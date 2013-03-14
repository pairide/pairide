var fs = require('fs'),
md5h = require('MD5'),
Recaptcha = require('recaptcha').Recaptcha,
roomUsers = require('../sockets/index.js').roomUsers,
roomAdmins = require('../sockets/index.js').roomAdmins;

var config = require('../config');

/*
 * GET home page.
 */
exports.index = function(req, res){

  var show_modal = false;
  if(req.query.l == '1'){
    show_modal = true;
  }
  
  res.render('index', { title: 'Home', current : 'Home', show_modal: show_modal });
};

/*
 * Route the user and render the about page.
 */
exports.about = function(req, res){
  res.render('about', { title: 'About', current : 'About' });
};

/*
 * Route the user and render the about page.
 */
exports.faq = function(req, res){
  res.render('faq', { title: 'FAQ', current : 'FAQ' });
};

/*
 * Route the user and render the Contact page.
 */
exports.contact = function(req, res){
  var recaptcha = new Recaptcha(config.PUBLIC_KEY, config.PRIVATE_KEY);

  res.locals.captcha = recaptcha.toHTML();
  res.locals.formError = false;

  if(req.query.e){
    res.locals.formError = req.query.e;
  }

  res.render('contact', { title: 'Contact', current : 'Contact' });
};

exports.forgot_password = function(req, res){

  var recaptcha = new Recaptcha(config.PUBLIC_KEY, config.PRIVATE_KEY);

  res.locals.captcha = recaptcha.toHTML();
  res.locals.formError = false;

  if(req.query.e){
    res.locals.formError = req.query.e;
  }

  res.render('forgot_password', {title: "Forgot Password", current: false});
};

exports.processContact = function(req, res){
  var data = {
        remoteip:  req.connection.remoteAddress,
        challenge: req.body.recaptcha_challenge_field,
        response:  req.body.recaptcha_response_field
  };

  if(!req.body.bugReportBox || !req.body.bugReportEmail){
    res.redirect('/contact?e=1');
  }

  var recaptcha = new Recaptcha(config.PUBLIC_KEY, config.PRIVATE_KEY, data);

  recaptcha.verify(function(success, error_code) {

        if (success) {
          var mailer = require('../email.js');
          var config = require('../config.js');
          var mailOptions = {
                      from: req.body.bugReportEmail,
                      to: config.email_from_address,
                      subject: "Contact Form",
                      text: req.body.bugReportBox + " <-----> " + req.body.bugReportEmail,
                      html: req.body.bugReportBox + "<br/><br/><br/>" + req.body.bugReportEmail
                  };
                  
          mailer.transport.sendMail(mailOptions, function(error, response){
                    
                    if(error){
                      console.log(error);
                    }

                    // Redirect and show user a success message.
                    var successMessage = "Thank you for contacting us. We'll be in touch if need be."
                    res.render('notify', {current: false, title: 'Contact - Message Sent', type: "success", notification: successMessage});
          });
        } else {
          res.redirect('/contact?e=2');
        }

    });
}

/*
 * Route the user and render the registration page.
 */
exports.register = function(req, res){
	res.render('register', { title: 'Register', current : "None", error : false, errorSet: false});
};

/*
 * Route the user and render the terms of service page.
 */
exports.tos = function(req, res){
	res.render('tos', { title: 'Terms of Service', current : "None"});
};

/*
 * Route the user and render the workspace.
 */
exports.workspace = function(req, res){
	res.render('workspace', {title: 'Workspace', current: "None", workspace: true});
};

/*
 * Route the user to it's profile page if he is logged in.
 */
exports.profile = function(req, res){
  res.render('layout', {title: 'Profile', current: "None"});  
}

/*
 * Creates a new project in the users workspace folder.
 */
exports.createProject = function(req, res){
  //the directory path for all user files
  var directory = process.cwd() + "/users"; 

  //the name of the user requesting files
  var username; 
  if (req.session && req.session.user_id){
    username = md5h(req.session.user_id);
  }
  else{
      res.send({result:false, error:"You must be logged in to do that."});
      return;
  }

  var sanityReg = /^[a-zA-Z0-9_ -]+$/;
  //check for potential path traversal attacks
  if (!sanityReg.exec(req.body.name)){
    res.send(
      {
        result:false, 
        error:"Project name must not contain any special characters."
      });
    return;
  }
  var path = directory + "/" + username + "/" + req.body.name;
  try {
    //raises an error if the project does not exist
    stats = fs.lstatSync(path);
    res.send({result:false, error:"A project with that name already exists."});
  }catch (e) {
    //create the directory for the project
    var mode = 0755;
    fs.mkdir(path, mode, function(err){
      if (err){
        res.send({result:false});
      }
      else{
        res.send({result:true});
      }
    });
  }
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
    return false;
  }
}

/*
 * Handle the ajax POST request for the file browser. A request is given
 * everytime a user loads the workspace or when they click to open a directory.
 * The directory of files is fetched and rendered into html.
 */
exports.fileConnector = function(req, res){
  //the directory path for all user files
  var directory = process.cwd() + "/users"; 
  //the name of the user requesting files
  var username; 
  var stats
  //the true path to the files being requested
  var path; 
  //the relative path from the users folder
  var relPath

  var room = req.body.room;
  var sockID = req.body.sID;

  if (room && sockID 
    && roomUsers[room] && roomAdmins[room] 
    && sockID in roomUsers[room]){
    var adminID = roomAdmins[room];
    username = md5h(roomUsers[room][adminID]);
    relPath = unescape(req.body.dir);
    path = directory + "/" + username + relPath;
    if (!pathExists(directory + "/" + username)){
      //create their user directory if it does not exist
      fs.mkdir(directory + "/" + username);
    }
  }
  else{
    console.log("User requested files associated with another room.");
    return;
  }
  console.log("Files requested at: " + path);
  try {
    //raises an error if the path does not exist
    stats = fs.lstatSync(path);
    if (stats.isDirectory()) {
        fs.readdir(path, function (err, files) {
          if (err) {
            console.log(err);
            return;
          }
          //html for start of the file list
          var html = "<ul style=\"display: none;\" class=\"jqueryFileTree\">";
          for (var i=0; i < files.length; i++){
            try{
              var fileName = unescape(files[i]);
              var filePath = path + fileName;
              var fileStats = fs.lstatSync(filePath);
             
              //check if file is a nested directory
              if (fileStats.isDirectory()){
                html +=  "<li class=\"directory collapsed context-menu-one\"><a ftype=\"directory\" href=\"#\" rel=\"" 
                + relPath + fileName + "/\">" + fileName + "</a></li>";
              }
              else if (fileStats.isFile()){
                var re = /(?:\.([^.]+))?$/; //regex for a file ext
                var ext = re.exec(fileName)[1];
                //add html tag for a file
                html += "<li class=\"file ext_" + ext + "\"><a ftype=\"file\" href=\"#\" rel=\"" 
                + relPath + fileName + "\">" + fileName + "</a></li>";
              }
            }catch(e){
              console.log(e);
            }
          }
        html += "</ul>"; //end file list
        res.send(html);
      });
    }
  }
  catch (e) {
    console.log("File directory for user does not exist. This should not happen.");
  }
}
