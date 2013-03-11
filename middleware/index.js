/*
 * Middlewares.
 */

/*
 * Check if user is authenticated.
 * If so, coontinue loading as is.
 * Else, raise an error.
 */
exports.isAuthenticated = function (req, res, next) {

  if (!req.session.user_id) {

    res.render('notify', {current: false, title: 'Protected Resource', type: "error", notification: "You have to be logged in to access this page."});

  } else {

  	res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    
    next();

  }
}

/*
 * Check if user is authenticated and pass in the
 * the information to the template engine.
 */
exports.checkAuth = function(req, res, next){

	if (req.session.user_id) {
		res.locals.auth = true;
    res.locals.auth_user = req.session.user_id;
	}

  // Continue loading as is.
	next();

}

exports.checkRoom = function(req, res, next){
  var matchRoomRequest = /.*\/(express|workspace)\/(.+)/;
  var rooms = require('../routes/room.js').roomsCreated;

  if(matchRoomRequest){
    var room = matchRoomRequest.exec(req.url)[2];

    for (var i = 0; i< rooms.length; i++) {
      if (rooms[i] == room){
        return next();
      }
    } 
  }
  
  res.render('notify', {current: false, title: 'Invalid room', type: "error", notification: "The room you have requested does not exist."});
}