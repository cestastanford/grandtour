module.exports = {
    
    key: 'deathPlace',
    name: 'Death Place',
    queries: {
        label: 'place',
        count: { deathPlace: { $exists: true } },
        match: d => ({ deathPlace: { $regex: new RegExp(d, 'gi') } }),
    }

}
