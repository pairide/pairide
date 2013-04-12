var socket = connect();
var username;
var autoSaveInterval = 1000*30;
var fileSelected = null;
//Relative path to the last item selected in the context menu.
var cmRelPath;
var cmRelName;
var cmFileType;
var cmActionLocks = {}; 
var syncedFileBrowser = true;
var createProjLock = false;
var delayedExpansions;
//the amount of time in ms until the form can be submitted again.
var formDelay = 1000; 

$(document).ready(function(){
  syncedFileBrowser = false;
  lock_editor("Please select a file.");

  if(!auth){
    //Get user's name and load the session
    $('#nameFormBtn').on("click", function(){
      set_user();
      return false;
    });
    $('#userModal input').keypress(function(e){
      var code = (e.keyCode ? e.keyCode : e.which);
      if(code == 13) { //Enter keycode
        set_user();
      } 
    });
  }
  else{
    //Make sure that registered user doesn't have more than one tab per
    //room.
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

  socket.on("socket_connected", function(data){
    requestWorkspace();
  });

  //let the client know that their file browser is currently out of sync
  //with the driver
  socket.on("set_filebrowser_desync", function(data){
    syncedFileBrowser = false;
  });

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

  socket.on("update_file_expansions", function(data){
    if (!isDriver && !syncedFileBrowser){
      delayedExpansions = data.expansions;
      syncedFileBrowser = true;
    }
  });


  socket.on("get_driver_filetree_expansion", function(data){
    if (isDriver){
      socket.emit("send_driver_filetree_expansion", {
        room:roomname,
        user:username,
        expansions: getFileTreeExpansion()
      });
    }
  });

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

  $("#addProjectButton").click(function(){
    $("#projectCreatorModalInput").val('');
    $('#projectCreatorModal').modal('show');
  });

  $('#createProjectForm').on("submit", function(data){
    var projName = $('#projectCreatorModalInput').val();

    if (cmActionLocks['proj']){
      return false;
    }
    var sanityReg = /^[a-zA-Z0-9_ -]+$/;
    //check for potential path traversal attacks
    if (!sanityReg.exec(projName)){
      alert("Project name must not contain any special characters.");
      $('#projectCreatorModalInput').val("");
      return false;
    }
    cmActionLocks['proj'] = true;
  });


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

  $('#saveFile').on("click", function(){
    if(isDriver && fileSelected){
      show_loader("Saving...");
      saveFile();
    } else if (fileSelected == null) {
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


  /*Handle download requests*/
  $('#driver').on('click', function(){
    var dat = {};
    dat.room = roomname;
    dat.path = "wut";
    $.fileDownload('/dl', {httpMethod: "POST", data: dat});
  });

});
  
//Send a request to the current file.
function saveFile(){
  socket.emit("save_file", 
    {
      room:roomname, 
      user:username,
      text:editor.getSession().getValue()
    });
}
//Automatically save the current state of the file periodically.
function autoSave(){
  if (driver && fileSelected && autoSaveToggle){
    autoSaveToggle = false;
    addConsoleMessage("Auto saving...");
    saveFile();
  }
}
/*
 * Make an ajax request for the users files.
 */
function requestWorkspace(){
  $('#fileTree').fileTree({
    root: '/',
    script: 'fileconnector',
    expandSpeed: 250,
    collapseSpeed: 250,
    multiFolder: false,
    sID: socket.socket['sessionid'],
    room: roomname
  }, function(file) {
    //event for when a file is clicked
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

//Returns a list of expanded directory paths, ordered by ascending 
//distance from the root.
function getFileTreeExpansion(){
  var openFolders = new Array();
  var root = $('#fileTree').children().children(".expanded");
  while (root.length){
    var child = root.children('a');
    openFolders.push($(child).attr('rel'));
    root = root.children('ul');
    root = root.children(".expanded");
  }
  return openFolders;
}
function setFileSelected(file){
  if(!fileSelected){
    unlock_editor();
  }
  fileSelected = file;
}

function load_file(file_content){
  editor.getSession().setValue(file_content);
}


function setupContextMenu(){
  cmActionLocks['delete'] = false;
  cmActionLocks['directory'] = false;
  cmActionLocks['rename'] = false;
  cmActionLocks['file'] = false;

  //capture the DOM element that was right clicked in the file tree
  $('#fileTree').on('contextmenu', function(e) {
    if ($(e.target).attr('rel')){
      cmRelPath = $(e.target).attr('rel');
      cmRelName = $(e.target).html();
      cmFileType = $(e.target).attr('ftype');
    }
    e.preventDefault();
  });

  //handling context menu for directories and projects
  var cmLineSep = "---------";
  $.contextMenu({
    selector: '.context-menu-one',
    callback: function(key, options) {
      if (key == "directory" || key == "file"){
        $('#contextMenuModal' + key).modal('show');
      }
      else if (key == "delete"){
        $('#cmDelLegend').html( "Delete " + cmRelPath);
        $('#contextMenuModaldelete').modal('show');
      }
      else if (key == "rename"){
        if (cmFileType == "directory"){
          //TODO support renaming of a directory
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
    //the list of items on the menu
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
      "sep5": cmLineSep,
    }
  });

  //user confirms deletion
  $('#cmDelButtonYes').on('click', function(e){

    emitDeleteReq();
  }); 

  //user declines deletion
  $('#cmDelButtonNo').on('click', function(e){
    $('#contextMenuModaldelete').modal('hide');
  });

  //user submits a new directory
  $('#cmAddDirButton').on('click', function(e){
    emitAddDirReq();
  });
  $('#contextMenuModaldirectory').keypress(function(e){
    var code = (e.keyCode ? e.keyCode : e.which);
    if(code == 13) { //Enter keycode
      emitAddDirReq();
    }
  });



  //user submits a new file
  $('#cmAddFileButton').on('click', function(e){
    emitAddFileReq();
  });
  $('#contextMenuModalfile input').keypress(function(e){
    var code = (e.keyCode ? e.keyCode : e.which);
    if(code == 13) { //Enter keycode
      emitAddFileReq();
    }
  });


  //user renames file
  $('#cmRenameButton').on('click', function(e){
    emitRenameReq();
  });
  $('#contextMenuModalrename input').keypress(function(e){
       var code = (e.keyCode ? e.keyCode : e.which);
      if(code == 13) { //Enter keycode
        emitRenameReq();
      } 
  });

  socket.on("refresh_files", function(data){
    //This clients file browser hasnt caught up with the drivers state yet.
    if (!(delayedExpansions && delayedExpansions.length)){
      //TODO maybe queue the refreshes while delayed expansion
      //is not finished
      refreshFiles(data); 
    }   
  });

  //triggered when the driver clicks a folder in the filebrowser
  socket.on("file_clicked", function(data){
    if (!isDriver){

      if (delayedExpansions && delayedExpansions.length){
        delayedExpansions.push(data.activePath);
      }
      else{
        var obj = $('a[rel="' + data.activePath + '"]');
        if (obj.length){
          forceClick(obj)
        }
      }
    } 
  });

  socket.on("request_workspace", function(data){
    requestWorkspace();
  });

  //listens for a result of a context menu action.
  socket.on("context_menu_click_result", function(data){
    if (data.key != "upload"){ //upload currently not implemented
      handleCMResult(data);
    }
  });

  socket.on("file_renamed", function(name){
    fileSelected = name;
  });

  socket.on("lock_editor", function(data){
    fileSelected = null;
    lock_editor("Please select a file.");
  });
}

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

//refresh the GUI at a directory that has had recent changes.
function refreshFiles(data){
  action = data.key;
  activePath = data.activePath;
  if (activePath && isDriver){
    var obj = $('a[rel="' + activePath + '"]');
    if (obj.length){

      if (action == "delete" && data.deleteDir){
        obj = obj.parent().parent().parent().children();
        if (!obj.attr("rel")){
          //Likely hit the root folder of the users workspace
          sendRequestWorkspace();
          return;
        }
      }   
      if (obj.parent().hasClass('collapsed'))
      {
        forceClick(obj);
      }
      else{
        obj.trigger("click", [true]).delay(500).trigger("click", [true]); 
      } 
    }
    else{
      sendRequestWorkspace();
    }
  }
}

function cmNameValidation(id){
  var name = $(id).val();
  if (name.length == 0){
    alert("Name must be at least one character.");
    return false;
  }
  //validate input
  if (!validatePath(cmRelPath, name)){
    $(id).val("");
    alert("Please avoid special characters.");
    return false;
  } 
  return true;
}

function emitDeleteReq(){
  action = "delete";
  if (!isDriver || cmActionLocks[action]) return;
  

  cmActionLocks[action] = true;
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

function emitAddDirReq(){
  var id = "#cmInputAddDir";
  var action = "directory";
  if (!isDriver || cmActionLocks[action] || !cmNameValidation(id)) return;
  cmActionLocks[action] = true;
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

function emitAddFileReq(){
  var id = "#cmInputAddFile";
  var action = "file";
  if (!isDriver || cmActionLocks[action] || !cmNameValidation(id)) return;
  cmActionLocks[action] = true;

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

function emitRenameReq(){
  var id = "#cmInputRename";
  action = "rename"
  if (!isDriver || cmActionLocks[action] || !cmNameValidation(id)) return;
  cmActionLocks[action] = true;

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

//Return the path to the parent folder that has
//had changes.
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

  //Check if username is not already taken 
  //before assigning it.
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
