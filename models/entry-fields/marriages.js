module.exports = {

    key: 'marriages',
    type: [{
        sequence: Number,
        spouse: String,
        year: String,  /* changed from Number because some values are annotated */
        relative: String,
        'Spouse ID': Number,
    }],
    label: 'Marriages',
    sheet: {

        spreadsheet: '1t6FRVhSQf6HyiJIHxC9sJEUqDdjkRYKtPrhyDoLveJo',
        name: 'Marriages',

    }

}
