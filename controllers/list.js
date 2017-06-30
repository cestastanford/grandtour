/*
*   Defines the static and instance methods for the Revision class.
*/

module.exports = class List {

    static myLists(req, res) {

        var username = req.body.username;
        console.log('finding lists for ' + username)

        this.find({ owner : username }, function(err, response) {
            if (err) {
                res.json({ error : err });
            } else {
                res.json({ entries : response });
            }
        });
    };

    static newList(req, res) {

        var user = req.body.username;
        var listName = req.body.name;

        var newList = new this({
            name: listName,
            owner: user,
            entryIDs: []
        });

        newList.save(function(error, newList) {
            res.json({ error: error, newList: newList });
        });
    };

    static deleteList(req, res) {

        var user = req.body.username;
        var id = req.body.id;

        this.remove({ _id: id }, function(error) {
            res.json({ error: error });
        });
    };

    static addToList(req, res) {

        var id = req.body.listID;
        var entryIndex = req.body.entryIndex;

        this.findOneAndUpdate(
            { _id: id },
            { $push : { entryIDs : entryIndex } },
            function(error) {
                if (error) res.json({ error: error});
                else res.json({ success: true });
            }
        );
    };

    static removeFromList(req, res) {

        var id = req.body.listID;
        var entryIndex = req.body.entryIndex;

        this.findOneAndUpdate(
            { _id: id },
            { $pull : { entryIDs : entryIndex } },
            function(error) {
                if (error) res.json({ error: error });
                else res.json({ success: true });
            }
        );
    };

}
