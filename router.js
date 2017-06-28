/*
*   Imports
*/

const router = require('express').Router()
const userRoutes = require('./routers/user')
const entryRoutes = require('./routers/entry')
const importRoutes = require('./routers/import')
const revisionRoutes = require('./routers/revision')


/*
*   Applies sub-router routes to main router.
*/

router.use(userRoutes)
router.use(entryRoutes)
router.use(importRoutes)
router.use(revisionRoutes)


/*
*   Exports
*/

module.exports = router
