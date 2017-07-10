/*
*   Entry documents contain all of the fields defined in './entry-fields/',
*   plus a marker for whether an entry has been deleted and an array.
*   Each version of an Entry is stored as a separate document, containing
*   a reference to the Revision that it's a part of, or null if
*   part of the latest Revision.
*/


/*
*   Imports
*/

const mongoose = require('mongoose')
const entryFields = require('./entry-fields')()


/*
*   Defines schema.
*/

const entrySchema = mongoose.Schema({

    index: { type: Number, required: true },
    _revisionIndex: Number,

})

for (let key in entryFields) entrySchema.add({

    [key]: {
        type: entryFields[key].type,
        default: null,
    }

})


/*
*   Adds query helper to retrieve only a certain revision of data
*   from the database.
*/

entrySchema.query.atRevision = function(revisionIndex) {

    if (revisionIndex) return this.where({ _revisionIndex: revisionIndex })
    else return this.where({ _revisionIndex: null })

}


/*
*   Adds toObject and toJSON helpers to remove unneeded fields before
*   returning data to the client.
*/

entrySchema.set('toObject', {

    versionKey: false,
    transform: (doc, ret) => {

        delete ret._id
        return ret

    }

})

entrySchema.set('toJSON', {

    versionKey: false,
    transform: (doc, ret) => {

        delete ret._id
        return ret

    }

})


/*
*   Defines static and instance methods.
*/

class Entry {

    /*
    *   Creates an entry at the latest Revision with the specified
    *   index and fields.  If an entry with the specified index
    *   already exists, returns 409 Conflict.  If the entry previously
    *   existed but was deleted, it is re-created.
    */

    static async create(newEntryFields) {

        const index = newEntryFields.index ? +newEntryFields.index : null
        if (!index) {
            const error = new Error('No index specified')
            error.status = 400
            throw error
        }

        const foundEntry = await this.findOne({ index }).atRevision()
        console.log(foundEntry)
        if (foundEntry) {
            const error = new Error('Entry with specified index already exists')
            error.status = 409
            throw error
        }

        const newEntry = new this({ index })
        Object.keys(entryFields).forEach(key => {
            if (newEntryFields[key]) newEntry[key] = newEntryFields[key]
        })
        
        await newEntry.save()
        return newEntry

    }


    /*
    *   Saves an entry's latest state as a new Revision.
    */

    async saveRevision(newRevisionIndex) {

        const newVersion = new this.constructor(this.toObject())
        newVersion._revisionIndex = newRevisionIndex
        await newVersion.save()

    }


    /*
    *   Resets the latest version of an entry to the version specified
    *   by the passed revisionIndex
    */

    async resetLatestToRevision(revisionIndex) {

        const { index } = await this.remove()
        const sourceVersion = await this.constructor.findOne({ index }).atRevision(revisionIndex)
        const newVersion = new this.constructor(sourceVersion ? sourceVersion.toObject() : {})
        newVersion._revisionIndex = null
        await newVersion.save()

    }


    /*
    *   Finds the indices of the previous and next entries in a
    *   given revision.
    */

    static async getAdjacentIndices(index, revisionIndex) {

        let previous = await this.findOne()
        .atRevision(revisionIndex)
        .lt('index', index)
        .sort('-index')

        if (!previous) previous = await this.findOne()
        .atRevision(revisionIndex)
        .sort('-index')

        let next = await this.findOne()
        .atRevision(revisionIndex)
        .gt('index', index)
        .sort('index')

        if (!next) next = await this.findOne()
        .atRevision(revisionIndex)
        .sort('index')

        return {
            previous: previous ? previous.index : null,
            next: next ? next.index : null,
        }

    }

}


/*
*   Attaches static and instance methods and creates model.
*/

entrySchema.loadClass(Entry)
const entryModel = mongoose.model('Entry', entrySchema)


/*
*   Exports
*/

module.exports = entryModel
