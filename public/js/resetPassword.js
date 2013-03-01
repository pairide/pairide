$(document).ready(function(){

	$('#resetPasswordForm').validate({
		errorElement: "span",
		rules: {
			email: { 
				required: true, 
				email: true 
			}
		}
	});
});