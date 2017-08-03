module.exports = {

    key: 'mentionedNames',
    type: [{
        name: String,
        entryIndex: Number,
    }],
    label: 'Mentioned Names',
    sheet: {

        spreadsheet: '1dXckjpjDbGcGxpFS9M1ndQDjoIK5hEwTZqJznqbwRS8',
        name: 'Mentioned Names',
        fromSheet: row => ({
            name: row.name,
            entryIndex: row.entryIndex1 !== '-1' ? row.entryIndex1 : (
                row.entryIndex2 !== '-1' ? row.entryIndex2 : (
                    row.entryIndex3 !== '-1' ? row.entryIndex3 : null
                )
            )
        }),
        doNotUpsert: true,

    }

}
