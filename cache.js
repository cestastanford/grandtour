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

exports.setQueryCounts = (revisionIndex, queryCounts) => cache.put('queryCounts.' + revisionIndex, queryCounts)
exports.getQueryCounts = revisionIndex => cache.get('queryCounts.' + revisionIndex)
exports.invalidateQueryCounts = revisionIndex => {
    console.log(`Query count cache for revisionIndex ${revisionIndex} invalidated`)
    cache.put('queryCounts.' + revisionIndex, null)
}
