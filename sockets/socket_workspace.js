var fs = require('fs'),
md5h = require('MD5');

//Handles the event of a user joining a room. This will create
//a room if needed.
exports.join = function(socket, data, roomDrivers, roomUsers, roomAdmins){

  var roomExistsBefore = "/" + data.room in socket.manager.rooms; 
  console.log('client request to join user room ' + data.room);
  socket.join(data.room);
  var roomExistsAfter = "/" + data.room in socket.manager.rooms
  socket.set("nickname", data.user);
  socket.set("room", data.room);

    //check if the room was newly created
  if (!roomExistsBefore && roomExistsAfter){
    roomDrivers[data.room] = socket.id;
    roomAdmins[data.room] = socket.id;
    roomUsers[data.room] = {};
    console.log("New room created by " + data.user + ": " + data.room);
    socket.emit("is_driver",{driver:true, admin: true});
  }
  else{
    socket.emit("is_driver",{driver:false, admin:false});
  }
  roomUsers[data.room][socket.id] = data.user;
  console.log(roomUsers);
}

//Handles a socket disconnecting. This will do garbage collection
//if the socket disconnecting is the only socket in the room.
exports.disconnect = function(io, socket, roomDrivers, roomUsers, roomAdmins){
    var room = socket.store.data["room"];
    //garbage collect the user mappings for each room
    if (roomUsers[room] && socket.id in roomUsers[room]){
        console.log("deleting user from room "+ room +"..." 
          + roomUsers[room][socket.id]);
        delete roomUsers[room][socket.id];
    }

    //check if admin is leaving room
    if (roomAdmins[room] && roomAdmins[room] == socket.id){

      console.log("deleting room..." + room);
      //TODO notify others?
      delete roomDrivers[room];
      delete roomAdmins[room];
      delete roomUsers[room];
    }
    else if (roomDrivers[room] && roomDrivers[room] == socket.id){
      //current driver left; default driver to the admin
      roomDrivers[room] = roomAdmins[room];

      //TODO notify admin he has become the driver
    }
    console.log("Known drivers: ");
    console.log(roomDrivers);
    console.log("Known rooms & users: ");
    console.log(roomUsers);
    console.log("room Admins");
    console.log(roomAdmins);

    //Notify other room members that user left
    io.sockets.in(room).emit('user_disconnect', {username: socket.store.data["nickname"]});
}

exports.get_users = function(socket, data, roomUsers){
	var users = new Array();

	for(user_id in roomUsers[data.room]){
		users.push(roomUsers[data.room][user_id]);
	}

	socket.emit('send_users', {usernames: users});
}
/*
 * Return true iff the directory path exists.
 */
function pathExists(path){
  try{
    fs.lstatSync(path);
    return true;
  }
  catch (e) {
    console.log(e);
    return false;
  }
}

/*
 * Handles all the options of the context menu for directories and 
 * projects.
 */
exports.menuDirectoryClicked = function(socket, data, roomDrivers, roomUsers, roomAdmins){

  var room = data.room;
    //just some sanity checks to make sure the user is who we think they are
  if (room && roomAdmins[room] && roomAdmins[room] == socket.id 
    && roomUsers[room] && socket.id in roomUsers[room] 
    && roomUsers[room][socket.id] == data.user
    && socket.store && socket.store.data 
    && socket.store.data.nickname == data.user){
    
    console.log(data.key + " " + data.relPath);
    var username = md5h(data.user);
    var relPath = unescape(data.relPath);
    var directory = process.cwd() + "/users"; 
    var path = directory + "/" + username + relPath;
    console.log(path);
    switch(data.key){
      //cases correspond to each menu option
      case 'file':
        console.log("file");
        break;
      case 'upload':
        //upload file to directory
        break;
      case 'delete':
        //delete entire directory
        break;
      case 'directory':
        //create new directory
        fs.mkdir(path + data.name); //use real input from data.dirname
        socket.emit("context_menu_click_result", {key:data.key, result:true});
        break;
    }
  }
}