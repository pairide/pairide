
/* 
 * Create a random session and redirect  
 * client to it.
 */
exports.create = function(req, res){
	var roomAdmins = require('../sockets/index.js').roomAdmins;
	if(req.session.user_id && req.body.room_name){
		// User is logged in and wants to create a custom room.

		var roomExists = req.body.room_name in roomAdmins;
	  	res.send(
	  		{
	  			result:!roomExists, 
	  			room:req.body.room_name
	  		});	

	}else{
		// User may or may not be logged in.
		var md5h = require('MD5');
		hash = md5h(new Date().getTime());
		res.redirect('/express/' + hash);

	}

}

/* Make client join specific session*/
exports.express_join = function(req, res){
  res.render('workspace', {title: 'Express Workspace', current: "None", workspace: false});
}