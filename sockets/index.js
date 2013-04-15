/*
 * This script sets up all socket connect and post connect 
 * event listeners. 
 */

// Contains the drivers socket id for each room. 
// E.g roomDrivers[roomname] -> drivers socket id.
var roomDrivers = {};
// Contains users of each room and their socket id mappings to their 
// username. To get a username roomUsers[roomname][socket id].
var roomUsers = {}; 
// The initial users who created the room.
// Maps room name to the socket id of the admin.
var roomAdmins = {};
// Maps room name to the file that room is working on. File is 
// stored as an absolute path.
var roomFile = {};
// Maintains a mapping of socket id to socket object.
// roomSockets[room][id] -> socket object
var roomSockets = {};

var workspace =  require('./socket_workspace');

// Make the user and admin models public to other server files.
exports.roomAdmins = roomAdmins;
exports.roomUsers = roomUsers;

/**
 * Defines all event handlers between server and client socket 
 * communication, including connect and disconnect.
 */
exports.communicate = function(io){

  // Listens for when a client makes a socket connection and
  // attaches many event handlers.
  io.sockets.on('connection', function (socket) {

    console.log("Client connect.");

    // Handles a socket disconnecting and performs any necessary garbage
    // collection on our models.
    socket.on("disconnect", function(){
      console.log("disconnect detected");
      workspace.disconnect(io, socket, roomDrivers, roomUsers,
      roomAdmins, roomFile, roomSockets);
    });

    // Handle request to get current members in a room.
    socket.on("get_users", function(data){
      room_users = roomUsers[data.room];
      workspace.get_users(socket, data, room_users);
    });

    // Socket handler for users requesting to join a room. This will populate
    // our models with the users relevant information.
    socket.on('join_room', function(data) {
      workspace.join(socket, data, roomDrivers, roomUsers, roomAdmins,
      roomFile, roomSockets);
    });

    // Handles when the client executes a context menu action such as
    // deleting or creating a file.
    socket.on("context_menu_clicked", function(data){
      workspace.menuClicked(socket, data, roomDrivers, roomUsers,
      roomAdmins, roomFile, io);
    });

    // Listens for when the driver has left-clicked a file in the file browser.
    // This is used to keep the navigators filetrees synchronized with the driver by
    // forcing the same click on their filetree.
    socket.on("driver_file_click", function(data){
      workspace.fileClick(socket, data, roomDrivers, roomUsers, io);
    });

    // Listens for when the driver sends their current file tree in the form
    // of a sequence of folder expansions. This is required when a new user
    // joins a room with a filetree that has some folders expanded already and
    // we want to synchronize the new users filetree.
    socket.on("send_driver_filetree_expansion", function(data){
      workspace.updateFileTree(socket, data, roomDrivers, roomUsers, io);
    });

    // Listens and relays the message that the editor has changed. This 
    // is used to synchronize all room members editor. The message is ussually
    // in the form of a delta.
    socket.on("editor_changed", function(data){
      var room = socket.store.data.room;
      if (roomDrivers[room] == socket.id){
        io.sockets.in(socket.store.data.room).emit('editor_update', data);
      }
    });

    // Listens and broadcasts a new chat message to all members in the room.
    socket.on('send_message', function(data){
      workspace.sendMessage(socket, data, roomUsers, io);
    });

    // Listen for a selection from any of the users in a room and emit
    // the selection to all users in the room.
    socket.on("post_selection", function(data){
      io.sockets.in(socket.store.data.room).emit('get_selection', data);
    });

    // Notifies the navigators of a room to unlock their editor 
    // (remove the overlay). This may occur when the driver selects a file 
    // when previously no file was selected.
    socket.on("unlock_navigators", function(data){
      workspace.unlockNavigators(socket, data, roomDrivers, roomUsers, io);
    });

    // On request from the driver, notifies all navigators to request 
    // a new filetree. This ussually occurs after the driver has 
    // created or removed an entire project.
    socket.on("send_request_workspace", function(data){
      workspace.requestWorkspace(socket, data, roomDrivers, roomUsers, io);
    });

    // Listen for a creation of annotation and send the annotation information
    // to all the clients in the room. Once this event is received by the clients
    // only then is an annotation applied.
    socket.on("post_annotation", function(data){
      var driverID = roomDrivers[socket.store.data.room];
      data["driver"] = roomUsers[socket.store.data.room][driverID];
      io.sockets.in(socket.store.data.room).emit('get_annotation', data);
    });

    // Handles when a switch request is made by driver.
    socket.on("switch_request", function(data){
      console.log("switch request performed by " + socket.store.data.nickname + " in room " + socket.store.data.room);
      workspace.make_switch(io, socket, data, roomDrivers, roomUsers);
    });

    // Notify users of an annotation being removed.
    socket.on("post_remove_annotation", function(data){
      io.sockets.in(socket.store.data.room).emit("get_remove_annotation", data);
    });

    // Request the driver for the current state of the editor. This event is used
    // when a new user joins and wants to synchronize his status with the driver.
    socket.on("post_acquire_current_state", function(){
      io.sockets.in(socket.store.data.room).emit("get_driver_state");
    });

    // Listen for the driver sending the current status and send it to all the users
    // in a room. This event would *only* be processed by clients who have recently
    // joined and haven't gotten their state synced.
    socket.on("post_driver_state", function(data){
      io.sockets.in(socket.store.data.room).emit("get_acquire_current_state", data)
    });

    // Handles when the driver selects a new file in the filetree and the rooms 
    // editor needs to reflect the new files contents. This involves saving
    // the previous file before loading the new file.
    socket.on('get_file', function(data){
      workspace.changeFile(socket, data, roomDrivers, roomUsers, roomAdmins, 
        roomFile);
    });

    // Handles when the driver wants to save the current file
    // (explicitly or through the auto-save feature).
    socket.on('save_file', function(data){
      workspace.handleSaveRequest(socket, data, roomDrivers, roomUsers,
       roomFile, roomSockets, io);
    });

    // Handles when the driver has changed the programming language being
    // used in the editor by notifying the navigators.
    socket.on("lang_change", function(data){
      io.sockets.in(socket.store.data.room).emit("driver_change_lang", data);
    });
  });
};