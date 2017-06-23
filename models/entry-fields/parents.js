const mongoose = require('mongoose')

module.exports = {

    key: 'parents',
    type: mongoose.Schema.Types.Mixed,
    label: 'Parents',
    sheet: {

        name: 'Parents',
        columns: [ 'order', 'parents', 'heir', 'pupil', 'surviving', 'posthumous', 'illegitimate' ],
        
    }

}
