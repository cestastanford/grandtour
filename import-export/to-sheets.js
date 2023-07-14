/*
*   Imports
*/

const socketIO = require('../socket')
const google = require('googleapis')
const Revision = require('../models/revision')
const Entry = require('../models/entry')


/*
*   Sends progress updates to socket-connected clients.
*/

const sendUpdate = (message, progress, done, url) => {
    const { socket } = socketIO
    socket.emit('sheets-export-status', { message, progress, done, url })
    console.log(message)
    if (done) console.log(url)
}


/*
*   Exports all entry values to a new Google Spreadsheet, returning
*   a link to the spreadsheet.
*/

module.exports = async (revisionIndex, entryFields) => {

    sendUpdate('Retrieving entries')
    const entries = await Entry.findAtRevision(null, revisionIndex)
    const sheets = saveEntriesToSheets(entries, entryFields)
    await saveSheetsToGoogleSpreadsheet(sheets)

}


/*
*   Saves entries to an in-memory representation of a spreadsheet.
*/

const saveEntriesToSheets = (entries, entryFields) => {

    sendUpdate('Formatting entries for spreadsheet')
    
    const sheets = createSheets(entryFields)
    let nFormatted = 0
    entries.forEach(entry => {

        Object.values(entryFields).forEach(field => {

            const value = entry[field.key]
            if (value) {

                const sheet = sheets[field.sheet.name]
                const transform = field.sheet.toSheet || (d => d)

                //  For fields that accept an array of values
                if (Array.isArray(value)) {

                    const newRows = value.map(valueArrayElement => {

                        const row = []
                        row[0] = entry.index

                        //  For fields whose values are objects
                        if (field.valueIsObject()) {

                            Object.keys(valueArrayElement).forEach(key => {
                                if (sheet.columnMap[key]) {
                                    row[sheet.columnMap[key]] = transform(valueArrayElement[key])
                                }
                            })

                        //  For fields whose values are primitives
                        } else row[sheet.columnMap[field.key]] = transform(valueArrayElement)
                        
                        return row

                    })

                    sheet.rows = [ ...sheet.rows, ...newRows ]

                //  For fields that accept a single value
                } else {

                    let row = sheet.rows.filter(row => row[0] === entry.index)[0]
                    if (!row) {

                        row = []
                        row[0] = entry.index
                        sheet.rows = [ ...sheet.rows, row ]

                    }

                    //  For fields whose values are objects
                    if (field.valueIsObject()) {

                        Object.keys(value).forEach(key => {
                            if (sheet.columnMap[key]) {
                                row[sheet.columnMap[key]] = transform(value[key])
                            }
                        })

                    //  For fields whose values are primitives
                    } else row[sheet.columnMap[field.key]] = transform(value)

                }

            }

        })

        nFormatted++
        if (nFormatted % 100 === 0) sendUpdate(`Formatted ${nFormatted} of ${entries.length} entries for spreadsheet`, { value: nFormatted, max: entries.length })

    })

    const sheetsArray = Object.values(sheets)
    sheetsArray.forEach(sheet => {

        //sheet.rows.sort((a, b) => +a[0] > +b[0] ? 1 : (+b[0] > +a[0] ? -1 : 0))
        sheet.rows.unshift(sheet.columns)
    
    })

    return sheetsArray

}


/*
*   Creates the spreadsheet sheets based on the field-to-sheet mappings
*   described in the entry field schemas.
*/

const createSheets = entryFields => {

    const sheets = {}
    Object.values(entryFields).forEach(field => {

        if (!sheets[field.sheet.name]) {

            sheets[field.sheet.name] = {
                name: field.sheet.name,
                columns: [ 'index' ],
                rows: [],
            }

        }

        const sheet = sheets[field.sheet.name]
        if (field.valueIsObject()) sheet.columns = [
            ...sheet.columns,
            ...Object.keys(field.getValueType()).filter(key => key !== '_id'),
        ]
            
        else sheet.columns = [ ...sheet.columns, field.key ]

    })

    Object.values(sheets).forEach(sheet => {
        sheet.columnMap = {}
        sheet.columns.forEach((column, i) => sheet.columnMap[column] = i)
    })
    
    return sheets

}


/*
*   Creates a new Google Spreadsheet containing the sheets of entry
*   fields.
*/

const saveSheetsToGoogleSpreadsheet = async sheets => {

    await authenticate()
    const spreadsheet = await createNewSpreadsheet(sheets)
    await setSpreadsheetPermissions(spreadsheet, { type: 'anyone', role: 'reader', allowFileDiscovery: false })
    sendUpdate(`Saving entry data to spreadsheet`)
    const progress = { value: 0, max: sheets.length }
    await Promise.all(sheets.map(sheet => saveToSheet(spreadsheet, sheet, progress)))
    sendUpdate('Done!', null, true, spreadsheet.spreadsheetUrl)

}


/*
*   Returns a promise for authenticating with Google to access the
*   specified sheets.
*/

const authenticate = () => new Promise(resolve => {

    sendUpdate('Authenticating with Google')

    const scopes = ['https://www.googleapis.com/auth/drive']
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
*   Returns a promise for creating a new Google spreadsheet, resolving
*   with the new Spreadsheet object.
*/

const createNewSpreadsheet = sheets => new Promise(resolve => {

    sendUpdate('Creating new Google Spreadsheet')
    
    const createSpreadsheetRequest = {
        resource: {
            properties: {
                title: `Grand Tour Explorer data, exported ${(new Date()).toLocaleString()}`,
            },
            sheets: sheets.map(sheet => ({
                properties: {
                    title: sheet.name,
                    gridProperties: {
                        frozenRowCount: 1,
                        frozenColumnCount: 1,
                    }
                },
            })),
        }
    }

    google.sheets('v4').spreadsheets.create(createSpreadsheetRequest, (error, response) => {
        if (error) { throw error }
        else resolve(response)    
    })

})


/*
*   Sets the permissions on the newly-created Google Spreadsheet.
*/

const setSpreadsheetPermissions = (spreadsheet, permission) => new Promise(resolve => {

    sendUpdate('Setting spreadsheet permissions')

    const setPermissionsRequest = {
        fileId: spreadsheet.spreadsheetId,
        resource: permission,
    }

    google.drive('v3').permissions.create(setPermissionsRequest, error => {
        if (error) { throw error }
        else resolve()
    })

})


/*
*   Saves a sheet rows to a new sheet on the Google Spreadsheet.
*/

const saveToSheet = async (spreadsheet, sheet, progress) => {

    const insertDataRequest = {

        spreadsheetId: spreadsheet.spreadsheetId,
        range: `${sheet.name}!A1`,
        valueInputOption: 'RAW',
        resource: {
            values: sheet.rows,
        },

    }

    await new Promise(resolve => {

        google.sheets('v4').spreadsheets.values.update(insertDataRequest, error => {
            if (error) { throw error }
            else resolve()
        })

    })

    progress.value++
    sendUpdate(`Saved entry data to sheet ${sheet.name}`, progress)

}