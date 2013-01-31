var socket = connect();
var username = "";

$(document).ready(function(){

	/*Get user's name and load the session */
	$('#nameform').submit(function(){
		username = $("#username").val();

		/*Username's validation is needed*/
		load(socket, "express", username);
		$('#userModal').modal('hide');
		return false;
	});
});