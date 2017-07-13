/*
*   Imports
*/

const cache = require('memory-cache')


/*
*   Caches the most-recent Revision index.
*/

exports.setLatestRevisionIndex = latestRevisionIndex => {
    cache.put('latestRevisionIndex', latestRevisionIndex);
    console.log(`latestRevisionIndex is ${latestRevisionIndex}`)
}

exports.getLatestRevisionIndex = () => cache.get('latestRevisionIndex')
