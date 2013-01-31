var host = window.location.hostname;
var port = 8000;
var url = "http://"+host+":"+port;
var isDriver; 

function load(socket, type, username){
	socket.on('is_driver', function(data){
		isDriver = data.driver;
	});
	var rID = roomID(type);
	socket.emit('join_room', { room: rID, user:username});

	//Set the client's role appropriately
	socket.on('is_driver', function(data){
		if(data.driver){
			$('#driver').html('Driver');
		}
		else{
			$('#driver').html('Navigator');
		}
	});
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