var language = "python";

$(document).ready(function(){
	setUpEditor();

	$('#fileTree').fileTree({
        root: '/',
        script: 'fileconnector',
        expandSpeed: 1000,
        collapseSpeed: 1000,
        multiFolder: false
    }, function(file) {
        alert(file);
    });	
});


/* Set up editor space with syntax highlighting,
*  auto-indent and bracket matching.
*/
function setUpEditor() {

	editor = CodeMirror.fromTextArea(document.getElementById("code"), {
		mode : {
			name : language
		},
		lineNumbers : true,
		indentUnit : 4,
		tabMode : "shift",
		theme : "monokai",
		matchBrackets : true
		//onChange : sendCode
	});

}