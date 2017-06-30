module.exports = {
    
    key: 'deathPlace',
    name: 'Death Place',
    queries: {
        label: 'place',
        count: { 'latest.deathPlace': { $exists: true } },
        match: d => ({ 'latest.deathPlace' : { $regex : new RegExp(d, 'gi') } }),
    }

}
