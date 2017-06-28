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
    *   Retrieves a given entry, using the latest update of each field
    *   up to 
    */

    static async getEntryAtRevision(index, revisionIndex) {

        const entry = await this.find({ index })
        const entryAtRevision = { index }
        entry.updates.forEach(update => {

            if (!revisionIndex || update.revisionIndex <= revisionIndex) {

                Object.keys(update).forEach(key => {

                    if (update[key] || update[key] === null) entryAtRevision[key] = update[key]

                })

            }

        })

        entryAtRevision.lastUpdatedRevision = entryAtRevision.revision
        delete entryAtRevision.revision
        return entryAtRevision

    }



}
