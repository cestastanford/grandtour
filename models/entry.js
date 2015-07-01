var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var Entry = new Schema({
  index : Number,
  biography : String,
  tours : [],
  narrative : String,
  notes : String,
  fullName : String,
  birthPlace : String,
  deathPlace : String,
  birthDate : {},
  deathDate : {},
  flourishedStartDate : {},
  flourishedEndDate : {},
  education : [],
  marriages : [],
  parents : {},
  travels : []
});

mongoose.model('Entry', Entry);
