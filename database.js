/* All functions related to db operations 
* will be here
*/
/*
var mongo = require('mongoskin');
var conn = mongo.db('mongodb://localhost:27017/test');
var users = conn.collection('users');

users.ensureIndex({
	'username': 1
}, {
	unique: true
});

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

exports.insertUser = function(user, callback){
	users.insert([user], callback)};
*/
/* User Schema
*  {username: required, unique, length=16,
	password_hash: length=32,
	salt: ,
	email: required, unique,
	validate: bool	
	}
*/
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/users');  

var db = mongoose.connection;

var Users = new mongoose.Schema({
    username: { 
        type: String, 
        unique: true,
        index: true,
        required: true,
    },
    password: {
    	type: String,
		required: true,
    },
    email: {
    	type: String,
    	unique: true,
    	index: true,
    	required: true,
    },
    password_hash: {
    	type: String,
    	required: true,
	},
	validated: {
		type: Boolean,
		required: true,
	},
	validation_hash: {
		type: String,
		required: true,
	}
});

var User = mongoose.model('User', Users)

/*	
var u = new User({ username: 'ayrus', password: 'test', password_hash: "test", email: "wutwut", validated: false, validation_hash: "123" });

u.save(function(err){
	if(err) console.log(err);
});*/

exports.users = User;

/*
exports.ifUserExists = function(username) {
	User.count({username: username},function(err, count){

		//console.log(count + " for " + username);

		if(!count){
			return true;
		}

		return false;
	})
}*/

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {


});