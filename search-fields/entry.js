module.exports = {
    
    key: 'entry',
    name: 'Free Search in entry text',
    queries: {
        label: 'text',
        count: { biography: { $exists: true } },
        match: d => {
            const or = [];
            for (let section in d.sections) {
                queryObj = {};
                if (section === 'tours') {

                    queryObj[section] = { $elemMatch: { text: { $regex: new RegExp((d.beginnings === 'yes' ? '\\b': '') + escapeRegExp(d.sections[section]), 'gi') } } };

                } else queryObj[section] = { $regex: new RegExp((d.beginnings === 'yes' ? '\\b': '') + escapeRegExp(d.sections[section]), 'gi') };
                or.push(queryObj);
            }
            return { $or: or };
        },
    },
  
}
