/*
*   Imports
*/

const router = require('express').Router()
const { isAdministrator } = require('./auth')
const exporting = require('../controllers/export')


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
