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
*   Defines a toJSON method that converts the _id field to an index
*   field.
*/

revisionSchema.set('toJSON', {

    versionKey: false,
    transform: (doc, ret) => {

        ret.index = ret._id
        delete ret._id
        return ret

    }

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

        const latestRevision = await this.findOne()
        .sort('-_id')
        .select('_id')

        return latestRevision ? latestRevision._id : 0

    }

    
    /*
    *   Creates a new Revision, saving all Entries' current versions
    *   to a new versioned document.
    */

    static async create(name) {

        const newRevisionIndex = (await this.getLatestRevisionIndex()) + 1
        const newRevision = new this({
            _id: newRevisionIndex,
            name,
        })

        const entries = await Entry.find().select('-_id').atRevision()
        for (let i = 0; i < entries.length; i++) {
            await entries[i].saveRevision(newRevisionIndex)
            if (i % 100 === 0) console.log(`Created new Revision for ${i}/${entries.length} entries`)
        }
        
        return await newRevision.save()

    }


    /*
    *   Deletes a Revision, removing associated versions of all Entries.
    */

    async delete(name) {

        await Entry.deleteMany({ _revisionIndex: this._id })
        return await this.remove()

    }


    /*
    *   Deletes the latest set of changes, setting the previous
    *   Revision as the latest.
    */

    static async clearLatest() {

        const latestRevisionIndex = await this.getLatestRevisionIndex()
        const entries = await Entry.find({ _revisionIndex: null })
        await Promise.all(entries.map(entry => entry.resetLatestToRevision(latestRevisionIndex)))

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
