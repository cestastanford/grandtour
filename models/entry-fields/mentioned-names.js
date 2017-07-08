module.exports = {

    key: 'mentionedNames',
    type: [{
        name: String,
        entryIndex: Number,
    }],
    label: 'Mentioned Names',
    sheet: {

        spreadsheet: '1PnBTlQnHfqj-sl32mcUpB-j2vL-BqJMx7BAiXe5TrRA',
        name: 'Mentioned Names',
        fromSheet: row => ({
            name: row.name,
            entryIndex: row.entryIndex1 !== '-1' ? row.entryIndex1 : (
                row.entryIndex2 !== '-1' ? row.entryIndex2 : (
                    row.entryIndex3 !== '-1' ? row.entryIndex3 : null
                )
            )
        })

    }

}
