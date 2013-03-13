var socket = connect();
var username;
var autoSaveInterval = 1000*30;
var fileSelected = null;
/*
 * Relative path to the last item selected in the context menu.
 */
var cmRelPath;
var cmRelName;
$(document).ready(function(){

	lock_editor("Please select a file.");

	if(!auth){
		/*Get user's name and load the session */
		$('#nameFormBtn').on("click", function(){
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
	$('#createProjectForm').ajaxForm(function(data) {

		if (data.result){
			$('#projectCreatorModal').modal('hide');
			requestWorkspace();
		}
		else{
			alert(data.error);
		}
	});

	$('#saveFile').on("click", function(){
		if(isDriver && fileSelected){
			show_loader("Saving...");
			saveFile();
		}
		else if (fileSelected == null){
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
		}else{
			showMessage("An error occurred: " + data.errmsg.toString(), true);
		}
		hide_loader();
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
		expandSpeed: 350,
		collapseSpeed: 350,
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


	//capture the DOM element that was right clicked
	$('#fileTree').on('contextmenu', function(e) {
		if ($(e.target).attr('rel')){
			cmRelPath = $(e.target).attr('rel');
			cmRelName = $(e.target).html();
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
				$('#cmRenameLegend').html( "Rename " + cmRelPath);
				$('#cmInputRename').val(cmRelName);
				$('#contextMenuModalrename').modal('show');
			}
			else if (key == "upload"){
				alert('This function has not been implemented yet.');
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
			"directory": {name: "Add directory", icon: "add"},
			"sep3": cmLineSep,
			"delete": {name: "Delete", icon: "delete"},
			"sep4": cmLineSep,
		}
	});
	//user confirms deletion
	$('#cmDelButtonYes').on('click', function(e){

		socket.emit('context_menu_clicked',
			{
					key: "delete",
					relPath: cmRelPath,
					user: username,
					room: roomname,
				});
	}); 
	//user declines deletion
	$('#cmDelButtonNo').on('click', function(e){
		$('#contextMenuModaldelete').modal('hide');
	});

	//user submits a new directory
	$('#cmAddDirButton').on('click', function(e){
		socket.emit('context_menu_clicked',
			{
					key: "directory",
					relPath: cmRelPath,
					user: username,
					room: roomname,
					name: $("#cmInputAddDir").val()
				});
	});
	//user submits a new file
	$('#cmAddFileButton').on('click', function(e){
		socket.emit('context_menu_clicked',
			{
				key: "file",
				relPath: cmRelPath,
				user: username,
				room: roomname,
				name: $("#cmInputAddFile").val(),
	            text: editor.getSession().getValue()
			});
	});

	//user renames file
	$('#cmRenameButton').on('click', function(e){
		socket.emit('context_menu_clicked',
			{
				key: "rename",
				relPath: cmRelPath,
				user: username,
				room: roomname,
				name: $("#cmInputRename").val(),
	            text: editor.getSession().getValue()
			});
	});

	//listens for a result of a context menu action.
	socket.on("context_menu_click_result", function(data){
		if (data.key != "upload"){ //upload currently not implemented
			handleCMResult(data);
		}
	});

	socket.on("file_renamed", function(name){
		fileSelected = name;
		alert(name);
	});
	socket.on("lock_editor", function(data){
		fileSelected = null;
		lock_editor("Please select a file.");
	});
}

/*
 * Handles the servers response to a context menu action.
 */
function handleCMResult(data){
   if (data.result){
		$('#contextMenuModal' + data.key).modal('hide');
		requestWorkspace();
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
