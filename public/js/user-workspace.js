var socket = connect();
var username;
var Range

$(document).ready(function(){

	load(socket, "workspace", username);
	requestWorkspace();
	$('#nameform').submit(function(){

		$('#userModal').modal('hide');
		return false;
	});

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