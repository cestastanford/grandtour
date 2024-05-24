/*
*   Imports
*/

const router = require('express').Router()
const { isAdministrator } = require('./auth')
const entryFields = require('../models/entry-fields')()
const importFromSheets = require('../import-export/from-sheets')
const importLinkedFootnotesFromSheets = require('../import-export/linked-footnotes-from-sheets')
const exportToSheets = require('../import-export/to-sheets')


/*
*   Imports from Google Sheets into new Revision
*/

// router.post('/api/import/from-sheets', isAdministrator, (req, res, next) => {

//     //  Sends HTTP response first so client doesn't re-attempt request
//     res.json({ status: 200 })

//     //  Kicks off async importing process
//     importFromSheets(entryFields)
//     .catch(next)

// })


// /*
// *   Imports LinkedFootnotes from Google Sheets into the database.
// */

// router.post('/api/import/linked-footnotes-from-sheets', isAdministrator, (req, res, next) => {

//     //  Sends HTTP response first so client doesn't re-attempt request
//     res.json({ status: 200 })

//     //  Kicks off async importing process
//     importLinkedFootnotesFromSheets(req.body.sheetId)
//     .catch(next)

// })


// /*
// *   Exports the indicated revision to Google Sheets.
// */

// router.post('/api/export/to-sheets', isAdministrator, (req, res, next) => {

//     //  Sends HTTP response first so client doesn't re-attempt request
//     res.json({ status: 200 })

//     //  Kicks off async exporting process, once for all fields except
//     //  formatted entry text, then again for formatted entry text
//     const entryFieldsExceptRichTextFields = {}
//     const richTextFields = {}
//     for (let key in entryFields) {
//         (entryFields[key].richText ? richTextFields : entryFieldsExceptRichTextFields)[key] = entryFields[key]
//     }

//     Promise.resolve()
//     .then(() => console.log('Exporting all fields except rich text fields'))
//     .then(() => exportToSheets(res.locals.activeRevisionIndex, entryFieldsExceptRichTextFields))
//     .then(() => console.log('Exporting rich text fields'))
//     .then(() => exportToSheets(res.locals.activeRevisionIndex, richTextFields))
//     .catch(next)

// })


/*
*   Exports
*/

module.exports = router
