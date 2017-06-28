/*
*   User objects contain personal and authentication info, plus
*   the currently-selected data revision.
*/

const { randomBytes } = require('crypto')
const mongoose = require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose')
const { REVISION, LATEST_REVISION } = require('./revision')
const ROLES = { viewer: 'viewer', editor: 'editor', administrator: 'administrator' }
const userSchema = new mongoose.Schema({
  
    username: String,
    fullName: String,
    email: String,
    role: { type: String, default: ROLES.viewer },
    activeRevisionIndex: { type: Number, ref: REVISION, default: LATEST_REVISION },

})

userSchema.plugin(passportLocalMongoose)
const User = mongoose.model('User', userSchema)


/*
*   Registers a new administrator user if no user exists on app
*   launch.
*/

const registerDefaultAdmin = async () => {

    if (await User.count() === 0) {

        const defaultAdmin = new User({

            username: 'default-admin',
            fullName: 'Administrator',
            email: 'none',
            role: ROLES.administrator,

        })

        const password = randomBytes(11).toString('hex')

        User.register(defaultAdmin, password, (err, user) => {
            
            if (err) { throw err }
            else {
                console.log('Default administrator user created:')
                console.log(' - username: default-admin')
                console.log(' - password: ' + password)
                console.log('-----------------------------------')
            }
            
        })

    }

}

module.exports = {

    User,
    ROLES,
    registerDefaultAdmin,

}
