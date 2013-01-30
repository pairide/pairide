/* Create a random session redirect  
* client to it
*/
exports.create = function(req, res){
  var md5h = require('MD5');
  hash = md5h(new Date().getTime());
  res.redirect('/express/' + hash);
}

/* Make client join specific session*/
exports.join = function(req, res){
  res.render('workspace', {title: 'Express Workspace', current: "None", logged_in: false});
}