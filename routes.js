/*
*   Imports
*/

const express = require('express')
const passport = require('passport')
const User = require('./models/user')
const Entry = require('./models/entry')
const List = require('./models/list')
const Count = require('./models/count')
const entries = require('./controllers/entries')
const importing = require('./controllers/import')
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
*   API routes for Entry management:
*   
*   - Get all entries
*   - Get single entry
*   - Search for entries (original and revised)
*   - Get entry suggestions
*   - Export entries
*   - Get unique entry field values
*/

routes.get('/api/entries', entries.index)
routes.get('/api/entries/:id', entries.single)
routes.post('/api/entries/search', auth, entries.search)
routes.post('/api/entries/search2', auth, entries.search2)
routes.post('/api/entries/suggest', auth, entries.suggest)
routes.post('/api/entries/export', auth, entries.export)
routes.post('/api/entries/uniques', auth, entries.uniques)


/*
*   API routes for importing to and exporting from the database:
*   
*   - Importing from Google Shets into new Revision
*/

routes.post('/api/import/sheets', importing.sheets)


/*
*   API routes for List management:
*
*   - Get current user's lists
*   - Create a new list
*   - Delete a list
*   - Add entries to a list
*   - Remove entries from a list
*/

routes.post('/api/lists/mylists', auth, lists.myLists)
routes.post('/api/lists/newlist', auth, lists.newList)
routes.post('/api/lists/deletelist', auth, lists.deleteList)
routes.post('/api/lists/addtolist', auth, lists.addToList)
routes.post('/api/lists/removefromlist', auth, lists.removeFromList)


module.exports = routes
