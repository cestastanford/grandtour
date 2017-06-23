/*
*   Entry documents contain all updates of the data for a single
*   entry.  Each individual revision of entry data is saved as an
*   EntryUpdate embedded document.
*/

const path = require('path')
const fs = require('fs')
const mongoose = require('mongoose')

/*
*   Generates the entryUpdateSchema from all field modules found
*   in './entry-fields'.
*/

const ENTRY_FIELDS_DIR = 'entry-fields'
const entryUpdateSchema = mongoose.Schema({})
fs.readdirSync(path.join(__dirname, ENTRY_FIELDS_DIR)).forEach(filename => {

    const { key, type } = require(`./${ENTRY_FIELDS_DIR}/${filename}`)
    entryUpdateSchema.add({ [key]: type })

})

const ENTRY = 'Entry'
const entrySchema = new mongoose.Schema({
  
    index: Number,
    updates: [ entryUpdateSchema ],

})

module.exports = {

    Entry: mongoose.model(ENTRY, entrySchema),

}
