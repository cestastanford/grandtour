module.exports = {
    
    key: 'military',
    name: 'Military Careers',
    queries: {
        label: 'rank',
        count: { 'latest.militaryCareers.rank': { $exists: true } },
        match: d => ({ 'latest.military.rank': { $regex: new RegExp(d, "gi") } }),
    }

}
