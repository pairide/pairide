/* Core node module imports */
var express = require('express'),
  app = express(),
  server = require('http').createServer(app),
  io = require('socket.io').listen(server),
  MongoStore = require('connect-mongo')(express),
  http = require('http'),
  path = require('path'),
  md5h = require('MD5');
  
/* Relative node imports */
var routes = require('./routes'),
  auth = require('./routes/auth'),
  socket_handler = require('./sockets'),
  db = require('./database.js'),
  random = require('./routes/random'),
  middleware = require('./middleware'),
  checkAuth = middleware.checkAuth;

app.configure(function(){
  app.set('port', process.argv[2] | 8000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  /**** TODO: Add a favicon *****/
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  // Use MongoDB for sessions.
  app.use(express.session({
    secret: app.cookie_secret,
    store: new MongoStore({
      db: "global_sessions"
    })
  }));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
  app.locals.pretty = true;
});

app.locals.auth = false;

/* GET Methods */

app.get('/', checkAuth, routes.index);
app.get('/home', checkAuth, routes.index);
app.get('/contact', checkAuth, routes.contact);
app.get('/register', checkAuth, routes.register);
app.get('/about', checkAuth, routes.about);
app.get('/faq', checkAuth, routes.faq);
app.get('/tos', checkAuth, routes.tos);
app.get('/profile', middleware.isAuthenticated, routes.profile);
app.get('/logout', middleware.isAuthenticated, auth.logout);
app.get('/workspace', middleware.isAuthenticated, checkAuth, routes.workspace);
app.get('/create_session', checkAuth, random.create);
app.get('/validate', checkAuth, auth.validate);
app.get(/^\/express\/.*$/, random.join);

/* POST Methods */
app.post('/workspace/fileconnector', routes.fileConnector);
app.post('/login', auth.login);
app.post('/register', auth.register);


/* Listen for requests */
server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

// Sockets debug level.
io.set('log level', 3);
// Set up connection and listen/send for events.
socket_handler.communicate(io)
