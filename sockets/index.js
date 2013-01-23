/*
 * Client connect and post connect event handlers:
 */

 
exports.communicate = function(io){

	io.sockets.on('connection', function (socket) {

		console.log("Client connect.");

		socket.on('test', function (data) {
    		console.log(data);
  		});
  		
	});

};