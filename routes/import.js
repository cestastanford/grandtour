/*
*   Imports
*/

const router = require('express').Router()
const { isAdministrator } = require('./auth')
const socketIO = require('../socket')
const google = require('googleapis')
const Revision = require('../models/revision')
const Entry = require('../models/entry')
const entryFields = require('../models/entry-fields')()
const { invalidateQueryCounts } = require('../cache')


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
*   Sends progress updates to socket-connected clients.
*/

const sendUpdate = (message, progress, done) => {
    const { socket } = socketIO
    socket.emit('sheets-import-status', { message, progress, done })
    console.log(message) 
}


/*
*   Handles a database reload request.  Downloads the indicated
*   Google Spreadsheet data, generates updated entries in memory,
*   and applies the changes to the database under a new Revision.
*   Client is updated via socket.io.
*/

const importFromSheets = async fieldRequestsFromRequest => {

    //  Requests sheet data from Google Spreadsheets
    const fieldRequests = fieldRequestsFromRequest || Object.values(entryFields)
    const sheetRequests = getSheetRequests(fieldRequests)
    await getSheets(sheetRequests)

    //  Applies data from sheets to an in-memory entry collection representation
    const entryUpdates = getEntryUpdates(fieldRequests)

    //  Saves entry updates to database in a new Revision
    await Revision.create(`Import from Google Sheets on ${(new Date()).toLocaleString()}`)
    await saveEntryUpdates(entryUpdates)
    await Revision.create()
    invalidateQueryCounts()
    sendUpdate('Done!', null, true)

}


/*
*   Generates Google Spreadsheet requests from field updates sent
*   in the request.
*/

const getSheetRequests = (fieldRequests) => {

    sendUpdate('Generating download requests')    

    const sheetRequests = []
    fieldRequests.forEach(fieldRequest => {

        const sheetRequest = {
            spreadsheetId: fieldRequest.sheet.spreadsheet,
            range: fieldRequest.sheet.name + '!A1:ZZ',
            valueRenderOption: 'UNFORMATTED_VALUE',
        }

        fieldRequest.sheetRequest = sheetRequest
        sheetRequests.push(sheetRequest)

    })

    return sheetRequests

}


/*
*   Authenticates with Google, submits the requests, then normalizes
*   response data into objects.
*/

const getSheets = async (sheetRequests) => {

    sendUpdate('Downloading sheet values')

    await authenticate()
    let downloaded = 0
    await Promise.all(sheetRequests.map(request => new Promise(resolve => {

        google.sheets('v4').spreadsheets.values.get(request, (error, response) => {
            if (error) { throw error }
            else {
                downloaded++
                sendUpdate(`Downloaded ${downloaded} of ${sheetRequests.length} sheets`, { value: downloaded, max: sheetRequests.length })
                request.values = normalizeSheetValues(response.values)
                resolve()
            }
        
        })

    })))

}


/*
*   Returns a promise for authenticating with Google to access the
*   specified sheets.
*/

const authenticate = () => new Promise(resolve => {

    const scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly']
    const email = process.env.SHEETS_EMAIL
    const key = process.env.SHEETS_PRIVATE_KEY.split('\\n').join('\n')

    const auth = new google.auth.JWT(email, null, key, scopes, null)
    auth.authorize(function (error, tokens) {
        
        if (error) { throw error }
        else {
            google.options({ auth })
            resolve()
        }
        
    });

})


/*
*   Transforms returned sheet values (arrays of arrays) into arrays
*   of objects with property names from column headers.  All values
*   are coerced to strings here.
*/

const normalizeSheetValues = rows => {

    const header = rows.shift()
    const rowObjects = rows.map(row => {

        const normalizedRow = {}
        header.forEach((key, i) => {
            if (row[i] !== undefined) normalizedRow[key] = `${row[i]}`
        })
        
        return normalizedRow

    })
    
    return rowObjects.filter(rowObject => Object.keys(rowObject).length)

}


/*
*   Applies the sheet data to an in-memory representation of the 
*   entries, based on the Sheets schemas described in the entry
*   field definitions.
*/

const getEntryUpdates = fieldRequests => {

    sendUpdate('Processing downloaded sheets')
    
    const entryUpdates = {}
    fieldRequests.forEach(fieldRequest => {

        const field = entryFields[fieldRequest.key]
        const sheetValues = fieldRequest.sheetRequest.values
        sheetValues.forEach(row => {

            //  Creates new entry if one doesn't exist
            if (!entryUpdates[row.index]) entryUpdates[row.index] = {}
            const entry = entryUpdates[row.index]

            //  Uses specified transform function, or uses the default,
            //  which either copies a primitive value or creates a
            //  new object from the indicated fields.
            const transform = field.sheet.fromSheet || (row => {

                //  Extracts an value object from the sheet data
                if (field.valueIsObject()) {
                    
                    const valueObject = {}
                    Object.keys(field.getValueType()).forEach(column => {
                        if (row[column]) valueObject[column] = row[column]
                    })
                    
                    if (Object.keys(valueObject).length) return valueObject
                
                //  Extracts a value primitive from the sheet data
                } else return row[fieldRequest.key]

            })

            //  Saves value to in-memory entry
            const value = transform(row)
            if (value) {

                //  Appends value to array value field
                if (field.isArrayOfValues()) {

                    if (!entry[field.key]) entry[field.key] = []
                    entry[field.key].push(value)

                //  Saves value to non-array value field
                } else entry[field.key] = value

            }

        })

    })

    return entryUpdates

}


/*
*   Saves entry updates to the database under the just-created revision.
*/

const saveEntryUpdates = async entryUpdates => {

    sendUpdate(`Saving entry updates to database`)

    const nEntries = Object.keys(entryUpdates).length
    let nEntriesUpdated = 0
    for (let index in entryUpdates) {

        const entry = await Entry.findByIndexAndUpdateAtLatest(index, entryUpdates[index], true)
        
        nEntriesUpdated++
        if (nEntriesUpdated % 100 === 0) {
            sendUpdate(`Saved ${nEntriesUpdated} of ${nEntries} entry updates to database`, { value: nEntriesUpdated, max: nEntries })
        }

        if (nEntriesUpdated === nEntries) {
            sendUpdate(`Saved all ${nEntries} entry updates to database`)
        }

        //  For memory-saving purposes
        delete entryUpdates[index]

    }

}


/*
*   Exports
*/

module.exports = router
