module.exports = {
    
    key: 'fullName',
    name: 'Full Name',
    queries: {
        label: 'name',
        count: { 'fullName': { $exists: true } },
        match: d => ({ $or: [
            { 'fullName': { $regex: new RegExp(d, 'gi') } },
            { 'alternateNames': { $regex: new RegExp(d, 'gi') } },
        ] })
    }

}
