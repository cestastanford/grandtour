const mongoose = require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose')

const User = new mongoose.Schema({
  
  fullName: String,
  email: String,
  role: { type: String, default: 'viewer' },

})

User.plugin(passportLocalMongoose)
module.exports = mongoose.model('User', User)
