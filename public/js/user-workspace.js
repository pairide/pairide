var socket = connect();
var username;

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


    $.contextMenu({
        selector: '.context-menu-one', 
        callback: function(key, options) {
        var relMatch = /^<a href="#" rel="([^"]+)/;
        var match = relMatch.exec(this.html());
        if (match){
            socket.emit('context_menu_dir_clicked', 
                {
                    key: key, 
                    relPath: match[1],
                    user: username,
                    room: roomname
                });
        }
        },
        items: {
            "create": {name: "Create File", icon: "edit"},
            "sep1": "---------",
            "upload": {name: "Upload File", icon: "cut"},
            "sep2": "---------",
            "directory": {name: "Add directory", icon: "cut"},
            "sep2": "---------",
            "delete": {name: "Delete", icon: "delete"},
            "sep5": "---------",
        }
    });
    
    $('.context-menu-one').on('click', function(e){
         
    })


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
