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

    static async findByIndexAtRevision(index, revisionIndex) {

        const result = await this.findOne({ index })
        .lte('_revisionIndex', revisionIndex || getLatestRevisionIndex())
        .sort('-_revisionIndex')

        if (result && result._deleted) return null
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

        return {
            previous: previous ? previous.index : null,
            next: next ? next.index : null,
        }

    }


    /*
    *   Finds a single Entry by query as of the latest Revision
    *   and applies the specified changes, creating a version for
    *   the latest Revision if it doesn't yet exist.
    */

    static async findByIndexAndUpdateAtLatest(index, updatedEntryFields, upsert) {

        const entry = await this.findByIndexAtRevision(index)
        if (entry || upsert) {

            let latest
            if (entry && entry._revisionIndex === getLatestRevisionIndex()) latest = entry
            else latest = new this(entry && entry.toObject() || { index })
            Object.keys(entryFields).forEach(key => {
                if (updatedEntryFields[key]) latest[key] = updatedEntryFields[key]
            })

            return latest.save()

        } else return null

    }


    /*
    *   Queries for multiple entries as of the specified Revision,
    *   returning an aggregation pipeline promise.
    */

    static async findAtRevision(query, revisionIndex) {

        const cursor = await this.aggregate()
        .match({ _revisionIndex: { $lte: revisionIndex || getLatestRevisionIndex() } })
        .sort({ _revisionIndex: -1 })
        .group({ _id: '$index', latest: { $first: '$$ROOT' } })
        .append({ $replaceRoot: { newRoot: '$latest' } })
        .match({ _deleted: false })
        .sort({ index: 1 })
        .cursor()
        .exec()

        const results = await cursor.toArray()
        return results.map(result => toObject(result))

    }


    /*
    *   Calculates the counts of entries with values for each field
    *   query mapping.
    */

    static async getCounts(revisionIndex) {

        const countQueries = {
            
            fullName: { fullName : { $ne : null } },
            alternateNames: { 'alternateNames.alternateName' : { $exists : true } },
            birthDate: { 'dates.0.birthDate' : { $exists : true } },
            birthPlace: { 'places.0.birthPlace' : { $exists : true } },
            deathDate: { 'dates.0.deathDate' : { $exists : true } },
            deathPlace: { 'places.0.deathPlace' : { $exists : true } },
            type: { type : { $ne : null } },
            societies: { 'societies.title' : { $exists : true } },
            societies_role: { 'societies.role' : { $exists : true } },
            education_institution: { 'education.institution' : { $exists : true } },
            education_place: { 'education.place' : { $exists : true } },
            education_degree: { 'education.degree' : { $exists : true } },
            education_teacher: { 'education.teacher' : { $exists : true } },
            pursuits: { pursuits : { $ne : [] } },
            occupations: { 'occupations.title' : { $exists : true } },
            occupations_group: { 'occupations.group' : { $exists : true } },
            occupations_place: { 'occupations.place' : { $exists : true } },
            military: { 'military.rank' : { $exists : true } },
            travel_place: { 'travels.place' : { $exists : true } },
            travel_date: { $or : [ { 'travels.travelStartYear' : { $ne : '0' } }, { 'travels.travelEndYear' : { $ne : '0' } } ] },
            travel_year: { $or : [ { 'travels.travelStartYear' : { $ne : '0' } }, { 'travels.travelEndYear' : { $ne : '0' } } ] },
            travel_month: { $or : [ { 'travels.travelStartMonth' : { $ne : '0' } }, { 'travels.travelEndMonth' : { $ne : '0' } } ] },
            travel_day: { $or : [ { 'travels.travelStartDay' : { $ne : '0' } }, { 'travels.travelEndDay' : { $ne : '0' } } ] },
            exhibitions: { 'exhibitions.title' : { $exists : true } },
            exhibitions_activity: { 'exhibitions.activity' : { $exists : true } },
        
        }

        const facets = {}
        Object.keys(countQueries).forEach(key => {

            facets[key] = [
                { $match: countQueries[key] },
                { $count: 'count' },
            ]

        })

        const results = await this.aggregate()
        .match({ _revisionIndex: { $lte: revisionIndex || getLatestRevisionIndex() } })
        .sort({ _revisionIndex: -1 })
        .group({ _id: '$index', latest: { $first: '$$ROOT' } })
        .append({ $replaceRoot: { newRoot: '$latest' } })
        .match({ _deleted: false })
        .sort({ index: 1 })
        .facet(facets)

        const counts = {}
        Object.keys(results[0]).forEach(key => {
            counts[key] = results[0][key][0].count
        })

        return { counts }

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
