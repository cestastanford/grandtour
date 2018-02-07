/*
*   Imports
*/

const router = require('express').Router()
const Entry = require('../models/entry')


/*
*   Extracts birth and death date markers.
*/

router.get('/api/birth-death-date-markers', (req, res, next) => {

    Entry.findAtRevision(null, req.user.activeRevisionIndex, 'index dates biography')
    .then(entries => Promise.all(entries.map(entry => {

        exclude = [ 311, 403, 570, 730.2, 748, 903, 955.2, 1062, 1192, 1303, 1655, 1706, 1748, 2074, 2625, 2649, 2656, 2830, 3484, 3554, 3627, 3769, 3778, 3856, 3877.2, 4173, 4315, 4361, 4996, 5252, 5293 ]
        if (entry.biography && entry.dates[0] && exclude.indexOf(entry.index) === -1) {

            const regex = /^(?:\D+|[^(]+)\(([^\d)]*)\d{4}(?:\/\d)?([^\d)]*)(?:-([^\d)]*)\d{1,4}([^\d)]*))?\)/
            const match = entry.biography.match(regex)
            entry.dates[0].birthDateMarker = match[1] || match[2]
            entry.dates[0].deathDateMarker = match[3] || match[4]
            const deathMatch = entry.dates[0].birthDateMarker.match(/d. ?(.*)/)
            if (deathMatch) {
                entry.dates[0].birthDateMarker = ''
                entry.dates[0].deathDateMarker = deathMatch[1]
            }

            const flourshedMatch = entry.dates[0].birthDateMarker.match(/fl. ?(.*)/)
            if (flourshedMatch) {
                entry.dates[0].birthDateMarker = ''
            }

            const birthDateMarkerMatch = entry.dates[0].birthDateMarker && entry.dates[0].birthDateMarker.match(/b. ?(.*)/)
            if (birthDateMarkerMatch) {
                entry.dates[0].birthDateMarker = birthDateMarkerMatch[1]
            }

            const deathDateMarkerMatch = entry.dates[0].deathDateMarker && entry.dates[0].deathDateMarker.match(/d. ?(.*)/)
            if (deathDateMarkerMatch) {
                entry.dates[0].deathDateMarker = deathDateMarkerMatch[1]
            }

            if (entry.dates[0].birthDateMarker === ' ') entry.dates[0].birthDateMarker = ''
            if (entry.dates[0].deathDateMarker === ' ') entry.dates[0].deathDateMarker = ''
            
            return Entry.findByIndexAndUpdateAtLatest(entry.index, { dates: entry.dates })

        } else return Promise.resolve()
        
    })))
    .then(updated => res.json(updated))
    .catch(next)
    
})


/*
*   Reorders Posts & Occupations and Military Careers to so no dates
*   are out of order, but blank dates are left in place..
*/

router.get('/api/reorder', (req, res, next) => {

    Entry.findAtRevision({}, req.user.activeRevisionIndex, 'index occupations military')
    .then(entries => Promise.all(entries.map(entry => {

        const reorder = (arr, orderValueKey) => {

            const newArr = arr.slice()
            for (let i = 0; i < newArr.length; i++) {
                
                const getPrevious = currentIndex => {
                    
                    let index = currentIndex - 1
                    while (true) {
                        
                        if (index < 0) return null
                        if (+newArr[index][orderValueKey]) return { index, orderValue: +newArr[index][orderValueKey] }
                        index--
                    
                    }
                
                }

                const currentOrderValue = +newArr[i][orderValueKey]
                if (currentOrderValue) {

                    let insertBefore = i
                    while (true) {

                        const previous = getPrevious(insertBefore)
                        if (previous && previous.orderValue > currentOrderValue) {

                            insertBefore = previous.index

                        } else break

                    }

                    if (insertBefore < i) {
                        newArr.splice(insertBefore, 0, newArr.splice(i, 1)[0])
                    }

                }

            }

            return newArr

        }

        const update = {}
        if (entry.occupations && entry.occupations.length) update.occupations = reorder(entry.occupations, 'from')
        if (entry.military && entry.military.length) update.military = reorder(entry.military, 'rankStart')
        return Entry.findByIndexAndUpdateAtLatest(entry.index, update)
        
    })))
    .then(updated => res.json(updated))
    .catch(next)
    
})


/*
*   Retrieves a list of all mentioned names without indexes.
*/

router.get('/api/unmatched-mentioned-names', (req, res, next) => {

    Entry.findAtRevision({ 'mentionedNames.entryIndex': null })
    .then(entries => {

        const mentionedNamesWithNoIndex = entries.reduce((accum, entry) => {

            const namesFromEntry = entry.mentionedNames.map(({ name }, listIndex) => ({ name, sourceEntryIndex: entry.index, listIndex }))
            .filter(({ entryIndex }) => !(entryIndex || entryIndex === 0))
            
            return accum.concat(namesFromEntry)

        }, [])

        mentionedNamesWithNoIndex.sort((a, b) => {

            if (+a.sourceEntryIndex < +b.sourceEntryIndex) return -1
            else if (+a.sourceEntryIndex > +b.sourceEntryIndex) return 1
            else if (+a.listIndex < +b.listIndex) return -1
            else if (+a.listIndex > +b.listIndex) return 1
            else return 0

        })

        const unmatchedMentionedNames = {}
        mentionedNamesWithNoIndex.forEach(({ name, sourceEntryIndex, listIndex }) => {

            if (!unmatchedMentionedNames[name]) unmatchedMentionedNames[name] = []
            unmatchedMentionedNames[name].push(`${ sourceEntryIndex }-${ listIndex }`)

        })

        const sortedKeys = Object.keys(unmatchedMentionedNames)
        sortedKeys.sort((a, b) => {

            if (a.toLowerCase() < b.toLowerCase()) return -1
            else if (a.toUpperCase() > b.toUpperCase()) return 1
            else return 0

        })
        
        const csv = sortedKeys.reduce((accum, name) => {

            return accum + `"${ name }","${ unmatchedMentionedNames[name].join(', ') }"\n`

        }, '"Name","Source Indices"\n')

        res.set('Content-Type', 'text/plain')
        res.send(csv)

    })
    .catch(next)

})


/*
*   Returns a list of indexes without full names.
*/

router.get('/api/no-full-name', (req, res, next) => {

    Entry.findAtRevision({ fullName: null }, req.user.activeRevisionIndex, 'index')
    .then(entries => {

        const csv = entries.reduce((accum, entry) => accum + `"${ entry.index }"\n`, '"index"\n')
        res.header('Content-Type', 'text/plain').send(csv)

    })
    .catch(next)

})


/*
*   Returns a list of indexes without types.
*/

router.get('/api/no-type', (req, res, next) => {

    Entry.findAtRevision({ type: null }, req.user.activeRevisionIndex, 'index')
    .then(entries => {

        const csv = entries.reduce((accum, entry) => accum + `"${ entry.index }"\n`, '"index"\n')
        res.header('Content-Type', 'text/plain').send(csv)

    })
    .catch(next)

})


/*
*   Returns a list of indexes without travels.
*/

router.get('/api/no-travels', (req, res, next) => {

    Entry.findAtRevision({ $or: [ { travels : null }, { travels : [] }, { 'travels.place' : null } ] }, req.user.activeRevisionIndex, 'index')
    .then(entries => {

        const csv = entries.reduce((accum, entry) => accum + `"${ entry.index }"\n`, '"index"\n')
        res.header('Content-Type', 'text/plain').send(csv)

    })
    .catch(next)

})



/*
*   Exports
*/

module.exports = router
