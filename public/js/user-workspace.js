/**
 * This script contains all code specific to a user workspace that
 * doesn't apply to an express session. For example, code related to 
 * the filebrowser (since an express session doesn't have files).
 */

// The socket object that is used for all communication with the server.
var socket = connect();
// The name of the user. Those who are not logged in 
// always start with "guest_".
var username;
// The length of an autosave interval in milliseconds.
var autoSaveInterval = 1000*30;
// The current working file in the editor.
var fileSelected = null;

// Relative path to the last item selected in the context menu.
var cmRelPath;
// Relative name to the last item selected in the context menu.
var cmRelName;
// The filetype of the last item selected in the context menu.
var cmFileType;
// A dictionary of locks associated with each context menu action. 
// This is to prevent the user from accidently requesting an action 
// multiple times just by clicking more then once and receiving both
// a success and an error message. If an action is locked all other 
// attempts are ignored.
var cmActionLocks = {};
// True iff the clients filebrowser currently matches the drivers.
var syncedFileBrowser = true;
// Holds a list of folder expansions when the clients filetree is not
// yet synced with the drivers.
var delayedExpansions;
// The amount of time in ms until the form can be submitted again.
// Used for locking out context menu actions.
var formDelay = 1000;

$(document).ready(function(){
  syncedFileBrowser = false;
  lock_editor("Please select a file.");

  if(!auth){
    // Get user's name and load the session
    $('#nameFormBtn').on("click", function(){
      set_user();
      return false;
    });
    $('#userModal input').keypress(function(e){
      var code = (e.keyCode ? e.keyCode : e.which);
      if(code == 13) { // Enter keycode
        set_user();
      }
    });
  }
  else{
    // Make sure that registered user doesn't have more than one tab per
    // room.
    $.when(check_username(socket, "workspace", username)).
    then(function(duplicate){
      if(duplicate){
        alert("You can only have one tab for each workspace.");
        window.location.replace(url);
      }
      else{
        load(socket, "workspace", username);
      }
    });
  }

  // Request filetree once socket connection is complete.
  socket.on("socket_connected", function(data){
    requestWorkspace();
  });

  // Lets the client know that their file browser is currently out of sync
  // with the driver.
  socket.on("set_filebrowser_desync", function(data){
    syncedFileBrowser = false;
  });

  // Listens for when a new file has been loaded.
  socket.on("receive_file", function(data){
    if(isDriver){
      setFileSelected(data.fileName);
      unlock_editor();
      load_file(data.text);
      socket.emit("unlock_navigators", {
        fileName: data.fileName,
        room: roomname,
        user: username
      });

      addConsoleMessage("Loaded new file - " + data.fileName);
    }
  });

  // Recieves an ordered sequence of file expansions from 
  // the current driver to synchronize this clients
  // filetree with the driver.
  socket.on("update_file_expansions", function(data){
    if (!isDriver && !syncedFileBrowser){
      delayedExpansions = data.expansions;
      syncedFileBrowser = true;
    }
  });

  // On request sends an ordered sequence of file expansions 
  // so that a newly joined navigator can synchronize their filetree
  // to this driver.
  socket.on("get_driver_filetree_expansion", function(data){
    if (isDriver){
      socket.emit("send_driver_filetree_expansion", {
        room:roomname,
        user:username,
        expansions: getFileTreeExpansion()
      });
    }
  });

  // On event, removes the overlay currently hiding the editor.
  socket.on("unlock_navigator", function(data){
    if (!isDriver){
      setFileSelected(data.fileName);
      unlock_editor();
    }
  });

  $("#code_overlay")
    .css("width", $("#code").css("width"))
    .css("position", "absolute")
    .css("top", $("#code_area").position().top + "px")
    .css("left", $("#code").position().left + "px");

  setupContextMenu();
  initNewProjectButton()
  setupSave();
  initUploader();
  handleDownload();

});


/**
 * Initialize event handlers for saving, 
 * including autosaving.
 */
 function setupSave(){

  // Explicitly saves the current working file.
  $('#saveFile').on("click", function(){
    if(isDriver && fileSelected){
      show_loader("Saving...");
      saveFile();
    } else if (fileSelected === null) {
      showMessage("No file selected.", true);
    }
    else{
      showMessage("Only the driver can save.", true);
    }
  });

  setInterval(autoSave, autoSaveInterval);
  socket.on("save_response", function(data){
    if(!data.errmsg){
      $("#loader_img").hide();
      $("#loader_msg").html("Saved.");
      addConsoleMessage("File saved.");
    }else{
      showMessage("An error occurred: " + data.errmsg.toString(), true);
    }
    hide_loader();
  });
 }

/**
 * Sets up event handlers for creating a new project.
 */
 function initNewProjectButton(){

  // Displays project creation modal.
  $("#addProjectButton").click(function(){
    $("#projectCreatorModalInput").val('');
    $('#projectCreatorModal').modal('show');
  });

  // Submit new project.
  $('#createProjectForm').on("submit", function(data){
    var projName = $('#projectCreatorModalInput').val();

    if (cmActionLocks['proj']){
      return false;
    }
    var sanityReg = /^[a-zA-Z0-9_ -]+$/;
    // check for potential path traversal attacks
    if (!sanityReg.exec(projName)){
      alert("Project name must not contain any special characters.");
      $('#projectCreatorModalInput').val("");
      return false;
    }
    cmActionLocks['proj'] = true; //lock the project action
  });

  // Recieve project creation response.
  $('#createProjectForm').ajaxForm(function(data) {
    setTimeout('cmActionLocks["proj"] = false', formDelay);
    if (data.result){
      $('#projectCreatorModal').modal('hide');
      sendRequestWorkspace();
    }
    else{
      alert(data.error);
    }
  });
}

/**
 * Handle download requests.
 */
function handleDownload(){
  $('#driver').on('click', function(){
    var dat = {};
    dat.room = roomname;
    dat.path = "wut";
    $.fileDownload('/dl', {httpMethod: "POST", data: dat});
  }); 
}
/**
 * Initializes and configures a file upload object.
 */
function initUploader(){
  $('#fileupload').fileupload({
    dataType: 'json',

    start:function(e){
      $("#FileUploadButton").off('click');
    },

    add: function (e, data) {
      $.each(data.files, function(index, file){

        var done_icon = $("<span/>");
        var li_contents = $("<li>" + file.name + "&nbsp;&nbsp;&nbsp;&nbsp;</li>")
                            .append(done_icon);

        $('ul', "#contextMenuUploadContainer")
          .append(li_contents);

        data.context = done_icon;
      });

      $("#FileUploadButton")
        .on("click", function() {
          data.submit();
      });
    },

    done: function (e, data) {
      if(data.textStatus == "success"){
        data.context
          .html("<i class='icon-ok icon-white'></i>");
      } else {
        data.context
          .html("<i class='icon-warning-sign icon-white'></i>");
      }
    },

    fail: function(e, data){
      data.context
        .html("<i class='icon-warning-sign icon-white'></i>");
    },

    progressall: function(e, data) {
      var progress = parseInt(data.loaded / data.total * 100, 10);

      if(progress==100){
        $("#FileUploadButton").hide();
      }

      $("#progress .bar")
        .css("width", progress + "%");
    }
  });

  $("#contextMenuFileUpload").on("hidden", function(){
    refreshFiles({
      key: "upload",
      activePath: getActiveFolderPath()
    });

    $("#FileUploadButton").show();
    $('ul', "#contextMenuUploadContainer").html("");
    $("#progress .bar").css("width", "0%");

    addConsoleMessage("Driver uploaded files to current working directory");
  }); 
}
/**
 * Send a request to save the current file.
 */
function saveFile(){
  socket.emit("save_file",
    {
      room:roomname,
      user:username,
      text:editor.getSession().getValue()
    });
}

/**
 * Automatically save the current state of the file 
 * periodically.
 */
function autoSave(){
  if (driver && fileSelected && autoSaveToggle){
    // Turns off autosave; only to be renabled if a
    // change occurs.
    autoSaveToggle = false; 
    addConsoleMessage("Auto saving...");
    saveFile();
  }
}
/*
 * Make an ajax request for the users files.
 */
function requestWorkspace(){

  // Configure and initialize a filetree object.
  $('#fileTree').fileTree({
    root: '/',
    script: 'fileconnector',
    expandSpeed: 250,
    collapseSpeed: 250,
    multiFolder: false,
    sID: socket.socket['sessionid'],
    room: roomname
  }, function(file) {
    // event for when a file is left-clicked
    if (isDriver){
      socket.emit("get_file", {
        user: username,
        fileName: file,
        text:editor.getSession().getValue(),
        room:roomname
      });
    }
  });
}

/**
 * Returns a list of expanded directory paths, ordered by ascending
 * distance from the root. E.g a nested expanded folder would come
 * after its parent.
 */ 
function getFileTreeExpansion(){
  var openFolders = [];
  var root = $('#fileTree').children().children(".expanded");
  while (root.length){
    var child = root.children('a');
    openFolders.push($(child).attr('rel'));
    root = root.children('ul');
    root = root.children(".expanded");
  }
  return openFolders;
}

/**
 * Set the current working file.
 */
function setFileSelected(file){
  if(!fileSelected){
    unlock_editor();
  }
  fileSelected = file;
}

function load_file(file_content){
  editor.getSession().setValue(file_content);
}


/**
 * Initializes the context menu and all of its event handlers. 
 */
function setupContextMenu(){

  // By default all cm actions are not locked.
  cmActionLocks['delete'] = false;
  cmActionLocks['directory'] = false;
  cmActionLocks['rename'] = false;
  cmActionLocks['file'] = false;

  // Capture the DOM element that was right clicked in the filetree.
  $('#fileTree').on('contextmenu', function(e) {
    if ($(e.target).attr('rel')){
      cmRelPath = $(e.target).attr('rel');
      cmRelName = $(e.target).html();
      cmFileType = $(e.target).attr('ftype');
    }
    e.preventDefault();
  });

  var cmLineSep = "---------";
  // Configures the context menu object
  $.contextMenu({
    selector: '.context-menu-one',
    callback: function(key, options) {

      // Key is the context menu option. Below handles
      // what happens when each option is selected.

      if (key == "directory" || key == "file"){
        $('#contextMenuModal' + key).modal('show');
      }
      else if (key == "delete"){
        $('#cmDelLegend').html( "Delete " + cmRelPath);
        $('#contextMenuModaldelete').modal('show');
      }
      else if (key == "rename"){
        if (cmFileType == "directory"){
          // TODO: support renaming of a directory
          alert("Renaming directory not yet supported.");
        }
        else{
          $('#cmRenameLegend').html( "Rename " + cmRelPath);
          $('#cmInputRename').val(cmRelName);
          $('#contextMenuModalrename').modal('show');
        }
      }
      else if (key == "upload"){
        $("#fileUploadpath").val(getActiveFolderPath());
        $("#contextMenuFileUpload").modal('show');
      }
      else if (key == "download"){
        var dat = {};
        dat.room = roomname;
        dat.path = cmRelPath;
        dat.file = cmRelName;
        $.fileDownload('/dl/'+cmRelName, {httpMethod: "POST", data: dat});
      }
    },
    // The list of actions on the context menu.
    items: {
      "rename": {name: "Rename File", icon: "edit"},
      "sep0": cmLineSep,
      "file": {name: "Create File", icon: "edit"},
      "sep1": cmLineSep,
      "upload": {name: "Upload File", icon: "upload"},
      "sep2": cmLineSep,
      "download": {name: "Download", icon: "download"},
      "sep3": cmLineSep,
      "directory": {name: "Add directory", icon: "add"},
      "sep4": cmLineSep,
      "delete": {name: "Delete", icon: "delete"},
      "sep5": cmLineSep
    }
  });

  // User confirms deletion.
  $('#cmDelButtonYes').on('click', function(e){
    emitDeleteReq();
  });

  // User declines deletion.
  $('#cmDelButtonNo').on('click', function(e){
    $('#contextMenuModaldelete').modal('hide');
  });

  // User submits a new directory.
  $('#cmAddDirButton').on('click', function(e){
    emitAddDirReq();
  });
  $('#contextMenuModaldirectory').keypress(function(e){
    var code = (e.keyCode ? e.keyCode : e.which);
    if(code == 13) { //Enter keycode
      emitAddDirReq();
    }
  });

  // User submits a new file.
  $('#cmAddFileButton').on('click', function(e){
    emitAddFileReq();
  });
  $('#contextMenuModalfile input').keypress(function(e){
    var code = (e.keyCode ? e.keyCode : e.which);
    if(code == 13) { //Enter keycode
      emitAddFileReq();
    }
  });

  // User submits a file rename.
  $('#cmRenameButton').on('click', function(e){
    emitRenameReq();
  });
  $('#contextMenuModalrename input').keypress(function(e){
       var code = (e.keyCode ? e.keyCode : e.which);
      if(code == 13) { // Enter keycode
        emitRenameReq();
      }
  });

  // Listens to changes to the filetree and updates the view
  // accordingly.
  socket.on("refresh_files", function(data){
    // This clients file browser hasn't caught up with the drivers state yet.
    if (!(delayedExpansions && delayedExpansions.length)){
      // TODO: maybe queue the refreshes while delayed expansion
      // is not finished
      refreshFiles(data);
    }
  });

  // triggered when the driver clicks a folder in the filebrowser
  socket.on("file_clicked", function(data){
    if (!isDriver){
      if (delayedExpansions && delayedExpansions.length){
        delayedExpansions.push(data.activePath);
      }
      else{
        var obj = $('a[rel="' + data.activePath + '"]');
        if (obj.length){
          forceClick(obj);
        }
      }
    }
  });

  // On event, refreshes the view for the filetree
  socket.on("request_workspace", function(data){
    requestWorkspace();
  });

  // Listens for a result on a context menu action.
  socket.on("context_menu_click_result", function(data){
    if (data.key != "upload"){
      handleCMResult(data);
    }
  });

  // Listens for updates to the name (because of a rename) of 
  // the current working file.
  socket.on("file_renamed", function(name){
    fileSelected = name;
  });

  // Locks the editor; this should be moved from this function
  socket.on("lock_editor", function(data){
    fileSelected = null;
    lock_editor("Please select a file.");
  });
}

/**
 * Simulates an artificial click on the JQuery object.
 */
function forceClick(obj){
  obj.trigger("click", [true]);
}

/*
 * Request that all users in the workspace an update on their file tree.
 */
function sendRequestWorkspace(){
  if (isDriver){
    socket.emit("send_request_workspace",
      {room: roomname,
      user: username
    });
  }
}

/**
 * Refreshes the view of the file tree and if possible
 * only updates the folder that has had changes made to it.
 * This is used in cases such as a new file being created 
 * in a folder and the current view of the file tree does
 * not the display it.
 */
function refreshFiles(data){

  // The context menu action that caused the change
  action = data.key; 
  // The path to the active folder.
  activePath = data.activePath;

  if (activePath && isDriver){
    var obj = $('a[rel="' + activePath + '"]');
    if (obj.length){

      if (action == "delete" && data.deleteDir){
        obj = obj.parent().parent().parent().children();
        if (!obj.attr("rel")){
          // Likely hit the root folder of the users workspace;
          // just refresh the entire workspace.
          sendRequestWorkspace();
          return;
        }
      }
      // if the active folder is already collapsed
      if (obj.parent().hasClass('collapsed'))
      {
        // expand the active folder by simulating a click.
        forceClick(obj);
      }
      else{ // the active folder is already expanded

        // Refresh the folder by collapsing it and then expanding it.
        // This is done by simulating a double click.
        obj.trigger("click", [true]).delay(500).trigger("click", [true]);
      }
    }
    else{
      sendRequestWorkspace();
    }
  }
}

/**
 * Return true iff the input box corresponding to the id
 * given contains valid text.
 */
function cmNameValidation(id){
  var name = $(id).val();
  if (name.length === 0){
    alert("Name must be at least one character.");
    return false;
  }
  // validate input
  if (!validatePath(cmRelPath, name)){
    $(id).val("");
    alert("Please avoid special characters.");
    return false;
  }
  return true;
}

/**
 * Sends a request to delete a file, folder or project.
 */
function emitDeleteReq(){
  action = "delete";
  if (!isDriver || cmActionLocks[action]) return;

  cmActionLocks[action] = true; //lock the action
  socket.emit('context_menu_clicked',
  {
    key: action,
    relPath: cmRelPath,
    user: username,
    room: roomname,
    activePath: getActiveFolderPath(),
    deleteDir:(cmFileType == "directory")
  });
}

/**
 * Sends a request to create a new directory.
 */
function emitAddDirReq(){
  var id = "#cmInputAddDir";
  var action = "directory";
  if (!isDriver || cmActionLocks[action] || !cmNameValidation(id)) return;
  cmActionLocks[action] = true; // lock the action
  socket.emit('context_menu_clicked',
  {
      key: action,
      relPath: cmRelPath,
      user: username,
      room: roomname,
      name:  $(id).val(),
      activePath: getActiveFolderPath()
  });
}

/**
 * Validates a relative path for common path traversal attacks.
 * Returns True iff path passes the validation false otherwise.
 * If the path already contains the filename, leave filename as 
 * an empty string.
 */
function validatePath(relativePath, fileName){
    relativePath = unescape(relativePath);
    fileName = unescape(fileName);

    var fullPath = relativePath + fileName;
    // Check for .. in relative path
    var pathReg1 = /.*\.\..*/;
    // Check that the fileName doesn't contain / or \
    var pathReg2 = /(.*(\/|\\).*)/;
    // Further validation on the name mostly ensures characters are alphanumeric 
    var pathReg3 = /^([a-zA-Z0-9_ .]|-)*$/;

    return !(pathReg1.exec(relativePath) || pathReg2.exec(fileName) || !pathReg3.exec(fileName) || pathReg1.exec(fullPath));
}

/**
 * Sends a request to create a file.
 */
function emitAddFileReq(){
  var id = "#cmInputAddFile";
  var action = "file";
  if (!isDriver || cmActionLocks[action] || !cmNameValidation(id)) return;
  cmActionLocks[action] = true; //lock the action

  socket.emit('context_menu_clicked',
  {
    key: action,
    relPath: cmRelPath,
    user: username,
    room: roomname,
    name: $(id).val(),
      text: editor.getSession().getValue(),
      activePath: getActiveFolderPath()
  });
}

/**
 * Sends a request to rename a file.
 */
function emitRenameReq(){
  var id = "#cmInputRename";
  action = "rename";

  if (!isDriver || cmActionLocks[action] || !cmNameValidation(id)) return;

  cmActionLocks[action] = true; // lock the action
  socket.emit('context_menu_clicked',
  {
    key: action,
    relPath: cmRelPath,
    user: username,
    room: roomname,
    name: $(id).val(),
    text: editor.getSession().getValue(),
    activePath: getActiveFolderPath()
  });
}

/**
 * Return the path to the parent folder that has
 * had changes. I.e if the path is currently to a
 * file then the active folder is the parent folder
 * of that file otherwise it is the directory itself.
 */
function getActiveFolderPath(){
  var activePath = cmRelPath;
  if (cmFileType == "file"){
    var i = cmRelPath.lastIndexOf("/");
    if (i !== -1){
      activePath = cmRelPath.substr(0, i + 1);
    }
  }
  return activePath;
}

/**
 * Clears the context menu action's lock after some time.
 */
function clearLock(key){
  setTimeout('cmActionLocks["' + key +'"] = false', formDelay);
}

/*
 * Handles the servers response to a context menu action.
 */
function handleCMResult(data){

  clearLock(data.key);
   if (data.result){
    $('#contextMenuModal' + data.key).modal('hide');
  }
  else{
    alert("Error: " + data.error);
  }
}

function lock_editor(message){
  editor.setReadOnly(true);
  $("#overlay_message").html(message);
  $("#code_overlay").fadeIn();
}

function unlock_editor(){
  if(isDriver){
    editor.setReadOnly(false);
  }
  $("#code_overlay").fadeOut();
}

function set_user(){
  username = "guest_" + $("#username").val();

  // Check if username is not already taken 
  // before assigning it.
  $.when(check_username(socket, "workspace", username)).
    then(function(duplicate){
      if(duplicate){
        $("#username").val('');
        $("#userModal .error").text('Sorry, this name is already taken.');
      }
      else{
        load(socket, "workspace", username);
        $('#userModal').modal('hide');
      }
    });
  return false;
}
