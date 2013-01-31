/*Socket handling for express sessions */
var socket = connect();

/*Socket logic for client*/
$(document).ready(function(){
    load(socket, "express", "model_name");
});