var socket = connect();
var username;

/*
 * Relative path to the last item selected in the context menu.
 */
var cmRelPath;
$(document).ready(function(){

	if(!auth){
		/*Get user's name and load the session */
		$('#nameform').submit(function(){
			username = $("#username").val();

			//Check if username is not already taken 
			//before assigning it.
			$.when(check_username(socket, "workspace", username)).
				then(function(duplicate){
					if(duplicate){
						$("#username").val('');
						$("#nameform .error").text('Sorry, this name is already taken.');
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
        requestWorkspace();
		load(socket, "workspace", username);
	}

    setupContextMenu();

	$("#addProjectButton").click(function(){
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
});

/*
 * Make an ajax request for the users files.
 */
function requestWorkspace(){
	$('#fileTree').fileTree({
        root: '/',
        script: 'fileconnector',
        expandSpeed: 350,
        collapseSpeed: 350,
        multiFolder: false
    }, function(file) {
        //event for when a file is clicked
        alert(file);
    });	
}

function setupContextMenu(){
    //handling context menu for directories and projects
    $.contextMenu({
        selector: '.context-menu-one', 
        callback: function(key, options) {
            var relMatch = /^<a href="#" rel="([^"]+)/;
            var match = relMatch.exec(this.html());
            if (match){

                cmRelPath = match[1];
                if (key == "directory"){
                    $('#contextMenuAddDirModal').modal('show');
                }
                else if (key == "file"){
                    $('#contextMenuAddFileModal').modal('show');
                }
                else if (key == "delete"){
                    $('#cmDelLegend').html( "Delete " + this.text());
                    $('#contextMenuDeleteModal').modal('show');
                }
                //else if ...upload

            }
        },
        //the list of items on the menu
        items: {
            "file": {name: "Create File", icon: "edit"},
            "sep1": "---------",
            "upload": {name: "Upload File", icon: "cut"},
            "sep2": "---------",
            "directory": {name: "Add directory", icon: "cut"},
            "sep2": "---------",
            "delete": {name: "Delete", icon: "delete"},
            "sep5": "---------",
        }
    });
    //user confirms deletion
    $('#cmDelButtonYes').on('click', function(e){
        socket.emit('context_menu_dir_clicked', 
            {
                    key: "delete", 
                    relPath: cmRelPath,
                    user: username,
                    room: roomname,
                });
    });  
    //user declines deletion
    $('#cmDelButtonNo').on('click', function(e){
        $('#contextMenuDeleteModal').modal('hide');
    });  

    //user submits a new directory
    $('#cmAddDirButton').on('click', function(e){
        socket.emit('context_menu_dir_clicked', 
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
        socket.emit('context_menu_dir_clicked', 
            {
                    key: "file", 
                    relPath: cmRelPath,
                    user: username,
                    room: roomname,
                    name: $("#cmInputAddFile").val()
                });

    });
    //listens for a result of a context menu action.
    socket.on("context_menu_click_result", function(data){

        switch(data.key){
            case "directory":
                if (data.result){
                    $('#contextMenuAddDirModal').modal('hide');
                    requestWorkspace();
                }
                else{
                    alert(data.error);
                }
                break;    
            case "file":
                if (data.result){
                    $('#contextMenuAddFileModal').modal('hide');
                    requestWorkspace();
                }
                else{
                    alert(data.error);
                }
                break;  
            case "delete":
                if (data.result){
                    $('#contextMenuDeleteModal').modal('hide');
                    requestWorkspace();
                }
                else{
                    alert(data.error);
                }
                break; 
        }
    });
    // $('.context-menu-one').on('click', function(e){
         
    // })
}
