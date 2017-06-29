module.exports = {

    key: 'tours',
    type: { lines: [] },
    label: 'Tours',
    sheet: {

        spreadsheet: '1dXckjpjDbGcGxpFS9M1ndQDjoIK5hEwTZqJznqbwRS8',
        name: 'Entries',
        column: 'tours',
        fromSheet: d => ({ lines: d.split(/\. (?=\[?-?\d{4})(?![^(]*\))(?![^[]*\])/g) }),
        toSheet: d => d.lines.join('. '),

    }

}
