/*
*   Imports
*/

const router = require('express').Router()
const userRoutes = require('./routes/user')
const entryRoutes = require('./routes/entry')
const importRoutes = require('./routes/import')
const exportRoutes = require('./routes/export')
const revisionRoutes = require('./routes/revision')


/*
*   Applies routes to main router.
*/

router.use(userRoutes)
router.use(entryRoutes)
router.use(importRoutes)
router.use(exportRoutes)
router.use(revisionRoutes)


/*
*   Exports
*/

module.exports = router
