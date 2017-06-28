/*
*   User objects contain personal and authentication info, plus
*   the currently-selected data revision.
*/

const mongoose = require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose')
const { REVISION } = require('./revision')
const ROLES = { viewer: 'viewer', editor: 'editor', administrator: 'administrator' }
const userSchema = new mongoose.Schema({
  
  fullName: String,
  email: String,
  role: { type: String, default: ROLES.viewer },
  activeRevisionIndex: { type: Number, ref: REVISION },

})

userSchema.plugin(passportLocalMongoose)

module.exports = {

    User: mongoose.model('User', userSchema),
    ROLES,

}
