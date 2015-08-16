var passport = require('passport');
var router = require('express').Router();
var User = require('./models/user');
var Entry = require('./models/entry');

var	users = require('./controllers/users');
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

  router.get('/components/:name', function (req, res) {
    var name = req.params.name;
    res.render( 'components/' + name + '/' + name);
  });

  // route to test if the user is logged in or not
  router.get('/loggedin', function(req, res) {
    res.send(req.isAuthenticated() ? req.user : '0');
  });

  // route to register
  router.post('/register', function(req, res, next) {
    User.register(new User(req.body), req.body.password, function(err, data) {
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

  var admin = function(req, res, next){
    if (!req.isAuthenticated() || req.user.role != "admin") {
    	res.send(401);
    }
    else {
    	next();
    }
  };


  /*
    APIs
  */

  // users
  router.get('/api/users', admin, users.index);
  // add
  router.post('/api/users/add', admin, function(req, res, next) {
    User.register(new User(req.body), req.body.password, function(err, data) {
      // problem registering the new user...
      if (err) { return res.status(401).send(err); }
      // if ok, let's login the new user
      return res.status(200).send({user:data});
    });
  });
  // remove
  router.post('/api/users/remove', admin, function(req, res, next) {
    User.find({username:req.body.username}).remove(function(err,data){
      if (err) { return res.status(401).send(err); }
      return res.status(200).send({ removed:data });

    });
  });
  // update
  router.post('/api/users/update', admin, function(req, res, next) {
    User.update({ username:req.body.username }, req.body, function(err,data){
      if (err) { return res.status(401).send(err); }
      return res.status(200).send({ updated:data });

    });
  });


  // entries
  router.get('/api/entries', auth, entries.index);
  router.get('/api/entries/:id', entries.single);
  router.post('/api/entries/search', auth, entries.search);
  router.post('/api/entries/suggest', auth, entries.suggest);
  router.post('/api/entries/export', auth, entries.export);
  router.post('/api/entries/uniques', auth, entries.uniques);

  // database
  router.post('/api/reload', admin, function(req, res){
    database.reload(req, res, io)
  });

  router.get('/api/reset', admin, function(req, res){
    database.reset(req, res, io)
  });

  return router;

}

module.exports = routes;
