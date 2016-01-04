var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var Entry = new Schema({
  index : Number,
  biography : String,
  tours : [],
  narrative : String,
  notes : String,
  entry : String,

  fullName : String,
  places : [],
  dates : [],
  type : String,

  pursuits : [],
  occupations : [],
  education : [],
  societies : [],
  exhibitions : [],
  military : [],
  marriages : [],
  mistress : [],
  parents : {},
  travels : []
});

mongoose.model('Entry', Entry);
