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
const proxy = require('express-http-proxy')
const passport = require('passport')
const forceSsl = require('force-ssl-heroku')
const socketIO = require('./socket')
const router = require('./router')
const User = require('./models/user')
const Revision = require('./models/revision')
const { getLatestRevisionIndex } = require('./cache')

/*
* Checks for required environmental variables.
*/

if (
    !process.env['SECRET_KEY_1'] ||
    !process.env['SECRET_KEY_2'] ||
    !process.env['SECRET_KEY_3'] ||
    !process.env['MONGODB_URI']
) {
  throw Error('Required environmental variables not set')
}


/*
*   Creates and configures Express server.
*/

const app = express()
app.set('views', [__dirname + '/dist/', __dirname + '/public/'])
app.set('view engine', 'pug');
app.use(forceSsl)
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
app.use('/explorer', router)
app.use(express.static('public'))

// Proxies 
app.use(proxy('https://ceserani.github.io/gt-book/', {
    proxyReqPathResolver: function(req) {
        if (req.url.indexOf("/gt-book") === -1) {
            return "/gt-book" + req.url;
        }
        return req.url;
    },
    filter: function(req, res) {
        return req.method == 'GET' && req.url.indexOf('/explorer') === -1;
    },
    skipToNextHandlerFilter: function(proxyRes) {
      return proxyRes.statusCode === 404;
    },
    userResDecorator: function(proxyRes, proxyResData, userReq, userRes) {
        if (proxyRes.headers['content-type'] === 'text/html') {
            data = proxyResData?.toString('utf8');
            // Fix links
            if (data && data.indexOf("/gt-book/") > -1) {
                return data.replace(/\/gt-book\//g, "");
            }
            return data;
        }
        return proxyResData;
    }
}));
// Use this instead once we finalize the book and finally compile it.
// app.use('/', express.static('gt-book'))

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
 * Set revisionIndex to latest revision index for non-authenticated users.
 */

app.use((req, res, next) => {
    res.locals.activeRevisionIndex = req.user && req.user.activeRevisionIndex ? res.locals.activeRevisionIndex: getLatestRevisionIndex()
});


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
