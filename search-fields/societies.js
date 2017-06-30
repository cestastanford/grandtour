module.exports = {
    
    key: 'societies',
    name: 'Societies & Academies',
    queries: [
        {
            subkey: '',
            label: 'society',
            count: { 'latest.societies.title': { $exists: true } },
            match: d => ({ 'latest.societies.title': { $regex: new RegExp(d.title, 'gi') } }),
        },
        {
            subkey: 'role',
            label: 'role',
            count: { 'latest.societies.role': { $exists: true } },
            match: d => ({ 'latest.societies.role': { $regex: new RegExp(d.role, 'gi') } }),
        },
    ],
  
}
