module.exports = {
    
    key: 'military',
    name: 'Military Careers',
    queries: {
        label: 'rank',
        count: { 'latest.militaryCareers.rank': { $exists: true } },
        match: d => ({ 'latest.militaryCareers.rank': { $regex: new RegExp(d, "gi") } }),
    }

}
