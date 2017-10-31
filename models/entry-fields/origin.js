const ORIGIN_TYPES = {

    extractedFromHeading: 'Extracted from heading',
    extractedFromNarrative: 'Extracted from narrative',
    fromDictionary: 'From the Dictionary',

}

module.exports = {

    key: 'origin',
    type: {
        entryOrigin: { type: String, enum: Object.values(ORIGIN_TYPES), required: true },
        sourceIndex: Number,
        sourceExists: Boolean,
    },

    label: 'Entry Origin',
    sheet: {

        name: 'Entry Origin',

    }

}
