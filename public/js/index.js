$(document).ready(function(){

	$('#login_form').validate({
		errorElement: "p",
		rules: {
			user: "required",
			password: "required"
		}
	});

});
