/*
*   Returns all query definition objects.
*/

const fs = require('fs')

const queries = {}
fs.readdirSync(__dirname).filter(filename => filename.match(/\.js$/) && filename !== 'index.js').forEach(filename => {

    const query = require(`./${filename}`)
    queries[query.key] = query

})

module.exports = queries
