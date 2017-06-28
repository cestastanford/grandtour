/*
*   Entry documents contain all updates of the data for a single
*   entry.  Each individual revision of entry data is saved as an
*   EntryUpdate embedded document.
*/


/*
*   Imports
*/

const mongoose = require('mongoose')
const { REVISION_MODEL } = require('./revision')
const entryFields = require('./entry-fields')
const { statics, methods } = require('../controllers/entry')


/*
*   Generates the EntryUpdate schema from all field modules found
*   in './entry-fields', then incorporates it as a subdocument in
*   the Entry schema.
*/

const entryUpdateSchema = mongoose.Schema({

    revision: { type: Number, ref: REVISION_MODEL, index: true }

})

for (let key in entryFields) entryUpdateSchema.add({

    [key]: {
        type: entryFields[key].type,
        default: null,
    }

})

const entrySchema = new mongoose.Schema({
  
    index: { type: Number, index: true },
    updates: [ entryUpdateSchema ],

})


/*
*   Attaches static and instance methods and creates model.
*/

entrySchema.statics = statics
entrySchema.methods = methods
const ENTRY_MODEL = 'Entry'
const Entry = mongoose.model(ENTRY_MODEL, entrySchema)


/*
*   Exports
*/

module.exports = { Entry }
