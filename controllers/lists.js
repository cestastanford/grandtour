var mongoose = require('mongoose')
, List = mongoose.model('List')

exports.mylists = function(req, res){

  var username = req.username;
  List.mylists({ owner : username }, function(err, response), {
    if (err) {
        res.json({ error : err });
    } else {
        res.json({ entries : response });
    }
  });

};
