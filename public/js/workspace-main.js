var language = "Python";
var editor;
var uploadClipBoard = "";
var Range;
var annotBoxLeft;
var currentHighlightedFile = null;
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
        changeLanguage(e.target.text);
    });

    var codeDiv = document.getElementById("code")
    // init event handlers for drag and drop
    codeDiv.addEventListener("dragenter", dragEnter, false);
    codeDiv.addEventListener("dragexit", dragExit, false);
    codeDiv.addEventListener("dragover", dragOver, false);
    codeDiv.addEventListener("drop", drop, false);

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



/*Handle language change request by the user*/
function changeLanguage(lang){
    language = languages[lang];
    $("#current_language").html(lang);
    editor.getSession().setMode("ace/mode/"+language);
    if(isDriver){
        socket.emit("lang_change", {language: lang});
    }
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

function show_loader(message){
    $("#loader_msg").html(message);
    $("#loader_img").show();
    $("#loader").fadeIn();
}

function hide_loader(){
    $("#loader").delay(3000).fadeOut();
}


function preventDefaultEvent(evt){
    evt.stopPropagation();
    evt.preventDefault();
}
function dragEnter(evt) {
    preventDefaultEvent(evt);
}

function dragExit(evt) {
    preventDefaultEvent(evt);
}

function dragOver(evt) {
    preventDefaultEvent(evt);
    evt.dataTransfer.dropEffect = 'copy';
}

function drop(evt) {
    preventDefaultEvent(evt);
    if (!(window.File && window.FileReader && window.FileList)) {
      alert('Your browser does not fully support drag and drop.');
      return;
    } 

    var files = evt.dataTransfer.files;
    // Check if at least one file has been dropped
    if (files.length > 0)
        handleFiles(files);
}


function handleFiles(files) {
    //clear editor for file contents
    editor.getSession().setValue("");
    var file = files[0];
    var reader = new FileReader();
    // init the reader event handlers
    reader.onloadend = handleReaderLoadEnd;

    // begin the read operation
    reader.readAsBinaryString(file);
}

function handleReaderLoadEnd(evt) {
     editor.getSession().setValue(evt.target.result);
}