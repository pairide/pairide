
exports.login = function(req, res){

	var data = req.body;

	if(data.user == "john" && data.password == "smith" ){

		res.send('Success')

	}else{

		res.send('Fatal: Auth Error.');
	}
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

	console.log(data);

	var errorSet = ((Object.keys(err)).length) ? true : false;

	if(errorSet){
		res.render('register', { title: 'Register', current : "None", error: err, errorSet: errorSet});

	}else{
		
		res.send("Validation success");

	}
}