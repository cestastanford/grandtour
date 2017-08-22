/*
*   Imports
*/

const router = require('express').Router()
const { isAdministrator } = require('./auth')
const importFromSheets = require('../import-export/from-sheets')
const importLinkedFootnotesFromSheets = require('../import-export/linked-footnotes-from-sheets')
const exportToSheets = require('../import-export/to-sheets')


/*
*   Imports from Google Sheets into new Revision
*/

router.post('/api/import/from-sheets', isAdministrator, (req, res, next) => {

    //  Sends HTTP response first so client doesn't re-attempt request
    res.json({ status: 200 })

    //  Kicks off async importing process
    importFromSheets(req.body.fieldRequests)
    .catch(next)

})


/*
*   Imports LinkedFootnotes from Google Sheets into the database.
*/

router.post('/api/import/linked-footnotes-from-sheets', isAdministrator, (req, res, next) => {

    //  Sends HTTP response first so client doesn't re-attempt request
    res.json({ status: 200 })

    //  Kicks off async importing process
    importLinkedFootnotesFromSheets(req.body.sheetId)
    .catch(next)

})


router.post('/api/export/to-sheets', isAdministrator, (req, res, next) => {

    //  Sends HTTP response first so client doesn't re-attempt request
    res.json({ status: 200 })

    //  Kicks off async exporting process
    exportToSheets(req.user.activeRevisionIndex)
    .catch(next)

})


/*
*   Exports the indicated revision to Google Sheets.
*/

router.post('/api/export/to-sheets', isAdministrator, (req, res, next) => {

    //  Sends HTTP response first so client doesn't re-attempt request
    res.json({ status: 200 })

    //  Kicks off async exporting process
    exportToSheets(req.user.activeRevisionIndex)
    .catch(next)

})


/*
*   Exports
*/

module.exports = router
