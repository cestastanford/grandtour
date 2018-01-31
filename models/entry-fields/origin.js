const ORIGIN_TYPES = [

    'Extracted from heading',
    'Extracted from narrative',
    'From the Dictionary',

]

module.exports = {

    key: 'origin',
    type: {
        entryOrigin: { type: String, enum: ORIGIN_TYPES, required: true },
        sourceName: String, // for when the origin entry no longer exists
        sourceIndex: Number, // for when the origin entry still exists
    },

    label: 'Entry Origin',
    sheet: {

        name: 'Entry Origin',

    }

}
