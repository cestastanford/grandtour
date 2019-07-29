module.exports = {

    key: 'travels',
    type: [{
        tourIndex: Number,
        travelIndex: Number, // this field is unused, query.js uses different implementation
        tourStartFrom: Number,
        tourStartTo: Number,
        tourEndFrom: Number,
        tourEndTo: Number,
        travelStartDay: Number,
        travelStartMonth: Number,
        travelEndDay: Number,
        travelEndMonth: Number,
        travelStartYear: Number,
        travelEndYear: Number,
        place: String,
        markers: String,
        travelindexTotal: String, // this field is unused, query.js uses different implementation
        latitude: String,
        longitude: String,
        italy: Boolean,
        lte: String,
        gte: String,
        parent: String,
        notes: String,
        'period of time calculations': String,
    }],
    label: 'Travels',
    sheet: {

        name: 'Travels',

    }

}
