/*
*   Revision documents represent sets of entry data updates.
*/


/*
*   Imports
*/

const mongoose = require('mongoose')
const Entry = require('./entry')


/*
*   Defines the Revision schema.
*/

const revisionSchema = mongoose.Schema({
    
    _id: Number,
    name: String,

})


/*
*   Defines the static and instance methods for the Revision class.
*/

class Revision {


    /*
    *   Retrieves the index of the latest revision, or 0 if no revisions
    *   exist.
    */

    static async getLatestRevisionIndex() {

        const latestRevision = await this.findOne({})
        .sort('-_id')
        .select('_id')

        return latestRevision ? latestRevision._id : 0

    }

    
    /*
    *   Creates a new Revision, saving all entries' current versions
    *   to their respective _revision arrays.
    */

    static async create(name) {

        const newRevisionIndex = (await this.getLatestRevisionIndex()) + 1
        const newRevision = new this({
            _id: newRevisionIndex,
            name,
        })

        const entries = await Entry.find({})
        await Promise.all(entries.map(entry => entry.saveRevision(newRevisionIndex)))
        await newRevision.save()
        return newRevision

    }

}



/*
*   Attaches static and instance methods and creates Revision model.
*/

revisionSchema.loadClass(Revision)
const revisionModel = mongoose.model('Revision', revisionSchema)


/*
*   Exports
*/

module.exports = revisionModel
