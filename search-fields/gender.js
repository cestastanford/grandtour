module.exports = {
    
    key: 'gender',
    name: 'Gender',
    queries: {
        label: 'gender',
        count: { gender: { $exists: true } },
        match: d => ({ gender: d }),
    } 

}
