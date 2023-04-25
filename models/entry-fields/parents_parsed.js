const mongoose = require('mongoose')

module.exports = {

    key: 'parents_parsed',
    type: [{
        "Parent ID": Number,
        order: String,
        parent: String,
        heir: Boolean,
        pupil: Boolean,
        surviving: Boolean,
        posthumous: Boolean,
        illegitimate: Boolean,
    }],
    label: 'Parents',
    sheet: {

        name: 'Parents Parsed',
        
    }

}
