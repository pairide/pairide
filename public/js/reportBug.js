/* This contains all scripts needed for the report a bug page. */

$(document).ready(function(){

  $('#reportBugForm').validate({
    errorElement: "span",
    rules: {
      bugReportBox : {
        required: true,
        minlength: 10,
        maxlength: 1024
      },
      bugReportEmail: { 
        required: true, 
        email: true 
      },
    }
  });
});