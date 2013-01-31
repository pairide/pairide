/*Socket handling for express sessions */
var socket = connect();

/*Socket logic for client*/
$(document).ready(function(){
	roomID = roomID('express');
	socket.emit('join_random_room', { room: roomID });
});