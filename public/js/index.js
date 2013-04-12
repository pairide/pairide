$(document).ready(function(){
  
  $('#create_session').ajaxForm(function(data) { 
    if (!data.result){
      alert("This room already exists.");
    }
    else if(data.valid == null){
      alert("Room name is invalid.");
    }
    else{
      window.location.replace("/workspace/" + encodeURIComponent(data.room));
    }
    });

  $('#login_form').validate({
    errorElement: "p",
    rules: {
      user: "required",
      password: "required"
    }
  });
});
