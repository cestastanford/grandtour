var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var Count = new Schema({
  
  field : String,
  count : Number

});

mongoose.model('Count', Count);
