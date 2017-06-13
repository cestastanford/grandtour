const mongoose = require('mongoose')

const Entry = new mongoose.Schema({
  
  index: Number,
  biography: String,
  tours: [],
  narrative: String,
  notes: String,
  entry: String,

  fullName: String,
  alternateNames: [],
  places: [],
  dates: [],
  type: String,

  pursuits: [],
  occupations: [],
  education: [],
  societies: [],
  exhibitions: [],
  military: [],
  marriages: [],
  mistress: [],
  parents: {},
  travels: [],

})

module.exports = mongoose.model('Entry', Entry)
