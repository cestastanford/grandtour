/*
*   Imports
*/

const router = require('express').Router()
const Entry = require('../models/entry')


/*
*   Retrieves a single Entry.
*/

router.get('/api/entries/:id', (req, res) => {

    res.json(req.user)

})


/*
*   Exports
*/

module.exports = router
