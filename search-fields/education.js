module.exports = {
    
    key: 'education',
    name: 'Education',
    queries: [
        {
            subkey: 'institution',
            label: 'institution',
            count: { 'latest.education.institution': { $exists: true } },
            match: d => ({ 'latest.education.institution': { $regex: new RegExp(d.institution, 'gi') } }),
        },
        {
            subkey: 'place',
            label: 'place',
            count: { 'latest.education.place': { $exists: true } },
            match: d => ({ 'latest.education.place': { $regex: new RegExp(d.place, 'gi') } }),
        },
        {
            subkey: 'degree',
            label: 'degree',
            count: { 'latest.education.fullDegree': { $exists: true } },
            match: d => ({ 'latest.education.fullDegree': { $regex: new RegExp(d.degree, 'gi') } }),
        },
        {
            subkey: 'teacher',
            label: 'teacher',
            count: { 'latest.education.teacher': { $exists: true } },
            match: d => ({ 'latest.education.teacher': { $regex: new RegExp(d.teacher, 'gi') } }),
        },
    ],
  
}
