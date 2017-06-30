/*
*   Imports
*/

const router = require('express').Router()
const { isAdministrator } = require('./auth')
const Revision = require('../models/revision')
const Entry = require('../models/entry')


/*
*   Returns all Revisions.
*/

router.get('/api/revisions', isAdministrator, async (req, res, next) => {

    Revision.find({})
    .then(revisions => res.json(revisions))
    .catch(next)

})


/*
*   Creates a new Revision.
*/

router.post('/api/revisions', isAdministrator, (req, res, next) => {

    Revision.create(`Revision started on ${(new Date()).toLocaleString()}`)
    .then(revision => res.status(201).json(revision))
    .catch(next)

})


/*
*   Updates a Revision's name.
*/

router.patch('/api/revisions/:index', isAdministrator, (req, res, next) => {

    Revision.findOne({ index: req.params.index })
    .then(revision => {
        if (revision) {
            revision.name = req.body.name
            return revision.save()
        } else { throw null  /* Triggers 404 Not Found handler */ } 
    })
    .then(revision => res.json(revision))
    .catch(next)

})


/*
*   Deletes a Revision, removing all associated updates from all entries.
*/

router.delete('/api/revisions/:index', isAdministrator, (req, res, next) => {

    Revision.findOneAndRemove({ index: req.params.index })
    .then(revision => {
        if (revision) return Entry.deleteUpdatesForRevision(revision.index)
        else { throw null  /* Triggers 404 Not Found handler */ } 
    })
    .then(() => res.status(200).send())
    .catch(next)

})


/*
*   Exports
*/

module.exports = router
