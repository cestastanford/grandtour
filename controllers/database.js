const fs = require('fs');
const google = require('googleapis');
const sheetValueRequest = google.sheets('v4').spreadsheets.values.get;
const mongoose = require('mongoose');
const Entry = mongoose.model('Entry');
const Count = mongoose.model('Count');



/*
*   Exported Function: reload
*   -------------------------
*   This function downloads the indicated Google Spreadsheet pages
*   and applies them to the database, updating the client with progress
*   via SocketIO.
*/
exports.reload = function(req, res, io) {

    //  Return initial server response
    res.json({ status: 200 });

    //  Gets the sheets selected for reloading
    const sheetsToReload = req.body.sheets.filter(sheet => sheet.reload);

    //  Kicks off the reloading process.
    Promise.resolve()
    .then(authenticate)
    .then(getReloadRequests.bind(null, sheetsToReload, io))
    .then(io.emit.bind(io, 'reload-finished-all'))
    .catch(error => {

        console.error(error);
        io.emit('reload-error', { error: error.message });

    });

}


/*
*   Function: authenticate
*   ----------------------
*   This function returns a promise for authenticating with Google
*   to access the specified sheets.
*/
function authenticate() {

    return new Promise(resolve => {

        const scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
        const email = process.env.SHEETS_EMAIL;
        const key = process.env.SHEETS_PRIVATE_KEY.split('\\n').join('\n');

        const auth = new google.auth.JWT(email, null, key, scopes, null);
        auth.authorize(function (error, tokens) {
            
            if (error) { throw error; }
            else {
                google.options({ auth });
                resolve();
            }
            
        });

    });

}


/*
*   Function: getReloadRequests
*   ---------------------------
*   This function returns the result of Promise.all() called on
*   an array of Promises, each for downloading then applying a single
*   sheet's values.
*/
function getReloadRequests(sheetsToReload, io) {

    //  Generates the request Promises
    const reloadRequests = sheetsToReload.map(sheet => new Promise(resolve => {

        Promise.resolve()
        .then(getSheetValues.bind(null, sheet, io))
        .then(parseSheetValues.bind(null, sheet, io))
        .then(applySheetValues.bind(null, sheet, io))
        .then(() => {

            io.emit('reload-finished', { message: 'Finished transfer to database!', sheet: sheet });
            resolve();

        }).catch(error => {

            console.error(error);
            io.emit('reload-error', { error: error.message, sheet });

        });

    }));

    return Promise.all(reloadRequests);

}


/*
*   Function: getSheetValues
*   ------------------------
*   This function returns a Promise for downloading the specified
*   Google Spreadsheets sheet and returning the values.
*/
function getSheetValues(sheet, io) {

    return new Promise((resolve, reject) => {

        io.emit('reload-start', { message: 'Retrieving data...' , sheet: sheet});

        const requestOptions = {
            spreadsheetId: sheet.spreadsheetId,
            range: sheet.sheetName + '!A1:Z',
        };

        return sheetValueRequest(requestOptions, (error, response) => {
            if (error) reject(error);
            else resolve(response.values);
        });

    });

}


/*
*   Function: parseSheetValues
*   --------------------------
*   This function parses the sheet values into a form ready to be
*   entered into the database.
*/
function parseSheetValues(sheet, io, unparsedValues) {

    io.emit('reload-start', { message: 'Preparing data for database...', sheet: sheet });

    //  Extracts the header row
    const header = unparsedValues.shift();

    //  Transforms each row into a keyed object, saved by index in 'entries'
    const updates = {};
    let currentRow;
    while (currentRow = unparsedValues.shift()) {

        //  Avoids rows that don't have numbers as indices
        const index = currentRow[0];
        if (!Number.isNaN(+index)) {

            var entry = {};
            for (let j = 1; j < currentRow.length; j++) {
                if (currentRow[j]) entry[header[j]] = currentRow[j];
            }

            if (sheet.multiple) {

                if (!updates[index]) {

                    updates[index] = {};
                    updates[index][sheet.value] = [];

                }
                updates[index][sheet.value].push(entry);

            } else if (sheet.value === 'entries') {
                
                entry.entry = [entry.biography, entry.tours, entry.narrative, entry.notes].join(' ');
                if (entry.tours) entry.tours = entry.tours.split(/\. \[?-?\d{4}(?![^(]*\))/g).map(tour => ({ text: tour }));
                updates[index] = entry;

            } else {

                updates[index] = {};
                updates[index][sheet.value] = entry && entry[sheet.value];

            }

        }

    }

    console.log(sheet.value, updates[10]);
    return updates;

}


/*
*   Function: applySheetValues
*   --------------------------
*   This function returns a Promise for applying the parsed sheet
*   values to the database.
*/
function applySheetValues(sheet, io, updates) {

    io.emit('reload-start', { message: 'Starting transfer to database...', sheet: sheet });

    const UPDATES_PER_RELOAD = 20;
    let nUpdated = 0;

    //  Creates an array of database request Promises
    const indices = Object.keys(updates);
    const databaseRequests = indices.map(index => {

        return new Promise(resolve => {

            try {

            Entry.findOneAndUpdate({ index }, updates[index], { upsert: true }, error => {

                nUpdated++;
                if (error) { throw [ error, updates[index] ]; }
                else {

                    resolve();
                    if (nUpdated % Math.floor(indices.length / UPDATES_PER_RELOAD) === 0) {
                        
                        io.emit('reload-progress', { count: nUpdated, total: indices.length, sheet: sheet });
                    
                    }

                }

            });

        } catch (error) { throw [ error, sheet, updates[index] ] }

        });

    });

    return Promise.all(databaseRequests);

}


//  Recounts the number of entries with data in a specific field.
exports.recount = function(req, res) {
  
  var counts = readJSONFile('./tsv/counts.json', 'counts');
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
