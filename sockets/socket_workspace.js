var fs = require('fs'),
md5h = require('MD5');


//Handles the event of a user joining a room. This will create
//a room if needed.
exports.join = function(socket, data, roomDrivers, roomUsers, 
  roomAdmins, roomFile, roomSockets){

  var roomExistsBefore = "/" + data.room in socket.manager.rooms; 
  console.log('client ' + data.user 
    + " (with socket id " + socket.id + ') requested to join user room ' 
    + data.room + "\n");

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
    console.log(socket.id);
    roomSockets[data.room][socket.id] = socket;

    console.log("New room created by " + data.user + ": " + data.room + "\n");
    socket.emit("is_driver",{driver:true, admin: true, name: data.user});
  }
  else{
    var driverID = roomDrivers[data.room];
    roomSockets[data.room][socket.id] = socket;
    socket.emit("is_driver", {
      driver:false, 
      admin:false, 
      name: roomUsers[data.room][driverID]
    });
      var driverID = roomDrivers[data.room];
      socket.emit("set_filebrowser_desync", {});
      roomSockets[data.room][driverID].emit("get_driver_filetree_expansion", {});
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

//When a user joins an already existing user workspace; the file browser
//may have one or more directories expanded. This function syncs the new users
//file browser with the driver.
exports.updateFileTree = function(socket, data, roomDrivers, roomUsers, io){
  var user = data.user;
  var room = data.room;
  if (validateDriver(socket, room, user, roomDrivers, roomUsers)){
    io.sockets.in(room).emit("update_file_expansions", {expansions:data.expansions});
  }
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
  console.log("User " + user + " requesting to load file in room " + room + "\n");
  if (validateDriver(socket, room, user, roomDrivers, roomUsers)){
    if (!validatePath(data.fileName, "")){
      //path has probably been manipulated on client side
      console.log("[Attack] Path attack: " + data.fileName 
        + " by " + user + " in room " + room + "\n");
      return;
    }

    var directory = process.cwd() + "/users"; 
    var adminID = roomAdmins[room];
    username = md5h(roomUsers[room][adminID]);
    var path = unescape(directory + "/" + username + data.fileName);
    if (!pathExists(path)){
      console.log("[Error] Can't find file to load: " + path);
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

exports.requestWorkspace = function(socket, data, roomDrivers, roomUsers, io){
  var room = data.room;
  var username = data.user;
  if (validateDriver(socket, room, username, roomDrivers, roomUsers)){
      io.sockets.in(room).emit("request_workspace", { });
  }
}

exports.sendMessage = function(socket, data, roomDrivers, roomUsers, io){
  var room = data.room;
  var username = data.user;
  if (validateDriver(socket, room, username, roomDrivers, roomUsers)){
        io.sockets.in(room).emit('new_message', data);
  }
  else{
    console.log("[Error] User attempting to send chat messages to other rooms");
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
            console.log("[Error] Failed to save file: " + path + "\n");
          }
          else{
            console.log("File saved: " + path + "\n");
          }
        }); 
      }
      else{
        socket.emit("save_response", {errmsg:"File does not exist."});
        console.log("[Error] File being saved does not exist with path " + path + "\n");
      }
    });
  }
}
//Loads a file to a room.
function loadFile(socket, path, room, roomFile, fileName){

  if (roomFile[room]){
      console.log("New File loaded -> " + path + " (was  " 
          + roomFile[room] + ") in room " + room + "\n")
  }
  else{
      console.log("New File loaded -> " + path + " in room " + room + "\n") 
  }

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
            console.log("[Error] Error reading file during a load (for room " 
              + room + "); with path  " +  path + "\n");
          }
        });
      }else{
        console.log("[Error] File to load does not exist (for room " 
          + room + "); with path " + path + "\n");
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

    console.log("Context menu action " + data.key + " at " + path + "\n");

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
                sendErrorCM(socket,data, err.errno + " " + err.code);
              } else {
                saveFile(socket, roomFile[room], data.text);
                loadFile(path + data.name, room, roomFile, io, data.name);
                sendSuccessCM(socket, data, room, io);
              }
            }); 
          }
        });
        break;
      case 'upload':
        //upload file to directory
        break;
      case 'rename':
        fs.exists(path, function(exists){
          if (!exists){
              sendErrorCM(socket,data, "The file you are trying to rename does not exist.");
          }
          else{
            var oldPath = path;
            var newPath = getNewPath(oldPath, data.name);
            fs.rename(oldPath, newPath, function(err) {
              if(err) {
                console.log("[Error] Failed to rename file from " + oldPath 
                  + " to " + newPath + "; with error " + err.errno + " " 
                  + err.code + "\n");
                sendErrorCM(socket,data, err.errno + " " + err.code);
              } else {
                console.log("File renamed from " + oldPath + " to " 
                  + newPath + " by " + data.user + " (in room " + room + ")\n")
                if (roomFile[room] == oldPath){
                  roomFile[room] = newPath;
                  io.sockets.in(room).emit('file_renamed', data.name);
                }
                sendSuccessCM(socket, data, room, io);
              }
            }); 
          }
        });
        break;
      case 'delete':
        //delete entire directory or file
        try{
            fs.removeRecursive(path,function(err,status){
              if (err){
                console.log("[Error] Failed to delete " + path + " by " + data.user
                  + " (in room " + room + ")\n");
                sendErrorCM(socket, data, "Failed to delete.");
              }
              else{
                console.log("Deleted " + path + " by " + data.user
                  + " (in room " + room + ")\n");
                sendSuccessCM(socket, data, room, io);
              }
            }, room, roomFile, io);
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
            console.log("Folder created by " + data.user 
              + " (in room " + room + ") at path " + path + "\n")
            sendSuccessCM(socket, data, room, io);
          }
        });
        break;
    }
  }else{
    //validation for driver failed
    sendErrorCM(socket,data, "You don't have privelege to do that; "
      +" you must be the current driver or admin.");
  }
}

/*
 * Replaces a path to a file with the same path to a new file.
 */
function getNewPath(oldPath, newName){
  var i = oldPath.lastIndexOf("/");
  if (i !== -1){
    return oldPath.substr(0, i + 1) + newName;
  } 
  else{
    return newName;
  }
}

exports.fileClick = function(socket, data, roomDrivers, roomUsers, io){
  var room = data.room;
  var user = data.user;
  if (validateDriver(socket, room, user, roomDrivers, roomUsers)){
    io.sockets.in(room).emit("file_clicked", {
      activePath: data.filePath
    });
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
function sendSuccessCM(socket, data, room, io){
  socket.emit("context_menu_click_result", {key:data.key, result:true});

  if (data.key == "delete"){
    io.sockets.in(room).emit("refresh_files", 
      {
        key:data.key, 
        activePath: data.activePath,
        deleteDir: data.deleteDir
      });
  }
  else{
      io.sockets.in(room).emit("refresh_files", 
      {
        key:data.key, 
        activePath: data.activePath
      });
  }
  
}

/*
 * Return true if string ends with a specific suffix.
 */
function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

/*
 * Recursively deletes a directory but also works for a single file. 
 * This is very powerful, and the path should be validated extensively
 * before executing it.
 */
fs.removeRecursive = function(path,cb, room, roomFile, io){
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
            console.log("Deleting file...." + path);
            if (path == roomFile[room]){
                roomFile[room] = null;
                io.sockets.in(room).emit("lock_editor", {
                  lock: true,
                });
            }
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

                var filePath;

                if (endsWith(path, '/')){
                  filePath = path + files[i];
                }
                else{
                  filePath = path + '/' + files[i];
                }
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
                }, room, roomFile, io);
    
              })()
            }
          }
        });
      }
    });
};
