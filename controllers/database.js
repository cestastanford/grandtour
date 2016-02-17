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

exports.reload = function(req, res, io){

  var sheets = req.body.sheets;
  var count = 0;
  var result = [];
  var total = sheets.filter(function(d){ return d.reload; }).length;
  var totalCount = 0;

  var data = {};

  sheets
    .filter(function(d){ return d.reload; })
    .forEach(function(sheet){

      Spreadsheet.load({
          debug: true,
          spreadsheetId: sheet.spreadsheetId,
          worksheetName: sheet.sheetName,
          oauth : {
            email: '502880495910-ldtkd1okd08lfk00lhjjscdusmgua9qe@developer.gserviceaccount.com',
            keyFile: __dirname + '/key.pem'
          }
        }, function sheetReady(err, spreadsheet) {

            // something got wrong
            if (err) {
              io.emit('reload-error', { error: err, sheet: sheet });
              totalCount++;
              return;
            }
            // starting to get the data
            spreadsheet.metadata(function(err, metadata){
              if(err) {
                totalCount++;
                io.emit('reload-error', { error: err, sheet: sheet });
              }
              io.emit('reload-start', { metadata: metadata, sheet: sheet } );
            });

            spreadsheet.receive(function(err, rows, info) {
              // something wrong when fetching
              if (err) {
                io.emit('reload-error', { error: err, sheet: sheet });
                totalCount++;
                return;
              }
              io.emit('reload-progress', { message: 'finito caricare', sheet: sheet } );
              update(sheet, rows);
            });
        });

  })


  function parseRows(rows) {

    var header = rows[1];
    var data = [];

    d3.values(rows).forEach(function(row,i){
      if (i == 0) return;
      var obj = {};
      for (var key in row) {
        obj[header[key]] = row[key];
      }
      data.push(obj);
    })

    return data;

  }

  function update(s, r) {

    var entries = 5293;
    var rows = parseRows(r);
    var data;
    var count = 0;
    // map for data
    if (!s.multiple) data = d3.map(rows, function(d){ return d.index; });
    else {
      data = d3.map();
      rows.forEach(function(d){
        if (!data.has(d.index)) data.set(d.index, []);
        data.get(d.index).push(d);
      })
    }

    io.emit('reload-progress', { message: 'cominciamo fare cose', sheet: s } );

    d3.range(entries).forEach(function(index){
      var condition = { index : index };
      var doc = {};
      doc[s.value] = s.multiple ? data.get(index) : data.get(index) ? data.get(index)[s.value] : null;
      Entry.findOneAndUpdate(condition, doc, { upsert : true }, function(err, raw){
        if (err) {
          io.emit('reload-error', { error: err, sheet: s });
        }
        count++;
        if(count == entries-1) {
          io.emit('reload-finished', { message: 'finito mongo', sheet:s } );
          totalCount++;
          if(totalCount == total) {
            io.emit('reload-finished-all', { message: 'finito tutto' } );
            res.json({ status:200 })
          }
        }
        else if(count % Math.round(entries/10) == 0) io.emit('reload-progress', { count: count, sheet:s } );

        // diff
      })
    })

  }

}


/* Reset the dataset */
exports.reset = function(req, res, io){

  try {
    // loading
    //var entries = readFile('./tsv/entries.tsv').values();
    var entries = readJSONFile('./tsv/entries.json', 'entries');
/*    var fullName = readFile('./tsv/fullName.tsv');
    var dates = readFile('./tsv/dates.tsv');
    var education = readFile('./tsv/education.tsv', true);
    var marriages = readFile('./tsv/marriages.tsv', true);
    var parents = readFile('./tsv/parents.tsv');
    var travels = readFile('./tsv/travels.txt', true);*/

    var errors = [];

    // drop the Entries
    Entry.collection.drop();

    var counter = 0;

    entries.forEach(function(data, i){

      var entry = new Entry({

        index : data.index,
        biography : data.biography,
        tours : data.tours,
        narrative : data.narrative,
        notes : data.notes,
        entry : [data.biography, data.tours.map(function(d){ return d.text}).join(), data.narrative, data.notes].join(),

      });

      entry.save(function(err, e){
        if (err) {
          errors.push(err);
        }
      });



    })

    res.json({ status: 200, errors : errors})

  }

  catch(error) {
    res.json({error:error});
  }


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

  delete travels.travelAfterYear;
  delete travels.travelAfterMonth;
  delete travels.travelAfterDay;
  delete travels.travelBeforeYear;
  delete travels.travelBeforeMonth;
  delete travels.travelBeforeDay;

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
        (new Date(travel.travelBeforeYear, travel.travelBeforeMonth, 0)).getDate(); // returns last day of preceding month
    }

  }

  return travels;

};


