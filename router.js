/*
*   Imports
*/

const router = require('express').Router()
const viewRoutes = require('./routes/views')
const importExportRoutes = require('./routes/import-export')
const userRoutes = require('./routes/user')
const revisionRoutes = require('./routes/revision')
const entryRoutes = require('./routes/entry')
const listRoutes = require('./routes/list')
const queryRoutes = require('./routes/query')
const linkedFootnoteRoutes = require('./routes/linked-footnote')
const utilRoutes = require('./routes/util')


/*
*   Applies routes to main router.
*/

router.use(viewRoutes)
router.use(importExportRoutes)
router.use(userRoutes)
router.use(revisionRoutes)
router.use(entryRoutes)
router.use(listRoutes)
router.use(queryRoutes)
router.use(linkedFootnoteRoutes)


/*
*   Applies one-off utility routes.
*/

if (process.env['ENABLE_UTIL_ROUTES']) {
    router.use(utilRoutes)
}


/*
*   Exports
*/

module.exports = router
