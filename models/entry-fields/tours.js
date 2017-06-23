module.exports = {

    key: 'tours',
    type: [],
    label: 'Tours',
    sheet: {

        name: 'Entries',
        column: 'tours',
        fromSheet: d => d.split(/\. (?=\[?-?\d{4})(?![^(]*\))(?![^[]*\])/g).map(tour => ({ text: tour })),
        toSheet: d => d.join('. '),

    }

}
