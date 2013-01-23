
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , db = require('./database.js');

var app = express();

app.configure(function(){
  app.set('port', process.argv[2] | 8000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
  app.locals.pretty = true;
});

app.get('/', routes.index);
app.get('/home', routes.index);
app.get('/contact', routes.contact)
app.get('/register', routes.register);
app.get('/about', routes.about);
app.get('/faq', routes.faq);
app.get('/tos', routes.tos);
app.get('/workspace', routes.workspace);
app.get('/dbtest', routes.dbtest);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
