module.exports = {
    
    key: 'birthPlace',
    name: 'Birth Place',
    queries: {
        label: 'place',
        count: { birthPlace: { $exists: true } },
        match: d => ({ birthPlace: { $regex: new RegExp(d, 'gi') } }),
    }

}
