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
const Revision = require('./revision')
const UserClass = require('../controllers/user')
const { ROLES } = require('../constants')


/*
*   Defines the User schema.
*/

const userSchema = new mongoose.Schema({
  
    username: { type: String, required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, default: ROLES.viewer, enum: Object.values(ROLES), required: true },
    activeRevisionIndex: { type: Number, ref: Revision, default: null },

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
