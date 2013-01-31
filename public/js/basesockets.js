var host = window.location.hostname;
var port = 8000;
var url = "http://"+host+":"+port;
var isDriver; 

function load(socket, type, username){

	//listen for the server to notify the client if they are
	//a driver or navigator
	socket.on('is_driver', function(data){
		setDriver(data.driver);
	});

	//listen for
	editor.getSession().on('change', function(e) {
		socket.emit("editor_changed");
	});
	var rID = roomID(type);
	socket.emit('join_room', { room: rID, user:username});
}

/*
 * Change the users state to be a driver or a navigator.
 */
function setDriver(driver){
 	isDriver = driver;
 	editor.setReadOnly(!isDriver);
}

/*Set up a socket connection
* for the user */
function connect(){
	return io.connect(url);
}

/* Get the room's id */
function roomID(type){
	var matchRoomRequest;

	//urls for express sessions and normal sessions 
	//are not the same 
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