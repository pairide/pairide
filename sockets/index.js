/*
 * Client connect and post connect event handlers:
 */
var random = require('./random_workspace');
 
exports.communicate = function(io){

	io.sockets.on('connection', function (socket) {

		console.log("Client connect.");

		socket.on('test', function (data) {
    		console.log(data);
  		});

  		socket.on('join_random_room', function(data) {
  			random.join(socket, data);
  		});
  		
	});

};