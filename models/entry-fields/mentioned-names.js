module.exports = {

    key: 'mentionedNames',
    type: [{
        name: String,
        entryIndex1: Number,
        entryIndex2: Number,
        entryIndex3: Number,
    }],
    label: 'Mentioned Names',
    sheet: {

        spreadsheet: '1PnBTlQnHfqj-sl32mcUpB-j2vL-BqJMx7BAiXe5TrRA',
        name: 'Mentioned Names',
        fromSheet: (d) => ({
            name: d.name,
            entryIndex: d.entryIndex1 !== '-1' ? d.entryIndex1 : (
                d.entryIndex2 !== '-1' ? d.entryIndex2 : (
                    d.entryIndex3 !== '-1' ? d.entryIndex3 : null
                )
            )
        })

    }

}
