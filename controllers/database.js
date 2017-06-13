/*
*   Imports
*/

const fs = require('fs')
const google = require('googleapis')
const sheetValueRequest = google.sheets('v4').spreadsheets.values.get
const Entry = require('../models/entry.js')
const Count = require('../models/count.js')


/*
*   Handles a database reload request.  Downloads the indicated
*   Google Spreadsheet data, generates updated entries in memory,
*   and applies the changes to the database.  Client is updated
*   via socket.io.
*/

exports.reload = (req, res, io) => {

    res.json({ status: 200 })
    const sheetsToReload = req.body.sheets.filter(sheet => sheet.reload)
    
    getEntryUpdates(sheetsToReload, io)
    .then(entryUpdates => applyEntryUpdates(entryUpdates, io))
    .catch(error => {

        console.error(error)
        io.emit('reload-error', { error: error.message })
        io.emit('reload-finished-all')

    })

}


/*
*   Authenticates with Google Sheets, then retrieves the indicated
*   Sheets data and adds the data from each sheet to the in-memory
*   temporary entry buffer.
*/

const getEntryUpdates = async (sheets, io) => {

    io.emit('authenticating')
    await authenticate()

    const entries = {}
    for (let i = 0; i < sheets.length; i++) {

        const sheet = sheets[i]

        io.emit('reload-start', { message: 'Retrieving data...' , sheet })
        const values = await getSheetValues(sheet)
        
        io.emit('reload-start', { message: 'Parsing data...' , sheet})
        const entryUpdates = await parseSheetValues(sheet, values)
        
        io.emit('reload-start', { message: 'Saving data...' , sheet})
        for (let index in entryUpdates) {

            if (!entries[index]) entries[index] = entryUpdates[index]
            else entries[index] = Object.assign({}, entries[index], entryUpdates[index])

        }

        io.emit('reload-start', { message: 'Waiting...' , sheet})

    }

    return entries

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
*   Returns a Promise for downloading the specified Google Spreadsheets
*   sheet and returning the values.
*/

const getSheetValues = sheet => new Promise(resolve => {

    const requestOptions = {
        spreadsheetId: sheet.spreadsheetId,
        range: sheet.sheetName + '!A1:Z',
        valueRenderOption: 'UNFORMATTED_VALUE',
    }

    return sheetValueRequest(requestOptions, (error, response) => {
        if (error) { throw error }
        else resolve(response.values)
    })

})


/*
*   Parses the sheet values into the database's entry object model
*   format, returning an object of entry updates.
*/

const parseSheetValues = (sheet, unparsedValues) => {

    //  Extracts the header row
    const header = unparsedValues.shift()

    //  Transforms each row into a keyed object, saved by index in 'entries'
    const updates = {}
    let currentRow
    while (currentRow = unparsedValues.shift()) {

        //  Avoids rows that don't have numbers as indices
        const index = currentRow[0]
        if (!Number.isNaN(+index)) {

            const update = {}
            for (let j = 1; j < currentRow.length; j++) {
                if (currentRow[j] !== '') update[header[j]] = currentRow[j]
            }

            if (sheet.multiple) {

                if (!updates[index]) {

                    updates[index] = {}
                    updates[index][sheet.value] = []

                }
                updates[index][sheet.value].push(update)

            } else if (sheet.value === 'entries') {
                
                update.entry = [update.biography, update.tours, update.narrative, update.notes].join(' ')
                if (typeof update.tours === 'string') update.tours = update.tours.split(/\. (?=\[?-?\d{4})(?![^(]*\))(?![^[]*\])/g).map(tour => ({ text: tour }))
                updates[index] = update

            } else {

                updates[index] = {}
                updates[index][sheet.value] = update && update[sheet.value]

            }

        }

    }

    return updates

}


/*
*   Applies the entry updates to the database.
*/

const applyEntryUpdates = async (entryUpdates, io) => {

    io.emit('reload-start', { message: 'Starting transfer to database...' })
    
    const UPDATES_PER_RELOAD = 50;
    const indices = Object.keys(entryUpdates)
    for (let i = 0; i < indices.length; i++) {

        index = indices[i]
        await Entry.findOneAndUpdate({ index }, entryUpdates[index], { upsert: true })
        if (i % Math.floor(indices.length / UPDATES_PER_RELOAD) === 0) {
            
            io.emit('reload-progress', { count: i, total: indices.length, })
        
        }

    }

    io.emit('reload-finished')

}


//  Recounts the number of entries with data in a specific field.
exports.recount = function(req, res) {
  
  var counts = readJSONFile('./mappings/counts.json', 'counts');
  Count.collection.drop();

  var newCounts = {};
  var n_counted = 0;
  counts.forEach(function(d) {

    var count = Entry.count(d.query, (function(error, number) {
      
      var d = this.d;

      if (error) res.json({ error: error });
      else {

        var newCount = new Count({
          field: d.field,
          count: number
        });

        newCount.save(function(error) { if (error) console.error(error); });
        newCounts[d.field] = number;
        if (++n_counted === counts.length) res.json({ status: 200 });

      }

    }).bind({ d: d }));

  });

};


//  Reads a JSON file.
function readJSONFile(path, obj){
  var file = fs.readFileSync(path, "utf8");
  var entries = JSON.parse(file.toString())[obj];
  return entries;
}


//  Gets the current counts.
exports.getCount = function(req, res) {
  
  Count.find({}, function(error, counts) {

    if (error) res.json({ error: error });
    else {

      var countsObject = {};
      for (var i = 0; i < counts.length; i++) {

        countsObject[counts[i].field] = counts[i].count;

      }

      res.json({ counts: countsObject });

    }

  });

};


/*
* Exported Function: clearAll
* ---------------------------
* This API function clears all entries from the database.
*/
exports.clearAll = function(req, res) {

  Entry.collection.drop(function(error) {

    if (error) res.json({ status: 500, error: error });
    else res.json({ status: 200 });

  });

}
