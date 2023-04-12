/*
*   Revision documents represent sets of entry data updates.
*/


/*
*   Imports
*/

const mongoose = require('mongoose')
const Entry = require('./entry')
const { setLatestRevisionIndex } = require('../cache')


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

revisionSchema.set('toJSON', { transform: (doc, ret) => {

        ret.index = ret._id
        delete ret._id
        delete ret.__v
        return ret

} })


/*
*   Defines the static and instance methods for the Revision class.
*/

class Revision {


    /*
    *   Creates a first Revision if one doesn't yet exist.
    */

    static async createInitialRevision() {

        if (await this.count() === 0) {
            
            const initialRevision = await this.create()
            console.log(`Initial Revision created: ${initialRevision.name}`)
            console.log('-----------------------------------')
            return initialRevision
        
        } else setLatestRevisionIndex(await this.getLatestRevisionIndex())
    
    }


    /*
    *   Retrieves the index of the latest revision, or 0 if no revisions
    *   exist.
    */

    static async getLatestRevisionIndex() {

        const latestRevision = await this.findOne()
        .sort('-_id')

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
            name: name || `Revision started on ${(new Date()).toLocaleString()}`,
        })
        
        await newRevision.save()
        setLatestRevisionIndex(await this.getLatestRevisionIndex())
        return newRevision

    }


    /*
    *   Deletes a Revision, removing associated versions of all Entries.
    */

    async delete(name) {

        await Entry.deleteMany({ _revisionIndex: this._id })
        const oldRevision = await this.remove()
        setLatestRevisionIndex(await this.getLatestRevisionIndex())
        return oldRevision

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
