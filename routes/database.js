/*
*   Imports
*/

const router = require('express').Router()
const { isAdministrator } = require('./auth')
const importing = require('../controllers/import')
const exporting = require('../controllers/export')


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
*   Exports the indicated revision to Google Sheets.
*/

router.post('/api/export/to-sheets', isAdministrator, (req, res, next) => {

    //  Sends HTTP response first so client doesn't re-attempt request
    res.json({ status: 200 })

    //  Kicks off async exporting process
    exporting.toSheets(req.body.revisionIndex)
    .catch(next)

})


/*
*   Exports
*/

module.exports = router
