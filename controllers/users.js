var	mongoose = require('mongoose')
, User = mongoose.model('User')

exports.index = function(req, res){

  User.find({}, function(err, users){
    if (err) {
      res.json({error:err});
    }
    res.json({ users: users });
  })

}
