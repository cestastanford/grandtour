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

exports.search = function(req, res){

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
