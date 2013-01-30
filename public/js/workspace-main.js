var language = "python";
var editor;
var uploadClipBoard = "";
$(document).ready(function(){
	setUpEditor();
	requestWorkspace();
    $('#code').on('dragover', handleDragOver);
    $('#code').on('drop', handleDragOn);
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

	editor = ace.edit("code");
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/javascript");
    document.getElementById('code').style.fontSize='14px';
}


/* Handle when a file is dragged onto the editor using some html5.
 * This may not work for all browsers.
 */
function handleDragOn(evt) {

    // Check for the various File API support.
    if (!(window.File && window.FileReader && window.FileList)) {
        //may want to supress this later
      alert('Your browser does not fully support drag and drop.');
      return;
    } 
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer = evt.originalEvent.dataTransfer;
    if (!evt.dataTransfer) return;
    var files = evt.dataTransfer.files;
    
    //only read the first file on the filelist
    //although the client may be dragging more then one at a time
    //the others are ignored; this is a design choice.
    if (files && files[0]){
        var f = files[0];
        editor.setValue(""); //clear it
        handleFileSelect(f);
        editor.setValue(uploadClipBoard);
    }

    
}

/* Handle when a file is dragged over the editor. */
function handleDragOver(evt) {
    evt.dataTransfer = evt.originalEvent.dataTransfer;
    if (!evt.dataTransfer) {
        return;
    }
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy';
}

/**
 * Reads a file on the clients computer and sets the upload clip board
 * to the files contents.
 */
function handleFileSelect(f) {
    var reader = new FileReader();
    // Closure to capture the file information.
    reader.onload = (function(theFile) {
        return function(e) {
            uploadClipBoard = e.target.result;
        };
    })(f);
    reader.readAsText(f);
}