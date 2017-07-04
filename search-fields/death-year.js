module.exports = {
    
    key: 'deathYear',
    name: 'Death Year',
    queries: {
        label: 'year',
        count: { deathYear: { $exists: true } },
        match: d => ({ deathYear: +d }),
    }

}
