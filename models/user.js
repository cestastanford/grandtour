var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
  fullName : String,
  email : String,
  role : { type: String, default: 'viewer' }
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);
