var socket = connect();
var username;
var Range

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
		load(socket, "workspace", username);
	}

	socket.on("get_selection", function(data){
		applySelection(data);
	});

	Range = require("ace/range").Range;


	$("#addProjectButton").click(function(){
		$('#projectCreatorModal').modal('show');
	});
    $('#createProjectForm').ajaxForm(function(data) { 

    	if (data.result){
		    $('#projectCreatorModal').modal('hide');
    	}
    	else{
    		alert(data.error);
    	}
    });

});

function handleSelection(range){

	if(!range.isEmpty()){
		//$("#debug").html(range.toString());

		socket.emit("post_selection", { user: username, range: range });
	}
}

function applySelection(data){

	if(data.user != username){
		$("#debug").html(data.range.end.row + " -> " + data.range.end.column);

		var start = data.range.start;
		var end = data.range.end;
		//var r = new Range(start.row, start.column, end.row, end.column);
		//editor.session.selection.addRange(data.range, true);
	}
	
}