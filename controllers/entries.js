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

exports.single = function(req, res){

  Entry.findOne({index:req.params.id}, function(err, entry){
    if (err) {
      res.json({error:err});
    //  return;
    }
    res.json({entry:entry});
  })

}
