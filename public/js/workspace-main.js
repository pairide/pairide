language = "python";

$(document).ready(function(){
	setUpEditor();
});


/* Set up editor space with syntax highlight,
*  auto-indent and bracket matching
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