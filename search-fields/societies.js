module.exports = {
    
    key: 'societies',
    name: 'Societies & Academies',
    queries: [
        {
            subkey: 'title',
            label: 'society',
            count: { 'latest.societies.title': { $exists: true } },
            match: d => ({ 'latest.societies.title': { $regex: new RegExp(d, 'gi') } }),
        },
        {
            subkey: 'role',
            label: 'role',
            count: { 'latest.societies.role': { $exists: true } },
            match: d => ({ 'latest.societies.role': { $regex: new RegExp(d, 'gi') } }),
        },
    ],
  
}
