/*
*   Imports
*/

const router = require('express').Router()
const { isViewer, isAdministrator } = require('./auth')
const LinkedFootnote = require('../models/linked-footnote')


/*
*   Returns all Revisions.
*/

router.get('/api/linked-footnotes', isViewer, async (req, res, next) => {

    LinkedFootnote.find({})
    .then(results => res.json(results))
    .catch(next)

})


/*
*   Returns all Revisions.
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
