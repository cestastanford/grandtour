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

entryFields.forEach(({ key, type }) => entryUpdateSchema.add({ [key]: type }))

const ENTRY = 'Entry'
const entrySchema = new mongoose.Schema({
  
    index: { type: Number, index: true },
    updates: [ entryUpdateSchema ],

})

module.exports = {

    Entry: mongoose.model(ENTRY, entrySchema),

}
