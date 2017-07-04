module.exports = {
    
    key: 'travels',
    name: 'Travels',
    queries: [
        {
            subkey: 'place',
            label: 'place',
            count: { 'travels.place': { $exists: true } },
            match: d => ({ 'travels.place': { $regex: new RegExp(d, 'gi') } }),
        },
        {
            subkey: 'year',
            label: 'year',
            count: { 'travels': { $elemMatch: { $or: [ { travelStartYear: { $ne: '0' } }, { travelEndYear: { $ne: '0' } } ] } } },
            match: d => ({}),
        },
        {
            subkey: 'month',
            label: 'month',
            count: { 'travels': { $elemMatch: { $or: [ { travelStartMonth: { $ne: '0' } }, { travelEndMonth: { $ne: '0' } } ] } } },
            match: d => ({}),
        },
        {
            subkey: 'day',
            label: 'day',
            count: { 'travels': { $elemMatch: { $or: [ { travelStartDay: { $ne: '0' } }, { travelEndDay: { $ne: '0' } } ] } } },
            match: d => ({}),
        },
    ]

}
