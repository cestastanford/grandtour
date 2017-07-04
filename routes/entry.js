/*
*   Imports
*/

const router = require('express').Router()
const { isViewer, isEditor } = require('./auth')
const Entry = require('../models/entry')
const searchFields = require('../search-fields')
const entries = require('../controllers/entries')


/*
*   Retrieves all Entries.
*/

router.get('/api/entries', isViewer, (req, res, next) => {

    Entry.find({})
    .then(entries => res.json(entries.map(entry => entry.getObject())))
    .catch(next)

})


/*
*   Retrieves a single Entry.
*/

router.get('/api/entries/:index', isViewer, (req, res, next) => {

    Entry.findById(req.params.index)
    .then(entry => {
        if (entry) return Promise.all([
            Promise.resolve(entry.atRevision()),
            entry.getAdjacentIndices(this.user.revisionIndex),
        ])
        else { throw null /*  Triggers the 404 Not Found error handler  */ }
    })
    .then(([ entry, { previous, next } ]) => res.json({ entry, previous, next }))
    .catch(next)

})


/*
*   Updates a single Entry under the latest Revision.
*/

router.patch('/api/entries/:index', isEditor, (req, res, next) => {

    Entry.findByIdAndUpdate(req.params.index, req.body)
    .then(entry => {
        if (!entry) { throw null /*  Triggers the 404 Not Found error handler  */ }
        return entry
    })
    .then(entry => res.json(entry))
    .catch(next)

})


/*
*   Deletes a single entry under the latest revision.
*/

router.delete('/api/entries/:index', isEditor, (req, res, next) => {

    Entry.findById(req.params.index)
    .then(entry => {
        if (entry) {
            const oldEntryJSON = entry.toJSON()
            return entry.delete().then(() => oldEntryJSON)
        } else { throw null /*  Triggers the 404 Not Found error handler  */ }
    })
    .then(oldEntry => res.json(oldEntry))
    .catch(next)

})


/*
*   Creates a new entry under the latest revision with the specified
*   index and any other fields.
*/

router.post('/api/entries', isEditor, (req, res, next) => {

    Entry.create(req.body)
    .then(newEntry => res.json(newEntry))
    .catch(next)

})


/*
*   Exports
*/

module.exports = router
