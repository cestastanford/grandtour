module.exports = {
    
    key: 'military',
    name: 'Military Careers',
    queries: {
        label: 'rank',
        count: { 'militaryCareers.rank': { $exists: true } },
        match: d => ({ 'militaryCareers.rank': { $regex: new RegExp(d, "gi") } }),
    }

}
