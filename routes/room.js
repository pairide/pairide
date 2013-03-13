roomsCreated = new Array();
exports.roomsCreated = roomsCreated;

/* 
 * Create a random session and redirect  
 * client to it.
 */
exports.create = function(req, res){
	var roomAdmins = require('../sockets/index.js').roomAdmins;
	if(req.session.user_id && req.body.room_name){
		// User is logged in and wants to create a custom room.

		// Make sure that room's name is valid and doesn't already exist.
		var roomExists = req.body.room_name in roomAdmins;
		var validationRegex = /[a-zA-Z0-9_]+/;
		var regexResult = validationRegex.exec(req.body.room_name);
	  	res.send(
	  		{
	  			result:!roomExists, 
	  			room:req.body.room_name,
	  			valid: regexResult
	  		});
	  	roomsCreated.push(req.body.room_name);	
	}else{
		// User may or may not be logged in.
		var md5h = require('MD5');
		hash = md5h(new Date().getTime());
		roomsCreated.push(hash);
		res.redirect('/express/' + hash);
	}
}
/* Make client join specific session*/
exports.express_join = function(req, res){
  res.render('workspace', {title: 'Express Workspace', current: "None", workspace: false});
}