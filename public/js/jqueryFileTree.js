/**
 * JQuery File Tree handles the client side view of the filetree browser.  
 * Some changes had to be made here to collaborate with the server.
 * Specifically, when the driver expands or collapses a folder all navigators
 * are notified to do the same to synchronize the filetree.
 */



// jQuery File Tree Plugin
//
// Version 1.01
//
// Cory S.N. LaViska
// A Beautiful Site (http://abeautifulsite.net/)
// 24 March 2008
//
// Visit http://abeautifulsite.net/notebook.php?article=58 for more information
//
// Usage: $('.fileTreeDemo').fileTree( options, callback )
//
// Options:  root           - root folder to display; default = /
//           script         - location of the serverside AJAX file to use; default = jqueryFileTree.php
//           folderEvent    - event to trigger expand/collapse; default = click
//           expandSpeed    - default = 500 (ms); use -1 for no animation
//           collapseSpeed  - default = 500 (ms); use -1 for no animation
//           expandEasing   - easing function to use on expand (optional)
//           collapseEasing - easing function to use on collapse (optional)
//           multiFolder    - whether or not to limit the browser to one subfolder at a time
//           loadMessage    - Message to display while initial tree loads (can be HTML)
//
// History:
//
// 1.01 - updated to work with foreign characters in directory/file names (12 April 2008)
// 1.00 - released (24 March 2008)
//
// TERMS OF USE
// 
// This plugin is dual-licensed under the GNU General Public License and the MIT License and
// is copyright 2008 A Beautiful Site, LLC. 
//

/**
 * Notifies the server that the file or directory located at
 * some path has been clicked.
 */
function sendActivePath(path){
	if (isDriver){	
		socket.emit("driver_file_click", 
			{
	        	room:roomname, 
				user:username,
				filePath:path
			});
	}
}
/**
 * Gradually expands directories to match the clients filebrowser
 * with the drivers.
 */
function expand(){

	if (delayedExpansions && delayedExpansions.length){
		var obj = $('a[rel="' + delayedExpansions[0] + '"]');
		if (obj.length){
			forceClick(obj)
		}
		else{
			console.log("Missing file with rel path = " + delayedExpansions[0]);
		}
		delayedExpansions.splice(0, 1);
	}
}

if(jQuery) (function($){
	
	$.extend($.fn, {
		fileTree: function(o, h) {
			// Defaults
			if( !o ) var o = {};
			if( o.root == undefined ) o.root = '/';
			if( o.script == undefined ) o.script = 'jqueryFileTree.php';
			if( o.folderEvent == undefined ) o.folderEvent = 'click';
			if( o.expandSpeed == undefined ) o.expandSpeed= 500;
			if( o.collapseSpeed == undefined ) o.collapseSpeed= 500;
			if( o.expandEasing == undefined ) o.expandEasing = null;
			if( o.collapseEasing == undefined ) o.collapseEasing = null;
			if( o.multiFolder == undefined ) o.multiFolder = true;
			if( o.loadMessage == undefined ) o.loadMessage = 'Loading...';
			if(o.sID == undefined) o.sID = null;
			if(o.room == undefined) o.room = null;
			
			$(this).each( function() {
				//t is the path, c seems to be a DOM object
				function showTree(c, t) {
					sendActivePath(t);
					$(c).addClass('wait');
					$(".jqueryFileTree.start").remove();
					$.post(o.script, { dir: t, sID: o.sID, room: o.room}, function(data) {
						$(c).find('.start').html('');
						$(c).removeClass('wait').append(data);
						if( o.root == t ) {
							$(c).find('UL:hidden').show(400, expand); 
						} else{ 
							$(c).find('UL:hidden').slideDown(
								o.expandSpeed, 
								o.expandEasing,
								expand
							);
						}
						bindTree(c, t);
					});
				}
				
				function bindTree(t, c) {
					$(t).find('LI A').bind(o.folderEvent, function(e, byTrigger) {
						if (byTrigger != true && !isDriver) return
						if( $(this).parent().hasClass('directory') ) {
							if( $(this).parent().hasClass('collapsed') ) {
								// Expand
								if( !o.multiFolder ) {
									$(this).parent().parent().find('UL').slideUp(
											o.collapseSpeed, 
											o.collapseEasing,
											function(){}
										);
									$(this).parent().parent().find('LI.directory').removeClass('expanded').addClass('collapsed');
								}
								$(this).parent().find('UL').remove(); // cleanup
								showTree( $(this).parent(), escape($(this).attr('rel').match( /.*\// )) );
								$(this).parent().removeClass('collapsed').addClass('expanded');
							} else {
								// Collapse
								sendActivePath($(this).attr("rel"));
								$(this).parent().children('UL').slideUp(
										o.collapseSpeed, 
										o.collapseEasing,
										expand);
								$(this).parent().removeClass('expanded').addClass('collapsed');
							}
						} else {
							if(currentHighlightedFile)
								currentHighlightedFile.removeClass("current_file");
							currentHighlightedFile = $(this);
							$(this).addClass("current_file");
							h($(this).attr('rel'));
						}
						return false;
					});
					// Prevent A from triggering the # on non-click events
					if( o.folderEvent.toLowerCase != 'click' ) $(t).find('LI A').bind('click', function() { return false; });
				}
				// Loading message
				$(this).html('<ul class="jqueryFileTree start"><li class="wait">' + o.loadMessage + '<li></ul>');
				// Get the initial file list
				showTree( $(this), escape(o.root) );
			});
		}
	});
	
})(jQuery);