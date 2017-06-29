/*
*   Defines the static and instance methods for the Entry class.
*/

module.exports = class Entry {


    /*
    *   Applies a set of updated fields to an entry under the specified
    *   Revision.
    */

    static async commitUpdate(index, revisionIndex, updatedFields) {

        const entryUpdate = Object.assign({}, { revision: revisionIndex }, updatedFields)
        await this.update({ index }, { $push: { updates: entryUpdate } }, { upsert: true })

    }


    /*
    *   Finds entries that match the given query as they existed
    *   at the given Revision.
    */

    static async findAtRevision(query, revisionIndex) {

        const entries = await this.find(query, { _id: 0 })
        return entries.map(entry => entry.toObject())
        .map(this.reduceToRevision.bind(null, revisionIndex))

    }


    /*
    *   Reduces array of updates up to the passed Revision (or the
    *   latest revision if null) into a single object of Entry fields.
    */

    static reduceToRevision(revisionIndex, entry) {

        const entryAtRevision = entry.updates.reduce((accumulator, update) => {

            if (!revisionIndex || update.revision <= revisionIndex) {

                Object.keys(update).forEach(key => {

                    if (update[key] || update[key] === null) accumulator[key] = update[key]

                })

            }

            return accumulator

        }, {})

        entryAtRevision.lastUpdatedRevision = entryAtRevision.revision
        delete entryAtRevision.revision
        entryAtRevision.index = entry.index
        return entryAtRevision

    }

}
