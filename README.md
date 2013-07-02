A middleware for window.postMessage
============================================================

// DO NOT YET USE IN PRODUCTION //

This project was inspired by things like connect for node.js. The idea is to abstract and simplify the messaging between windows or iframes. Both sides listen and respond to specific messages they agree on allowing for a simple way to implement protocols and answer-response setups.

See: 
- https://developer.mozilla.org/en-US/docs/Web/API/window.postMessage
- https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent
- https://developer.mozilla.org/en-US/docs/Web/API/window.open
- http://caniuse.com/#search=postmessage

At some future point maybe even:
- https://developer.mozilla.org/en-US/docs/Web/API/Worker
- https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

Extremely helpfull for debugging:
- http://www.briangrinstead.com/blog/chrome-developer-tools-monitorevents

## Mockup use case ##

Set up the messenger:

	var messenger = require('postmessenger');

	// only trust these origins:

Optionally trust specific domains / origins (script's own origin is added by default):

	messanger.accept('http://motionbank.org');
	// or
	messanger.accept([
		'http://motionbank.org', 
		'http://theforsythecompany.com'
	]);

A per default message consists of:

	// uses simple format to wrap message data:
	// {
	//    name: 'myFunkyName',
	//	  data: <actual message data here>
	// }

	( Note that this can be overriden in both .on() and .send(). )

Now set up "routes" / message signatures to listen to and add callbacks:

	// the name acts like a query and unmatched names will be ignored

	messanger.on('aMessageName',function( request, response ){

		// request:
		// {
		//    name: <message originalMessage.data.name>,
		//    data: <message originalMessage.data.data>,
		//    params: { <parsed from name> },
		//    origin: <message originalMessage.origin>,
		//    source: <message originalMessage.source>
		// }

		// response is a messanger bound to the origin and source, so that you can:
		// response.send(<name>,<data>);

		myAppView.display( request.data );
	});	

	// regex matching
	messanger.on(/set*/,function( request ){
		myAppView.setAlways( request.data );
	});

	// params
	messanger.on('set/:that/to/:type',function( request ){
		console.log( request.params ); // -> { that: <..>, type: <..> }
	});

Sending messages is as easy:

	messanger.send('name', {/* data */}, otherWindow, otherWindowOrigin );
	// or
	messanger.to( otherWindow [, otherWindowOrigin='*'] );
	messanger.send('name', {/* data */});
	// or
	messanger.auto(true); // if messages come in senders will be auto registered
	messanger.send('name', {/* data */});

	// send a message to all clients except the excluded
	messanger.transport(message, [excludeWindow]);

Note that not all of this is fully implemented yet.

If you use it, i want links to your projects!

