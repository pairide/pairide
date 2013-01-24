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

	var editor = ace.edit("code");
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/javascript");

}