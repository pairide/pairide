/*Socket handling for express sessions */

var sock = require(./sock.js)
var socket = sock.connect();

/*Socket logic for client*/
$(document).ready(function(){
	roomID = sock.roomID('express');
	socket.emit('join_random_room', { room: roomID });
});