/*
*   Imports
*/

const socketIO = require('../socket')
const google = require('googleapis')
const Revision = require('../models/revision')
const Entry = require('../models/entry')
const entryFields = require('../models/entry-fields')


/*
*   Sends progress updates to socket-connected clients.
*/

const sendUpdate = (message, progress) => {
    const { socket } = socketIO
    socket.emit('sheets-export', { message, progress })
    console.log(message) 
}


/*
*   Exports all entry values to a new Google Spreadsheet, returning
*   a link to the spreadsheet.
*/

exports.toSheets = async revisionIndex => {

    sendUpdate('Retrieving entries')
    const entries = await Entry.findAtRevision({}, revisionIndex)
    const sheets = await saveEntriesToSheets(entries)
    return sheets
    //  await saveSpreadsheet(spreadsheet)

}


/*
*   Saves entries to an in-memory representation of a Google Spreadsheet.
*/

const saveEntriesToSheets = async entries => {

    sendUpdate('Formatting entries for spreadsheet')
    
    const sheets = createSheets()
    entries.forEach(entry => {

        Object.values(entryFields).forEach(field => {

            const value = entry[field.key]
            if (value) {

                const sheet = sheets[field.sheet.name]
                const transform = field.sheet.toSheet || (d => d)

                //  For fields that accept an array of values
                if (Array.isArray(field.type)) {

                    const newRows = value.map(valueArrayElement => {

                        const row = []
                        row[sheet.header.indexOf('index')] = entry.index

                        //  For fields whose values are objects
                        if (field.sheet.columns) {

                            for (let key in valueArrayElement) {
                                row[sheet.header.indexOf(key)] = transform(valueArrayElement[key])
                            }

                        //  For fields whose values are primitives
                        } else row[sheet.header.indexOf(field.sheet.column)] = transform(valueArrayElement)

                        return row

                    })

                    sheet.rows = [ ...sheet.rows, ...newRows ]

                //  For fields that accept a single value
                } else {

                    let row = sheet.rows.filter(row => row[sheet.header.indexOf('index')] === entry.index)[0]
                    if (!row) {

                        row = []
                        row[sheet.header.indexOf('index')] = entry.index
                        sheet.rows = [ ...sheet.rows, row ]

                    }

                    //  For fields whose values are objects
                    if (field.sheet.columns) {

                        for (let key in value) {
                            row[sheet.header.indexOf(key)] = transform(value[key])
                        }

                    //  For fields whose values are primitives
                    } else row[sheet.header.indexOf(field.sheet.column)] = transform(value)

                }

            }

        })

    })

    return sheets

}


/*
*   Creates the Google Spreadsheet sheets based on the field-to-sheet
*   mappings described in the entry field schemas.
*/

const createSheets = () => {

    const sheets = {}
    Object.values(entryFields).forEach(field => {

        if (!sheets[field.sheet.name]) {

            sheets[field.sheet.name] = {
                name: field.sheet.name,
                header: [ 'index' ],
            }

        }

        const sheet = sheets[field.sheet.name]
        if (field.sheet.column) sheet.header = [ ...sheet.header, field.sheet.column ]
        else sheet.header = [ ...sheet.header, ...field.sheet.columns ]
        sheet.rows = [ sheet.header ]

    })

    return sheets

}