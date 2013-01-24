$(document).ready(function(){

	$('#registration_form').validate({
		errorElement: "span",
		rules: {
			first: "required",
			last: "required",
			username: { 
				required: true,
				minlength: 4,
				maxlength: 20,
			},
			email: { 
				required: true, 
				email: true 
			},
			pass: {
				required: true,
				minlength: 4,
				maxlength: 64
			},
			confirm_pass: {
      			equalTo: "#password"
    		}
		}
	});
});