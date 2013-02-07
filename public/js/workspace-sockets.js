var socket = connect();
var username = "alex";

$(document).ready(function(){
	$('#nameform').submit(function(){
		load(socket, "workspace", username + Math.floor(Math.random()*11).toString());
		$('#userModal').modal('hide');
		return false;
	});
});