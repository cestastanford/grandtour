/*
*   Imports
*/

const router = require('express').Router()
const { isViewer, isEditor } = require('./auth')
const Entry = require('../models/entry')
const entryFields = require('../models/entry-fields')()


/*
*   Creates a new entry under the latest revision with the specified
*   index and any other fields.
*/

// router.put('/api/entries/:index', isEditor, (req, res, next) => {

//     Entry.createAtLatest(req.params.index, req.body)
//     .then(entry => res.json(entry))
//     .catch(next)

// })


/*
*   Deletes a single entry under the latest revision.
*/

// router.delete('/api/entries/:index', isEditor, (req, res, next) => {

//     Entry.deleteAtLatest(req.params.index)
//     .then(entry => {
//         if (entry) res.json(entry)
//         else { throw null /* Triggers the 404 Not Found error handler */ }
//     })
//     .catch(next)

// })


/*
*   Retrieves a single Entry.
*/

router.get('/api/entries/:index', isViewer, (req, res, next) => {

    Entry.findByIndexAtRevision(req.params.index, res.locals.activeRevisionIndex)
    .then(entry => Promise.all([
        Promise.resolve(entry),
        Entry.getAdjacentIndices(req.params.index, res.locals.activeRevisionIndex),
    ]))
    .then(([ entry, { previous, next, lastUsedDecimal } ]) => res.json({ entry, previous, next, lastUsedDecimal }))
    .catch(next)

})


/*
*   Retrieves all Entries (limit 20).
*/

router.get('/api/entries', isViewer, (req, res, next) => {

    Entry.findAtRevision(null, res.locals.activeRevisionIndex, null, null, 20, 0)
    .then(entries => res.json(entries))
    .catch(next)

})


/*
*   Updates a single Entry under the latest Revision.
*/

// router.patch('/api/entries/:index', isEditor, (req, res, next) => {

//     Entry.findByIndexAndUpdateAtLatest(req.params.index, req.body)
//     .then(entry => {
//         if (entry) res.json(entry)
//         else { throw null /* Triggers the 404 Not Found error handler */ }
//     })
//     .catch(next)

// })


/*
*   Retrieves and returns the entry field definitions.
*/

router.get('/api/entry-fields', isViewer, (req, res, next) => {

    res.json(entryFields)

})


/*
*   Extracts birth and death date markers.
*/

/*

router.get('/api/transform', (req, res, next) => {

    Entry.findAtRevision(null, res.locals.activeRevisionIndex, 'index dates biography')
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

*/


/*
*   Reorders Posts & Occupations and Military Careers to so no dates
*   are out of order, but blank dates are left in place..
*/

/*

router.get('/api/transform', (req, res, next) => {

    Entry.findAtRevision({}, res.locals.activeRevisionIndex, 'index occupations military')
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

*/


/*
*   Retrieves a list of all mentioned names without indexes.
*/

/*

router.get('/request', (req, res, next) => {

    Entry.findAtRevision({ 'mentionedNames.entryIndex': null })
    .then(entries => {

        const mentionedNamesWithNoIndex = entries.reduce((accum, entry) => {

            //console.log(entry)
            const namesFromEntry = entry.mentionedNames.filter(({ entryIndex }) => !(entryIndex || entryIndex === 0))
            .map(({ name }) => ({ name, sourceIndex: entry.index }))

            return accum.concat(namesFromEntry)

        }, [])

        mentionedNamesWithNoIndex.sort((a, b) => {

            if (a.name.toLowerCase() < b.name.toLowerCase()) return -1
            else if (a.name.toUpperCase() > b.name.toUpperCase()) return 1
            else if (+a.sourceIndex < +b.sourceIndex) return -1
            else if (+a.sourceIndex > +b.sourceIndex) return 1
            else return 0

        })

        const csv = mentionedNamesWithNoIndex.reduce((accum, { name, sourceIndex }) => {

            return accum + `"${ name }","${ sourceIndex }"\n`

        }, '"Name","Source Index"\n')

        res.set('Content-Type', 'text/plain')
        res.send(csv)

    })
    .catch(next)

})

*/


/*
*   Exports
*/

module.exports = router
