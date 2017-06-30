/*
*   Entry documents contain all updates of the data for a single
*   entry.  Each individual revision of entry data is saved as an
*   EntryUpdate embedded document.
*/


/*
*   Imports
*/

const mongoose = require('mongoose')
const Revision = require('./revision')
const entryFields = require('./entry-fields')
const EntryClass = require('../controllers/entry')


/*
*   Generates the EntryUpdate schema from all field modules found
*   in './entry-fields', then incorporates it as a subdocument in
*   the Entry schema.
*/

const entryUpdateSchema = mongoose.Schema({

    revision: { type: Number, ref: Revision, index: true }

}, { _id: false })

for (let key in entryFields) entryUpdateSchema.add({

    [key]: {
        type: entryFields[key].type,
        default: undefined,
    }

})

const entrySchema = new mongoose.Schema({
  
    index: { type: String, index: true, required: true },
    updates: [ entryUpdateSchema ],

})


/*
*   Attaches static and instance methods and creates model.
*/

entrySchema.loadClass(EntryClass)
const Entry = mongoose.model('Entry', entrySchema)


/*
*   Exports
*/

module.exports = Entry
