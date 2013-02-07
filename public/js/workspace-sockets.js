var socket = connect();
var username;

$(document).ready(function(){
	load(socket, "workspace", username);
	$('#nameform').submit(function(){

		$('#userModal').modal('hide');
		return false;
	});
});