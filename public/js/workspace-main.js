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
    editor.setValue("hello");
}


/* Handle when a file is dragged onto the editor. */
function handleDragOn(evt) {

    evt.stopPropagation();
    evt.preventDefault();
    alert(evt.dataTransfer);
    var files = evt.dataTransfer.files;
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
        output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ', f.size, ' bytes, last modified: ', f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a', '</li>');
    }

    editor.setValue("");
    editor.setValue('<ul>' + output.join('') + '</ul>');
}

/* Handle when a file is dragged over the editor. */
function handleDragOver(evt) {
    alert(evt);
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy';
}

/**
* Read a local file from the evt.
* @param {Object} evt
*/
function handleFileSelect(evt) {

    var files = evt.target.files;
    // FileList object
    for (var i = 0, f; f = files[i]; i++) {

        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function(theFile) {
            return function(e) {
                uploadClipBoard = e.target.result;
            };
        })(f);
        reader.readAsText(f);
    }
}