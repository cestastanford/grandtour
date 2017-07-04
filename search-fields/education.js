module.exports = {
    
    key: 'education',
    name: 'Education',
    queries: [
        {
            subkey: 'institution',
            label: 'institution',
            count: { 'education.institution': { $exists: true } },
            match: d => ({ 'education.institution': { $regex: new RegExp(d, 'gi') } }),
        },
        {
            subkey: 'place',
            label: 'place',
            count: { 'education.place': { $exists: true } },
            match: d => ({ 'education.place': { $regex: new RegExp(d, 'gi') } }),
        },
        {
            subkey: 'degree',
            label: 'degree',
            count: { 'education.fullDegree': { $exists: true } },
            match: d => ({ 'education.fullDegree': { $regex: new RegExp(d, 'gi') } }),
        },
        {
            subkey: 'teacher',
            label: 'teacher',
            count: { 'education.teacher': { $exists: true } },
            match: d => ({ 'education.teacher': { $regex: new RegExp(d, 'gi') } }),
        },
    ],
  
}
