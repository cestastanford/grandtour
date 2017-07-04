module.exports = {
    
    key: 'birthYear',
    name: 'Birth Year',
    queries: {
        label: 'year',
        count: { birthYear: { $exists: true } },
        match: d => ({ birthYear: +d }),
    }

}
