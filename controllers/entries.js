var	mongoose = require('mongoose')
, Entry = mongoose.model('Entry')

exports.index = function(req, res){

  Entry.find({}, function(err, count){
    if (err) {
      res.json({error:err});
    //  return;
    }
    res.json({count:count});
  })

}

/*exports.search = function(req, res){

  var fullName = req.body.fullName;

  var query = {
    fullName: { $regex : new RegExp(fullName, "i") }
  }

  Entry.find(query, function(err, entries){
    if (err) {
      res.json({error:err});
    //  return;
    }
    res.json({entries:entries});
  })

}*/

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
      return obj[key] = obj[key].exactMatch ? obj[key].value : { $regex : new RegExp(escapeRegExp(obj[key].value), "gi") };
    }
  }
}


/*
exports.suggest = function (req, res) {

  var field = req.body.field
    , value = req.body.value
    , query = {}
    , pipeline = [ { $group: { _id: '$' + field, count: { $sum: 1 } } }, { $sort: { count:-1 } } ]

  if (field.match(/\./)) {
    var elemMatch = {};
    if (field.match(/\.$/)) {
      elemMatch = { $regex : new RegExp(value, "i") };
      pipeline[0].$group._id = '$' + field.split(".")[0];
    }
    else elemMatch[field.split(".")[1]] = { $regex : new RegExp(value, "i") };

    query[field.split(".")[0]] = { $elemMatch : elemMatch };

    pipeline.unshift({ $unwind : '$' + field.split(".")[0] });

  } else {
    query[field] = { $regex : new RegExp(value, "i") };
  }

  pipeline.unshift({ $match: query });

  console.log(pipeline)

  Entry
    .aggregate(pipeline)
    .exec(function (err, response) {
      if (err) {
        res.json({ error: err })
        return;
      }
      res.json({
        results: response
      });
    })

}

*/


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

/*  Entry
    .aggregate([
      { $match : { 'travels' : { $elemMatch : { 'place' : { $regex : new RegExp('Venice', "i") } } } } },
      { $unwind : '$travels' },
      { $group: { _id : '$travels.place', count : { $sum: 1 } } },
      { $sort: { count : -1 } }
    ])
    .exec(function (err, response) {
      if (err) {
        res.json({ error: err })
        return;
      }
      res.json({
        results: response
      });
    })*/

/*  var pipeline = [ { $group: { _id: '$' + field, count: { $sum: 1 } } }, { $sort: { count:-1 } } ];

  Entry
    .aggregate(pipeline)
    .exec(function (err, response) {
      if (err) {
        res.json({ error: err })
        return;
      }
      res.json({
        results: response
      });
    })*/

}

exports.search = function (req, res) {

  var originalQuery = JSON.stringify(req.body.query);
  query = getQuery(req.body.query);

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
