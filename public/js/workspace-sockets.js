var socket = connect();
var username = "alex";

$(document).ready(function(){
	$('#nameform').submit(function(){
		load(socket, "workspace", username);
		$('#userModal').modal({show: false});
		alert('wut');
		return false;
	});
});