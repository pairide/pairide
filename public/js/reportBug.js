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