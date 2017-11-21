const mongoose = require('mongoose')

module.exports = {

    key: 'parents',
    type: {
        order: String,
        parents: String,
        parentsEntryIndex: Number,
        heir: Boolean,
        pupil: Boolean,
        surviving: Boolean,
        posthumous: Boolean,
        illegitimate: Boolean,
    },
    label: 'Parents',
    sheet: {

        name: 'Parents',
        
    }

}
