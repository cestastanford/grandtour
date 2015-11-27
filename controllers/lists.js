var mongoose = require('mongoose')
, List = mongoose.model('List')

exports.mylists = function(req, res) {

  var username = req.body.username;
  console.log('finding lists for ' + username)

  List.find({ owner : username }, function(err, response) {
    if (err) {
        res.json({ error : err });
    } else {
        res.json({ entries : response });
    }
  });

};

exports.newlist = function(req, res) {

  var listOwner = req.body.username;
  var listName = req.body.name;

  var newList = new List({

    name: listName,
    owner: listOwner,
    entryIDs: []

  });

  newList.save(function(error, newList) {
    res.json({ error: error, newList: newList });
  });

};
