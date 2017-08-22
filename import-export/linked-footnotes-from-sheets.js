/*
*   Imports
*/

const socketIO = require('../socket')
const google = require('googleapis')
const LinkedFootnote = require('../models/linked-footnote')


/*
*   Sends progress updates to socket-connected clients.
*/

const sendUpdate = (message, progress, done) => {
    const { socket } = socketIO
    socket.emit('linked-footnotes-import-status', { message, progress, done })
    console.log(message) 
}


/*
*   Handles a linked footnote reload request.  Downloads the indicated
*   Google Spreadsheet data and saves new LinkedFootnote database
*   entries from the data.
*/

module.exports = async sheetId => {

    //  Requests sheet data from Google Spreadsheets
    const sheetRequest = getSheetRequest(sheetId)
    await getSheet(sheetRequest)

    //  Applies data from sheet to an in-memory LinkedFootnote collection
    //  representation, then saves them to the database
    await saveLinkedFootnotes(sheetRequest.values)
    sendUpdate('Done!', null, true)

}


/*
*   Generates Google Spreadsheet requests from field updates sent
*   in the request.
*/

const getSheetRequest = sheetId => {

    sendUpdate('Generating download request')    

    return {
        spreadsheetId: sheetId,
        range: 'Linked Footnotes!A1:ZZ',
        valueRenderOption: 'UNFORMATTED_VALUE',
    }

}


/*
*   Authenticates with Google, submits the requests, then normalizes
*   response data into objects.
*/

const getSheet = async sheetRequest => {

    sendUpdate('Downloading sheet values')

    await authenticate()
    await new Promise(resolve => {

        google.sheets('v4').spreadsheets.values.get(sheetRequest, (error, response) => {
            
            if (error) { throw error }
            else {
                sheetRequest.values = normalizeSheetValues(response.values)
                resolve()
            }
        
        })

    })

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
*   Saves linked footnote data to new LinkedFootnote database documents.
*/

const saveLinkedFootnotes = async linkedFootnotes => {

    sendUpdate(`Saving entry updates to database`)

    for (let i = 0; i < linkedFootnotes.length; i++) {

        const linkedFootnote = new LinkedFootnote(linkedFootnotes[i])
        await linkedFootnote.save()

    }

}
