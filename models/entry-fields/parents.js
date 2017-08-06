const mongoose = require('mongoose')

module.exports = {

    key: 'parents',
    type: {
        order: String,
        parents: String,
        heir: Boolean,
        pupil: Boolean,
        surviving: Boolean,
        posthumous: Boolean,
        illegitimate: Boolean,
    },
    label: 'Parents',
    sheet: {

        spreadsheet: '1t6FRVhSQf6HyiJIHxC9sJEUqDdjkRYKtPrhyDoLveJo',
        name: 'Parents',
        
    }

}
