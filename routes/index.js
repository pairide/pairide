
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'sadihsaifh', current : 'Home' });
};

exports.register = function(req, res){
	res.render('register', { title: 'Register', current : "None"});
}