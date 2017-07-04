module.exports = {
    
    key: 'occupations',
    name: 'Occupations & Posts',
    queries: [
        {
            subkey: 'title',
            label: 'occupation',
            count: { 'occupations.title': { $exists: true } },
            match: d => ({ 'occupations.title': { $regex: new RegExp(d, 'gi') } }),
        },
        {
            subkey: 'group',
            label: 'group',
            count: { 'occupations.group': { $exists: true } },
            match: d => ({ 'occupations.group': { $regex: new RegExp(d, 'gi') } }),
        },
        {
            subkey: 'place',
            label: 'place',
            count: { 'occupations.place': { $exists: true } },
            match: d => ({ 'occupations.place': { $regex: new RegExp(d, 'gi') } }),
        },
    ],
  
}
