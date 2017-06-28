/*
*   Imports
*/

const router = require('express').Router()
const { isViewer } = require('./auth')
const Entry = require('../models/entry')


/*
*   Retrieves a single Entry.
*/

router.get('/api/entries', isViewer, (req, res, next) => {

    Entry.findAtRevision({}, req.user.activeRevisionIndex)
    .then(entries => res.json(entries))
    .catch(next)

})


/*
*   Exports
*/

module.exports = router
