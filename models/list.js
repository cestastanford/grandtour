/*
*   List documents represent user-created lists of entries.
*/


/*
*   Imports
*/

const mongoose = require('mongoose')
const ListClass = require('../controllers/list')


/*
*   Defines the Revision schema.
*/

const listSchema = mongoose.Schema({
    
    name: String,
    owner: String,
    entryIDs: [Number],

})


/*
*   Attaches static and instance methods and creates Revision model.
*/

listSchema.loadClass(ListClass)
const List = mongoose.model('List', listSchema)


/*
*   Exports
*/

module.exports = List
