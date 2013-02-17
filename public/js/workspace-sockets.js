var socket = connect();
var username;

$(document).ready(function(){
	load(socket, "workspace", username);
	$('#nameform').submit(function(){

		$('#userModal').modal('hide');
		return false;
	});
});

function handleSelection(range){

	if(!range.isEmpty()){
		$("#debug").html(range.toString());

		socket.emit("user_selection", { user: username, range: range });
	}
}