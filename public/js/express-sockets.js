var socket = io.connect('http://localhost:8000');

/*Socket logic for client*/
$(document).ready(function(){
	var matchRoomRequest = /.*\/workspace\/(.{32})/;
	var roomID = matchRoomRequest.exec(document.URL)[1];

	//Express session
	socket.emit('join_random_room', { room: roomID });
});