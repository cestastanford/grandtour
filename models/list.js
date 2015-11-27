var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var List = new Schema({
  index : Number,
  owner : String,
  entryIDs : [Number]
});

mongoose.model('List', List);
