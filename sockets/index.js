/*
 * Client connect and post connect event handlers:
 */

var roomDrivers = {};
var random = require('./random_workspace'),
    user = require('./user_workspace');
exports.communicate = function(io){

	io.sockets.on('connection', function (socket) {

		console.log("Client connect.");

		socket.on('test', function (data) {
    		console.log(data);
  		});

  	socket.on('join_random_room', function(data) {
  			random.join(socket, data);
  		});
      //Handles a socket disconnecting. This will do garbage collection
      //if the socket disconnecting is the only socket in the room.
      socket.on("disconnect", function(){
        user.disconnect(socket, roomDrivers);
      });

      //socket handler for users requesting to join a room
      socket.on('join_user_room', function(data) {
          user.join(socket, data, roomDrivers);
      });
	});
};