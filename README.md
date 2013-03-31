## A middleware for window.postMessage a la connect for node.js ##

fjenett - 2013-03-31

See:
https://developer.mozilla.org/en-US/docs/DOM/window.postMessage

Idea:
	var messanger = require('postmessanger');

	// only listen to these origins:

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

	messanger.send('name', {/* data */}, otherWindow, otherWindowOrigin );
	// or
	messanger.connect( otherWindow [, otherWindowOrigin='*'] );
	messanger.send('name', {/* data */});
	// or
	messanger.autoConnect(true); // if messages come in senders will be auto registered
	messanger.send('name', {/* data */});
