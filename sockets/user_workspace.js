exports.join = function(socket, data){

	var roomExistsBefore = "/" + data.room in socket.manager.rooms; 
	console.log('client request to join user room ' + data.room);
	socket.join(data.room);
	
	var roomExistsAfter = "/" + data.room in socket.manager.rooms

	//check if the room was newly created
	if (!roomExistsBefore && roomExistsAfter){
		console.log("New room created by " + data.user + ": " + data.room);
	}
	socket.set("nickname", data.user);
	socket.set("room", data.room);
	socket.get('nickname', function(err, nickname) {
        console.log("Created Nickname at" +data.room+":" + nickname);
    });
}