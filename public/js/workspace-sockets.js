
var socket = io.connect('http://localhost:8000');

/*Socket logic for client joining a user room.*/
$(document).ready(function(){
    // editor.getSession().on('change', function(e) {
    // 	socket.emit("user_edit", {room: roomID});
    // });
	var username = "alex";
    load(socket, "workspace", username);
});