/*
*   Imports
*/

const router = require('express').Router()
const { isViewer } = require('./auth')
const List = require('../models/list')


/*
*   API routes for List management:
*
*   - Get current user's lists
*   - Create a new list
*   - Delete a list
*   - Add entries to a list
*   - Remove entries from a list
*/

router.post('/api/lists/mylists', isViewer, (req, res) => List.myLists(req, res))
router.post('/api/lists/newlist', isViewer, (req, res) => List.newList(req, res))
router.post('/api/lists/deletelist', isViewer, (req, res) => List.deleteList(req, res))
router.post('/api/lists/addtolist', isViewer, (req, res) => List.addToList(req, res))
router.post('/api/lists/removefromlist', isViewer, (req, res) => List.removeFromList(req, res))


/*
*   Exports
*/

module.exports = router
