$(document).ready(function(){
	
	$('#create_session').ajaxForm(function(data) { 
		
		if (!data.result){
			alert("This room already exists.");
		}
		else{
			window.location.replace("/workspace/" + data.room);
		}
    });

	$('#login_form').validate({
		errorElement: "p",
		rules: {
			user: "required",
			password: "required"
		}
	});

});
