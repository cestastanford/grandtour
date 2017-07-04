/*
*   Imports
*/

const router = require('express').Router()
const { isEditor, isAdministrator } = require('./auth')
const Revision = require('../models/revision')
const Entry = require('../models/entry')


/*
*   Returns all Revisions.
*/

router.get('/api/revisions', isEditor, async (req, res, next) => {

    Revision.find({})
    .then(revisions => res.json(revisions))
    .catch(next)

})


/*
*   Creates a new Revision.
*/

router.post('/api/revisions', isAdministrator, (req, res, next) => {

    Revision.create(req.body.name || `Revision started on ${(new Date()).toLocaleString()}`)
    .then(revision => res.status(201).json(revision))
    .catch(next)

})


/*
*   Updates a Revision's name.
*/

router.patch('/api/revisions/:index', isAdministrator, (req, res, next) => {

    Revision.findByIdAndUpdate(req.params.index, { name: req.body.name }, { new: true })
    .then(revision => {
        if (!revision) { throw null /* Triggers 404 Not Found handler */ } 
        else return revision
    })
    .then(revision => res.json(revision))
    .catch(next)

})


/*
*   Deletes a Revision, removing all associated entry data.
*/

router.delete('/api/revisions/:index', isAdministrator, (req, res, next) => {

    Revision.findByIdAndRemove(req.params.index)
    .then(revision => {
        if (revision) return Entry.deleteMany({ _revisionIndex: revision._id })
        else { throw null /* Triggers 404 Not Found handler */ } 
    })
    .then(() => res.status(200).send())
    .catch(next)

})


/*
*   Exports
*/

module.exports = router
