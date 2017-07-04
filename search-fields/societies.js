module.exports = {
    
    key: 'societies',
    name: 'Societies & Academies',
    queries: [
        {
            subkey: 'title',
            label: 'society',
            count: { 'societies.title': { $exists: true } },
            match: d => ({ 'societies.title': { $regex: new RegExp(d, 'gi') } }),
        },
        {
            subkey: 'role',
            label: 'role',
            count: { 'societies.role': { $exists: true } },
            match: d => ({ 'societies.role': { $regex: new RegExp(d, 'gi') } }),
        },
    ],
  
}
