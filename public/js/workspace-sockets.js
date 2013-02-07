var socket = connect();
var username, roomname;

$(document).ready(function(){
	$('#nameform').submit(function(){
		load(socket, "workspace", username, roomname);
		$('#userModal').modal('hide');
		return false;
	});
});