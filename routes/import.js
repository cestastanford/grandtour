/*
*   Imports
*/

const router = require('express').Router()
const { isAdministrator } = require('./auth')
const importing = require('../controllers/import')


/*
*   Imports from Google Sheets into new Revision
*/

router.post('/api/import/from-sheets', isAdministrator, (req, res, next) => {

    //  Sends HTTP response first so client doesn't re-attempt request
    res.json({ status: 200 })

    //  Kicks off async importing process
    importing.fromSheets(req.body.fieldRequests)
    .catch(next)

})


/*
*   Exports
*/

module.exports = router
