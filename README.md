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

	// uses simple format to wrap message data:
	// {
	//    name: 'myFunkyName',
	//	  data: <actual message data here>
	// }
	// where the name acts like a query

	messanger.on('setMessage',function( message [, params [, origin [, source]]] ){
		myAppView.display( message );
	});	

	// regex matching
	messanger.on(/set*/,function( data [, params [, origin [, source]]] ){
		myAppView.setAlways( data );
	});

	// params
	messanger.on('set/:that/to/:type',function( data [, params [, origin [, source]]] ){
		console.log( params ); // -> { that: <..>, type: <..> }
	});

	messanger.send( otherWindow, {/* data */}, otherWindowOrigin );
	// or
	messanger.connect( otherWindow [, otherWindowOrigin='*'] );
	messanger.send({/* data */});
	// or
	messanger.autoConnect(true); // if messages come in senders will be auto registered
	messanger.send(/* data */);