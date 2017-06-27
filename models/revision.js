/*
*   Revision documents represent sets of entry data updates.
*/

const mongoose = require('mongoose')
const REVISION = 'Revision'
const revisionSchema = mongoose.Schema({
    
    index: { type: Number, index: true },
    name: String,

})

module.exports = {

    REVISION,
    Revision: mongoose.model(REVISION, revisionSchema),

}
