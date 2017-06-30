/*
*   Imports
*/

const router = require('express').Router()
const viewRoutes = require('./routes/views')
const databaseRoutes = require('./routes/database')
const userRoutes = require('./routes/user')
const revisionRoutes = require('./routes/revision')
const entryRoutes = require('./routes/entry')
const listRoutes = require('./routes/list')


/*
*   Applies routes to main router.
*/

router.use(viewRoutes)
router.use(databaseRoutes)
router.use(userRoutes)
router.use(revisionRoutes)
router.use(entryRoutes)
router.use(listRoutes)


/*
*   Exports
*/

module.exports = router
