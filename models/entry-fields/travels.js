/*
*   Removes travel dates set as 0.
*/

const removeBlankDates = travel => Object.keys(travel).forEach(key => {

    if ([ 'travelStartDay',
        'travelStartMonth',
        'travelStartYear',
        'travelEndDay',
        'travelEndMonth',
        'travelEndYear' ].indexOf(key) > -1) {

        if (+travel[key] === 0) delete travel[key]

    }

})


/*
*   Parses the notes to determine whether travel dates were present
*   in the dictionary or added later.
*/

const calculateSpecifiedInDictionary = travel => {

    if (travel.notes) {
        const match = travel.notes.match(/(?:TD|KG) -- 0/)
        console.log('note: ', travel.notes, ' (matched: ' + (match ? 'yes' : 'no') + ')')
        if (match) return false
    }

    return true

}


/*
*   Entry Field export.
*/

module.exports = {

    key: 'travels',
    type: [{
        tourIndex: Number,
        travelIndex: Number,
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
        travelindexTotal: String,
        latitude: String,
        longitude: String,
        lte: String,
        gte: String,
        parent: String,
        notes: String,
        'period of time calculations': String,
        travelDateSpecifiedInDictionary: Boolean,
    }],
    label: 'Travels',
    sheet: {

        name: 'Travels',
        fromSheet: (row, field) => {

            const valueObject = {}
            Object.keys(field.getValueType()).forEach(column => {
                if (row[column]) valueObject[column] = row[column]
            })

            removeBlankDates(valueObject)
            valueObject.travelDateSpecifiedInDictionary = calculateSpecifiedInDictionary(valueObject)
            
            if (Object.keys(valueObject).length) return valueObject

        }

    }

}
