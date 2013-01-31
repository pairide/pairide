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
        var nick = socket.store.data["nickname"];
        var room = socket.store.data["room"];
        if (roomDrivers[room] == nick){
          delete roomDrivers[room];
          console.log(io.sockets);
        }

      });

      //socket handler for users requesting to join a room
      socket.on('join_user_room', function(data) {
          //would be nice to put the code below into user.join
          //and just do user.join(socket, data);
          var roomExistsBefore = "/" + data.room in socket.manager.rooms; 
          console.log('client request to join user room ' + data.room);
          socket.join(data.room);
          var roomExistsAfter = "/" + data.room in socket.manager.rooms
          socket.set("nickname", data.user);
          socket.set("room", data.room);
          //check if the room was newly created
          if (!roomExistsBefore && roomExistsAfter){
            roomDrivers[data.room] = data.user;
            console.log("New room created by " + data.user + ": " + data.room);
          }
          console.log(roomDrivers);  
      });
	});
};