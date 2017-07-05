module.exports = {

    key: 'mentionedNames',
    type: [],
    label: 'Mentioned Names',
    sheet: {

        spreadsheet: '1PnBTlQnHfqj-sl32mcUpB-j2vL-BqJMx7BAiXe5TrRA',
        name: 'Mentioned Names',
        columns: [ 'name', 'entryIndex1', 'entryIndex2', 'entryIndex3' ],
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
