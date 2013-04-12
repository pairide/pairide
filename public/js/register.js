$(document).ready(function(){

  jQuery.validator.addMethod("validUsername", 
                              validUsername, 
                              "Username cannot start with the string \"guest_\"");

  var validator = $('#registration_form').validate({
    errorElement: "span",
    rules: {
      first: "required",
      last: "required",
      username: { 
        required: true,
        minlength: 4,
        maxlength: 20,
        validUsername: true
      },
      email: { 
        required: true, 
        email: true 
      },
      pass: {
        required: true,
        minlength: 4,
        maxlength: 64
      },
      confirm_pass: {
            equalTo: "#password"
        }
    }
  });
});

function validUsername(){
  var username = $("#username input").val();
  //alert(username);
  var invalidRegex = /^guest_.*/i;

  if(invalidRegex.exec(username) != null){
    return false;
  }
  
  return true;
}