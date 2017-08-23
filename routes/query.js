/*
*   Imports
*/

const router = require('express').Router()
const { isViewer } = require('./auth')
const queries = require('../query.js')


/*
*   Retrieves the counts of entries that have values for the queries
*   defined in './mappings/counts".
*/

router.get('/api/getcount', isViewer, (req, res, next) => {

    queries.getCounts(req.user.activeRevisionIndex)
    .then(counts => res.json(counts))
    .catch(next)

})


/*
*   Previously-existing entry search routes.
*/

router.post('/api/entries/search2?', isViewer, queries.search);
router.post('/api/entries/suggest', isViewer, queries.suggest);
router.post('/api/entries/export', isViewer, queries.export);
router.post('/api/entries/uniques', isViewer, queries.uniques);


/*
*   Exports
*/

module.exports = router
