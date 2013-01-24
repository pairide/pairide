var language = "python";

$(document).ready(function(){
	setUpEditor();
	requestWorkspace();

});

/*
 * Make an ajax request for the users files.
 */
function requestWorkspace(){
	$('#fileTree').fileTree({
        root: '/',
        script: 'fileconnector',
        expandSpeed: 350,
        collapseSpeed: 350,
        multiFolder: false
    }, function(file) {
        alert(file);
    });	
}
/* Set up editor space with syntax highlighting,
*  auto-indent and bracket matching.
*/
function setUpEditor() {

	var editor = ace.edit("code");
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/javascript");
    document.getElementById('code').style.fontSize='14px';

}