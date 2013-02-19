var language = "Python";
var editor;
var uploadClipBoard = "";
var Range;
var annotBoxLeft;
var languages = {"Python" : "python",
                 "Javascript" : "javascript",
                 "Java" : "java",
                 "C/C++" : "c_cpp",
                 "SQL" : "sql"};

$(document).ready(function(){
	setUpEditor(language);

    //Set up language label and selection
    $("#current_language").html(language);
    for (language  in languages){
        var str_link = "<li><a href='#'>" + language + "</a></li>";
        $("#languageList").append(str_link);
    }
    //Listener for language change
    $("#languageList li").click(function(e){
        changeLanguage(e);
    });
    $('#code').on('dragover', handleDragOver);
    $('#code').on('drop', handleDragOn);
    $('#userModal').modal({show: true});

    editor.getSession().selection.on('changeSelection', function(e) {
        handleSelection(editor.getSession().selection.getRange());
    });

    $("#anoLink").on("click", function(){
        handleAnnotation();
    });

    $("#annotBtn").on("click", function(){
        addAnnotation();
    });

    $(".annotation").live("dblclick", function(e){
        removeAnnotationSend(e.target.id);
    })

    Range = require("ace/range").Range;

  /*  $("#debug").on("click", function(){
        var r = new Range(0, 3, 0, 7);
        //editor.session.selection.addRange(r);

        //editor.addSelectionMarker(r);
        //editor.getSession().addMarker(r,"wutwut","text", false);
        //
        
        editor.setValue("sup");
    });*/

});

/* Set up editor space with syntax highlighting,
*  auto-indent and bracket matching.
*/
function setUpEditor(lang) {

	editor = ace.edit("code");
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/"+lang.toLowerCase());
    document.getElementById('code').style.fontSize='14px';
    editor.getSession().setUseWrapMode(true);
    editor.getSession().setWrapLimitRange(80, 80);

    var annotBoxLeft = parseInt($(".ace_print-margin").css("left")) +  50 + "px"

    //$(".ace_gutter-cell.ace_breakpoint").css("left", annotBoxLeft);

    var annotBox = $("<div/>");
    annotBox.attr("id", "annotBox");
    annotBox.css("position", "relative");
    annotBox.css("left", annotBoxLeft);
    annotBox.css("width", "20px");
    $("#code").append(annotBox);



        //var range = data.range;
   /* var margin_top = 1 * 20;
    var annot_height = ((4) + 1) * 20;

    var annot = $("<div/>");
    annot.css("margin-top", margin_top + "px");
    annot.css("height", annot_height + "px");
    annot.css("width", "10px")
    annot.css("background", "#8EC21F");

    $("#annotBox").append(annot);

    annot.popover({
        "trigger": "hover",
        "content": "Hey what's up?",
    })*/
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

/*Handle language change request by the user*/
function changeLanguage(e){
    var lang = e.target.text;
    language = languages[lang];
    $("#current_language").html(lang);
    editor.getSession().setMode("ace/mode/"+language);
}

function showMessage(message, hide){
    $("#error_alert_msg").html(message);
    $("#error_alert").fadeIn();

    if(hide){
        setTimeout(
            function(){
                $("#error_alert").fadeOut();
            },
            10000
        )
    }
}