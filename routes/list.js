/*
*   Imports
*/

const router = require('express').Router()
const { isViewer, isUser } = require('./auth')
const List = require('../models/list')
const Entry = require('../models/entry')
const { projectForEntryList } = require('../query')


/*
*   API routes for List management:
*
*   - Get current user's lists
*   - Create a new list
*   - Delete a list
*   - Add entries to a list
*   - Remove entries from a list
*/

// router.get('/api/lists/mylists', isUser, (req, res) => List.myLists(req, res))
// router.post('/api/lists/newlist', isUser, (req, res) => List.newList(req, res))
// router.post('/api/lists/deletelist', isUser, (req, res) => List.deleteList(req, res))
// router.post('/api/lists/addtolist', isUser, (req, res) => List.addToList(req, res))
// router.post('/api/lists/removefromlist', isUser, (req, res) => List.removeFromList(req, res))


/*
*   Returns the entries from a list.
*/

// router.get('/api/lists/:id/entries', isViewer, async (req, res, next) => {
//     try {
//         const list = await List.findById(req.params.id);
//         if (list) {
//             const entries = await Promise.all(list.entryIDs.map(index => Entry.findByIndexAtRevision(index, res.locals.activeRevisionIndex)))
//             res.json({
//                 ...list.toObject(),
//                 entries: entries.filter(e => e).map(projectForEntryList),
//             });
//         }
//         else {
//             // Triggers the 404 Not Found error handler
//             throw null;
//         }
//     }
//     catch(e) {
//         next(e);
//     }

// })


/*
*   Exports
*/

module.exports = router
