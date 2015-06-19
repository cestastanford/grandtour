var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var Entry = new Schema({
  index : Number,
  biography : String,
  tours : String,
  narrative : String,
  notes : String,
  fullName : String,
  birthPlace : String,
  deathPlace : String,
  birthDate : {},
  deathDate : {},
  flourishedStartDate : {},
  flourishedEndDate : {},
  education : []
});

mongoose.model('Entry', Entry);
