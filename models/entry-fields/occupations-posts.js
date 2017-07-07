module.exports = {

    key: 'occupations',
    type: [{
        profession: String,
        code: Number,
        group: String,
        title: String,
        place: String,
        details: String,
        from: String,  /* changed from Number because some values are annotated */
        to: Number,
    }],
    label: 'Occupations & Posts',
    sheet: {

        spreadsheet: '1dXckjpjDbGcGxpFS9M1ndQDjoIK5hEwTZqJznqbwRS8',
        name: 'Occupations & Posts',

    }

}
