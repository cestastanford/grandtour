const mongoose = require('mongoose')

module.exports = {

    key: 'parents',
    type: [{
        "Parent ID": Number,
        order: String,
        parents: String,
        heir: Boolean,
        pupil: Boolean,
        surviving: Boolean,
        posthumous: Boolean,
        illegitimate: Boolean,
    }],
    label: 'Parents',
    sheet: {

        name: 'Parents',
        
    }

}
