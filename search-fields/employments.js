module.exports = {
    
    key: 'employments',
    name: 'Employments & Identifiers',
    queries: {
        label: 'pursuit',
        count: { 'latest.employments': { '$ne': null } },
        match: d => ({ 'latest.employments': { $regex: new RegExp(d, 'gi') } }),
    }

}
