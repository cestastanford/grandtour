/*
*   Revision documents represent sets of entry data updates.
*/


/*
*   Imports
*/

const mongoose = require('mongoose')
const { statics, methods } = require('../controllers/revision')


/*
*   Defines the Revision schema.
*/

const LATEST_REVISION_INDEX = -1
const revisionSchema = mongoose.Schema({
    
    index: { type: Number, index: true },
    name: String,

})


/*
*   Attaches static and instance methods and creates Revision model.
*/

revisionSchema.statics = statics
revisionSchema.methods = methods
const REVISION_MODEL = 'Revision'
const Revision = mongoose.model(REVISION_MODEL, revisionSchema)


/*
*   Exports
*/

module.exports = {

    REVISION_MODEL,
    Revision,
    LATEST_REVISION_INDEX,

}
