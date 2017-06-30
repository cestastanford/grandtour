module.exports = {
    
    key: 'birthYear',
    name: 'Birth Year',
    queries: {
        label: 'year',
        count: { 'latest.birthYear': { $exists: true } },
        match: d => ({ 'latest.birthYear': +d }),
    }

}
