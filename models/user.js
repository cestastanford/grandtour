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
const UserClass = require('../controllers/user')
const { ROLES } = require('../constants')


/*
*   Defines the User schema.
*/

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

userSchema.loadClass(UserClass)
userSchema.plugin(passportLocalMongoose)
const User = mongoose.model('User', userSchema)


/*
*   Exports
*/

module.exports = User
