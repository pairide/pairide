/*
 * This script has code that is common to both express and user
 * workspaces. It is different to basesockets.js, in that it does not
 * contain any socket code. For example, drag and drop is implemented
 * here because both have this feature.
 */

//The current selected language to view code with.
var language = "Python";
//The Ace editor object.
var editor;
var Range;
var annotBoxLeft;
//The current highlighted file in the filebrowser.
var currentHighlightedFile = null;
//A dictionary of supported languages.
var languages = {"Python " : "python",
                 "Javascript " : "javascript",
                 "Java " : "java",
                 "C/C++ " : "c_cpp",
                 "SQL " : "sql"};


$(document).ready(function(){
  setUpEditor(language);

  $(window).bind('beforeunload', function (){
    return "You are the admin. Leaving the room will terminate it."
  ;});

  //Set up language label and selection
  for (var lang  in languages){
    var str_link = "<li id=lang_" + languages[lang] + "><a href='#'>" + lang + "</a></li>";
    $("#languageList").append(str_link);
  }

  //highlight is set to python by default
  $("#lang_python a")
    .append("<i class='icon-ok'></i>");

  //Listener for language change
  $("#languageList li").click(function(e){
    $("#languageList li a i").remove();
    $(this).children().append("<i class='icon-ok'></i>");
    $('#current_language').dropdown('toggle');
    changeLanguage(e.target.text);
    return false;
  });

  var codeDiv = document.getElementById("code");
  // init event handlers for drag and drop
  codeDiv.addEventListener("dragenter", dragEnter, false);
  codeDiv.addEventListener("dragexit", dragExit, false);
  codeDiv.addEventListener("dragover", dragOver, false);
  codeDiv.addEventListener("drop", drop, false);

  $('#userModal').modal({show: true});

  editor.getSession().selection.on('changeSelection', function(e) {
    handleSelection(editor.getSession().selection.getRange());
  });

  // Annotation request.
  $("#anoLink").on("click", function(){
    handleAnnotation();
    return false;
  });

  $('#driver').on('click', function(){
    return false;
  });

  $("#annotBtn").on("click", function(){
    addAnnotation();
  });

  $("#annotModal").keypress(function(e){
    var code = (e.keyCode ? e.keyCode : e.which);
    if(code == 13) { //Enter keycode
      addAnnotation();
    }
  });

  $(".annotation").on("dblclick", function(e){
    var r=confirm("Are you sure you want to delete?");
    if(r){
      removeAnnotationSend(e.target.id);
    }
  });

  Range = require("ace/range").Range;
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

  var annotBoxLeft = parseInt($(".ace_print-margin").css("left"), 10) +  50 + "px";

  var annotBox = $("<div/>");
  annotBox.attr("id", "annotBox");
  annotBox.css("position", "relative");
  annotBox.css("left", annotBoxLeft);
  annotBox.css("width", "20px");
  annotBox.css("height", "100px");

  $("#code").append(annotBox);
}

/*Handle language change request by the user*/
function changeLanguage(lang){
  language = languages[lang];
  editor.getSession().setMode("ace/mode/"+language);
  if(isDriver){
    socket.emit("lang_change", {language: lang});
  }
}

/*Display a custom error message on the workspace
  - hide should be true to toggle the automatic
  fadeout of the message.*/
function showMessage(message, hide){
  $("#error_alert_msg").html(message);
  $("#error_alert").show();
  var messageTimeout = null;

  // Timeout for the message's auto fadeout.
  if(hide){
    messageTimeout = setTimeout(
      function(){
        $("#error_alert").fadeOut();
      },
      10000
    );
  }

  // Handle the close button event.
  $("#error_alert .close").one('click', function(){
    $("#error_alert").hide();
      if(messageTimeout){
        window.clearTimeout(messageTimeout);
      }
  });
}

/*
 * Show a loader message on the top pane.
 */
function show_loader(message){
  $("#loader_msg").html(message);
  $("#loader_img").show();
  $("#loader").fadeIn();
}

/*
 * Hide the loader message.
 */
function hide_loader(){
  $("#loader").delay(3000).fadeOut();
}

/*
 * Prevents default behaviour from occuring for an event.
 */
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

/*
 * Handles when files are dropped onto the editor.
 */
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

/*
 * Internal to function drop. Begins the HTML5
 * reading on the first file in the filelist.
 */
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

/* 
 * Internal to function "handleFiles".
 * Handles when the filereader has finished reading 
 * the file that had been dragged and dropped. This
 * pushes the files content onto the editor.
 */
function handleReaderLoadEnd(evt) {
  //update the editor with the files content
  editor.getSession().setValue(evt.target.result);
}

//Prevent the default behaviour attached to the escape key.
//For some browsers the escape key will kill all javascript including ajax
//transports.
$(document).keypress(function(e){
  var code = (e.keyCode ? e.keyCode : e.which);

  if(code == 27) { //Escape key
    preventDefaultEvent(e);
  }
  else if (code == 9 && e.ctrlKey){ //check for TAB + CTRL
    preventDefaultEvent(e);
    if (editor.getReadOnly() || !$("#msg").is(":focus")){
      $("#msg").focus();
    }
    else{
      editor.focus();
    }
  }
});

