module.exports = {
    
    key: 'fullName',
    name: 'Full Name',
    queries: {
        label: 'name',
        count: { 'latest.fullName': { $ne: null } },
        match: d => ({ $or: [
            { 'latest.fullName': { $regex: new RegExp(d, 'gi') } },
            { 'latest.alternateNames.alternateName': { $regex: new RegExp(d, 'gi') } },
        ] })
    }

}
