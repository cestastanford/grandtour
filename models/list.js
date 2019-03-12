/*
*   List documents represent user-created lists of entries.
*/


/*
*   Imports
*/

const mongoose = require('mongoose')


/*
*   Defines the Revision schema.
*/

const listSchema = mongoose.Schema({
    
    name: String,
    owner: String,
    entryIDs: [Number],

}, { usePushEach: true })


/*
*   Defines static and instance methods for the class.
*/

class List {

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

    static async addToList(req, res) {

        var id = req.body.listID;
        var entryIndex = req.body.entryIndex;

        let model = await this.findOne({_id: id});
        try {
            if (model.entryIDs.length && model.entryIDs.includes(entryIndex)) {

            }
            else {
                model.entryIDs.push(entryIndex);
            }
            await model.save();
            res.json({ success: true, entryIDs: model.entryIDs });
        }
        catch (error) {
            res.json({ error: error, a: 'a'});
        }
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


/*
*   Attaches static and instance methods and creates Revision model.
*/

listSchema.loadClass(List)
const listModel = mongoose.model('List', listSchema)


/*
*   Exports
*/

module.exports = listModel
