var mongoose = require('mongoose')
  , d3 = require('d3')
  , Entry = mongoose.model('Entry')

exports.index = function(req, res, next) {

  Entry.find({}, 'index fullName pursuits occupations education').atRevision()
  .then(entries => res.json({ entries }))
  .catch(next)

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




exports.suggest = function (req, res, next) {

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

  if (field === 'fullName') {

    var query = { $or : [ { fullName: condition[field] }, { alternateNames: { $elemMatch : { alternateName : condition[field] } } } ] };
    var fields = { fullName: true, alternateNames: true };
    Entry.find(query, fields)
    .atRevision()
    .sort(field)
    .then(response => {

      var matches = [];
      var doesMatch = function(d) { return d.search( new RegExp(value, "i") ) != -1; };
      response.forEach(function(entry) {

        if (doesMatch(entry.fullName)) matches.push({ nameMatch: entry.fullName });
        entry.alternateNames.forEach(function(alternateName) {

          if (doesMatch(alternateName.alternateName)) matches.push({
            nameMatch: alternateName.alternateName,
            see: entry.fullName,
          });

        });

      });

      res.json({ results: matches });

    })
    .catch(next)

  } else {

    Entry.distinct(field, condition)
    .atRevision()
    .then(response => {
      var filteredResponse = response.filter(function(d){ return d.search( new RegExp(value, "i") ) != -1; });
      res.json({
        results: response.filter(function(d){ return d.search( new RegExp(value, "i") ) != -1; })
      });
    })
    .catch(next)

  }
}



exports.uniques = function (req, res) {

  var field = req.body.field;
  //var value = req.body.value;
  var query = parseQuery(req.body.query);
  //console.log(JSON.stringify(query))
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

    if (field === 'fullName') group['_id'] = { d: { fullName: '$fullName', parentFullName: '$parentFullName' }, u: '$index' };
    else group['_id'] = { d: '$' + field, u: '$index' };
    group['count'] = { $sum : 1 }

    var pipeline = [];

    pipeline.push( { $match : query } )
    pipeline.push({ $match: {_revisionIndex: null } })
    if (field.split('.').length > 1) {
      pipeline.push({ $unwind: '$' + field.split('.')[0] })
    }
    if (field === 'fullName') {
      pipeline.push({
        $project : {
          index : true,
          parentFullName: '$fullName',
          fullName : {
            $concatArrays : [
              { $ifNull : [
                { $map : {
                  input : '$alternateNames',
                  as : 'grade',
                  in : '$$grade.alternateName',
                } },
                [],
              ] },
              [ '$fullName' ],
            ]
          }
        }
      });
      pipeline.push({ $unwind : '$fullName' });
    }
    pipeline.push( { $group : group } )
    pipeline.push( { $group : { _id : '$_id.d', count: { $sum: 1 } } } )
    if (field === 'fullName') {
      pipeline.push({
        $project : {
          _id: '$_id.fullName',
          parentFullName: '$_id.parentFullName',
          count: true,
        }
      });
    }
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


exports.new_suggest = function (req, res, next) {

  var field = req.body.field;
  var value = req.body.value;
  var condition = searchMap[field](value);
  // console.log(field,value, condition)
  Entry.
    distinct(field, condition).atRevision()
    .then(response => {
      res.json({
        results: response//.filter(function(d){ return d.search( new RegExp(value, "i") ) != -1; })
      });
    })
    .catch(next)
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

  fullName : function(d) { return { $or : [
    { fullName : { $regex : new RegExp(escapeRegExp(d), "gi") } },
    { alternateNames : { $elemMatch : { alternateName : { $regex : new RegExp(escapeRegExp(d), "gi") } } } },
  ] } },
  type : function(d) { return { type : d } },

  birthDate : function(d) { return { dates : { $elemMatch : { birthDate : d } } } },
  deathDate : function(d) { return { dates : { $elemMatch : { deathDate : d } } } },

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

  travel : function(d) {

    var outer = [];

    if (d.date) {

      if (d.date.startYear) {

        outer.push({
          $or : [ { travelEndYear : { $gt : +d.date.startYear } }, { $and : [ { travelEndYear : +d.date.startYear } ] } ]
        });

        if (d.date.startMonth) {

          var middle = outer[0].$or[1].$and;
          middle.push({
            $or : [ { travelEndMonth : { $gt : +d.date.startMonth } }, { $and : [ { travelEndMonth : +d.date.startMonth } ] } ]
          });

          if (d.date.startDay) {

            var inner = middle[1].$or[1].$and;
            inner.push({
              $or : [ { travelEndDay : { $gte : +d.date.startDay } } ]
            });

          }

        }

      }

      if (d.date.endYear) {

        outer.push({
          $or : [ { travelStartYear : { $lt : +d.date.endYear, $ne : 0 } }, { $and : [ { travelStartYear : +d.date.endYear } ] } ]
        });

        if (d.date.endMonth) {

          var middle = outer[0].$or[1].$and;
          middle.push({
            $or : [ { travelStartMonth : { $lt : +d.date.endMonth, $ne : 0 } }, { $and : [ { travelStartMonth : +d.date.endMonth } ] } ]
          });

          if (d.date.endDay) {

            var inner = middle[1].$or[1].$and;
            inner.push({
              $or : [ { travelStartDay : { $lte : +d.date.endDay, $ne : 0 } } ]
            });

          }

        }

      }

    }

    if (d.place) outer.push({ place : { $regex : new RegExp(escapeRegExp(d.place), "gi") } });

    return { travels : { $elemMatch : { $and : outer } } };

  },

  entry : function(d) {

    var or = [];
    for (var section in d.sections) {
      queryObj = {};
      queryObj[section] = { $regex : new RegExp((d.beginnings === 'yes' ? '\\b' : '') + escapeRegExp(d.sections[section]), "gi") };
      or.push(queryObj);
    }
    return { $or : or };
  },

}

var searchMap = {

  fullName : function(d) { return { $or : [
    { fullName : { $regex : new RegExp(escapeRegExp(d), "gi") } },
    { alternateNames : { $elemMatch : { alternateName : { $regex : new RegExp(escapeRegExp(d), "gi") } } } },
  ] } },

  type : function(d) { return { type : d } },

  birthDate : function(d) { return { dates : { $elemMatch : { birthDate : d } } } },
  deathDate : function(d) { return { dates : { $elemMatch : { deathDate : d } } } },

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

  travel : function(d) {

    var outer = [];

    if (d.date) {

      if (d.date.startYear) {

        outer.push({
          $or : [ { travelEndYear : { $gt : +d.date.startYear } }, { $and : [ { travelEndYear : +d.date.startYear } ] } ]
        });

        if (d.date.startMonth) {

          var middle = outer[0].$or[1].$and;
          middle.push({
            $or : [ { travelEndMonth : { $gt : +d.date.startMonth } }, { $and : [ { travelEndMonth : +d.date.startMonth } ] } ]
          });

          if (d.date.startDay) {

            var inner = middle[1].$or[1].$and;
            inner.push({
              $or : [ { travelEndDay : { $gte : +d.date.startDay } } ]
            });

          }

        }

      }

      if (d.date.endYear) {

        outer.push({
          $or : [ { travelStartYear : { $lt : +d.date.endYear, $ne : 0 } }, { $and : [ { travelStartYear : +d.date.endYear } ] } ]
        });

        if (d.date.endMonth) {

          var middle = outer[0].$or[1].$and;
          middle.push({
            $or : [ { travelStartMonth : { $lt : +d.date.endMonth, $ne : 0 } }, { $and : [ { travelStartMonth : +d.date.endMonth } ] } ]
          });

          if (d.date.endDay) {

            var inner = middle[1].$or[1].$and;
            inner.push({
              $or : [ { travelStartDay : { $lte : +d.date.endDay, $ne : 0 } } ]
            });

          }

        }

      }

    }

    if (d.place) outer.push({ place : { $regex : new RegExp(escapeRegExp(d.place), "gi") } });

    return { travels : { $elemMatch : { $and : outer } } };

  },

  entry : function(d) {
    var or = [];
    for (var section in d.sections) {
      queryObj = {};
      queryObj[section] = { $regex : new RegExp((d.beginnings === 'yes' ? '\\b' : '') + escapeRegExp(d.sections[section]), "gi") };
      or.push(queryObj);
    }
    return { $or : or };
  },

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
    if (query[k].constructor === Array) {
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


exports.search = function (req, res, next) {

  var originalQuery = JSON.stringify(req.body.query);
  var query = parseQuery(req.body.query);

    Entry
      .find(query, {
        index : true,
        fullName : true,
        biography : true,
        places: true,
        dates: true,
        travels: true
      })
      .atRevision()
      .then(response => {
        res.json({
          request : JSON.parse(originalQuery),
          entries : response
        });
      } )
      .catch(next)

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
    var s = searchMapRE[k](query[k]);

    o.push(s)

  }
  return o.length ? { $and: o } : {};
}


exports.search2 = function (req, res, next) {

  var originalQuery = JSON.stringify(req.body.query);
  var query = parseQuery2(req.body.query);

  console.log(JSON.stringify(query))


    Entry
      .find(query, {
        index : true,
        fullName : true,
        biography : true,
        places: true,
        dates: true,
        travels: true
      })
      .atRevision()
      .then(response => {
        res.json({
          request : JSON.parse(originalQuery),
          entries : response
        });
      })
      .catch(next)
}




function parseExport(res){

  var activities = [];
  var activityIndex = 0;
  var travels = [];

  var entries = res.map(function(d){

    var entry = {};

    // index
    entry.index = d.index;
    // fullName
    entry.fullName = d.fullName;
    // gender
    entry.gender = d.gender;
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
        index : ++activityIndex,
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
        index : ++activityIndex,
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
        index : ++activityIndex,
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
        index : ++activityIndex,
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
        index : ++activityIndex,
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
        index : ++activityIndex,
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
        index : ++activityIndex,
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
        coordinates : a.latitude ? [a.latitude, a.longitude].join(",") : "",
        startDate : a.travelStartYear ? a.travelStartYear + "-" + (a.travelStartMonth || "01") + "-" + (a.travelStartDay || "01") : "", //a.travelStartMonth ? a.travelStartDay ? a.travelStartYear + "/" + (a.travelStartMonth || "01") + "/" + (a.travelStartDay || "01") : a.travelStartYear + "/" + a.travelStartMonth : a.travelStartYear : "",
        endDate : a.travelEndYear ? a.travelEndYear + "-" +  (a.travelEndMonth || "01") + "-" + (a.travelEndDay || "01") : "" //a.travelEndMonth ? a.travelEndDay ? a.travelEndYear + "/" + a.travelEndMonth + "/" + a.travelEndDay : a.travelEndYear + "/" + a.travelEndMonth : a.travelEndYear : "",
      })
    })

    entry.activities = activities
      .filter(function(d){ return d.entry == entry.index; })
      .map(function(d){ return d.index; })
      .join(",")

    return entry;
  })

  return {
    entries : entries,
    activities : activities,
    travels : travels
  }

}


exports.export = function (req, res) {

  if (req.body.query) {

    var originalQuery = JSON.stringify(req.body.query);
    var query = parseQuery(req.body.query);

  } else {

    var ids = req.body.index_list;
    var query = { index : { $in : ids } };

  }

  Entry
    .aggregate()
    .match(query)
    .match({ _revisionIndex: null })
    .exec(function (err, response) {

      if (err) {
        res.json({ error: err })
        return;
      }

      res.json({
        // request : JSON.parse(originalQuery),
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
  Entry.findOne({index:req.params.id}, function(err, response){
    if (err) res.json({error:err});
    var entry = response;
    Entry.findOne({ index : { $gt : req.params.id } }).sort('index').limit(1).select('index').exec(function(err, response) {
      if (err) res.json({error:err});
      var nextIndex = response ? response.index : req.params.id;
      Entry.findOne({ index : { $lt : req.params.id } }).sort('-index').limit(1).select('index').exec(function(err, response) {
        if (err) res.json({error:err});
        var previousIndex = response ? response.index : req.params.id;
        res.json({entry: entry, nextIndex: nextIndex, previousIndex: previousIndex });
      });
    });
  });
}


/*
*   Calculates the counts of entries with values for each field
*   query mapping.
*/

exports.getCounts = async function() {

    const countQueries = {
        
        fullName: { fullName : { $ne : null } },
        alternateNames: { alternateNames : { $exists : true } },
        birthDate: { 'dates.0.birthDate' : { $exists : true } },
        birthPlace: { 'places.0.birthPlace' : { $exists : true } },
        deathDate: { 'dates.0.deathDate' : { $exists : true } },
        deathPlace: { 'places.0.deathPlace' : { $exists : true } },
        type: { type : { $ne : null } },
        societies: { 'societies.title' : { $exists : true } },
        societies_role: { 'societies.role' : { $exists : true } },
        education_institution: { 'education.institution' : { $exists : true } },
        education_place: { 'education.place' : { $exists : true } },
        education_degree: { 'education.degree' : { $exists : true } },
        education_teacher: { 'education.teacher' : { $exists : true } },
        pursuits: { pursuits : { $ne : [] } },
        occupations: { 'occupations.title' : { $exists : true } },
        occupations_group: { 'occupations.group' : { $exists : true } },
        occupations_place: { 'occupations.place' : { $exists : true } },
        military: { 'military.rank' : { $exists : true } },
        travel_place: { 'travels.place' : { $exists : true } },
        travel_date: { $or : [ { 'travels.travelStartYear' : { $ne : '0' } }, { 'travels.travelEndYear' : { $ne : '0' } } ] },
        travel_year: { $or : [ { 'travels.travelStartYear' : { $ne : '0' } }, { 'travels.travelEndYear' : { $ne : '0' } } ] },
        travel_month: { $or : [ { 'travels.travelStartMonth' : { $ne : '0' } }, { 'travels.travelEndMonth' : { $ne : '0' } } ] },
        travel_day: { $or : [ { 'travels.travelStartDay' : { $ne : '0' } }, { 'travels.travelEndDay' : { $ne : '0' } } ] },
        exhibitions: { 'exhibitions.title' : { $exists : true } },
        exhibitions_activity: { 'exhibitions.activity' : { $exists : true } },
    
    }

    const counts = {}
    await Promise.all(Object.keys(countQueries).map(async key => {

        const count = await Entry.count(countQueries[key]).atRevision()
        counts[key] = count

    }))

    return { counts }

}
