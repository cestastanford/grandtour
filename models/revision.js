/*
*   Revision documents represent sets of entry data updates.
*/

const mongoose = require('mongoose')
const REVISION = 'Revision'
const LATEST_REVISION = -1
const revisionSchema = mongoose.Schema({
    
    index: { type: Number, index: true },
    name: String,

})

module.exports = {

    REVISION,
    LATEST_REVISION,
    Revision: mongoose.model(REVISION, revisionSchema),

}
