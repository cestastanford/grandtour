module.exports = {
    
    key: 'gender',
    name: 'Gender',
    queries: {
        label: 'gender',
        count: { 'latest.gender': { $ne: null } },
        match: d => ({ 'latest.gender': d }),
    } 

}
