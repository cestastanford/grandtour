/*
*   Imports
*/

const router = require('express').Router()
const { isEditor } = require('./auth')
const Revision = require('../models/revision')


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

router.post('/api/revisions', isEditor, (req, res, next) => {

    Revision.create(`Revision started on ${(new Date()).toLocaleString()}`)
    .then(revision => res.status(201).json(revision))
    .catch(next)

})


/*
*   Exports
*/

module.exports = router
