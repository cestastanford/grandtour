/*
*   Imports
*/

const router = require('express').Router()
const { isViewer, isEditor } = require('./auth')
const Entry = require('../models/entry')


/*
*   Retrieves all Entries.
*/

router.get('/api/entries', isViewer, (req, res, next) => {

    Entry.find().atRevision(req.user.activeRevisionIndex)
    .then(entries => res.json(entries))
    .catch(next)

})


/*
*   Retrieves a single Entry.
*/

router.get('/api/entries/:index', isViewer, (req, res, next) => {

    Entry.findOne({ index: req.params.index }).atRevision(req.user.activeRevisionIndex)
    .then(entry => Promise.all([
        Promise.resolve(entry),
        Entry.getAdjacentIndices(req.params.index, req.user.activeRevisionIndex),
    ]))
    .then(([ entry, { previous, next } ]) => res.json({ entry, previous, next }))
    .catch(next)

})


/*
*   Updates a single Entry under the latest Revision.
*/

router.patch('/api/entries/:index', isEditor, (req, res, next) => {

    Entry.findOneAndUpdate({ index: req.params.index }, req.body, { new: true }).atRevision()
    .then(entry => {
        if (entry) return res.json(entry)
        else { throw null /* Triggers the 404 Not Found error handler */ }
    })
    .catch(next)

})


/*
*   Deletes a single entry under the latest revision.
*/

router.delete('/api/entries/:index', isEditor, (req, res, next) => {

    Entry.findOneAndRemove({ index: req.params.index }).atRevision()
    .then(entry => {
        if (entry) return res.json(entry)
        else { throw null /* Triggers the 404 Not Found error handler */ }
    })
    .catch(next)

})


/*
*   Creates a new entry under the latest revision with the specified
*   index and any other fields.
*/

router.post('/api/entries', isEditor, (req, res, next) => {

    Entry.create(req.body)
    .then(entry => res.json(entry))
    .catch(next)

})


/*
*   Exports
*/

module.exports = router
