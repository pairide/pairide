$(document).ready(function(){

	$('#login_form').validate({
		errorElement: "p",
		rules: {
			user: "required",
			password: "required",
			user: {
				minlength: 4,
				maxlength: 20,
			},
			password: {
				minlength: 4,
				maxlength: 64,
			}
		}
	});
});