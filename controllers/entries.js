var	mongoose = require('mongoose')
, Entry = mongoose.model('Entry')

exports.index = function(req, res){

  Entry.find({}, 'index fullName pursuits occupations education', function(err, entries){
    if (err) {
      res.json({error:err});
    //  return;
    }
    res.json({entries:entries});
  })

}

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function getQuery(obj){
  for (var k in obj) {
    if (getLast(obj, k) == null) delete obj[k];
  }
  return obj;
}

function getLast(obj, key){
  for (var k in obj[key]) {
    if (typeof obj[key][k] == 'object') return getLast(obj[key], k);
    else {
      if (!/\S/.test(obj[key].value)) return null;
      else return obj[key].exactMatch ? obj[key].value : { $regex : new RegExp(escapeRegExp(obj[key].value), "gi") };
    }
  }
}


function getQuery2(obj){
  var antani = {};
  for (var k in obj) {
    antani[k] = seek(obj,k)
  }
  return antani;
}




exports.suggest = function (req, res) {

  var field = req.body.field;
  var value = req.body.value;
  var condition = {};

  if (field.match(/\./)) {
    var elemMatch = {};
    elemMatch[field.split('.')[1]] = { $regex : new RegExp(value, "i") };
    var query = { $elemMatch : elemMatch };
    condition[field.split('.')[0]] = query;
  } else {
    var query = { $regex : new RegExp(value, "i") };
    condition[field] = query;
  }

  Entry.
    distinct(field, condition, function (err, response) {
      if (err) {
        res.json({ error: err })
        return;
      }
      res.json({
        results: response.filter(function(d){ return d.search( new RegExp(value, "i") ) != -1; })
      });
    })


}


exports.new_suggest = function (req, res) {

  var field = req.body.field;
  var value = req.body.value;
  var condition = searchMap[field](value);
  console.log(field,value, condition)
  Entry.
    distinct(field, condition, function (err, response) {
      if (err) {
        res.json({ error: err })
        return;
      }
      res.json({
        results: response//.filter(function(d){ return d.search( new RegExp(value, "i") ) != -1; })
      });
    })
}



function seek(obj) {
  var o = {};
  for (var k in obj){
    if (typeof obj[k] == 'string' && !/\S/.test(obj[k]) ) {
      delete o[k];
    } else if (k=='value') o = { $regex : new RegExp(escapeRegExp(obj[k]), "gi") };
        else if (k=='$number') o = +obj[k]
          else if (k=='$gte') o = { $gte : +obj[k], $ne : 0 }
            else if (k=='$lte') o = { $lte : +obj[k], $ne : 0 } // USING $OR!!! { $or : [ {} ] }
              else {
                typeof seek(obj[k]) != 'object' || Object.getOwnPropertyNames(seek(obj[k])).length !== 0 ? o[k] = seek(obj[k]) : delete o[k];
              }
  }
  return o;
}

var searchMap = {

  fullName : function(d) { return { fullName : { $regex : new RegExp(escapeRegExp(d), "gi") } } },

  birthDate : function(d) { return { dates : { $elemMatch : { birthDate : +d } } } },
  deathDate : function(d) { return { dates : { $elemMatch : { deathDate : +d } } } },

  birthPlace : function(d) { return { places : { $elemMatch : { birthPlace : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },
  deathPlace : function(d) { return { places : { $elemMatch : { deathPlace : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },

  societies : function(d) { return { societies : { $elemMatch : { title : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },
  societies_role : function(d) { return { societies : { $elemMatch : { role : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },

  education_institution : function(d) { return { education : { $elemMatch : { institution : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },
  education_place : function(d) { return { education : { $elemMatch : { place : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },
  education_degree : function(d) { return { education : { $elemMatch : { fullDegree : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },
  education_teacher : function(d) { return { education : { $elemMatch : { teacher : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },

  pursuits : function(d) { return { pursuits : { $elemMatch : { pursuit : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },

  occupations : function(d) { return { occupations : { $elemMatch : { title : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },
  occupations_group : function(d) { return { occupations : { $elemMatch : { group : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },
  occupations_place : function(d) { return { occupations : { $elemMatch : { place : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },

  exhibitions : function(d) { return { exhibitions : { $elemMatch : { title : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },
  exhibitions_activity : function(d) { return { exhibitions : { $elemMatch : { activity : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },

  military : function(d) { return { military : { $elemMatch : { rank : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },

  travel_place : function(d) { return { travels : { $elemMatch : { place : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },
  travel_at : function(d) { return { travels : { $elemMatch : {
    $or : [
      { $and : [ { travelStartYear : { $lte : +d, $ne : 0 } } , { travelEndYear : { $gte : +d } } ] },
      { $and : [ { travelStartYear : +d } , { travelEndYear : 0 } ] },
    ]
  } } } },

  entry : function(d) { return { entry : { $regex : new RegExp(escapeRegExp(d), "gi") } } },


}

function merge(obj1, obj2) {
  for (var p in obj2) {
    try {
      if ( obj2[p].constructor==Object ) {
        obj1[p] = merge(obj1[p], obj2[p]);
      } else {
        obj1[p] = obj2[p];
      }
    } catch(e) {
      obj1[p] = obj2[p];

    }
  }
  return obj1;
}

function parseQuery(query) {
  var o = {};
  for (var k in query){
    var s = searchMap[k](query[k]);
    merge(o,s);
  }
  return o;
}


exports.search = function (req, res) {

  var originalQuery = JSON.stringify(req.body.query);
  var query = parseQuery(req.body.query);

  console.log(JSON.stringify(query))

  Entry
    .count(query, function (err, count){

      if (err) {
        res.json({ error: err })
        return;
      }

      Entry
        .aggregate()
        .match(query)
    //    .limit(req.body.limit || 20)
    //    .skip(req.body.skip || 0)
        .group(
          {
            _id: '$_id',
            index : { $first : "$index" },
            fullName : { $first : "$fullName" },
            biography: { $first : "$biography" }
          }
        )
        .sort(
          { index: 1 }
        )
        .exec(function (err, response) {
          if (err) {
            res.json({ error: err })
            return;
          }
          res.json({
            request : JSON.parse(originalQuery),
            count : count,
            entries : response
          });
        })

    })

}


exports.old_search = function (req, res) {

  var originalQuery = JSON.stringify(req.body.query);
//  query = getQuery(req.body.query);

/*  var query = JSON.parse(JSON.stringify(req.body.query, function(key, value) {
    return typeof value == 'object' ? value.hasOwnProperty('value') ? /\S/.test(value.value) ? { $regex : value.value } : undefined : value : value;
  }));*/

  query = seek(req.body.query);


  Entry
    .count(query, function (err, count){

      if (err) {
        res.json({ error: err })
        return;
      }

      Entry
        .aggregate()
        .match(query)
    //    .limit(req.body.limit || 20)
    //    .skip(req.body.skip || 0)
        .group(
          {
            _id: '$_id',
            index : { $first : "$index" },
            fullName : { $first : "$fullName" },
            biography: { $first : "$biography" }
          }
        )
        .sort(
          { index: 1 }
        )
        .exec(function (err, response) {
          if (err) {
            res.json({ error: err })
            return;
          }
          res.json({
            request : JSON.parse(originalQuery),
            count : count,
            entries : response
          });
        })

    })

}


exports.single = function(req, res){

  Entry.findOne({index:req.params.id}, function(err, entry){
    if (err) {
      res.json({error:err});
    //  return;
    }
    res.json({entry:entry});
  })

}
