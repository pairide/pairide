
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
  res.render('contact', { title: 'Contact', current : 'Contact' });
};

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
 * Handle the ajax POST request for the file browser. A request is given
 * everytime a user loads the workspace or when they click to open a directory.
 * The directory of files is fetched and rendered into html.
 */
exports.fileConnector = function(req, res){


  fs = require('fs');
  //the directory path for all user files
  var directory = process.cwd() + "/users"; 

  //the name of the user requesting files
  var username; 
  if (req.session && req.session.user_id){
    username = req.session.user_id;
  }
  else{
    return;
  }
  //the relative path from the users folder
  var relPath = unescape(req.body.dir);
  //the true path to the files being requested
  var path = directory + "/" + username + relPath;
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
                html +=  "<li class=\"directory collapsed\"><a href=\"#\" rel=\"" 
                + relPath + fileName + "/\">" + fileName + "</a></li>";
              }
              else if (fileStats.isFile()){
                var re = /(?:\.([^.]+))?$/; //regex for a file ext
                var ext = re.exec(fileName)[1];
                console.log(ext);
                //add html tag for a file
                html += "<li class=\"file ext_" + ext + "\"><a href=\"#\" rel=\"" 
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
    console.log("File directory does not exist");
  }

}
