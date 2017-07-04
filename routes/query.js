/*
*   Imports
*/

const router = require('express').Router()
const { isViewer } = require('./auth')
const Entry = require('../models/entry')
const searchFields = require('../search-fields')
const entries = require('../controllers/entries')


/*
*   Retrieves the counts of entries that have values for the queries
*   defined in './mappings/counts".
*/

router.get('/api/getcount', isViewer, (req, res, next) => {

    Entry.getCounts()
    .then(counts => res.json(counts))
    .catch(next)

})


/*
*   Performs a search for entries based on the supplied queries.
*/

router.post('/api/entries/search', (req, res, next) => {

    Entry.find(assembleQuery(req.body.query))
    .then(results => results.map(result => Object.assign({}, result.toObject().latest, { index: result.index })))
    .then(entries => res.json({ entries }))
    .catch(next)

})


/*
*   Helper function for parsing and assembling MongoDB queries from
*   submitted field values.
*/

const assembleQuery = fields => {

    const $and = []
    for (var key in fields) {
        
        const keyParts = key.split('_')
        let getQuery
        if (keyParts[1]) getQuery = searchFields[keyParts[0]].queries.filter(q => q.subkey === keyParts[1])[0].match
        else getQuery = searchFields[keyParts[0]].queries.match
        
        let fieldQuery
        if (Array.isArray(fields[key])) {
            const $or = fields[key].map(getQuery)
            fieldQuery = { $or }
        } else fieldQuery = getQuery(fields[key]);

        $and.push(fieldQuery)

    }

    console.log(JSON.stringify($and))
    return $and.length ? { $and } : {}

}


/*
*   Old API routes for Entry management:
*   - Get entry suggestions
*   - Export entries
*   - Get unique entry field values
*/

router.post('/api/entries/suggest', isViewer, entries.suggest)
router.post('/api/entries/export', isViewer, entries.export)
router.post('/api/entries/uniques', isViewer, entries.uniques)


/*
*   Exports
*/

module.exports = router
