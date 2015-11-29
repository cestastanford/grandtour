var mongoose = require('mongoose')
, List = mongoose.model('List')

exports.myLists = function(req, res) {

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

exports.newList = function(req, res) {

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

exports.deleteList = function(req, res) {

    var user = req.body.username;
    var id = req.body.id;

    List.remove({ _id: id }, function(error) {
        res.json({ error: error });
    });

};
