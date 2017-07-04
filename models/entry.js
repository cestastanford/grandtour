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
const entryFields = require('./entry-fields')


/*
*   Defines schema.
*/

const entrySchema = mongoose.Schema({

    index: Number,
    _deleted: Boolean,
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
    *   Saves an entry's latest state in as a previous Revision and
    *   creates a new 
    */

    async saveRevision(newRevisionIndex) {

        const newVersion = new this.constructor(this.toObject())
        newVersion._revisionIndex = newRevisionIndex
        await newVersion.save()

    }


    /*
    *   Calculates the counts of entries with values for each field
    *   query mapping.
    */

    static async getCounts() {

        const countQueries = {
            
            fullName: { fullName : { $ne : null } },
            alternateNames: { alternateNames : { $exists : true } },
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
            pursuits: { pursuits : { $ne : null } },
            occupations: { 'occupations.title' : { $exists : true } },
            occupations_group: { 'occupations.group' : { $exists : true } },
            occupations_place: { 'occupations.place' : { $exists : true } },
            military: { 'military.rank' : { $exists : true } },
            travel_place: { 'travels.place' : { $exists : true } },
            travel_date: { $or : [ { 'travels.travelStartYear' : { $ne : 0 } }, { 'travels.travelEndYear' : { $ne : 0 } } ] },
            travel_year: { $or : [ { 'travels.travelStartYear' : { $ne : 0 } }, { 'travels.travelEndYear' : { $ne : 0 } } ] },
            travel_month: { $or : [ { 'travels.travelStartMonth' : { $ne : 0 } }, { 'travels.travelEndMonth' : { $ne : 0 } } ] },
            travel_day: { $or : [ { 'travels.travelStartDay' : { $ne : 0 } }, { 'travels.travelEndDay' : { $ne : 0 } } ] },
            exhibitions: { 'exhibitions.title' : { $exists : true } },
            exhibitions_activity: { 'exhibitions.activity' : { $exists : true } },
        
        }

        const counts = {}
        await Promise.all(Object.keys(countQueries).map(async key => {

            const count = await this.count(countQueries[key])
            counts[key] = count

        }))

        return { counts }

    }


    /*
    *   Finds the indices of the previous and next entries in a
    *   given revision.
    */

    async getAdjacentIndices(revisionIndex) {

        const previous = await this.constructor.findOne()
        .atRevision(this._revisionIndex)
        .lt('index', this.index)
        .sort('-index')
        .select('index')

        const next = await this.constructor.findOne()
        .atRevision(this._revisionIndex)
        .gt('index', this.index)
        .sort('index')
        .select('index')

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
