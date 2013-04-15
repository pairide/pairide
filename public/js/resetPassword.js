/* This contains all scripts needed for the reset password page. */

$(document).ready(function(){

  $('#resetPasswordForm').validate({
    errorElement: "span",
    rules: {
      email: { 
        required: true, 
        email: true 
      }
    }
  });
});