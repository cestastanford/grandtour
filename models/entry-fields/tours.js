module.exports = {

    key: 'tours',
    type: [],
    label: 'Tours',
    sheet: {

        spreadsheet: '1dXckjpjDbGcGxpFS9M1ndQDjoIK5hEwTZqJznqbwRS8',
        name: 'Entries',
        column: 'tours',
        fromSheet: d => d.split(/\. (?=\[?-?\d{4})(?![^(]*\))(?![^[]*\])/g).map(tour => ({ text: tour })),
        toSheet: d => d.join('. '),

    }

}
