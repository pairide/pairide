/*
 * Client connect and post connect event handlers:
 */

var roomDrivers = {};
var workspace =  require('./socket_workspace');
exports.communicate = function(io){

	io.sockets.on('connection', function (socket) {

		  console.log("Client connect.");

      //Handles a socket disconnecting. This will do garbage collection
      //if the socket disconnecting is the only socket in the room.
      socket.on("disconnect", function(){
        workspace.disconnect(socket, roomDrivers);
      });

      //socket handler for users requesting to join a room
      socket.on('join_room', function(data) {
          workspace.join(socket, data, roomDrivers);
      });

      socket.on("editor_changed", function(data){
      });
	});
};