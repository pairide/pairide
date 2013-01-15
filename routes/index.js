
/*
 * GET home page.
 */

exports.index = function(req, res){
<<<<<<< HEAD
  res.render('index', { title: 'sadihsaifh', current : 'Home' });
};

exports.register = function(req, res){
	res.render('register', { title: 'Register', current : "None"});
}
=======
  res.render('index', { title: 'Home', current : 'Home' });
};

/*
 * Route the user and render the about page.
 */
exports.about = function(req, res){
  res.render('about', { title: 'sadihsaifh', current : 'Home' });
};
>>>>>>> ed4686452bf4574f70072dd323fd6951ac5cb2f1
