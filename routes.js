/*
*   Imports
*/

const express = require('express')
const passport = require('passport')
const { User, ROLES } = require('./models/user')
const Entry = require('./models/entry')
const List = require('./models/list')
const Count = require('./models/count')
const entries = require('./controllers/entries')
const database = require('./controllers/database')
const lists = require('./controllers/lists')


/*
*   Defines Express router for site routes.
*/

const routes = express.Router()


/*
*   Renders Angular-driven pages.
*/

routes.get('/', (req, res) => {
    res.render('index')
})

routes.get('/views/:name', (req, res) => {
    const name = req.params.name
    res.render(name + '/' + name)
})

routes.get('/components/:name', (req, res) => {
    const name = req.params.name
    res.render('components/' + name + '/' + name)
})


/*
*   User management routes:
*
*    - Check if a user is logged in
*    - Register new user
*    - Login
*    - Logout
*/

routes.get('/loggedin', (req, res) => {
    res.send(req.isAuthenticated() ? req.user : '0')
})

routes.post('/register', (req, res, next) => {
    User.register(new User(req.body), req.body.password, (err, data) => {
        // problem registering the new user...
        if (err) { return res.status(401).send(err) }
        // if ok, let's login the new user
        req.logIn(data, (err) => {
            if (err) { return res.status(401).send(err) }
            return res.status(200).send(data)
        })
        //res.redirect('/')
    })
})

routes.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) { return res.status(401).send(err) }
        if (!user) { return res.status(401).send(info) }
        req.logIn(user, function(err) {
            if (err) { return res.status(401).send({ error: err }) }
            return res.sendStatus(200, req.user)
        })
    })(req, res, next)
})

routes.post('/logout', function(req, res){
    req.logOut()
    res.sendStatus(200)
})


/*
*   Authentication middleware: checks if user is logged in or if
*   user is an administrator, respectively.
*/

const auth = (req, res, next) => {
    if (!req.isAuthenticated())
        res.send(401)
    else next()
}

var admin = (req, res, next) => {
    //  Security flaw: user can send doctored request objects to gain admin access
    if (!req.isAuthenticated() || req.user.role !== ROLES.administrator) {
        res.send(401)
    }
    else next()
}


/*
*   API routes for user management:
*
*    - Get all users
*    - Add new user
*    - Remove user
*    - Update user
*/

routes.post('/api/users/add', admin, (req, res, next) => {
  User.register(new User(req.body), req.body.password, (err, data) => {
    // problem registering the new user...
    if (err) { return res.status(401).send(err) }
    // if ok, let's login the new user
    return res.status(200).send({ user: data })
  })
})

routes.post('/api/users/remove', admin, (req, res, next) => {
  User.find({ username: req.body.username }).remove((err,data) => {
    if (err) { return res.status(401).send(err) }
    return res.status(200).send({ removed: data })
  })
})

routes.post('/api/users/update', admin, (req, res, next) => {
  User.update({ username: req.body.username }, req.body, (err, data) => {
    if (err) { return res.status(401).send(err) }
    return res.status(200).send({ updated: data })
  })
})


/*
*   API routes for Entry management:
*   
*    - Get all entries
*    - Get single entry
*    - Search for entries (original and revised)
*    - Get entry suggestions
*    - Export entries
*    - Get unique entry field values
*/

routes.get('/api/entries', entries.index)
routes.get('/api/entries/:id', entries.single)
routes.post('/api/entries/search', auth, entries.search)
routes.post('/api/entries/search2', auth, entries.search2)
routes.post('/api/entries/suggest', auth, entries.suggest)
routes.post('/api/entries/export', auth, entries.export)
routes.post('/api/entries/uniques', auth, entries.uniques)


/*
*   API routes for database management:
*   
*    - Reload database from Google Sheets (original)
*    - Remove all entries
*    - Import from Google Sheets into new Revision
*    - Recount field values
*    - Get count of field values
*/


routes.post('/api/reload', admin, database.reload)
routes.get('/api/clear-all', admin, database.clearAll)
routes.post('/api/sheets-import', database.sheetsImport)
routes.get('/api/recount', admin, database.recount)
routes.get('/api/getcount', auth, database.getCount)


/*
*   API routes for List management:
*
*    - Get current user's lists
*    - Create a new list
*    - Delete a list
*    - Add entries to a list
*    - Remove entries from a list
*/

routes.post('/api/lists/mylists', auth, lists.myLists)
routes.post('/api/lists/newlist', auth, lists.newList)
routes.post('/api/lists/deletelist', auth, lists.deleteList)
routes.post('/api/lists/addtolist', auth, lists.addToList)
routes.post('/api/lists/removefromlist', auth, lists.removeFromList)


module.exports = routes
