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

    try {
        const revisions = await Revision.find({})
        res.json(revisions)
    } catch (error) {
        next(error)
    }

})


/*
*   Creates a new Revision.
*/

router.post('/api/revisions', isEditor, (req, res, next) => {

    Revision.create(`Revision started on ${(new Date()).toLocaleString()}`)
    .catch(next)

})


/*
*   Exports
*/

module.exports = router
