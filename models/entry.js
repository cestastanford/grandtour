/*
*   Entry documents contain all of the fields defined in './entry-fields/',
*   plus a marker for whether an entry has been deleted and an array
*   of previous revisions of the entry.
*/


/*
*   Imports
*/

const mongoose = require('mongoose')
const entryFields = require('./entry-fields')


/*
*   Defines schema: adds _id and _deleted fields, adds fields defined
*   in entry schemas, adds _revisions field, and sets up 
*/

const entrySchema = mongoose.Schema({

    _id: Number,
    _deleted: Boolean,
    _revisionIndex: Number,

})

for (let key in entryFields) entrySchema.add({

    [key]: {
        type: entryFields[key].type,
        default: null,
    }

})

entrySchema.add({ _revisions: { type: [entrySchema], _id: false } })


/*
*   Defines static and instance methods.
*/

class Entry {

    /*
    *   Returns the entry as a plain JS object of fields, at the
    *   indicated revisionIndex if present.
    */

    getObject(revisionIndex) {
        
        let index = this._id
        let entryObject = null
        if (revisionIndex) {
            
            const revision = this._revisions.filter(revision => revision.revisionIndex === revisionIndex)[0]
            if (revision) entryObject = Object.assign({}, revision.toObject({ versionKey: false }))
        
        } else entryObject = Object.assign({}, this.toObject({ versionKey: false }))

        if (!entryObject) return null
        else {
            entryObject.index = index
            delete entryObject._id
            delete entryObject._deleted
            delete entryObject._revisionIndex
            delete entryObject._revisions
            return entryObject
        }

    }


    /*
    *   Deletes an entry by setting its _deleted field to true.
    */

    async delete() {

        this._deleted = true
        await this.save()
        return this

    }


    /*
    *   Creates an entry at the latest Revision with the specified
    *   index and fields.  If an entry with the specified index
    *   already exists, returns 409 Conflict.  If the entry previously
    *   existed but was deleted, it is re-created.
    */

    static async create(newEntryFields) {

        const _id = newEntryFields.index ? +newEntryFields.index : null
        if (!_id) {
            const error = new Error('No index specified')
            error.status = 400
            throw error
        }

        const foundEntry = await this.findOneById(_id)
        if (foundEntry && !foundEntry._deleted) {
            const error = new Error('Entry with specified index already exists')
            error.status = 409
            throw error
        }

        const newEntry = foundEntry || new Entry({ _id })
        entryFields.forEach(key => {
            if (newEntryFields[key]) newEntry[key] = newEntryFields[key]
        })
       
        newEntry._deleted = false
        await newEntry.save()
        return newEntry

    }


    /*
    *   Deletes an entry's latest updates, replacing its field values
    *   with those of its previous Revision's, if present.
    */

    async stepBack() {

        if (this._revisions.length > 0) {
            
            const latestRevision = this._revisions[this._revisions.length - 1]
            Object.assign(this, latestRevision)
            latestRevision.remove()
            await this.save()
        
        } else {
            const error = new Error('Cannot step back; previous Revision not found')
            error.status = 404
            throw error
        }

    }


    /*
    *   Deletes an entry Revision, if it exists.
    */

    async deleteRevision(revisionIndex) {

        const revision = this._revisions.filter(revision => revision.revisionIndex === revisionIndex)[0]
        if (revision) {
            revision.remove()
            await this.save()
        }

    }


    /*
    *   Saves an entry's latest state in _revisions and increments
    *   the current Revision index.
    */

    async saveRevision(revisionIndex) {

        const newRevision = { _revisionIndex: revisionIndex }
        Object.assign(newRevision, this)
        delete newRevision._id
        delete newRevision._revisions
        this._revisions.push(newRevision)
        await this.save()

    }


    /*
    *   Calculates the counts of entries with values for each field
    *   query mapping.
    */

    static async getCounts() {

        const countMappings = []
        Object.values(searchFields).forEach(field => {

            if (Array.isArray(field.queries)) field.queries.forEach(query => {
                const key = [ field.key, query.subkey ].filter(e => e).join('_')
                countMappings.push({ key, query: query.count })
            })

            else countMappings.push({ key: field.key, query: field.queries.count })

        })

        const counts = {}
        await Promise.all(countMappings.map(async mapping => {

            const count = await this.count(mapping.query)
            counts[mapping.key] = count

        }))

        return { counts }

    }


    /*
    *   Finds the indices of the previous and next entries in a
    *   given revision.
    */

    async getAdjacentIndices(revisionIndex) {

        const query = revisionIndex
        ? { _revisions: { $elemMatch: { revisionIndex: revisionIndex, _deleted: false } } }
        : { _deleted: { $ne: true } }

        const previous = await this.constructor.findOne(query)
        .lt('_id', this._id)
        .sort('-_id')
        .select('_id')

        const next = await this.constructor.findOne(query)
        .gt('_id', this._id)
        .sort('_id')
        .select('_id')

        return {
            previous: previous ? previous._id : null,
            next: next ? next._id : null,
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
