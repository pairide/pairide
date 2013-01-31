var db = require('../database.js');

exports.login = function(req, res){

	var data = req.body,
	title = "Error",
	type = "error",
	notification;

	db.users.findOne({username: data.user}, '_id password_hash salt validated', function(error, user){

		if(error){

			notification = error;

		}else if(!user){

			notification = "No such user registered. Please re-check your credentials again.";

		}else{

			//Check if user is validated
			if(!user.validated){

				notification = "Your account has not been activated it. Please activate it first.";

			}else{

				var bcrypt = require('bcrypt');
				if(bcrypt.compareSync(data.password, user.password_hash)){

					req.session.user_id = data.user;
					res.redirect('/workspace');	

				}else{

					notification = "Passwords don't match; please re-check your credentials again.";
				}


			}

		}

		//TODO: Render a new login box.
		res.render('notify', {current: "Login", title: title, type: type, notification: notification});

	});


}

exports.register = function(req, res){

	/* Validations */

	var data = req.body;

	var err = {};

	if(!data.first){
		err['first'] = "First name is missing.";
	}

	if(!data.last){
		err['last'] = "Last name is missing.";
	}

	if(!data.username){
		err['user'] = "Username is missing.";
	}

	if(!data.email){
		err['email'] = "EMail is missing.";
	}

	if(!data.pass || !data.confirm_pass){
		err['pwords'] = "Password(s) is missing.";
	}

	if(data.pass != data.confirm_pass){
		err['pword_match '] = "Passwords do not match.";
	}

	if(data.pass.length < 4 || data.username.length < 4){
		err['pword_length'] = "Username & password must be four characters in length";
	}

	var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

	if(!emailPattern.test(data.email)){
		err['email_pat'] = "Enter a valid email address";
	}

	var errorSet = ((Object.keys(err)).length) ? 1 : false;

	if(errorSet){

		res.render('register', { title: 'Register', current : "None", error: err, errorSet: errorSet});

	}else{

		var userExists = false;
		var emailExists = false;
		var errorSet = false;

		db.users.count({username: data.username},function(err, count){ 

			if(count) userExists = true;

			db.users.count({email: data.email}, function(err, count){

				if(count) emailExists = true;

				if(userExists || emailExists){
					
					errorSet = 2;

					res.render('register', { title: 'Register', current : "None", userExists: userExists, emailExists: emailExists, errorSet: errorSet});

				}else{

					var bcrypt = require('bcrypt'),
					salt = bcrypt.genSaltSync(10),
					hash = bcrypt.hashSync(data.pass, salt),
					validation_hash = bcrypt.genSaltSync(10);
				
					var newUser = new db.users({
						username: data.username,
						password_hash: hash,
						salt: salt, 
						email: data.email,
						first_name: data.first,
						last_name: data.last,
						validated: false,
						validation_hash: validation_hash,
					});

					// Save the new user.
					newUser.save();

					// Setup and fire the validation email.
					var mailer = require('../email.js');

					var validation_url = mailer.callbackURL + validation_hash;

					var mailOptions = {
                    	from: "PairIDE <pairit3@gmail.com>",
                    	to: data.email,
                    	subject: "Activate your account at PairIDE",
                    	text: data.first + " activate your new account at PairIDE at " + validation_url,
                    	html: data.first + ' activate your new account at PairIDE at <a href="' + validation_url + '">' + validation_url + '</a>'
                	};

                	mailer.transport.sendMail(mailOptions, function(error, response){
                		if(error){
                			//TODO: Handle.
                			console.log(error);
                		}


                		var successMessage = "Username " + data.username + " has been registered. An activation email has been sent to " + data.email;

                		res.render('notify', {current: false, title: 'Registration Successful!', type: "success", notification: successMessage});
                	});

				}

			});
		});
	
	}
}

exports.validate = function(req, res){

	var data = req.query,
	type = "error",
	title = "Error",
	notification;

	if(data.i){

		db.users.findOne({validation_hash: data.i}, function(error, user){

			if(error){

				notification = error;

				res.render('notify', {current: false, title: title, type: type, notification: notification});

			}else if(!user){

				notification = "No such user with the given hash.";

				res.render('notify', {current: false, title: title, type: type, notification: notification});

			}else{

				db.users.update({validation_hash: data.i}, {validated: true}, function(err, num, raw){
					
					if(error){
						notification = error;
					
					}else{
						notification = "Account activated. You may now log in."
						type = "success";
						title = "Activated!";
					}

					res.render('notify', {current: false, title: title, type: type, notification: notification});					
				});


			}
		});

	}else{

		res.render('notify', {current: false, title: title, type: type, notification: "Malformed input."});
	}

	
}

exports.logout = function(req, res){

	delete req.session.user_id;

	res.redirect('/home');
}