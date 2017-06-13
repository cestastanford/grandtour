const mongoose = require('mongoose')

const List = new mongoose.Schema({
  
  name: String,
  owner: String,
  entryIDs: [Number],

})

module.exports = mongoose.model('List', List)
