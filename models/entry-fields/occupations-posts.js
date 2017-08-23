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

        name: 'Occupations & Posts',

    }

}
