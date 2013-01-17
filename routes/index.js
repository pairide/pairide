
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Home', current : 'Home' });
};

/*
 * Route the user and render the about page.
 */
exports.about = function(req, res){
  res.render('about', { title: 'About', current : 'About' });
};

/*
 * Route the user and render the about page.
 */
exports.faq = function(req, res){
  res.render('faq', { title: 'FAQ', current : 'FAQ' });
};

/*
 * Route the user and render the Contact page.
 */
exports.contact = function(req, res){
  res.render('contact', { title: 'Contact', current : 'Contact' });
};

exports.register = function(req, res){
	res.render('register', { title: 'Register', current : "None"});
};

exports.tos = function(req, res){
	res.render('tos', { title: 'Terms of Service', current : "None"});
};

exports.workspace = function(req, res){
	res.render('workspace', {title: 'Workspace', current: "None"});
};


