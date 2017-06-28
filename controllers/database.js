/*
*   Imports
*/

const { io } = require('../socket')
const google = require('googleapis')
const { Revision } = require('../models/revision')
const { Entry } = require('../models/entry')
const entryFields = require('../models/entry-fields')


/*
*   Handles a database reload request.  Downloads the indicated
*   Google Spreadsheet data, generates updated entries in memory,
*   and applies the changes to the database under a new Revision.
*   Client is updated via socket.io.
*/

exports.sheetsImport = (req, res) => {

    //  Sends HTTP response first so client doesn't re-attempt request
    res.json({ status: 200 })

    //  Used for sending progress updates to socket-connected clients
    const sendUpdate = (message, progress) => {
        io.emit('sheets-import', { message, progress })
        console.log(message) 
    }

    //  Kicks off async importing process
    beginSheetsImport(req.body.fieldRequests, sendUpdate)
    .then()
    .catch(console.error.bind(console))

}

beginSheetsImport = async (fieldRequestsFromRequest, sendUpdate) => {

    //  Requests sheet data from Google Spreadsheets
    const fieldRequests = fieldRequestsFromRequest || Object.values(entryFields)
    const sheetRequests = getSheetRequests(fieldRequests, sendUpdate)
    await getSheets(sheetRequests, sendUpdate)

    //  Applies data from sheets to an in-memory entry collection representation
    const entryUpdates = getEntryUpdates(fieldRequests, sendUpdate)

    //  Saves entry updates to database
    const revision = await createRevision(sendUpdate)
    await saveEntryUpdates(revision, entryUpdates, sendUpdate)

}


/*
*   Generates Google Spreadsheet requests from field updates sent
*   in the request.
*/

const getSheetRequests = (fieldRequests, sendUpdate) => {

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

const getSheets = async (sheetRequests, sendUpdate) => {

    sendUpdate('Downloading sheet values')

    await authenticate()
    let downloaded = 0
    await Promise.all(sheetRequests.map(request => new Promise(resolve => {

        google.sheets('v4').spreadsheets.values.get(request, (error, response) => {
            if (error) { throw error }
            else {
                sendUpdate(`Downloaded ${++downloaded} of ${sheetRequests.length} sheets`)
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

const getEntryUpdates = (fieldRequests, sendUpdate) => {

    sendUpdate('Processing downloaded sheets')
    
    const entryUpdates = {}
    fieldRequests.forEach(fieldRequest => {

        const entryField = entryFields[fieldRequest.key]
        const sheetValues = fieldRequest.sheetRequest.values
        sheetValues.forEach(row => {

            //  Creates new entry if one doesn't exist
            if (!entryUpdates[row.index]) entryUpdates[row.index] = {}
            const entry = entryUpdates[row.index]

            //  Extracts value or value object from sheet
            let value
            let transform = entryField.sheet.fromSheet || (d => d)
            if (entryField.sheet.columns) {
                
                const valueObject = {}
                entryField.sheet.columns.forEach(column => {
                    if (row[column]) valueObject[column] = row[column]
                })
                
                if (Object.keys(valueObject).length) {
                    value = transform(valueObject)
                }
            
            } else if (row[entryField.sheet.column]) {
                value = transform(row[entryField.sheet.column])
            }

            //  Saves value as entry property or as element in entry property array
            if (value) {

                if (Array.isArray(entryField.type)) {

                    if (!entry[entryField.key]) entry[entryField.key] = []
                    entry[entryField.key].push(value)

                } else entry[entryField.key] = value

            }
            
        })

    })

    return entryUpdates

}


/*
*   Creates and saves a new Revision under which to store the entry
*   updates.
*/

const createRevision = async sendUpdate => {

    sendUpdate('Preparing to save entry updates to database')

    //  Creates a new Revision with a sequential index
    const nRevisions = await Revision.count()
    const revision = new Revision({
        index: nRevisions,
        name: `Import from Google Sheets on ${(new Date()).toLocaleString()}`,
    })

    //  Saves Revision to database and returns
    await revision.save()
    return revision

}


/*
*   Saves entry updates to the database under the just-created revision.
*/

const saveEntryUpdates = async (revision, entryUpdates, sendUpdate) => {

    const nEntries = Object.keys(entryUpdates).length
    let nEntriesUpdated = 0
    for (let index in entryUpdates) {

        await Entry.commitUpdate(index, revision.index, entryUpdates[index])
        
        nEntriesUpdated++
        if (nEntriesUpdated % 1000 === 0) {
            sendUpdate(`Saved ${nEntriesUpdated} of ${nEntries} entry updates to database`)
        }

        if (nEntriesUpdated === nEntries) {
            sendUpdate(`Saved all ${nEntries} entry updates to database`)
        }

    }

}


exports.reload = () => {}
exports.clearAll = () => {}
exports.recount = () => {}
exports.getCount = () => {}
