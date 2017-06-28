/*
*   Imports
*/

const router = require('express').Router()
const entryRoutes = require('./routers/entry')


/*
*   Applies sub-router routes to main router.
*/

router.use(entryRoutes)


/*
*   Exports
*/

module.exports = router
