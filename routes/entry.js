/*
*   Imports
*/

const router = require('express').Router()
const { isViewer, isEditor } = require('./auth')
const Entry = require('../models/entry')


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
*   Exports
*/

module.exports = router
