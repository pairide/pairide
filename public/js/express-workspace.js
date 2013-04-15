/* This contains all the code related to express workspaces only */

var socket = connect();
var username = "";

$(document).ready(function(){

  if(!auth){
    //Get user's name and load the session.
    $('#nameFormBtn').on("click", function(){
      set_user();
      return false;
    });
    $('#userModal input').keypress(function(e){
       var code = (e.keyCode ? e.keyCode : e.which);
      if(code == 13) { //Enter keycode
          set_user();
      } 
    });
    
  }
  else{
    //Make sure that registered user doesn't have more than one tab per
    //room.
    $.when(check_username(socket, "express", username)).
    then(function(duplicate){
      if(duplicate){
        alert("You can only have one tab for each workspace.");
        window.location.replace(url);
      }
      else{
        load(socket, "express", username);
      }
    });
  }
});

function set_user(){
  username = "guest_" + $("#username").val();

  //Check if username is not already taken 
  //before assigning it.
  $.when(check_username(socket, "express", username)).
    then(function(duplicate){
      if(duplicate){
        $("#username").val('');
        $("#userModal .error").text('Sorry, this name is already taken.');
      }
      else{
        load(socket, "express", username);
        $('#userModal').modal('hide');
      }
    });
  return false;
}

