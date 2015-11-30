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

    var user = req.body.username;
    var listName = req.body.name;

    var newList = new List({
        name: listName,
        owner: user,
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

exports.addToList = function(req, res) {

    var id = req.body.listID;
    var entryIndex = req.body.entryIndex;

    List.findOneAndUpdate(
        { _id: id },
        { $push : { entryIDs : entryIndex } },
        function(error) {
            if (error) res.json({ error: error});
            else res.json({ success: true });
        }
    );
};

exports.removeFromList = function(req, res) {

    var id = req.body.listID;
    var entryIndex = req.body.entryIndex;

    List.findOneAndUpdate(
        { _id: id },
        { $pull : { entryIDs : entryIndex } },
        function(error) {
            if (error) res.json({ error: error });
            else res.json({ success: true });
        }
    );
};
