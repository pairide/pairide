var host = window.location.hostname;
var port = 8000;
var url = "http://"+host+":"+port;
var isDriver; 

//base load function for the workspace
function load(socket, type, username){

	//listen for the server to notify the client if they are
	//a driver or navigator
	socket.on('is_driver', function(data){
		setDriver(data.driver);
		if (!isDriver){
			//Some one is already editing when the user joined.
			//Editor should be updated with the current text.
			//editor.setValue(currentEditor);
		}
	});

	//listens for incoming updates to the editor caused by the driver
	//making changes.
	socket.on("editor_update", function(data){
		if (!isDriver){
			editor.setValue(data.text);
		}
	});

	//listens for changes in the editor and notifies the server
	editor.getSession().on('change', function(e) {
		if (isDriver){
			socket.emit("editor_changed", {text: editor.getValue()});
		}
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
		matchRoomRequest = /.*\/workspace\/(.{3,})/;
	}
	else{
		matchRoomRequest = /.*\/express\/(.{32})/;
	}
	var match = matchRoomRequest.exec(document.URL);

	if(match){
		return match[1];
	}
}