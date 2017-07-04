module.exports = {
    
    key: 'exhibitions',
    name: 'Exhibitions & Awards',
    queries: [
        {
            subkey: 'title',
            label: 'exhibition',
            count: { 'exhibitions.title': { $exists: true } },
            match: d => ({ 'exhibitions.title': { $regex: new RegExp(d, 'gi') } }),
        },
        {
            subkey: 'activity',
            label: 'activity',
            count: { 'exhibitions.activity': { $exists: true } },
            match: d => ({ 'exhibitions.activity': { $regex: new RegExp(d, 'gi') } }),
        },
    ],
  
}
