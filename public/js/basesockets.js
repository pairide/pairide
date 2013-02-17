/* This is client side socket code for both express 
 *and user workspaces. 
 */

var host = window.location.hostname;
var port = 8000;
var url = "http://"+host+":"+port;
var isDriver; 
var buffering = false;
var bufferWait = 250; //in ms

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
			$('#driver').html('Navigator');
			$('#driver').addClass('label-warning');
		}
		else{
			$('#driver').html('Driver');
			$('#driver').addClass('label-success');
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
		if (isDriver && !buffering){
			buffering = true;
			setTimeout(sendChanges,bufferWait);
		}
	});

	var rID = roomID(type);
	socket.emit('join_room', { room: rID, user:username});

	/* set up chat room */
	socket.emit('get_users', {room: rID});

	socket.once('send_users', function(data){
		var users = data.usernames;
		for(user in users){
			$('#user_list').append("<p>" + users[user] + "</p>");
		}
	});

	socket.on('new_user', function(data){
		if(data.user != username){
			$('#user_list').append("<p>" + data.user + "</p>");
		}
	});

	//Handle event: user sends a new message
	$("#chatsend").submit(function(){
		var message = $("#msg").val();
		socket.emit('send_message', {user: username, msg: message});
		$("#msg").val("");
		return false;
	});
	//Handle event: getting a new message from another user
	socket.on('new_message', function(data){
		$('#chatmsg p').append(data.user + ": " + data.msg + "</br>");
	});

	//Handle event: a user disconnected from the room
	socket.on('user_disconnect', function(data){
		var username = data.username;
		$("#user_list p").remove(":contains('" + username + "')");
	});
}


function sendChanges(){
	if (isDriver){
		socket.emit("editor_changed", {text: editor.getValue()});
		buffering = false;
	}
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

/*Return true if username is available for the roomID,
false otherwise*/
function  check_username(socket, type, username){

	var rID = roomID(type);
	var dfd = new $.Deferred();

	//Get the list of users in the room
	//and check if any of them conflict
	//with username
	socket.emit('get_users', {room: rID});
	socket.once('send_users', function(data){
		var	users = data.usernames;
		for(user in users){
			if(users[user] == username){
				dfd.resolve( true );
			}
		}
		dfd.resolve( false );
	});
	return dfd.promise();
}