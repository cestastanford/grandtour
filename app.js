var express = require('express')
var mongoose = require('mongoose')
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('cookie-session');
var bodyParser = require('body-parser');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  next();
};


//server.listen(app.get('port'));
// socket.io
io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('disconnected')
  });
});

app.set('views', __dirname + '/public/');
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ keys: ['secretkey1', 'secretkey2', '...']}));

// static
app.use(express.static(__dirname + '/public'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));

// Configure passport middleware
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

mongoose.connect(process.env['MONGODB_URI'], function(err) {
  if (err) {
    console.error('Could not connect to MongoDB at the specified URI.');
    process.exit(1);
  }
});

// crossdomain
app.use(allowCrossDomain);

// Register routes
app.use('/', require('./routes')(io));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      title: 'error1',
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    title: 'error1',
    message: err.message,
    error: {}
  });
});

app.set('port', process.env.PORT || 4000);

server.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});
