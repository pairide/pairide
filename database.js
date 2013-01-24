/* All functions related to db operations 
* will be here
*/

var mongo = require('mongoskin');
var conn = mongo.db('mongodb://localhost:27017/test');
var users = conn.collection('users');

//Get a list of all users
exports.getUser = function(user){
	users.findOne({ username: user}, function(err, item){
		if(!item){
			console.log(user + " does not exist");
		}
		else{
			console.log(item.username);
		}
	});
}

exports.insertUser = function(user){
	users.insert([user], function(err, result){
		if(err){
			return false;
		}
		else{
			console.log(result);
			return true;
		}
	});
};

/* User Schema
*  {username: required, unique, length=16,
	password_hash: length=32,
	salt: ,
	email: required, unique,
	validate: bool	
	}
*/
