var	mongoose = require('mongoose')
  , fs = require('fs')
  , d3 = require('d3')
  , jsondiffpatch = require('jsondiffpatch')
  , Entry = mongoose.model('Entry')
  , Count = mongoose.model('Count');

var Spreadsheet = require('edit-google-spreadsheet');

function readFile(path, multiple){
  var file = fs.readFileSync(path, "utf8");
  var entries = d3.tsv.parse(file.toString());
  if (!multiple) return d3.map(entries, function(d){ return d.index; });
  var m = d3.map();
  entries.forEach(function(d){
    if (!m.has(d.index)) m.set(d.index, []);
    m.get(d.index).push(d);
  })
  return m;
}

function readJSONFile(path, obj){
  var file = fs.readFileSync(path, "utf8");
  var entries = JSON.parse(file.toString())[obj];
  return entries;
}


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


/*
* Exported Function: reload
* -------------------------
* This API function is called when the user clicks the Reload button
* on the Manage screen.  It erases the existing collection of entries,
* then downloads each selected spreadsheet and adds them to the
* database, one by one.  It sends status updates through the socket.
*/
exports.reload = function(req, res, io){

  //  Return initial server response
  res.json({ status: 200 });

  //  Downloads spreadsheets
  var sheetsToReload = req.body.sheets.filter(function(sheet) { return sheet.reload; });
  var sheetReloadStatus = { nSheetsToReload: sheetsToReload.length, sheetsReloaded: 0 };
  sheetsToReload.forEach(function(sheet) {

    io.emit('reload-start', { message: 'Retrieving database...' , sheet: sheet});

    Spreadsheet.load({
      debug: true,
      spreadsheetId: sheet.spreadsheetId,
      worksheetName: sheet.sheetName,
      oauth: {
        email: '502880495910-ldtkd1okd08lfk00lhjjscdusmgua9qe@developer.gserviceaccount.com',
        keyFile: __dirname + '/key.pem',
      },
    }, function sheetReady(err, spreadsheet) {

      if (err) io.emit('reload-error', { error: err, sheet: sheet });
      else {

        spreadsheet.metadata(function(err, metadata) {

          if (err) io.emit('reload-error', { error: err, sheet: sheet });
          else io.emit('reload-start', { message: 'Downloading ' + metadata.rowCount + ' rows with ' + metadata.colCount + ' columns...', sheet: sheet });

        });

        spreadsheet.receive(function(err, rows, info) {

          if (err) io.emit('reload-error', { error: err, sheet: sheet });
          else {

            io.emit('reload-start', { message: 'Preparing downloaded data for database...', sheet: sheet });
            saveSheetToDatabase(sheet, rows, sheetReloadStatus, io);

          }

        });

      }

    });

  });

}


/*
* Function: saveSheetToDatabase
* ------------------------
* This function saves the contents of a sheet to the database.
* It loops through each entry in the sheet and adds it to the
* corresponding entry in the database, adding a new entry if the
* entry doesn't yet exist.
*/
function saveSheetToDatabase(sheet, rows, sheetReloadStatus, io) {

  //  Constants
  var UPDATES_PER_RELOAD = 20;

  //  Extracts the header row
  var header = rows['1'];
  delete rows['1'];

  //  Transforms each row into a keyed object, saved by index in 'entries'
  var entries = {};
  for (rowNumber in rows) {

    //  Avoids rows that don't have numbers as indices
    if (!Number.isNaN(+rows[rowNumber]['1'])) {

      var entry = {};
      for (cellNumber in rows[rowNumber]) {
        entry[header[cellNumber]] = rows[rowNumber][cellNumber];
      }
      if (sheet.multiple) {
        if (!entries[entry.index]) entries[entry.index] = [];
        entries[entry.index].push(entry);
      } else entries[entry.index] = entry;

    }

    //  For memory management
    delete rows[rowNumber];

  }

  //  Sends status update
  io.emit('reload-start', { message: 'Starting transfer to database...', sheet: sheet });

  //  Adds entries to database
  var keys = Object.keys(entries);
  var nUpdated = 0;
  keys.forEach(function(key) {

    var query = { index: key };
    var doc = {};
    if (sheet.value === 'entries') {
      doc = entries[key];
      doc.entry = [doc.biography, doc.tours, doc.narrative, doc.notes].join();
    } else {
      doc[sheet.value] = sheet.multiple ? entries[key] : entries[key] && entries[key][sheet.value];
    }

    Entry.findOneAndUpdate(query, doc, { upsert: true }, function(err) {

      if (err) io.emit('reload-error', { error: [err, doc], sheet: sheet });
      else {

        //  For memory management
        delete entries[key];
        
        nUpdated++;
        
        if (nUpdated % Math.floor(keys.length / UPDATES_PER_RELOAD) === 0) {
          io.emit('reload-progress', { count: nUpdated, total: keys.length, sheet: sheet });
        }

        if (nUpdated === keys.length) {

          io.emit('reload-finished', { message: 'Finished transfer to database!', sheet: sheet });
          sheetReloadStatus.sheetsReloaded++;
          
          if (sheetReloadStatus.sheetsReloaded === sheetReloadStatus.nSheetsToReload) {

            io.emit('reload-finished-all', { message: 'All reloads complete!' });

          }

        }

      }

    });

  });

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
