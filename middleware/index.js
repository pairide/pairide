

exports.isAuthenticated = function (req, res, next) {

  if (!req.session.user_id) {

    res.render('notify', {current: false, title: 'Protected Resource', type: "error", notification: "You have to be logged in to access this page."});

  } else {

  	res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    
    next();

  }
}

exports.checkAuth = function(req, res, next){

	if (req.session.user_id) {

		res.locals.auth = true;

	}

	next();

}