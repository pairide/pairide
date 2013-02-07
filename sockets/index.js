/*
 * Client connect and post connect event handlers:
 */
var roomDrivers = {};
//Contains users of each room and their socket id mappings to their username
//To get a username roomUsers[roomname][socket id]
var roomUsers = {}; 
var workspace =  require('./socket_workspace');
exports.communicate = function(io){

	io.sockets.on('connection', function (socket) {

		  console.log("Client connect.");

      //Handles a socket disconnecting.
      socket.on("disconnect", function(){
        console.log("disconnect detected");
        workspace.disconnect(socket, roomDrivers, roomUsers);
      });

      //Handle request to get members in a room
      socket.on("get_users", function(data){
        workspace.get_users(socket, data, roomUsers);
      });

      //socket handler for users requesting to join a room
      socket.on('join_room', function(data) {
          workspace.join(socket, data, roomDrivers, roomUsers);
          io.sockets.in(socket.store.data.room).emit('new_user', data);
      });
      //relay the message that the editor changed
      socket.on("editor_changed", function(data){
          var room = socket.store.data.room;
          if (roomDrivers[room] == socket.id){
            io.sockets.in(socket.store.data.room).emit('editor_update', data);
            console.log ("Incoming changes to the editor: " + data.text);
          }
      });

      socket.on('send_message', function(data){
        io.sockets.in(socket.store.data.room).emit('new_message', data);
      });
	});
};