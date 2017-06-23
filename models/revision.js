/*
*   Revision documents represent sets of entry data updates.
*/

const mongoose = require('mongoose')
const REVISION = 'Revision'
const revisionSchema = mongoose.Schema({
    
    _id: Number,
    name: String,
    locked: Boolean,

})

module.exports = {

    REVISION,
    Revision: mongoose.model(REVISION, revisionSchema),

}
