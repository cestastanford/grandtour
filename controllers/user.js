/*
*   Defines the static and instance methods for the User class.
*/

const statics = {}
const methods = {}


/*
*   Registers a new administrator user if no user exists on app
*   launch.
*/

statics.registerDefaultAdmin = async function() {

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


/*
*   Updates a User's active Revision.
*/

methods.setActiveRevision = async function(activeRevisionIndex) {

    await this.update({ activeRevisionIndex })

}



/*
*   Exports
*/

module.exports = { statics, methods }
