/*
*   Imports
*/

const router = require('express').Router()
const { isViewer, isAdministrator } = require('./auth')
const LinkedFootnote = require('../models/linked-footnote')
const Entry = require('../models/entry')


/*
*   Returns all Linked Footnotes.
*/

router.get('/api/linked-footnotes', isViewer, async (req, res, next) => {

    LinkedFootnote.find({})
    .then(results => res.json(results))
    .catch(next)

})


/*
*   Returns the Linked Footnotes found in an entry.
*/

router.get('/api/linked-footnotes/in-entry/:entryIndex', isViewer, async (req, res, next) => {

    Entry.findByIndexAtRevision(req.params.entryIndex)
    .then(entry => {
        if (entry) return entry.notes ? LinkedFootnote.findAllFromString(entry.notes_formatted || entry.notes) : Promise.resolve([])
        else { throw null /* Triggers the 404 Not Found error handler */ }
    })
    .then(results => res.json(results))
    .catch(next)

})


/*
*   Deletes all Linked Footnotes.
*/

router.delete('/api/linked-footnotes', isAdministrator, async (req, res, next) => {

    LinkedFootnote.deleteMany({})
    .then(() => res.status(200).send())
    .catch(next)

})


/*
*   Exports
*/

module.exports = router
