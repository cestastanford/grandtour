/*
*   Imports
*/

const Revision = require('../models/revision')
const entryFields = require('../models/entry-fields')
const countMappings = require('../mappings/counts.json')


/*
*   Defines the static and instance methods for the Entry class.
*/

module.exports = class Entry {


    /*
    *   Reduces array of updates up to the passed Revision (or the
    *   latest revision if null) into a single object of Entry fields.
    */

    atRevision(revisionIndex) {

        const entryAtRevision = this.toObject().updates.reduce((accumulator, update) => {

            if (!revisionIndex || update.revision <= revisionIndex) {

                Object.keys(update).forEach(key => {

                    if (update[key]) accumulator[key] = update[key]
                    if (update[key] === null) delete accumulator[key]

                })

            }

            return accumulator

        }, {})

        delete entryAtRevision.revision
        if (Object.keys(entryAtRevision).length) {

            entryAtRevision.index = this.index
            return entryAtRevision

        } else return null

    }


    /*
    *   Convenience static method for performing a 'find' command
    *   at a given Revision.
    */

    static async findAtRevision(query, revisionIndex) {

        const entries = await this.find(query)
        return entries.map(entry => entry.atRevision(revisionIndex))

    }


    /*
    *   Applies a set of updated fields to an entry under the latest
    *   Revision.
    */

    async saveToLatestRevision(updatedFields) {

        const revisionIndex = await Revision.getLatestIndex()
        let update = this.updates.filter(update => update.revision === revisionIndex)[0]
        if (!update) {
            update = this.updates.create({ revision: revisionIndex })
            this.updates.push(update)
        }

        for (let key in entryFields) {
            if (updatedFields[key] || updatedFields[key] === null) update[key] = updatedFields[key]
        }

        this.latest = this.atRevision()
        await this.save()

    }


    /*
    *   Deletes an entry under the latest Revision by setting all
    *   fields to null.
    */

    async deleteAtLatestRevision() {

        const deletionUpdate = {}
        for (let key in entryFields) deletionUpdate[key] = null
        const oldEntry = await this.atRevision()
        await this.saveToLatestRevision(deletionUpdate)
        return oldEntry

    }


    /*
    *   Creates an entry at the latest Revision with the specified
    *   index and fields.    If an entry with the specified index
    *   already exists, returns 409 Conflict.  If the entry previously
    *   existed but was deleted, it is re-created.
    */

    static async createAtLatestRevision(entryFields) {

        const index = entryFields.index
        if (!index && index !== '0') {
            const error = new Error('No index specified')
            error.status = 400
            throw error
        }

        const foundEntry = await this.findOne({ index })
        if (foundEntry && foundEntry.atRevision() !== null) {
            const error = new Error('Entry with specified index already exists')
            error.status = 409
            throw error
        }

        delete entryFields.index
        if (!Object.keys(entryFields).length) {
            const error = new Error('No entry fields specified')
            error.status = 400
            throw error
        }

        const newEntry = foundEntry || new Entry({ index })
        await newEntry.saveToLatestRevision(entryFields)
        return newEntry.atRevision()

    }


    /*
    *   Deletes all updates from all Entries for a given Revision.
    */

    static async deleteUpdatesForRevision(revisionIndex) {

        const entries = await this.find({})
        await Promise.all(entries.map(async entry => {

            const matchingUpdate = entry.updates.filter(update => update.revision === +revisionIndex)[0]
            if (matchingUpdate) {
                entry.updates.pull(matchingUpdate)
                entry.latest = entry.atRevision()
                await entry.save()
            }

        }))

    }


    /*
    *   Calculates the counts of entries with values for each field
    *   query mapping.
    */

    static async getCounts() {

        const counts = {}
        await Promise.all(countMappings.counts.map(async mapping => {

            const count = await this.count(mapping.query)
            counts[mapping.field] = count

        }))

        return { counts }

    }

}
