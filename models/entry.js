/*
*   Entry documents contain all updates of the data for a single
*   entry.  Each individual revision of entry data is saved as an
*   EntryUpdate embedded document.
*/

const path = require('path')
const fs = require('fs')
const mongoose = require('mongoose')
const { REVISION } = require('./revision')
const entryFields = require('./entry-fields')


/*
*   Generates the entryUpdateSchema from all field modules found
*   in './entry-fields'.
*/

const entryUpdateSchema = mongoose.Schema({

    revision: { type: Number, ref: REVISION, index: true }

})

for (let key in entryFields) entryUpdateSchema.add({

    [key]: {
        type: entryFields[key].type,
        default: null,
    }

})

const ENTRY = 'Entry'
const entrySchema = new mongoose.Schema({
  
    index: { type: Number, index: true },
    updates: [ entryUpdateSchema ],

})


/*
*   Applies a set of updated fields to an entry under the specified
*   Revision.
*/

entrySchema.statics.commitUpdate = async function(index, revisionId, updatedFields) {

    const entryUpdate = Object.assign({}, { revision: revisionId }, updatedFields)
    await this.update({ index }, { $push: { updates: entryUpdate } }, { upsert: true })

}

module.exports = {

    Entry: mongoose.model(ENTRY, entrySchema),

}
