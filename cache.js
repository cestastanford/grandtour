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


/*
*   Caches the counts of entries with values for specified queries.
*/

exports.setQueryCounts = queryCounts => cache.put('queryCounts', queryCounts)
exports.getQueryCounts = () => cache.get('queryCounts')
exports.invalidateQueryCounts = () => {
    console.log('Query count cache invalidated')
    cache.put('queryCounts', null)
}
