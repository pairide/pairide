var fs = require('fs'),
md5h = require('MD5');


//Handles the event of a user joining a room. This will create
//a room if needed.
exports.join = function(socket, data, roomDrivers, roomUsers, 
  roomAdmins, roomFile, roomSockets){

  var roomExistsBefore = "/" + data.room in socket.manager.rooms; 
  console.log('client request to join user room ' + data.room);
  socket.join(data.room);
  var roomExistsAfter = "/" + data.room in socket.manager.rooms
  socket.set("nickname", data.user);
  socket.set("room", data.room);

    //check if the room was newly created
  if ((!roomExistsBefore && roomExistsAfter) || !roomAdmins[data.room]){
    roomDrivers[data.room] = socket.id;
    roomAdmins[data.room] = socket.id;
    roomUsers[data.room] = {};
    roomFile[data.room] = null;
    roomSockets[data.room] = {};
    roomSockets[data.room][socket.id] = socket;
    console.log("New room created by " + data.user + ": " + data.room);
    socket.emit("is_driver",{driver:true, admin: true, name: data.user});
  }
  else{
    var driverID = roomDrivers[data.room];
    roomSockets[data.room] = socket;
    socket.emit("is_driver", {
      driver:false, 
      admin:false, 
      name: roomUsers[data.room][driverID]
    });
  }
  roomUsers[data.room][socket.id] = data.user;
  socket.emit("socket_connected", {});
}

//Handles a socket disconnecting. This will do garbage collection
//if the socket disconnecting is the only socket in the room.
exports.disconnect = function(io, socket, roomDrivers, roomUsers, roomAdmins, 
  roomFile, roomSockets){
    var room = socket.store.data["room"];
    //garbage collect the user mappings for each room
    if (roomUsers[room] && socket.id in roomUsers[room]){
        console.log("deleting user from room "+ room +"..." 
          + roomUsers[room][socket.id]);
        delete roomUsers[room][socket.id];
    }

    if (roomSockets[room] && roomSockets[room][socket.id]){
      delete roomSockets[room][socket.id];
    }

    //check if admin is leaving room
    if (roomAdmins[room] && roomAdmins[room] == socket.id){

      console.log("deleting room..." + room);
      delete roomDrivers[room];
      delete roomAdmins[room];
      delete roomUsers[room];
      delete roomFile[room];
      delete roomSockets[room];
      //notify everyone that room doesn't exist anymore
      io.sockets.in(room).emit('admin_disconnect', {});

      //remove room from the roomsCreated list
      var rooms = require('../routes/room.js').roomsCreated;
      var index = rooms.indexOf(room);
      rooms.splice(index, 1);
    }
    else if (roomDrivers[room] && roomDrivers[room] == socket.id){
      //current driver left; default driver to the admin
      roomDrivers[room] = roomAdmins[room];
      //TODO notify admin he has become the driver
    }
    // console.log("Post disconnect data");
    // console.log("Known drivers: ");
    // console.log(roomDrivers);
    // console.log("Known rooms & users: ");
    // console.log(roomUsers);
    // console.log("room Admins");
    // console.log(roomAdmins);
    // console.log("room files");
    // console.log(roomFile);
    // console.log("room sockets");
    // console.log(roomSockets);

    //Notify other room members that user left
    io.sockets.in(room).emit('user_disconnect', 
      {username: socket.store.data["nickname"]});
}

exports.get_users = function(socket, data, room_users){
	var users = new Array();

	for(user_id in room_users){
		users.push(room_users[user_id]);
	}

	socket.emit('send_users', {usernames: users});
}
/*
 * Return true iff the directory path exists.
 */
function pathExists(path){
  path = unescape(path);
  try{
    fs.lstatSync(path);
    return true;
  }
  catch (e) {
    console.log(e);
    return false;
  }
}

//Handles a request to change file in the workspace
exports.changeFile = function(socket, data, roomDrivers, roomUsers, roomAdmins,
 roomFile){

  var room = data.room;
  var user = data.user;
  if (validateDriver(socket, room, user, roomDrivers, roomUsers)){
    if (!validatePath(data.fileName, "")){
      //path has probably been manipulated on client side
      console.log("Path attack: " + data.fileName);
      return;
    }

    var directory = process.cwd() + "/users"; 
    var adminID = roomAdmins[room];
    username = md5h(roomUsers[room][adminID]);
    var path = unescape(directory + "/" + username + data.fileName);
    console.log("check if path exists " + path);
    if (!pathExists(path)){
      console.log("Can't find file requested: " + path);
      return;
    }

    //no previous file had been selected
    if (roomFile[room] == null){
        loadFile(socket, path, room, roomFile, data.fileName);
    }
    //previous file must be saved before switching
    else if (roomFile[room] != path){
        saveFile(socket, roomFile[room], data.text);
        loadFile(socket, path, room, roomFile, data.fileName);
    }

  }
}
exports.handleSaveRequest = function(socket, data, roomDrivers, roomUsers,
 roomFile){
  var room = data.room;
  var user = data.user;
  if (validateDriver(socket, room, user, roomDrivers, roomUsers)
    && roomFile[room]){
      saveFile(socket, roomFile[room], data.text);
  }
}

//notifies the navigators to unlock their overlay
exports.unlockNavigators = function(socket, data, roomDrivers, roomUsers, io){
  var room = data.room;
  var username = data.user;
  if (validateDriver(socket, room, username, roomDrivers, roomUsers) 
    && data.fileName){
      io.sockets.in(room).emit("unlock_navigator", 
        { fileName: data.fileName });
  }
}
//Save content a file at the given path
function saveFile(socket, path, content){
  if (path){
    fs.exists(path, function(exists){
      if (exists){
        fs.writeFile(path, content, function(err) {
          socket.emit("save_response", {errmsg:err});
          if (err){
            console.log("Failed to save file: " + path);
          }
          else{
            console.log("File saved: " + path);
          }
        }); 
      }
      else{
        socket.emit("save_response", {errmsg:"File does not exist."});
        console.log("Could not find file to save: " + path);
      }
    });
  }
}
//Loads a file to a room.
function loadFile(socket, path, room, roomFile, fileName){
  roomFile[room] = path;
  fs.exists(path, function(exists){
      if (exists){
        fs.readFile(path, function(err, data) {
          if (!err){
            // io.sockets.in(room).emit("receive_file", 
            //   {
            //     text:unescape(data),
            //     fileName:fileName
            //   });
            socket.emit("receive_file", 
              {
                text:unescape(data),
                fileName:fileName
              });
          }
          else{
            console.log("Error reading file! This shouldn't happen.");
          }
        });
      }else{
        console.log("File to load does not exist: " + path);
      }
    }); 
}
//Validates a relative path for common path traversal attacks.
function validatePath(relativePath, fileName){

    relativePath = unescape(relativePath);
    fileName = unescape(fileName);

    var fullPath = relativePath + fileName;
    //Check for .. in relative path
    var pathReg1 = /.*\.\..*/; 
    //Check that the fileName doesn't contain / or \
    var pathReg2 = /(.*(\/|\\).*)/;
    //Further validation on the name mostly ensures characters are alphanumeric 
    var pathReg3 = /^([a-zA-Z0-9_ .]|-)*$/;

    return !(pathReg1.exec(relativePath) 
          || pathReg2.exec(fileName) 
          || !pathReg3.exec(fileName)
          || pathReg1.exec(fullPath));
}

//Validate if the user is a driver for the room.
function validateDriver(socket, room, username, roomDrivers, roomUsers){

   return validateUser(socket, room, username, roomUsers) 
          && roomDrivers[room] && roomDrivers[room] == socket.id;
}

//Validate if the user is an admin for the room.
function validateAdmin(socket, room, username, roomAdmins, roomUsers){
   return validateUser(socket, room, username, roomUsers) 
          && roomAdmins[room] && roomAdmins[room] == socket.id;
}

//Validate if the user is both an admin and the current driver.
function validateDrivingAdmin(socket, room, username, roomDrivers, 
  roomAdmins, roomUsers){

  return validateDriver(socket,room,username,roomDrivers,roomUsers)
      && validateAdmin(socket, room, username, roomAdmins, roomUsers);
}
//Validate if the user matches our socket information, 
//and room information. This will prevent spoofing a username
//on the client side.
function validateUser(socket, room, username, roomUsers){

   return (room 
    && roomUsers[room] && socket.id in roomUsers[room] 
    && roomUsers[room][socket.id] == username
    && socket.store && socket.store.data 
    && socket.store.data.nickname == username
    && socket.store.data.room == room);
}
/*
 * Handles all the options of the context menu for directories and 
 * projects.
 */
exports.menuClicked = function(socket, data, roomDrivers, 
  roomUsers, roomAdmins, roomFile, io){

  var room = data.room;
  if (validateDriver(socket, room, data.user, 
    roomDrivers, roomUsers)){

    var adminID = roomAdmins[room];
    var username = md5h(roomUsers[room][adminID]);
    var relPath = unescape(data.relPath);
    var directory = process.cwd() + "/users"; 
    var path = unescape(directory + "/" + username + relPath);

    console.log("Context menu action " + data.key 
      + " at \n" + path 
      + (data.name? data.name : ""));

    if (!validatePath(relPath, data.name)){
      sendErrorCM(socket, data, "Name should avoid special characters.");
      return;
    }
    if (!pathExists(path)){
      sendErrorCM(socket,data, "User folder does not exist.");
      return;
    }


    switch(data.key){
      //cases correspond to each menu option
      case 'file':
        fs.exists(path + data.name, function(exists){
          if (exists){
              sendErrorCM(socket,data, "This file already exists.");
          }
          else{
            fs.writeFile(path + data.name, "", function(err) {
              if(err) {
                sendErrorCM(socket,data,err);
              } else {
                saveFile(socket, roomFile[room], data.text);
                loadFile(path + data.name, room, roomFile, io, data.name);
                sendSuccessCM(socket, data);
              }
            }); 
          }
        });
        break;
      case 'upload':
        //upload file to directory
        break;
      case 'delete':
        //delete entire directory or file
        try{
            fs.removeRecursive(path,function(err,status){
              if (err){
                sendErrorCM(socket, data, "Failed to delete.");
              }
              else{
                sendSuccessCM(socket, data);
                if(data.lock){
                  roomFile[room] = null;
                  console.log("Delete request: lock: " +  data.lock);
                  io.sockets.in(socket.store.data.room).emit("lock_editor", {
                    lock: true,
                  });
                }
              }
            });
        }catch(ignore){
        }
        break;
      case 'directory':
        //create new directory
        var mode = 0755;
        fs.mkdir(path + data.name, mode, function(err){
          if (err) {
            sendErrorCM(socket,data, "Folder already exists, or has invalid name.");
          }
          else{
            sendSuccessCM(socket, data);
          }
        });
        break;
    }
  }
}

/*Handle the switch request made by socket*/
exports.make_switch = function(io, socket, data, roomDrivers, roomUsers){
  var old_driver = socket.store.data.nickname;
  var room = socket.store.data.room;

  //socket needs to be in driver mode
  //for switch to be legal
  if(roomDrivers[room] == socket.id){

    var room_users = roomUsers[room];
    var success = false;
    for(user_id in room_users){
      if(room_users[user_id] == data.switch_target){
          roomDrivers[room] = user_id;
          console.log("driver changed to: " + user_id);
          success = true;
      }
    }

    if(success){
        //tell all others that a switch happened
        io.sockets.in(room).emit('switch_success', 
        {new_driver: data.switch_target, new_nav: old_driver});
    }
    else{
        socket.emit('switch_failure', {});
    }
  }
  else{
    socket.emit('switch_failure', {});
  }
}

/*
 * Notify the socket that the context menu action failed.
 */
function sendErrorCM(socket, data, errorMsg){
  socket.emit("context_menu_click_result", 
    {
      key:data.key, 
      result:false, 
      error:errorMsg
    });
}
/*
 * Notify the socket that the context menu action succeeded.
 */
function sendSuccessCM(socket, data){
  socket.emit("context_menu_click_result", {key:data.key, result:true});
}
/*
 * Recursively deletes a directory but also works for a single file. 
 * This is very powerful, and the path should be validated extensively
 * before executing it.
 */
fs.removeRecursive = function(path,cb){
    var self = this;

    fs.stat(path, function(err, stats) {
      if(err){
        cb(err,stats);
        return;
      }
      if(stats.isFile()){
        fs.unlink(path, function(err) {
          if(err) {
            cb(err,null);
          }else{
            cb(null,true);
          }
          return;
        });
      }else if(stats.isDirectory()){
        // A folder may contain files
        // We need to delete the files first
        // When all are deleted we could delete the 
        // dir itself
        fs.readdir(path, function(err, files) {
          if(err){
            cb(err,null);
            return;
          }
          var f_length = files.length;
          var f_delete_index = 0;

          // Check and keep track of deleted files
          // Delete the folder itself when the files are deleted

          var checkStatus = function(){
            // We check the status
            // and count till we r done
            if(f_length===f_delete_index){
              fs.rmdir(path, function(err) {
                if(err){
                  cb(err,null);
                }else{ 
                  cb(null,true);
                }
              });
              return true;
            }
            return false;
          };
          if(!checkStatus()){
            for(var i=0;i<f_length;i++){
              // Create a local scope for filePath
              // Not really needed, but just good practice
              // (as strings arn't passed by reference)
              (function(){
                var filePath = path + '/' + files[i];
                // Add a named function as callback
                // just to enlighten debugging
                fs.removeRecursive(filePath,function removeRecursiveCB(err,status){
                  if(!err){
                    f_delete_index ++;
                    checkStatus();
                  }else{
                    cb(err,null);
                    return;
                  }
                });
    
              })()
            }
          }
        });
      }
    });
};
