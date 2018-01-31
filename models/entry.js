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
const { getLatestRevisionIndex, invalidateQueryCounts } = require('../cache')


/*
*   Logs entry modifications and invalidates query count cache.
*/

const OP_TYPES = { CREATE: 'CREATE', UPDATE: 'UPDATE', UPSERT: 'UPSERT', DELETE: 'DELETE' }
const logEntryModification = (opType, index, update) => {

    console.log(`Entry Modification: ${opType} ${index} ${update ? Object.keys(update).join(', ') : ''}`)
    invalidateQueryCounts(getLatestRevisionIndex())

}


/*
*   Defines schema.
*/

const entrySchema = mongoose.Schema({

    _revisionIndex: { type: Number, default: getLatestRevisionIndex },
    _deleted: { type: Boolean, default: false },
    index: { type: Number, required: true, index: true },

})

for (let key in entryFields) {

    entrySchema.add({

        [key]: {
            type: entryFields[key].isArrayOfValues() || !entryFields[key].valueIsObject()
            ? entryFields[key].type
            : mongoose.Schema(entryFields[key].type),
            
            default: null,
        }

    })

}


/*
*   Adds toObject and toJSON helpers to remove unneeded fields and
*   correctly interpret the _deleted flag before returning Entry to
*   the client.
*/

const toObject = (doc, ret) => {

    const returnedObject = ret || doc
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject._revisionIndex
    delete returnedObject._deleted
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

        logEntryModification(OP_TYPES.CREATE, index, newEntryFields)
        
        const foundEntry = await this.findByIndexAtRevision(index)
        if (foundEntry) {
            const error = new Error('Entry with specified index already exists')
            error.status = 409
            throw error
        }

        return this.findByIndexAndUpdateAtLatest(index, Object.assign({ _deleted: false }, newEntryFields), true)

    }


    /*
    *   Deletes the Entry specified by index by clearing all fields
    *   and setting the _deleted flag to true in the latest Revision,
    *   returning the deleted entry, if any.
    */

    static async deleteAtLatest(index) {

        logEntryModification(OP_TYPES.DELETE, index)

        const existingEntry = await this.findByIndexAtRevision(index)
        if (existingEntry) {
            await this.remove({ index: existingEntry.index, _revisionIndex: getLatestRevisionIndex() })
            await (new this({ index, _deleted: true })).save()
        }

        return existingEntry

    }


    /*
    *   Finds a single Entry by index as of the specified Revision,
    *   or the latest Revision if null, returning the query promise.
    */

    static async findByIndexAtRevision(index, revisionIndex, includeDeleted) {

        const result = await this.findOne({ index })
        .lte('_revisionIndex', revisionIndex || getLatestRevisionIndex())
        .sort('-_revisionIndex')

        if (result && result._deleted && !includeDeleted) return null
        return result

    }


    /*
    *   Finds the indices of the previous and next entries in a
    *   given revision.
    */

    static async getAdjacentIndices(index, revisionIndex) {

        let previous = await this.findOne({ _deleted: false })
        .lte('_revisionIndex', revisionIndex || getLatestRevisionIndex())
        .lt('index', index)
        .sort('-index -_revisionIndex')

        if (!previous) previous = await this.findOne({ _deleted: false })
        .lte('_revisionIndex', revisionIndex || getLatestRevisionIndex())
        .sort('-index -_revisionIndex')

        let next = await this.findOne({ _deleted: false })
        .lte('_revisionIndex', revisionIndex || getLatestRevisionIndex())
        .gt('index', index)
        .sort('index -_revisionIndex')

        if (!next) next = await this.findOne({ _deleted: false })
        .lte('_revisionIndex', revisionIndex || getLatestRevisionIndex())
        .sort('index -_revisionIndex')

        let lastUsedDecimal = await this.findOne({ _deleted: false })
        .lte('_revisionIndex', revisionIndex || getLatestRevisionIndex())
        .gte('index', index)
        .lt('index', Math.ceil(+index) === +index ? (+index) + 1 : Math.ceil(+index))
        .sort('-index -_revisionIndex')

        return {
            previous: previous ? previous.index : null,
            next: next ? next.index : null,
            lastUsedDecimal: lastUsedDecimal ? lastUsedDecimal.index : null,
        }

    }


    /*
    *   Finds a single Entry by query as of the latest Revision
    *   and applies the specified changes, creating a version for
    *   the latest Revision if it doesn't yet exist.  If inserting
    *   is true, the function will create the entry if no previous
    *   versions exist.
    */

    static async findByIndexAndUpdateAtLatest(index, updatedEntryFields, insert) {

        if (!insert) logEntryModification(OP_TYPES.UPDATE, index, updatedEntryFields)

        const entry = await this.findByIndexAtRevision(index, null, true)
        if (entry || insert) {

            let latest
            if (entry && entry._revisionIndex === getLatestRevisionIndex()) latest = entry
            else latest = new this(entry && entry.toObject() || { index })
            Object.keys(updatedEntryFields).forEach(key => { latest[key] = updatedEntryFields[key] })
            return latest.save()

        } else return null

    }


    /*
    *   Returns the beginning of an aggregation pipeline that finds
    *   the latest version of each entry, if it exists and hasn't
    *   been deleted.
    */

    static aggregateAtRevision(revisionIndex) {
        
        return this.aggregate()
        .allowDiskUse(true)
        .match({ _revisionIndex: { $lte: revisionIndex || getLatestRevisionIndex() } })
        .sort({ _revisionIndex: -1 })
        .group({ _id: '$index', latest: { $first: '$$ROOT' } })
        .append({ $replaceRoot: { newRoot: '$latest' } })
        .match({ _deleted: false })
        .sort({ index: 1 })
    
    }


    /*
    *   Queries for multiple entries as of the specified Revision,
    *   returning an aggregation pipeline promise.
    */

    static async findAtRevision(query, revisionIndex, projection, sort) {

        const cursor = await this.aggregateAtRevision(revisionIndex)
        .match(query || {})
        .sort(sort || { index: 1 })
        .project(projection || { _id: false })
        .cursor()
        .exec()

        const results = await cursor.toArray()
        return results.map(result => toObject(result))

    }


    /*
    *   Retrieves an array of unique values for a given field in
    *   the Entry schema.
    */

    static async distinctAtRevision(field, query, revisionIndex) {

        const results = await this.aggregateAtRevision(revisionIndex)
        .unwind('$' + field.split('.')[0])
        .match(query)
        .group({ _id: '$' + field })
        .sort('_id')

        return results.map(result => result._id)

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
