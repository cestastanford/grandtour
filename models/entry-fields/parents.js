const mongoose = require('mongoose')

module.exports = {

    key: 'parents',
    type: mongoose.Schema.Types.Mixed,
    label: 'Parents',
    sheet: {

        spreadsheet: '1dXckjpjDbGcGxpFS9M1ndQDjoIK5hEwTZqJznqbwRS8',
        name: 'Parents',
        columns: [ 'order', 'parents', 'heir', 'pupil', 'surviving', 'posthumous', 'illegitimate' ],
        
    }

}
