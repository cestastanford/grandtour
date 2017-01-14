var	mongoose = require('mongoose')
  , fs = require('fs')
  , d3 = require('d3')
  , jsondiffpatch = require('jsondiffpatch')
  , Entry = mongoose.model('Entry')
  , Count = mongoose.model('Count');

//var GoogleSpreadsheet = require("google-spreadsheet");
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

//  if (!multiple) return d3.map(entries, function(d){ return d.index; });

  /*var m = d3.map();

  entries.forEach(function(d){
    if (!m.has(d.index)) m.set(d.index, []);
    m.get(d.index).push(d);
  })

  return m;*/
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

  //  Erases existing entries
  Entry.collection.drop(function(err) {

    if (err) console.log(err);

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
              saveSheetToDatabase(sheet, rows, sheetReloadStatus, res, io);

            }

          });

        }

      });

    })

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
function saveSheetToDatabase(sheet, rows, sheetReloadStatus, res, io) {

  //  Constants
  var UPDATES_PER_RELOAD = 20;

  //  Extracts the header row
  var header = rows['1'];
  delete rows['1'];

  //  Transforms each row into a keyed object, saved by index in 'entries'
  var entries = {};
  for (rowNumber in rows) {

    var entry = {};
    for (cellNumber in rows[rowNumber]) {
      entry[header[cellNumber]] = rows[rowNumber][cellNumber];
    }
    if (sheet.multiple) {
      if (!entries[entry.index]) entries[entry.index] = [];
      entries[entry.index].push(entry);
    } else entries[entry.index] = entry;

  }

  //  Sends status update
  io.emit('reload-start', { message: 'Starting transfer to database...', sheet: sheet });

  //  Adds entries to database
  var keys = Object.keys(entries);
  keys.forEach(function(key, i) {

    var query = { index: keys[i] };
    var doc = {};
    if (sheet.value === 'entries') {
      doc = entries[keys[i]];
      doc.entry = [doc.biography, doc.tours, doc.narrative, doc.notes].join();
    } else {
      doc[sheet.value] = sheet.multiple ? entries[keys[i]] : entries[keys[i]] && entries[keys[i]][sheet.value];
    }

    Entry.findOneAndUpdate(query, doc, { upsert: true }, function(err) {

      //  Sends status update depending on outcome
      if (err) io.emit('reload-error', { error: err, sheet: sheet });
      else if (i === keys.length - 1) {

        io.emit('reload-finished', { message: 'Finished transfer to database!', sheet: sheet });
        sheetReloadStatus.sheetsReloaded++;
        if (sheetReloadStatus.sheetsReloaded === sheetReloadStatus.nSheetsToReload) {

          io.emit('reload-finished-all', { message: 'All reloads complete!' });
          res.json({ status: 200 });

        }

      } else {
        io.emit('reload-progress', { count: i, total: keys.length, sheet: sheet });
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


//  Calculates best guesses for travel dates when data is
//  missing, using tour info and preceding and succeeding
//  travels.
exports.calculateBeforeAndAfter = function(req, res) {

  var N_ENTRIES = 5293;
  var completed = 0;

  for (var i = 0; i < N_ENTRIES; i++) {
    
    Entry.findOne({ index : i }, (function(error, entry) {
      
      var i = this.i;

      if (entry.travels) {

        Entry.findOneAndUpdate(
          { index : i },
          { travels : calculateApproximates(entry.travels) },
          (function() {
            var i = this.i;
            completed++;
            if (completed % 100 === 0) console.log(completed + ' / ' + N_ENTRIES + ' approximates calculated.');
            if (completed === N_ENTRIES) res.json({ completed: true });
          }).bind({ i: i })
        );

      } else {
        completed++;
        if (completed % 100 === 0) console.log(completed + ' / ' + N_ENTRIES + ' approximates calculated.');
        if (completed === N_ENTRIES) res.json({ completed: true });
      }

    }).bind({ i: i }));

  };

};

//  add beforeDate and afterDate fields to
//  each entry's travels.
function calculateApproximates(travels) {

  var latestAfterDate = { year: travels[0].tourStartFrom };

  for (var i = 0; i < travels.length; i++) {

    var travel = travels[i];

    if (travel.tourStartFrom > latestAfterDate.year) {
      latestAfterDate = { year: travel.tourStartFrom };
    }

    if (travel.travelEndYear) {
      latestAfterDate = { year: travel.travelEndYear };
      if (travel.travelEndMonth) {
        latestAfterDate.month = travel.travelEndMonth;
        if (travel.travelEndDay) {
          latestAfterDate.day = travel.travelEndDay;
        }
      }
    }

    else {
      travel.travelAfterYear = latestAfterDate.year;
      travel.travelAfterMonth = latestAfterDate.month || 1;
      travel.travelAfterDay = latestAfterDate.day || 1;
    }

  }

  var earliestBeforeDate = { year: travels[travels.length - 1].tourEndFrom };
  
  for (var i = travels.length - 1; i > -1; i--) {

    var travel = travels[i];

    if (travel.tourEndFrom < earliestBeforeDate.year) {
      earliestBeforeDate = { year: travel.tourEndFrom };
    }

    if (travel.travelStartYear) {
      earliestBeforeDate = { year: travel.travelStartYear };
      if (travel.travelStartMonth) {
        earliestBeforeDate.month = travel.travelStartMonth;
        if (travel.travelStartDay) {
          earliestBeforeDate.day = travel.travelStartDay;
        }
      }
    }

    else {
      travel.travelBeforeYear = earliestBeforeDate.year;
      travel.travelBeforeMonth = earliestBeforeDate.month || 12;
      travel.travelBeforeDay = earliestBeforeDate.day ||
        (new Date(travel.travelEndYear, travel.travelEndMonth, 0)).getDate(); // returns last day of preceding month
    }

  }

  for (var i = 0; i < travels.length; i++) {

    var travel = travels[i];

    if (travel.travelAfterYear) {

      travel.travelStartYear = travel.travelAfterYear;
      travel.travelStartMonth = travel.travelAfterMonth;
      travel.travelStartDay = travel.travelAfterDay;
      travel.travelEndYear = travel.travelBeforeYear;
      travel.travelEndMonth = travel.travelBeforeMonth;
      travel.travelEndDay = travel.travelBeforeDay;
      travel.estimatedTravelDates = true;

    } else travel.estimatedTravelDates = false;

  }

  return travels;

};


