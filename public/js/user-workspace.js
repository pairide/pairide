var socket = connect();
var username;
var autoSaveInterval = 1000*30;
var fileSelected = null;
/*
 * Relative path to the last item selected in the context menu.
 */
var cmRelPath;
var cmRelName;
var cmFileType;
var syncedFileBrowser = true;
var delayedExpansions;
$(document).ready(function(){
	syncedFileBrowser = false;
	lock_editor("Please select a file.");

	if(!auth){
		/*Get user's name and load the session */
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
			addConsoleMessage("File saved.");
		}else{
			showMessage("An error occurred: " + data.errmsg.toString(), true);
		}
		hide_loader();
	});

	$('#fileupload').fileupload({
		dataType: 'json',
		add: function (e, data) {

			$.each(data.files, function(index, file){

				var done_icon = $("<span/>")

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
			data.context
				.html("<i class='icon-ok icon-white'></i>");
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

		$("#fileupload").replaceWith(
				$("#fileupload").val('').clone(true)
		);

		$("#FileUploadButton").show();
		$('ul', "#contextMenuUploadContainer").html("");
		$("#progress .bar").css("width", "0%");
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
					alert("Renaming directory not yet supported.")
				}
				else{
					$('#cmRenameLegend').html( "Rename " + cmRelPath);
					$('#cmInputRename').val(cmRelName);
					$('#contextMenuModalrename').modal('show');					
				}

			}
			else if (key == "upload"){


				var files = $('input[type="file"]')[0].files;
for (var i = 0; i < files.length; i++)
{
    alert(files[i].name);
}



				$("#contextMenuFileUpload").modal('show');
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
					activePath: getActiveFolderPath()
				});
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

		if (!(delayedExpansions && delayedExpansions.length)){
			//TODO maybe queue the refreshes while delayed expansion
			//is not finished
			refreshFiles(data.activePath);	
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
//refresh the GUI at a directory that has had recent changes.
function refreshFiles(activePath){
	if (activePath && isDriver){
		var obj = $('a[rel="' + activePath + '"]');
		if (obj.length){
			if (obj.parent().hasClass('collapsed'))
			{
				forceClick(obj);
			}
			else{
				obj.trigger("click", [true]).delay(500).trigger("click", [true]);	
			}	
		}
		else{
			requestWorkspace();
		}
	}
}
function emitAddDirReq(){
	socket.emit('context_menu_clicked',
	{
			key: "directory",
			relPath: cmRelPath,
			user: username,
			room: roomname,
			name: $("#cmInputAddDir").val(),
			activePath: getActiveFolderPath()
	});
}

function emitAddFileReq(){
	socket.emit('context_menu_clicked',
	{
		key: "file",
		relPath: cmRelPath,
		user: username,
		room: roomname,
		name: $("#cmInputAddFile").val(),
		text: editor.getSession().getValue(),
		activePath: getActiveFolderPath()
	});	
}

function emitRenameReq(){
	socket.emit('context_menu_clicked',
	{
		key: "rename",
		relPath: cmRelPath,
		user: username,
		room: roomname,
		name: $("#cmInputRename").val(),
		text: editor.getSession().getValue(),
		activePath: getActiveFolderPath()
	});
}

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
/*
 * Handles the servers response to a context menu action.
 */
function handleCMResult(data){
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
