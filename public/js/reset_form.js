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