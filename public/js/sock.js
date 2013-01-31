var host = window.location.hostname;
var port = 8000;
var url = "http://"+host+":"+port;

/*Set up a socket connection
* for the user */
extends.connect = function(){
	return io.connect(url);
}

/* Get the room's id */
extends.roomID = function(type){
	var matchRoomRequest;

	if(type=="workspace"){
		matchRoomRequest = /.*\/workspace\/(.{32})/;
	}
	else{
		matchRoomRequest = /.*\/express\/(.{32})/;
	}
	var match = matchRoomRequest.exec(document.URL);

	if(match){
		return match[1];
	}
}

