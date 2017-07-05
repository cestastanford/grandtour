/*
*   Imports
*/

const router = require('express').Router()
const { isViewer } = require('./auth')
const Entry = require('../models/entry')
const entries = require('../controllers/entries')


/*
*   Retrieves the counts of entries that have values for the queries
*   defined in './mappings/counts".
*/

router.get('/api/getcount', isViewer, (req, res, next) => {

    entries.getCounts(req.user.activeRevisionIndex)
    .then(counts => res.json(counts))
    .catch(next)

})


/*
*   Previously-existing entry search routes.
*/

router.post('/api/entries/search', isViewer, entries.search);
router.post('/api/entries/search2', isViewer, entries.search2);
router.post('/api/entries/suggest', isViewer, entries.suggest);
router.post('/api/entries/export', isViewer, entries.export);
router.post('/api/entries/uniques', isViewer, entries.uniques);


/*
*   Exports
*/

module.exports = router
