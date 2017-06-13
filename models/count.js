const mongoose = require('mongoose')

const Count = new mongoose.Schema({
  
  field: String,
  count: Number,

})

module.exports = mongoose.model('Count', Count)
