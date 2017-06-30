/*
*   Imports
*/

const router = require('express').Router()


/*
*   Renders Angular-driven views and components.
*/

router.get('/', (req, res) => {
    res.render('index')
})

router.get('/views/:name', (req, res) => {
    const name = req.params.name
    res.render(name + '/' + name)
})

router.get('/components/:name', (req, res) => {
    const name = req.params.name
    res.render('components/' + name + '/' + name)
})


/*
*   Exports
*/

module.exports = router
