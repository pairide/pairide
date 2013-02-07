//Handles the event of a user joinging a room. This will create
//a room if needed.
exports.join = function(socket, data, roomDrivers, roomUsers){
  var roomExistsBefore = "/" + data.room in socket.manager.rooms; 
  console.log('client request to join user room ' + data.room);
  socket.join(data.room);
  var roomExistsAfter = "/" + data.room in socket.manager.rooms
  socket.set("nickname", data.user);
  socket.set("room", data.room);

    //check if the room was newly created
  if (!roomExistsBefore && roomExistsAfter){
    roomDrivers[data.room] = socket.id;
    roomUsers[data.room] = {};
    console.log("New room created by " + data.user + ": " + data.room);
    socket.emit("is_driver",{driver:true});
  }
  else{
    socket.emit("is_driver",{driver:false});
  }
  roomUsers[data.room][socket.id] = data.user;
  console.log(roomUsers);
}

//Handles a socket disconnecting. This will do garbage collection
//if the socket disconnecting is the only socket in the room.
exports.disconnect = function(socket, roomDrivers, roomUsers){
    var room = socket.store.data["room"];

    //garbage collect the user mappings for each room
    if (roomUsers[room] && socket.id in roomUsers[room]){
        console.log("deleting user from room "+ room +"..." 
          + roomUsers[room][socket.id]);
        delete roomUsers[room][socket.id];
    }

    //check if driver is leaving room
    //NOTE: this is deletes the room at the moment irregardless of navigators
    if (roomDrivers[room] && roomDrivers[room] == socket.id){

      console.log("deleting room..." + room);
      delete roomDrivers[room];
      delete roomUsers[room];
    }
    console.log("Known drivers: ");
    console.log(roomDrivers);
    console.log("Known rooms & users: ");
    console.log(roomUsers);
}