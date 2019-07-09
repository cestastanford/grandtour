/*
*   Imports
*/

const http = require('http')
const express = require('express')
const mongoose = require('mongoose')
mongoose.Promise = Promise
const morgan = require('morgan')
const bodyParser = require('body-parser')
const session = require('cookie-session')
const cookieParser = require('cookie-parser')
const passport = require('passport')
const socketIO = require('./socket')
const router = require('./router')
const User = require('./models/user')
const Revision = require('./models/revision')

/*
* Checks for required environmental variables.
*/

<<<<<<< HEAD
=======
    process.env['SECRET_KEY_1']='abc';
    process.env['SECRET_KEY_2']='abc';
    process.env['SECRET_KEY_3']='abc';
    process.env['MONGODB_URI']='localhost:27017';

>>>>>>> parent of f9e3757... Delete app.js
if (
    !process.env['SECRET_KEY_1'] ||
    !process.env['SECRET_KEY_2'] ||
    !process.env['SECRET_KEY_3'] ||
    !process.env['MONGODB_URI']
) {
<<<<<<< HEAD
  throw Error('Required environmental variables not set')
=======
//  throw Error('Required environmental variables not set')
>>>>>>> parent of f9e3757... Delete app.js
}


/*
*   Creates and configures Express server.
*/

const app = express()
app.set('views', [__dirname + '/dist/', __dirname + '/public/'])
app.set('view engine', 'pug');
app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(cookieParser())
app.use(session({ keys: [
    process.env['SECRET_KEY_1'],
    process.env['SECRET_KEY_2'],
    process.env['SECRET_KEY_3']
]}))


/*
*   Sets up Passport authentication.
*/

app.use(passport.initialize())
app.use(passport.session())
const LocalStrategy = require('passport-local').Strategy
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())   


/*
*   Sets up Socket.IO.
*/

const server = http.Server(app)
socketIO.init(server)


/*
*   Creates an artificial delay for server testing purposes.
*/

if (process.env['DEBUG_DELAY']) app.use((req, res, next) => setTimeout(next, 1000))


/*
*   Registers static and dynamic routes.
*/

app.use(express.static(__dirname + '/dist'))
app.use('/', router)


/*
*   Handles errors, generating 404 errors for non-error requests
*   not handled by routes, then handing handling off to the default
*   error handler, which prints the errors to the console and returns
*   the error status code.
*/

app.use((req, res, next) => {
    const err = new Error(`Not Found: ${req.originalUrl}`)
    err.status = 404
    next(err)
})


/*
*   Connects to MongoDB, runs initialization tasks, then starts server
*   listening on indicated port.
*/

const options = {
    server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } }, 
    replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS : 30000 } }
}  

mongoose.connect(process.env['MONGODB_URI'], options)
.then(() => User.registerDefaultAdmin())
.then(() => Revision.createInitialRevision())
.then(() => {

    app.set('port', process.env.PORT || 4000)
    server.listen(app.get('port'), () => {
        console.log("Node app is running at localhost:" + app.get('port'))
    })

})
.catch(error => { throw error })
