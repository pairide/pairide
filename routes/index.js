
/*
 * GET home page.
 */

 var db = require('../database.js');

exports.index = function(req, res){
  res.render('index', { title: 'Home', current : 'Home' });
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

exports.register = function(req, res){
	res.render('register', { title: 'Register', current : "None"});
};

exports.tos = function(req, res){
	res.render('tos', { title: 'Terms of Service', current : "None"});
};

exports.workspace = function(req, res){
	res.render('workspace', {title: 'Workspace', current: "None"});
};

/*
 * Handle the ajax POST request for the file browser.
 */
exports.fileConnector = function(req, res){
  //res.render("filedemo"); //currently always rendering fake files
  console.log("Handling post to file manager")

  fs = require('fs');
  var directory = process.cwd() + "/users"; 
  var username = "alex"; //this needs to be based on the current user
  var path = directory + "/" + username + req.body.dir;
  console.log("Path: " + path);
  try {
    //raises an error if the path does not exist
    stats = fs.lstatSync(path);

    if (stats.isDirectory()) {
        fs.readdir(path, function (err, files) {
          if (err) {
            console.log(err);
            return;
          }
          var html = "<ul style=\"display: none;\" class=\"jqueryFileTree\">";
          for (var i=0; i < files.length; i++){
            try{
              var filePath = path + files[i];
              var fileStats = fs.lstatSync(filePath);
              //check if file is a nested directory
              if (fileStats.isDirectory()){
              //might want to decode the html entities for filename
                html +=  "<li class=\"directory collapsed\"><a href=\"#\" rel=\"" 
                + req.body.dir + files[i] + "/\">" + files[i] + "</a></li>";
              }
              else if (fileStats.isFile()){
                html +=  "<li class=\"directory collapsed\"><a href=\"#\" rel=\"" 
                + req.body.dir + files[i] + "/\">" + files[i] + "</a></li>";
              }
            }catch(e){
              console.log(e);
            }
          }
        html += "</ul>";
        res.send(html);
      });
    }
  }
  catch (e) {
    console.log("Path to user workspace does not exist");
  }

}

//testing page for the database -- to be removed later
exports.dbtest = function(req, res){
	db.getUsers();
	res.send('wut');
}

