/*
*   Imports
*/

const router = require('express').Router()
const userRoutes = require('./routes/user')
const entryRoutes = require('./routes/entry')
const databaseRoutes = require('./routes/database')
const revisionRoutes = require('./routes/revision')


/*
*   Applies routes to main router.
*/

router.use(userRoutes)
router.use(entryRoutes)
router.use(databaseRoutes)
router.use(revisionRoutes)


/*
*   Exports
*/

module.exports = router
