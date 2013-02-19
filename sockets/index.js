/*
 * Client connect and post connect event handlers:
 */
var roomDrivers = {};
//Contains users of each room and their socket id mappings to their username
//To get a username roomUsers[roomname][socket id]
var roomUsers = {}; 
//The initial users who created the room.
var roomAdmins = {};

var workspace =  require('./socket_workspace');

exports.communicate = function(io){

	io.sockets.on('connection', function (socket) {

		  console.log("Client connect.");

      //Handles a socket disconnecting.
      socket.on("disconnect", function(){
        console.log("disconnect detected");
        workspace.disconnect(io, socket, roomDrivers, roomUsers, roomAdmins);
      });

      //Handle request to get members in a room
      socket.on("get_users", function(data){
        room_users = roomUsers[data.room];
        workspace.get_users(socket, data, room_users);
      });

      //socket handler for users requesting to join a room
      socket.on('join_room', function(data) {
          workspace.join(socket, data, roomDrivers, roomUsers, roomAdmins);
          io.sockets.in(socket.store.data.room).emit('new_user', data);
      });

      socket.on("context_menu_dir_clicked", function(data){
        workspace.menuClicked(socket, data, roomDrivers, roomUsers, roomAdmins);
      });

      //relay the message that the editor has changed
      socket.on("editor_changed", function(data){
          var room = socket.store.data.room;
          if (roomDrivers[room] == socket.id){
            io.sockets.in(socket.store.data.room).emit('editor_update', data);
            console.log ("Change to the editor in room " + room + ": " + data.text);
          }
      });

      //Emit new message to all members in the room
      socket.on('send_message', function(data){
        io.sockets.in(socket.store.data.room).emit('new_message', data);
      });

      socket.on("post_selection", function(data){
        io.sockets.in(socket.store.data.room).emit('get_selection', data);
        //console.log("SELECTION-> " + data.user);
      });

      socket.on("post_annotation", function(data){
        //console.log("ANNOT: " + data);
        //console.log(roomDrivers[socket.store.data.room]);
        //console.log(roomUsers[socket.store.data.room][]);
        var driverID = roomDrivers[socket.store.data.room];
        data["driver"] = roomUsers[socket.store.data.room][driverID];
        io.sockets.in(socket.store.data.room).emit('get_annotation', data);
  	  });

      //Handle switch request made by potential driver
      socket.on("switch_request", function(data){
        console.log("switch request performed by " + socket.store.data.nickname + " in room " + socket.store.data.room);
        workspace.make_switch(io, socket, data, roomDrivers, roomUsers);
      });

      socket.on("post_remove_annotation", function(data){
        console.log("Remove Annotation: " + data.target)
        io.sockets.in(socket.store.data.room).emit("get_remove_annotation", data);
      });
  });
};