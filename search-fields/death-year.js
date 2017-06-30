module.exports = {
    
    key: 'deathYear',
    name: 'Death Year',
    queries: {
        label: 'year',
        count: { 'latest.deathYear': { $exists: true } },
        match: d => ({ 'latest.deathYear': +d }),
    }

}
