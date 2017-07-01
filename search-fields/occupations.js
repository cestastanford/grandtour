module.exports = {
    
    key: 'occupations',
    name: 'Occupations & Posts',
    queries: [
        {
            subkey: 'title',
            label: 'occupation',
            count: { 'latest.occupations.title': { '$exists': true } },
            match: d => ({ 'latest.occupations.title': { $regex: new RegExp(d, 'gi') } }),
        },
        {
            subkey: 'group',
            label: 'group',
            count: { 'latest.occupations.group': { '$exists': true } },
            match: d => ({ 'latest.occupations.group': { $regex: new RegExp(d, 'gi') } }),
        },
        {
            subkey: 'place',
            label: 'place',
            count: { 'latest.occupations.place': { '$exists': true } },
            match: d => ({ 'latest.occupations.place': { $regex: new RegExp(d, 'gi') } }),
        },
    ],
  
}
