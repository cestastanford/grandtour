/*
*   Returns all entry field definition objects.
*/

const fs = require('fs')

const entryFields = {}
fs.readdirSync(__dirname).filter(filename => filename.match(/\.js$/) && filename !== 'index.js').forEach(filename => {

    const entryField = require(`./${filename}`)
    entryFields[entryField.key] = entryField

})

module.exports = entryFields
