roomsCreated = new Array();
exports.roomsCreated = roomsCreated;
var spawn = require('child_process').spawn;
var roomAdmins = require('../sockets/index.js').roomAdmins;
var roomUsers = require('../sockets/index.js').roomUsers;
var md5h = require('MD5');
var fs = require('fs');

/* 
 * Create a session/room and redirect the
 * client to it.
 */
exports.create = function(req, res){
  var roomAdmins = require('../sockets/index.js').roomAdmins;
  if(req.session.user_id && req.body.room_name){
    // User is logged in and wants to create a custom room.
    // Make sure that room's name is valid and doesn't already exist
    var validationRegex = /[a-zA-Z0-9_ ]+/;
    var regexResult = validationRegex.exec(req.body.room_name);

    //The roomname will be appended to a URL so replace
    //spaces with underscores.
    var escapedRoomName = req.body.room_name.replace(/ /g,"_");
    var roomExists = escapedRoomName in roomAdmins;
    res.send({
      result:!roomExists,
      room:escapedRoomName,
      valid: regexResult
    });

    if (!roomExists){
      roomsCreated.push(escapedRoomName);
    }
  }else{
    //User may or may not be logged in.
    //Create an express session.
    var md5h = require('MD5');
    hash = md5h(new Date().getTime());
    roomsCreated.push(hash);
    res.redirect('/express/' + hash);
  }
};

/* Make client join specific session*/
exports.express_join = function(req, res){
  res.render('workspace', {title: 'Express Workspace', current: "None", workspace: false});
};

/*Handle download requests*/
exports.download = function(req, res) {

    var admin_id = roomAdmins[req.body.room];
    var admin = admin_id? roomUsers[req.body.room][admin_id] : null;
    if(admin){
      //determine root directory to fetch file from
      var admin_hash = md5h(admin);
      var directory = "users";
      var path = unescape(directory + "/" + admin_hash);

      // Options -r recursive -j ignore directory info - redirect to stdout
      process.chdir(path);
      var stats = fs.statSync(req.body.path.slice(1));
      if(stats.isFile()){
        var file = fs.readFileSync(req.body.path.slice(1));
        res.setHeader("Content-Disposition", "attachment");
        res.setHeader("filename", req.file);
        res.setHeader("Content-Type", "text/plain");
        res.write(file.toString());
        res.end();
      }else{
        // Options -r recursive -j ignore directory info - redirect to stdout
        var zip = spawn('zip', ['-r', '-', req.body.path.slice(1)]);
        console.log(req.body);

        res.contentType('zip');

        // Keep writing stdout to res
        zip.stdout.on('data', function (data) {
          res.write(data);
        });

        // End the response on zip exit
        zip.on('exit', function (code) {
          if(code !== 0) {
            res.statusCode = 500;
            console.log('zip process exited with code ' + code);
            res.end();
          } else {
            res.end();
          }
        });
      }
      //get back to original directory
      process.chdir('../../');
  }else{
    res.statusCode = 500;
    console.log('download request error: admin not found;');
    res.end();
  }
};
