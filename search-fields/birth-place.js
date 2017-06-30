module.exports = {
    
    key: 'birthPlace',
    name: 'Birth Place',
    queries: {
        label: 'place',
        count: { 'latest.birthPlace': { $exists: true } },
        match: d => ({ 'latest.birthPlace' : { $regex : new RegExp(d, 'gi') } }),
    }

}
