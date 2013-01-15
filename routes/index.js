
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
  res.render('about', { title: 'sadihsaifh', current : 'Home' });
};