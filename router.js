/*
*   Imports
*/

const router = require('express').Router()
const viewRoutes = require('./routes/views')
const importRoutes = require('./routes/import')
const exportRoutes = require('./routes/export')
const userRoutes = require('./routes/user')
const revisionRoutes = require('./routes/revision')
const entryRoutes = require('./routes/entry')
const listRoutes = require('./routes/list')
const queryRoutes = require('./routes/query')


/*
*   Applies routes to main router.
*/

router.use(viewRoutes)
router.use(importRoutes)
router.use(exportRoutes)
router.use(userRoutes)
router.use(revisionRoutes)
router.use(entryRoutes)
router.use(listRoutes)
router.use(queryRoutes)


/*
*   Exports
*/

module.exports = router
