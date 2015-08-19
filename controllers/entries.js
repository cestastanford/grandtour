var	mongoose = require('mongoose')
  , d3 = require('d3')
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



exports.uniques = function (req, res) {

  var field = req.body.field;
  //var value = req.body.value;
  var query = parseQuery(req.body.query);
  console.log(JSON.stringify(query))
  /*if (field.match(/\./)) {
    var elemMatch = {};
    elemMatch[field.split('.')[1]] = { $regex : new RegExp(value, "i") };
    var query = { $elemMatch : elemMatch };
    condition[field.split('.')[0]] = query;
  } else {
    var query = { $regex : new RegExp(value, "i") };
    condition[field] = query;
  }*/
  /*
  Entry.
    distinct(field, query, function (err, response) {
      if (err) {
        res.json({ error: err })
        return;
      }
      res.json({
        results: response.filter(function(d){ return d.search( new RegExp(value, "i") ) != -1; })
      });
    })*/

    var group = {}
    group['_id'] = { d: "$" + field, u: '$index' };
    group['count'] = { $sum : 1 }

    var pipeline = [];

    pipeline.push( { $match : query } )
    if (field.split('.').length > 1) {
      pipeline.push({ $unwind: '$' + field.split('.')[0] })
    }
    pipeline.push( { $group : group } )
    pipeline.push( { $group : { _id : '$_id.d', count: { $sum: 1 } } } )
    pipeline.push( { $sort : { count : -1 } } )

    Entry
      .aggregate(pipeline, function (err, response) {
        if (err) {
          res.json({ error: err })
          return;
        }
        res.json({
          values : response.filter(function(d){ return d._id !== null }) //d._id.search( new RegExp(value, "i") ) != -1; })
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

var searchMapRE = {

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

var searchMap = {

  fullName : function(d) { return { fullName : { $regex : new RegExp(escapeRegExp(d), "gi") } } },

  birthDate : function(d) { return { dates : { $elemMatch : { birthDate : +d } } } },
  deathDate : function(d) { return { dates : { $elemMatch : { deathDate : +d } } } },

  birthPlace : function(d) { return { places : { $elemMatch : { birthPlace : d  } } } },
  deathPlace : function(d) { return { places : { $elemMatch : { deathPlace : d  } } } },

  societies : function(d) { return { societies : { $elemMatch : { title : d } } } },
  societies_role : function(d) { return { societies : { $elemMatch : { role :d  } } } },

  education_institution : function(d) { return { education : { $elemMatch : { institution : d  } } } },
  education_place : function(d) { return { education : { $elemMatch : { place : d  } } } },
  education_degree : function(d) { return { education : { $elemMatch : { fullDegree : d } } } },
  education_teacher : function(d) { return { education : { $elemMatch : { teacher : d  } } } },

  pursuits : function(d) { return { pursuits : { $elemMatch : { pursuit : d  } } } },

  occupations : function(d) { return { occupations : { $elemMatch : { title : d  } } } },
  occupations_group : function(d) { return { occupations : { $elemMatch : { group : d  } } } },
  occupations_place : function(d) { return { occupations : { $elemMatch : { place : d  } } } },

  exhibitions : function(d) { return { exhibitions : { $elemMatch : { title : d  } } } },
  exhibitions_activity : function(d) { return { exhibitions : { $elemMatch :  { activity : d  }  } } } ,

  military : function(d) { return { military : { $elemMatch : { rank : d  } } } },

  travel_place : function(d) { return { travels : { $elemMatch : { place : d}  } } },
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
  var o = []
  for (var k in query){
    if (typeof query[k] == 'object') {
      var s = { $or : [] }
      for (var i in query[k]) {
        s.$or.push( searchMap[k](query[k][i]) );
      }
    }
    else var s = searchMap[k](query[k]);

    o.push(s)

  }
  return o.length ? { $and: o } : {};
}


exports.search = function (req, res) {

  var originalQuery = JSON.stringify(req.body.query);
  var query = parseQuery(req.body.query);

  console.log(JSON.stringify(query))

    Entry
      .find(query, {
        index : true,
        fullName : true,
        biography : true
      }, function (err, response) {
        if (err) {
          res.json({ error: err })
          return;
        }
        res.json({
          request : JSON.parse(originalQuery),
          entries : response
        });
      } )
/*
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
        //  biography: { $first : "$biography" }
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
*/

}



function parseQuery2(query) {
  var o = []
  for (var k in query){
    if (typeof query[k] == 'object') {
      var s = { $or : [] }
      for (var i in query[k]) {
        s.$or.push( searchMapRE[k](query[k][i]) );
      }
    }
    else var s = searchMapRE[k](query[k]);

    o.push(s)

  }
  return o.length ? { $and: o } : {};
}


exports.search2 = function (req, res) {

  var originalQuery = JSON.stringify(req.body.query);
  var query = parseQuery2(req.body.query);

    Entry
      .find(query, {
        index : true,
        fullName : true,
        biography : true
      }, function (err, response) {
        if (err) {
          res.json({ error: err })
          return;
        }
        res.json({
          request : JSON.parse(originalQuery),
          entries : response
        });
      } )
}




function parseExport(res){

  var activities = [];
  var travels = [];

  var entries = res.map(function(d){

    var entry = {};

    // index
    entry.index = d.index;
    // fullName
    entry.fullName = d.fullName;
    // birthDate
    entry.birthDate = d.dates[0] ? d.dates[0].birthDate || "" : "";
    // deathDate
    entry.deathDate = d.dates[0] ? d.dates[0].deathDate || "" : "";
    // birthPlace
    entry.birthPlace = d.dates[0] ? d.dates[0].birthPlace || "" : "";
    // deathPlace
    entry.deathPlace = d.dates[0] ? d.dates[0].deathPlace || "" : "";
    // parents
    entry.parents = d.parents || "";

    // activities

    // marriages
    if (d.marriages) d.marriages.forEach(function(a){ activities.push({
        entry : d.index,
        type : 'marriage',
        details : a.sequence || "",
        value : a.spouse || "",
        place : "",
        startDate : a.year || "",
        endDate : "",
      })
    })

    // education
    if (d.education) d.education.forEach(function(a){ activities.push({
        entry : d.index,
        type : 'education',
        details : "",
        value : a.institution || "",
        place : a.place || "",
        startDate : a.from || "",
        endDate : a.to || "",
      })
    })

    // societies
    if (d.societies) d.societies.forEach(function(a){ activities.push({
        entry : d.index,
        type : 'society',
        details : a.role || "",
        value : a.title || "",
        place : "",
        startDate : a.from || "",
        endDate : a.to || "",
      })
    })

    // exhibitions
    if (d.exhibitions) d.exhibitions.forEach(function(a){ activities.push({
        entry : d.index,
        type : 'exhibition',
        details : "",
        value : a.title || "",
        place : a.place || "",
        startDate : a.from || "",
        endDate : a.to || "",
      })
    })

    // pursuits
    if (d.pursuits) d.pursuits.forEach(function(a){ activities.push({
        entry : d.index,
        type : 'pursuit',
        details : "",
        value : a.pursuit,
        place : "",
        startDate : "",
        endDate : "",
      })
    })

    // occuaptions
    if (d.occupations) d.occupations.forEach(function(a){ activities.push({
        entry : d.index,
        type : 'occupation',
        details : a.group,
        value : a.title,
        place : a.place || "",
        startDate : a.from || "",
        endDate : a.to || "",
      })
    })

    // occuaptions
    if (d.military) d.occupations.forEach(function(a){ activities.push({
        entry : d.index,
        type : 'military careers',
        details : a.officeType,
        value : a.rank,
        place : a.place || "",
        startDate : a.rankStart || "",
        endDate : a.rankEnd || "",
      })
    })

    // travels
    if (d.travels) d.travels.forEach(function(a){ travels.push({
        entry : d.index,
        travelIndex : a.travelindexTotal,
        place : a.place || "",
        startDate : a.travelStartYear ? a.travelStartMonth ? a.travelStartDay ? a.travelStartYear + "/" + a.travelStartMonth + "/" + a.travelStartDay : a.travelStartYear + "/" + a.travelStartMonth : a.travelStartYear : "",
        endDate : a.travelEndYear ? a.travelEndMonth ? a.travelEndDay ? a.travelEndYear + "/" + a.travelEndMonth + "/" + a.travelEndDay : a.travelEndYear + "/" + a.travelEndMonth : a.travelEndYear : "",
      })
    })

    return entry;
  })

  return {
    entries : entries,
    activities : activities,
    travels : travels
  }

}


exports.export = function (req, res) {

  var originalQuery = JSON.stringify(req.body.query);
  var query = parseQuery(req.body.query);

  Entry
    .aggregate()
    .match(query)
    .exec(function (err, response) {

      if (err) {
        res.json({ error: err })
        return;
      }

      res.json({
        request : JSON.parse(originalQuery),
        result : parseExport(response)
      });

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
    }
    res.json({entry:entry});
  })
}
