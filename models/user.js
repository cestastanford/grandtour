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
const { ROLES } = require('../constants')


/*
*   Defines the User schema.
*/

const userSchema = new mongoose.Schema({
  
    username: { type: String, required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, default: ROLES.viewer, enum: Object.values(ROLES), required: true },
    activeRevisionIndex: { type: Number, default: null },

})


/*
*   Defines the static and instance methods for the User class.
*/

class User {


    /*
    *   Registers a new administrator user if no user exists on app
    *   launch.
    */

    static async registerDefaultAdmin() {

        if (await this.count() === 0) {

            const defaultAdmin = new this({

                username: 'default-admin',
                fullName: 'Administrator',
                email: 'none',
                role: ROLES.administrator,

            })

            const password = crypto.randomBytes(11).toString('hex')
            await new Promise(resolve => this.register(defaultAdmin, password, (err, user) => {
                
                if (err) { throw err }
                else {
                    console.log('Default administrator user created:')
                    console.log(' - username: default-admin')
                    console.log(' - password: ' + password)
                    console.log('-----------------------------------')
                    resolve()
                }
                
            }))

        }

    }

}


/*
*   Attaches the Passport plugin andstatic and instance methods,
*   then creates model.
*/

userSchema.loadClass(User)
userSchema.plugin(passportLocalMongoose)
const userModel = mongoose.model('User', userSchema)


/*
*   Exports
*/

module.exports = userModel
