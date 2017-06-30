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


/*
*   Creates and configures Express server.
*/

const app = express()
app.set('views', __dirname + '/public/')
app.set('view engine', 'jade')
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
*   Connects Mongoose to MongoDB.
*/

const mongoOptions = {
    server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } }, 
    replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS : 30000 } }
}  

mongoose.connect(process.env['MONGODB_URI'], mongoOptions, err => {
    if (err) {
        console.error('Could not connect to MongoDB at the specified URI.')
        process.exit(1)
    }
})


/*
*   Registers static and dynamic routes.
*/

app.use(express.static(__dirname + '/public'))
app.use('/bower_components', express.static(__dirname + '/bower_components'))
app.use('/', router)


/*
*   Creates a default admin user if none exists.
*/

User.registerDefaultAdmin()
.catch(console.error.bind(console))


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
*   Initiates server listening on indicated port.
*/

app.set('port', process.env.PORT || 4000)
server.listen(app.get('port'), () => {
    console.log("Node app is running at localhost:" + app.get('port'))
})
