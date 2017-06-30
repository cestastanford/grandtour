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


module.exports = routes
