$(document).ready(function(){

	$('#registration_form').validate({
		errorElement: "span",
		rules: {
			first: "required",
			last: "required",
			pass: "required",
			confirm_pass: {
      			equalTo: "#password"
    		}
		}
	});
});