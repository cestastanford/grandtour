var	mongoose = require('mongoose')
  , fs = require('fs')
  , d3 = require('d3')
  , Entry = mongoose.model('Entry');

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

exports.gigi = function(req, res, io){

Spreadsheet.load({
    debug: true,
    spreadsheetId: '1w8LD2RkdyPcMq7ffv4YlUKx5PAWAlQpzgw7A-9tbVvg',
    worksheetName: 'Entries',
    oauth : {
      email: '502880495910-ldtkd1okd08lfk00lhjjscdusmgua9qe@developer.gserviceaccount.com',
      keyFile: __dirname +'/key.pem'
    }
  }, function sheetReady(err, spreadsheet) {
      spreadsheet.metadata(function(err, metadata){
        if(err) throw err;
        console.log(metadata);
        // { title: 'Sheet3', rowCount: '100', colCount: '20', updated: [Date] }
      });
      /*
      //use speadsheet!
      spreadsheet.receive(function(err, rows, info) {
        if(err) throw err;
        console.log("Found rows:", info);
        // Found rows: { '3': { '5': 'hello!' } }
      });*/
  });

res.json({})


}


/* Reload the whole dataset */
exports.reload = function(req, res, io){

  try {
    // loading
    var entries = readFile('./tsv/entries.tsv').values();
    var fullName = readFile('./tsv/fullName.tsv');
    var dates = readFile('./tsv/dates.tsv');
    var education = readFile('./tsv/education.tsv', true);

    var errors = [];

    // drop the Entries
    Entry.collection.drop();

    io.emit('reload-start', entries.length);

    var counter = 0;

    entries.forEach(function(data, i){

      var entry = new Entry({
        index : data.index,
        biography : data.biography,
        tours : data.tours,
        narrative : data.narrative,
        notes : data.notes,
        fullName : fullName.get(data.index).fullName,
        birthPlace : dates.get(data.index).birthPlace,
        deathPlace : dates.get(data.index).deathPlace,
        birthDate : {
          start : dates.get(data.index).birthDateStart,
          end : dates.get(data.index).birthDateEnd
        },
        deathDate : {
          start : dates.get(data.index).deathDateStart,
          end : dates.get(data.index).deathDateEnd
        },
        flourishedStartDate : {
          start : dates.get(data.index).flourishedStartDateStart,
          end : dates.get(data.index).flourishedStartDateEnd
        },
        flourishedEndDate : {
          start : dates.get(data.index).flourishedEndDateStart,
          end : dates.get(data.index).flourishedEndDateEnd
        },
        education : education.get(data.index)
      });

      entry.save(function(err, e){
        if (err) {
          io.emit('reload-error', e);
          errors.push(err);
        }
        counter++;
        if(counter == entries.length) io.emit('reload-finished', counter);
        else if(counter % 100 == 0) io.emit('reload-progress', counter);

      });



    })

    res.json({status:200, errors:errors})

  }
  catch(error) {
    console.log(error)
    res.json({error:error});
  }


  /*Entry.findById(req.body.id, function (err, response){
    if (err) {
      res.json({ error: err })
      return;
    }
    res.json({
      result: response
    });
  })*/

}
