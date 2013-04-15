/* This contains all scripts needed for the reset password page: create new password*/

$(document).ready(function(){

	$('#resetPasswordForm').validate({
		errorElement: "span",
		rules: {
			pass: {
				required: true,
				minlength: 4,
				maxlength: 64
			},
			confirm_pass: {
				equalTo: "#pass"
			}
		}
	});
});

