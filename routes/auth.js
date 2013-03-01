/*
 * Authentication halders. Handles Login, Registration and Logout actions.
 */

var db = require('../database.js'),
Recaptcha = require('recaptcha').Recaptcha,
config = require('../config');

/*
 * Controller for login.
 * Check if the supplied credientials given by the user match and set
 * session if so. 
 */
exports.login = function(req, res){


	var data = req.body,
	title = "Error",
	type = "error",
	notification;

	db.users.findOne({username: data.user}, '_id password_hash salt validated', function(error, user){

		if(error){
			// DB Transaction error.
			notification = error;

		}else if(!user){
			notification = "No such user registered. Please re-check your credentials again.";

		}else{
			// Check if user email is validated
			if(!user.validated){
				notification = "Your account has not been activated it. Please activate it first.";

			}else{
				// Compare the password. 
				var bcrypt = require('bcrypt');
				if(bcrypt.compareSync(data.password, user.password_hash)){

					req.session.user_id = data.user;
					res.redirect('/home?l=1');

				}else{

					notification = "Passwords don't match; please re-check your credentials again.";
				}
			}
		}
		//TODO: Render a new login box.
		res.render('notify', {current: "Login", title: title, type: type, notification: notification});
	});
};

/* 
 * Controller for user registration.
 * Validate all fields and insert the user registration data. Send a validation email
 * to the user once completed.
 */
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

	// Check if error set.
	var errorSet = ((Object.keys(err)).length) ? 1 : false;

	if(errorSet){
		res.render('register', { title: 'Register', current : "None", error: err, errorSet: errorSet});

	}else{
		var userExists = false;
		var emailExists = false;
		var errorSet = false;

		// Perform DB side validations.
		db.users.count({username: data.username},function(err, count){

			if(count) userExists = true;

			db.users.count({email: data.email}, function(err, count){

				if(count) emailExists = true;

				if(userExists || emailExists){
					// User and/or email already exist.
					errorSet = 2;
					res.render('register', { title: 'Register', current : "None", userExists: userExists, emailExists: emailExists, errorSet: errorSet});

				}else{
					// Insert the new user.
					var bcrypt = require('bcrypt'),
					salt = bcrypt.genSaltSync(10),
					hash = bcrypt.hashSync(data.pass, salt),
					validation_hash = bcrypt.genSaltSync(10);

					var newUser = new db.users({
						username: data.username,
						password_hash: hash,
						email: data.email,
						first_name: data.first,
						last_name: data.last,
						validated: false,
						validation_hash: validation_hash,
						reset_hash: false,
						reset_request_alive: false,
					});

					// Save the new user.
					newUser.save();

					// Setup and fire the validation email.
					var mailer = require('../email.js');
					var config = require('../config.js');
					var validation_url = config.callbackURL + "validate?i=" + validation_hash + "&u=" + data.username;
					var mailOptions = {
						from: config.email_from_address,
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

						// Redirect and show user a success message.
						var successMessage = "Username " + data.username + " has been registered. An activation email has been sent to " + data.email;
						res.render('notify', {current: false, title: 'Registration Successful!', type: "success", notification: successMessage});
					});
				}
			});
		});
	}
};

/* 
 * Controller for user email validation.
 */
exports.validate = function(req, res){

	var data = req.query,
	type = "error",
	title = "Error",
	notification;

	// Check if validation hash and user is set as a GET parameter.
	if(data.i && data.u){

		db.users.findOne({validation_hash: data.i, username: data.u}, function(error, user){

			if(error){
				// DB Transaction error.
				notification = error;
				res.render('notify', {current: false, title: title, type: type, notification: notification});

			}else if(!user){
				notification = "No such user with the given hash.";
				res.render('notify', {current: false, title: title, type: type, notification: notification});

			}else{
				// Set the user as validated and show a success message.
				db.users.update({validation_hash: data.i, username: data.u}, {validated: true}, function(err, num, raw){

					if(error){
						notification = error;
					}else{
						notification = "Account activated. You may now log in.";
						type = "success";
						title = "Activated!";
					}
					res.render('notify', {current: false, title: title, type: type, notification: notification});
				});
			}
		});

	}else{
		// No validation hash given; someone is trying to access the validation page directly.
		res.render('notify', {current: false, title: title, type: type, notification: "Malformed input."});
	}
};

/*
 * Controller for logout.
 */
exports.logout = function(req, res){

	delete req.session.user_id;
	res.redirect('/home');
};

exports.processForgotPassword = function(req, res){

  var data = {
		remoteip:  req.connection.remoteAddress,
		challenge: req.body.recaptcha_challenge_field,
		response:  req.body.recaptcha_response_field
  };

  var type = "error",
	title = "Error",
	notification;

  if(!req.body.email){
	res.redirect('/forgot_password?e=1');
  }

  var recaptcha = new Recaptcha(config.PUBLIC_KEY, config.PRIVATE_KEY, data);

  recaptcha.verify(function(success, error_code) {

	if(success){

		db.users.findOne({email: req.body.email}, function(error, user){

			console.log(req.body.email);

			if(error){
				// DB Transaction error.
				notification = error;
				res.render('notify', {current: false, title: title, type: type, notification: notification});

			}else if(!user){
				notification = "No such user. Please try again.";
				res.render('notify', {current: false, title: title, type: type, notification: notification});

			}else{
				_reset_password(user, req.body.email, res);
			}

		});

	}else{
		res.redirect('/forgot_password?e=2');
	}

  });

};

function _reset_password(user, email, res){

	var type = "error",
	title = "Error",
	notification;

	var bcrypt = require('bcrypt'),
	reset_hash = bcrypt.genSaltSync(10);

	db.users.update({email: email}, {reset_hash: reset_hash, reset_request_alive: true}, function(error, num, raw){

		if(error){
			notification = error;
			res.render('notify', {current: false, title: title, type: type, notification: notification});

		}else{

			var mailer = require('../email.js');
			var config = require('../config.js');
			var validation_url = config.callbackURL + "reset?r=" + reset_hash + "&u=" + user.username;
			var mailOptions = {
				from: config.email_from_address,
				to: email,
				subject: "Reset your password at PairIDE",
				text: "Reset your password at PairIDE at " + validation_url,
				html: 'Reset your password at PairIDE at <a href="' + validation_url + '">' + validation_url + '</a>'
			};
			mailer.transport.sendMail(mailOptions, function(error, response){
				if(error){
					//TODO: Handle.
					console.log(error);
				}

				// Redirect and show user a success message.
				var successMessage = "A reset password link has been sent to " + email;
				res.render('notify', {current: false, title: 'Reset Password', type: "success", notification: successMessage});
			});
		}
	});
}

exports.reset_password_form = function(req, res){

	var data = req.query,
	type = "error",
	title = "Error",
	notification;

	if(data.u && data.r){

		db.users.findOne({username: data.u, reset_hash: data.r}, function(error, user){

			if(error){
				// DB Transaction error.
				notification = error;
				res.render('notify', {current: false, title: title, type: type, notification: notification});

			}else if(!user || !user.reset_request_alive){
				notification = "No such record.";
				res.render('notify', {current: false, title: title, type: type, notification: notification});

			}else{
				res.render('reset_password_form', {current: false, title: "Reset Password", username: data.u, reset_hash: data.r});
			}
		});

	}else{

		res.render('notify', {current: false, title: title, type: type, notification: "Malformed input."});

	}
};

exports.reset_password = function(req, res){

	var data = req.body,
	type = "error",
	title = "Error",
	notification;

	if(data.pass && data.confirm_pass && data.reset_hash && data.user){

		db.users.findOne({username: data.user, reset_hash: data.reset_hash}, function(error, user){

			if(error){
				// DB Transaction error.
				notification = error;
				res.render('notify', {current: false, title: title, type: type, notification: notification});

			}else if(!user || !user.reset_request_alive){
				notification = "No such record.";
				res.render('notify', {current: false, title: title, type: type, notification: notification});

			}else{

				var bcrypt = require('bcrypt'),
				salt = bcrypt.genSaltSync(10),
				hash = bcrypt.hashSync(data.pass, salt);

				db.users.update({username: data.user, reset_hash: data.reset_hash}, {password_hash: hash, reset_request_alive: false}, function(error, num, raw){

					if(error){
						notification = error;
						res.render('notify', {current: false, title: title, type: type, notification: notification});

					}else{
						var successMessage = "Your password has been reset.";
						res.render('notify', {current: false, title: 'Login', type: "success", notification: successMessage});
					}
				});
			}
		});

	}else{
		res.render('notify', {current: false, title: title, type: type, notification: "Malformed input."});
	}
};