## A middleware for window.postMessage a la connect for node.js ##

fjenett - 2013-03-31

See:
https://developer.mozilla.org/en-US/docs/DOM/window.postMessage

Idea:
var messanger = require('postmessanger');

messanger.listen('http://motionbank.org');
// or
messanger.listen([
	'http://motionbank.org', 
	'http://theforsythecompany.com'
]);

messanger.on('setMessage',function( message [,origin [, source]] ){
	myAppView.display( message );
});

messanger.send( otherWindow, {/* data */}, otherWindowOrigin );
// or
messanger.connect( otherWindow [, otherWindowOrigin='*'] );
messanger.send({/* data */});
// or
messanger.autoConnect(true); // if messages come in senders will be auto registered
messanger.send(/* data */);