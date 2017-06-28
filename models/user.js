/*
*   User objects contain personal and authentication info, plus
*   the currently-selected data revision.
*/


/*
*   Imports
*/

const crypto = require('crypto')
const mongoose = require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose')
const { REVISION_MODEL, LATEST_REVISION_INDEX } = require('./revision')
const { statics, methods } = require('../controllers/user')


/*
*   Defines the User schema.
*/

const ROLES = { viewer: 'viewer', editor: 'editor', administrator: 'administrator' }
const userSchema = new mongoose.Schema({
  
    username: String,
    fullName: String,
    email: String,
    role: { type: String, default: ROLES.viewer },
    activeRevisionIndex: { type: Number, ref: REVISION_MODEL, default: LATEST_REVISION_INDEX },

})


/*
*   Attaches the Passport plugin andstatic and instance methods,
*   then creates model.
*/

userSchema.statics = statics
userSchema.methods = methods
userSchema.plugin(passportLocalMongoose)
const USER_MODEL = 'User'
const User = mongoose.model(USER_MODEL, userSchema)


/*
*   Exports
*/

module.exports = { User, ROLES }
