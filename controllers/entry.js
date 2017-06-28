/*
*   Defines the static and instance methods for the Entry class.
*/

const statics = {}
const methods = {}


/*
*   Applies a set of updated fields to an entry under the specified
*   Revision.
*/

statics.commitUpdate = async function(index, revisionIndex, updatedFields) {

    const entryUpdate = Object.assign({}, { revision: revisionIndex }, updatedFields)
    await this.update({ index }, { $push: { updates: entryUpdate } }, { upsert: true })

}


/*
*   Retrieves a given entry, using the latest update of each field
*   up to 
*/

methods.getEntryAtRevision = async function(revisionIndex) {

    const entry = await this.find({ index })
    const entryAtRevision = { index }
    entry.updates.forEach(update => {

        if (update.revisionIndex <= revisionIndex) {

            for (let key in update) {

                if (update[key]) entryAtRevision[key] = update[key]

            }

        }

    })

    entryAtRevision.lastUpdatedRevision = entryAtRevision.revision
    delete entryAtRevision.revision
    return entryAtRevision

}


/*
*   Exports
*/

module.exports = { statics, methods }
