module.exports = {
    
    key: 'employments',
    name: 'Employments & Identifiers',
    queries: {
        label: 'pursuit',
        count: { employments: { $ne: [] } },
        match: d => ({ employments: { $regex: new RegExp(d, 'gi') } }),
    }

}
