var socket = connect();
var username;

$(document).ready(function(){

	load(socket, "workspace", username);
	$('#nameform').submit(function(){

		$('#userModal').modal('hide');
		return false;
	});


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