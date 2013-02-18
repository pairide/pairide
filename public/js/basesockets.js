/* This is client side socket code for both express 
 *and user workspaces. 
 */

var host = window.location.hostname;
var port = 8000;
var url = "http://"+host+":"+port;
var isDriver; 
var buffering = false;
var bufferWait = 250; //in ms
var roomname;
var currentHighlight;

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
			//editor.setValue(data.text);
			//alert(data.deltas);
			var deltas = data.deltas;
			//alert(deltas.length);
			//for(var i=0; i<deltas.length; i++){
			//	alert(deltas[i]);
			//}
			editor.getSession().getDocument().applyDeltas(data.deltas);
		}
	});

	//listens for changes in the editor and notifies the server
	editor.getSession().getDocument().on('change', function(e) {
		if (isDriver){
			//buffering = true;
			//alert('change');
			//setTimeout(sendChanges,bufferWait);
			var deltas = new Array();
			deltas.push(e.data);
			console.log(e.data);
			socket.emit("editor_changed", {deltas: deltas});
			//alert(e.data);
		}
	});

	roomname = roomID(type);
	socket.emit('join_room', { room: roomname, user:username});

	/* set up chat room */
	socket.emit('get_users', {room: roomname});

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

	// Handle event: A user makes a selection.
	socket.on("get_selection", function(data){
		applySelection(data);
	});

	// Handle: A user added an annotation.
	socket.on("get_annotation", function(data){
		applyAnnotation(data);
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


function handleSelection(range){

	//if(range.isEmpty()){
		//$("#debug").html(range.toString());

		socket.emit("post_selection", { user: username, range: range });
	//}
}

function applySelection(data){

	if(data.user != username){

		$("#debug").html(data.user + " -> " + username + " -> " + isDriver);

		var editorSession = editor.getSession();
		var start = data.range.start;
		var end = data.range.end;
		var r = new Range(start.row, start.column, end.row, end.column);
		var lineStyle = isDriver ? "navigator" : "driver";

		for(var i in editorSession.getMarkers(false)){
			editorSession.removeMarker(i);
		}
		
		editorSession.addMarker(r, "line-style-" + lineStyle, "text", false);
	}
	
}

function handleAnnotation(){

    var sel = editor.getSession().selection.getRange();

    if(!sel.isEmpty()){
    	//Sanitize.
    	$("#annotModal").modal({show: true, backdrop: false});

    }else{	
    	//Handle Error.
    }
}

function addAnnotation(){

	var sel = editor.getSession().selection.getRange();
	var annot = $("#annot_text").val();

	socket.emit("post_annotation", {
		user: username,
		range: sel,
		annot: annot,
	});


	$("#annotModal").modal('hide');

	editor.getSession().selection.clearSelection();
}

function applyAnnotation(data){

	var range = data.range;
	var margin_top = parseInt(range.start.row) * 20;
	var annot_height = ((range.end.row - range.start.row) + 1) * 20;
	var annotation_color = data.driver == data.user ? "#8EC21F" : "#C2731F";
	var annotation_role = data.driver == data.user ? "driver" : "navigator";


	var annot = $("<div/>");
	annot.attr("class", "annotation");
	annot.css("background", annotation_color);
	annot.css("top", margin_top + "px");
	annot.css("height", annot_height + "px");

	$("#annotBox").append(annot);

	annot.popover({
		"trigger": "hover",
		content: data.annot,
	})

	annot.hover(
		function(){
			highlightAnnotation(range, annotation_role);
		},
		function(){
			destroyHighlightAnnotation();
		}
	);
}

function highlightAnnotation(range, role){
	
	var s = range.start;
	var e = range.end;
	var r = new Range(s.row, s.column, e.row, e.column);
	//console.log(range);
	currentHighlight = editor.getSession().addMarker(r,"line-style-" + role, "text");
}

function destroyHighlightAnnotation(){
	editor.getSession().removeMarker(currentHighlight);
}