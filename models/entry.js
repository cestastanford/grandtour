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
const { getLatestRevisionIndex } = require('../cache')


/*
*   Defines schema.
*/

const entrySchema = mongoose.Schema({

    _revisionIndex: { type: Number, default: getLatestRevisionIndex },
    _deleted: { type: Boolean, default: false },
    index: { type: Number, required: true, index: true },

})

for (let key in entryFields) entrySchema.add({

    [key]: {
        type: entryFields[key].type,
        default: null,
    }

})


/*
*   Adds toObject and toJSON helpers to remove unneeded fields and
*   correctly interpret the _deleted flag before returning Entry to
*   the client.
*/

const toObject = (doc, ret) => {

    const returnedObject = ret || doc
    if (returnedObject._deleted) return null
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject._revisionIndex
    delete returnedObject._deleted
    Object.values(entryFields).forEach(field => {
        if (field.valueIsObject()) {
            delete field.getValueType()._id
            delete returnedObject.__v
        }
    })

    return returnedObject

}

entrySchema.set('toObject', { transform: toObject })
entrySchema.set('toJSON', { transform: toObject })


/*
*   Defines static and instance methods.
*/

class Entry {


    /*
    *   Creates an Entry at the latest Revision with the specified
    *   index and fields.  If an entry with the specified index
    *   already exists, returns 409 Conflict.  If the entry previously
    *   existed but was deleted, it is re-created.  Returns the new
    *   entry if successful.
    */

    static async createAtLatest(index, newEntryFields) {

        const foundEntry = await this.findOne({ index, _revisionIndex: getLatestRevisionIndex() })
        if (foundEntry) {
            
            if (foundEntry._deleted) {
                await foundEntry.remove()
            } else {
                const error = new Error('Entry with specified index already exists')
                error.status = 409
                throw error
            }

        }

        const newEntry = new this({ index })
        Object.keys(entryFields).forEach(key => {
            if (newEntryFields[key]) newEntry[key] = newEntryFields[key]
        })
        
        return newEntry.save()

    }


    /*
    *   Deletes the Entry specified by index by clearing all fields
    *   and setting the _deleted flag to true in the latest Revision,
    *   returning the deleted entry, if any.
    */

    static async deleteAtLatest(index) {

        const existingEntry = await this.findOneAtRevision({ index })
        if (existingEntry) {
            const _revisionIndex = getLatestRevisionIndex()
            await this.remove({ index, _revisionIndex })
            const newDeletedEntry = new this({ index, _deleted: true })
            await newDeletedEntry.save()
        }

        return existingEntry

    }


    /*
    *   Applies changes to the Entry specified by index, creating
    *   a version for the latest Revision if it doesn't yet exist.
    */

    updateAtLatest(updatedEntryFields) {

        let latest
        if (this._revisionIndex === getLatestRevisionIndex()) latest = this
        else latest = new this.constructor(this.toObject())
        Object.keys(entryFields).forEach(key => {
            if (updatedEntryFields[key]) latest[key] = updatedEntryFields[key]
        })

        return latest.save()

    } 


    /*
    *   Finds a single Entry by query as of the specified Revision,
    *   or the latest Revision if null, returning the query promise.
    */

    static findOneAtRevision(query, revisionIndex) {

        return this.findOne(query)
        .lte('_revisionIndex', revisionIndex || getLatestRevisionIndex())
        .sort('-_revisionIndex')

    }


    /*
    *   Queries for multiple entries as of the specified Revision,
    *   returning an aggregation pipeline promise.
    */

    static async findAtRevision(query, revisionIndex) {

        const results = await this.aggregate([

            { $match: { _revisionIndex: { $lte: revisionIndex || getLatestRevisionIndex() } } },
            { $sort: { _revisionIndex: -1 } },
            { $group: { _id: '$index', latest: { $first: '$$ROOT' } } },
            { $replaceRoot: { newRoot: '$latest' } },
            { $sort: { index: 1 } },

        ])

        return results.map(result => toObject(result)).filter(result => result)

    }


    /*
    *   Finds the indices of the previous and next entries in a
    *   given revision.
    */

    static async getAdjacentIndices(index, revisionIndex) {

        let previous = await this.findOneAtRevision({ _deleted: false }, revisionIndex)
        .lt('index', index)
        .sort('-index')

        if (!previous) previous = await this.findOneAtRevision({ _deleted: false }, revisionIndex)
        .sort('-index')

        let next = await this.findOneAtRevision({ _deleted: false }, revisionIndex)
        .gt('index', index)
        .sort('index')

        if (!next) next = await this.findOneAtRevision({ _deleted: false }, revisionIndex)
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
