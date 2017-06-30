module.exports = {
    
    key: 'exhibitions',
    name: 'Exhibitions & Awards',
    queries: [
        {
            subkey: '',
            label: 'exhibition',
            count: { 'latest.exhibitions.title': { $exists: true } },
            match: d => ({ 'latest.exhibitions.title': { $regex: new RegExp(d.title, 'gi') } }),
        },
        {
            subkey: 'activity',
            label: 'activity',
            count: { 'latest.exhibitions.activity': { $exists: true } },
            match: d => ({ 'latest.exhibitions.activity': { $regex: new RegExp(d.activity, 'gi') } }),
        },
    ],
  
}
