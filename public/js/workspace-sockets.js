var socket = io.connect('http://localhost:8000');

/*Socket logic for client joining a user room.*/
$(document).ready(function(){
    editor.getSession().on('change', function(e) {
    	socket.emit("user_edit", {room: roomID});
    });
    load(socket);
	var matchRoomRequest = /.*\/workspace\/(.{3,})/;
	var roomID = matchRoomRequest.exec(document.URL)[1];
	//notify the server that the user wishes to join the room
	socket.emit('join_user_room', { room: roomID, user:"alex"});
});