/*
*   Returns all entry schema field objects.
*/

const fs = require('fs')
module.exports = fs.readdirSync(__dirname).map(filename => {

    return filename !== 'index.js' ? require(`./${filename}`) : null 

}).filter(d => d)
