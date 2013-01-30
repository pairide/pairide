exports.join = function(socket, data){

	console.log('client requested to join random room ' + data.room);
	socket.join(data.room);
}