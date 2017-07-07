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

        spreadsheet: '1dXckjpjDbGcGxpFS9M1ndQDjoIK5hEwTZqJznqbwRS8',
        name: 'Parents',
        
    }

}
