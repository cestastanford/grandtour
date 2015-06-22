var passport = require('passport');
var router = require('express').Router();
var User = require('./models/user');
var Entry = require('./models/entry');

var	entries = require('./controllers/entries');
var	database = require('./controllers/database');


/*
router.get('/', function(req, res) {
  res.render('app/index', { user: req.user });
});

router.get('/partials/:name', function (req, res) {
  var name = req.params.name;
  res.render('app/' + name + '/' + name);
});

router.get('/register', function(req, res) {
  res.render('app/auth/register', {});
});

router.post('/register', function(req, res, next) {

  User.register(new User({
    username: req.body.username,
    fullName: req.body.fullname,
    email: req.body.email,
    role: 'admin'
  }), req.body.password, function(err,data) {

    if (err) { return res.render('app/auth/register', { success: false, message: err.message } ); }
    // if ok, let's login the new user
    req.logIn(data, function(err) {
      if (err) { return next(err); }
      return res.redirect('/');
    });
    //res.redirect('/');
  });
});

router.get('/login', function(req, res) {
  res.render('app/auth/login', { user: req.user });
});

router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.render('app/auth/login',{ success: false }); }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('/');
    });
  })(req, res, next);
});


router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});


// redirect all others to the index (HTML5 history)
router.get('*', function (req, res){
  res.render('app/index', { user: req.user });
})

// Serialized and deserialized methods when got from session
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

// Define a middleware function to be used for every secured routes
var auth = function(req, res, next){
  if (!req.isAuthenticated())
  	res.send(401);
  else
  	next();
};
//==================================================================
*/

//==================================================================
// routes

function routes(io) {

  router.get('/', function(req, res){
    res.render('index');
  });

  // angular
  router.get('/views/:name', function (req, res) {
    var name = req.params.name;
    res.render( name + '/' + name);
  });

  router.get('/users', /*auth,*/ function(req, res){
    res.send([{name: "user1"}, {name: "user2"}]);
  });
  //==================================================================

  //==================================================================
  // route to test if the user is logged in or not
  router.get('/loggedin', function(req, res) {
    res.send(req.isAuthenticated() ? req.user : '0');
  });

  // route to register
  router.post('/register', function(req, res, next) {
    User.register(new User({
      username: req.body.username
    }), req.body.password, function(err, data) {
      // problem registering the new user...
      if (err) { return res.status(401).send(err); }
      // if ok, let's login the new user
      req.logIn(data, function(err) {
        if (err) { return res.status(401).send(err); }
        return res.status(200).send(data);
      });
      //res.redirect('/');
    });
  });

  // route to log in
  /*router.post('/login', passport.authenticate('local'), function(req, res) {
    res.send(req.user);
  });*/

  router.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      if (err) { return res.status(401).send(err); }
      if (!user) { return res.status(401).send(info); }
      req.logIn(user, function(err) {
        if (err) { return res.status(401).send({ error: err }); }
        return res.sendStatus(200, req.user);
      });
    })(req, res, next);
  });


  // route to log out
  router.post('/logout', function(req, res){
    req.logOut();
    res.sendStatus(200);
  });
  //==================================================================

  // redirect all others to the index (HTML5 history)
  /*router.get('*', function (req, res){
    res.render('index', { user: req.user });
  })*/

  var auth = function(req, res, next){
    if (!req.isAuthenticated())
    	res.send(401);
    else
    	next();
  };


  /*
    APIs
  */

  // entries
  router.get('/api/entries', auth, entries.index);
  router.get('/api/entries/:id', auth, entries.single);
  router.post('/api/entries/search', auth, entries.search);

  // database
  router.get('/api/gigi', auth, database.gigi);

  router.get('/api/reload', auth, function(req, res){
    database.reload(req, res, io)
  });

  return router;

}

module.exports = routes;
