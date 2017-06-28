/*
*   Revision documents represent sets of entry data updates.
*/


/*
*   Imports
*/

const mongoose = require('mongoose')
const RevisionClass = require('../controllers/revision')


/*
*   Defines the Revision schema.
*/

const revisionSchema = mongoose.Schema({
    
    index: { type: Number, index: true },
    name: String,

})


/*
*   Attaches static and instance methods and creates Revision model.
*/

revisionSchema.loadClass(RevisionClass)
const Revision = mongoose.model('Revision', revisionSchema)


/*
*   Exports
*/

module.exports = Revision
