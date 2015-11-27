var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var List = new Schema({
  name: String,
  owner: String,
  entryIDs: [Number]
});

mongoose.model('List', List);