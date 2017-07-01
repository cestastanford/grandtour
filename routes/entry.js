/*
*   Imports
*/

const router = require('express').Router()
const { isViewer, isEditor } = require('./auth')
const Entry = require('../models/entry')
const searchFields = require('../search-fields')
const entries = require('../controllers/entries')



/*
*   Retrieves all Entries at the User's active Revision.
*/

router.get('/api/entries', isViewer, (req, res, next) => {

    Entry.findAtRevision({}, req.user.activeRevisionIndex)
    .then(entries => res.json(entries))
    .catch(next)

})


/*
*   Retrieves a single Entry at the User's active Revision.
*/

router.get('/api/entries/:index', isViewer, (req, res, next) => {

    Entry.findOne({ index: req.params.index })
    .then(entry => {
        if (entry) return entry.atRevision(req.user.activeRevisionIndex)
        else { throw null /*  Triggers the 404 Not Found error handler  */ }
    })
    .then(entryAtRevision => res.json(entryAtRevision))
    .catch(next)

})


/*
*   Updates a single Entry under the latest Revision.
*/

router.patch('/api/entries/:index', isEditor, (req, res, next) => {

    Entry.findOne({ index: req.params.index })
    .then(entry => {
        if (entry) {
            return entry.saveToLatestRevision(req.body)
            .then(() => entry.atRevision(req.user.activeRevisionIndex))
        } else { throw null /*  Triggers the 404 Not Found error handler  */ }
    })
    .then(entry => res.json(entry))
    .catch(next)

})


/*
*   Deletes a single entry under the latest revision by setting
*   all fields to null.
*/

router.delete('/api/entries/:index', isEditor, (req, res, next) => {

    Entry.findOne({ index: req.params.index })
    .then(entry => {
        if (entry) return entry.deleteAtLatestRevision()
        else { throw null /*  Triggers the 404 Not Found error handler  */ }
    })
    .then(oldEntry => res.json(oldEntry))
    .catch(next)

})


/*
*   Creates a new entry under the latest revision with the specified
*   index and any other fields.
*/

router.post('/api/entries', isEditor, (req, res, next) => {

    Entry.createAtLatestRevision(req.body)
    .then(newEntry => res.json(newEntry))
    .catch(next)

})


/*
*   Retrieves the counts of entries that have values for the queries
*   defined in './mappings/counts".
*/

router.get('/api/getcount', isViewer, (req, res, next) => {

    Entry.getCounts()
    .then(counts => res.json(counts))
    .catch(next)

})


/*
*   Performs a search for entries based on the supplied queries.
*/

router.post('/api/entries/search', (req, res, next) => {

    Entry.find(assembleQuery(req.body.query))
    .then(results => results.map(result => result.latest))
    .then(entries => res.json({ entries }))
    .catch(next)

})


/*
*   Helper function for parsing and assembling MongoDB queries from
*   submitted field values.
*/

const assembleQuery = fields => {

    const $and = []
    for (var key in fields) {
        
        const keyParts = key.split('_')
        let getQuery
        if (keyParts[1]) getQuery = searchFields[keyParts[0]].queries.filter(q => q.subkey === keyParts[1])[0].match
        else getQuery = searchFields[keyParts[0]].queries.match
        
        let fieldQuery
        if (Array.isArray(fields[key])) {
            const $or = fields[key].map(getQuery)
            fieldQuery = { $or }
        } else fieldQuery = getQuery(fields[key]);

        $and.push(fieldQuery)

    }

    console.log(JSON.stringify($and))
    return $and.length ? { $and } : {}

}


/*
*   Old API routes for Entry management:
*   - Get entry suggestions
*   - Export entries
*   - Get unique entry field values
*/

router.post('/api/entries/suggest', isViewer, entries.suggest)
router.post('/api/entries/export', isViewer, entries.export)
router.post('/api/entries/uniques', isViewer, entries.uniques)


/*
*   Exports
*/

module.exports = router
