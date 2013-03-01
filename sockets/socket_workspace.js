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
    socket.emit("is_driver",{driver:true, admin: true, name: data.user});
  }
  else{
    var driverID = roomDrivers[data.room];
    socket.emit("is_driver",{driver:false, admin:false, name: roomUsers[data.room][driverID]});
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
exports.menuClicked = function(socket, data, roomDrivers, roomUsers, roomAdmins){

  var room = data.room;
    //just some sanity checks to make sure the user is who we think they are
  if (room && roomAdmins[room] && roomAdmins[room] == socket.id 
    && roomUsers[room] && socket.id in roomUsers[room] 
    && roomUsers[room][socket.id] == data.user
    && socket.store && socket.store.data 
    && socket.store.data.nickname == data.user){
    
    var username = md5h(data.user);
    var relPath = unescape(data.relPath);

    var directory = process.cwd() + "/users"; 

    var path = directory + "/" + username + relPath;
    var pathReg1 = /.*\.\..*/;
    var pathReg2 = /(.*\/.*)/;
    var pathReg3 = /^([a-zA-Z0-9_ .]|-)+$/;
    if (pathReg1.exec(relPath) || pathReg2.exec(data.name) || !pathReg3.exec(data.name)){
      sendErrorCM(socket, data, "Name should avoid special characters.");
      return;
    }
    if (!pathExists(path)){
      sendErrorCM(socket,data, "User folder does not exist.");
      return;
    }
    console.log("Context menu action " + data.key + " at \n" + path + (data.name? data.name : ""));
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
