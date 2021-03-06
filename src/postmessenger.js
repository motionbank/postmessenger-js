
// TODO:
// add WebWorkers? https://developer.mozilla.org/en-US/docs/DOM/Using_web_workers
// add WebSockets?

if ( typeof window === 'undefined' ) {
	throw( 'PostMessenger can only run in a window context.' );
}

if ( !( 'JSON' in window ) ) {
	throw( 'Your browser does not support JSON parsing / generation' );
}

var PostMessenger = (function(win){

	var gPostMassengerId = (new Date()).getTime();

	/*
	 +	Utilities
	 +
	 L + + + + + + + + + + + + + + + + + + + */

	var isArray = function ( arr ) {
		return (Object.prototype.toString.call( arr ) === '[object Array]');
	}

	var isRegex = function ( rgx ) {
		return (Object.prototype.toString.call( rgx ) === '[object RegExp]');
	}

	var isFunction = function ( fn ) {
		return fn && (typeof fn === 'function') && (fn instanceof Function);
	}

	var debug = function () {
		if ( false ) {
			if ( 'console' in window && console.log ) {
				console.log( arguments );
			}
		}
	}

	var sendArgsToOpts = function ( nameOrOpts, data, receiver, receiverOrigin ) {
		var opts = !(arguments.length === 1 && typeof nameOrOpts === 'object') ? {
				name: nameOrOpts, 
				data: data, 
				receiver: receiver, 
				receiverOrigin: receiverOrigin
			} : nameOrOpts;
		return opts;
	}

	//#Class Matcher

	 var Matcher = function ( id, matcherFn, callback, context, nameAlias, dataAlias ) {

	 	this.id = id;
	 	var self = this;
	 	this.test = function ( other ) {
	 		var res = matcherFn.apply( self, [other] );
	 		return res;
	 	}
	 	this.callback = callback;
	 	this.context = context;
	 	this.nameAlias = nameAlias;
	 	this.dataAlias = dataAlias;
	 }
	 Matcher.prototype = {
	 	handle : function ( winMessage ) {
	 		if ( typeof winMessage.data !== 'string' ) {
	 			debug( 'Ignored message because it\'s not a json string' );
	 			return;
	 		}
	 		var data = winMessage.dataParsed = JSON.parse( winMessage.data );
	 		if ( this.nameAlias in data && 
	 			  this.test( data[this.nameAlias] ) ) {
	 			// var response = new PostMessenger();
	 			// response.to( winMessage.source );
	 			var matcher = this;
	 			var response = {
	 				send: function () {
	 					var opts = sendArgsToOpts.apply(null, arguments);
	 					opts.receiver = winMessage.source;
	 					opts.receiverOrigin = winMessage.origin;
	 					opts.nameAlias = opts.nameAlias || matcher.nameAlias;
	 					opts.dataAlias = opts.dataAlias || matcher.dataAlias;
	 					opts.callback = opts.context || matcher.context;

	 					PostMessenger.prototype.send.apply(PostMessenger,[opts]);
	 				}
	 			}
	 			this.callback.apply( this.context, [ new Request(this, winMessage), response ] );
	 			return true;
	 		}
	 		return false;
	 	}
	 }


	//#Class Request

	 var Request = function ( matcher, winMessage ) {
	 	this.name = winMessage.dataParsed[matcher.nameAlias];
	 	this.data = winMessage.dataParsed[matcher.dataAlias];
	 	this.source = winMessage.source;
	 	this.origin = winMessage.origin;
	 	this.message = winMessage;
	 	this.params = {};
	 }

	//#Class PostMessenger
	 
	//##PostMessenger constructor
	var PostMessenger = function ( aWindow ) {

		this.hash = btoa( 'PM' + (++gPostMassengerId) ) . toUpperCase();
		debug( 'new PostMessenger#' + this.hash );

		this.allowedOrigins = [];
		this.matchers = [];
		this.receivers = [];
		this.connected = false;

		if ( aWindow ) {
			this.win = aWindow;
			this.winOrigin = this.win.location.protocol + '//' + this.win.location.host;

			this.accept( this.winOrigin );
			this.connect();
		} else {
			this.winOrigin = win.location.protocol + '//' + win.location.host;
		}
	}
	PostMessenger.prototype = {
		/**
		 *	allow( arg [, ...] )
		 *
		 *	Add allowed origins.
		 *
		 *	TODO: 
		 *		add wildcards? ... http://*.moba.org ... http://www.web-*.de
		 *		and/or regex match?
		 */
		//accept()
		accept : function () {
			if ( arguments.length === 0 ) {
				// adds the current origin to allowed origins
				this.accept( this.winOrigin );
			} else if ( arguments.length === 1 ) {
				if ( typeof arguments[0] === 'string' && 
					 this.allowedOrigins.indexOf(arguments[0]) === -1 ) {
					this.allowedOrigins.push( arguments[0] );
				} else if ( isArray( arguments[0] ) && arguments[0].length > 0 ) {
					for ( var i = 0, k = arguments[0].length; i < k; i++ ) {
						this.accept( arguments[0][i] );
					}
				}
			} else if ( arguments.length > 1 ) {
				for ( var i = 0, k = arguments.length; i < k; i++ ) {
					this.accept( arguments[i] );
				}
			}
		},
		/**
		 *	on( matcher, callback [, context] )
		 *
		 *	Wire up the actions to take based upon certain events.
		 *
		 */
		//on()
		on : function ( matcherOrOpts, callback, context ) {

			var opts = !(arguments.length === 1 && typeof matcherOrOpts === 'object') ? {
				matcher: matcherOrOpts, callback: callback, context: context
			} : matcherOrOpts;
			opts.nameAlias = opts.nameAlias || 'name';
			opts.dataAlias = opts.dataAlias || 'data';

			var matcherFn = function () { return false; }
			
			if ( typeof opts.matcher === 'string' ) {
				matcherFn = function ( other ) { return other === opts.matcher };
			} else if ( isRegex( opts.matcher ) ) {
				matcherFn = function ( other ) { return opts.matcher.test( other ) };
			} else if ( isFunction( opts.matcher ) ) {
				matcherFn = function ( other ) { return opts.matcher.apply(null,[other]) };
			} else {
				throw( 'Matcher can only be a string, regex or function.' );
			}

			if ( typeof opts.callback !== 'function' ) {
				throw( 'Callback needs to be a function' );
			}

			if ( !opts.context ) opts.context = null;

			var m = new Matcher( 
				opts.matcher, matcherFn, 
				opts.callback, opts.context, 
				opts.nameAlias, opts.dataAlias );
			this.matchers.push(m);

			return m;
		},
		/**
		 *
		 */
		//connect()
		connect : function () {
			this.win.addEventListener(
				'message', 
				(function connectIIFE (pm){
					return function connectCurry (msg){
				if ( pm.connected ) {
					(function connectHandleReceiveMessage ( winMessage ) {
						if ( this.allowedOrigins.indexOf( winMessage.origin ) !== -1 ) {
							var didMatch = false;
							for ( var i = 0, k = this.matchers.length; i < k; i++ ) {
								if ( this.matchers[i].handle( winMessage ) ) didMatch = true;
							}
							if ( !didMatch ) {
								debug( 'Did not match and was ignored: ' );
								try { debug( winMessage.data, winMessage.origin ); } catch ( e ) {}
								debug( 'Matchers', this.matchers );
							}
						} else {
							console.log( this, winMessage.origin, this.allowedOrigins );
							throw( 'Origin not allowed: '+winMessage.origin );
						}
					}).apply(pm,[msg]);
				}
			}/*connectCurry*/
			})(this)/*connectIIFE*/
			);/*addEventListener*/
			this.connected = true;
		},
		//disconnect()
		disconnect : function () {
			this.connected = false;
		},
		/**
		 *	myMessenger.add( otherWindow );
		 */
		//to()
		to : function ( receiver ) {
			if ( receiver && typeof receiver === 'object' && 'postMessage' in receiver ) {
				this.receivers.push( receiver );
			} else {
				debug( 'This receiver was ignored: ', receiver );
			}
		},
		/**
		 *	This should become : 
		 *		- send( name, data, receiver, receiverOrigin )
		 *		- send({ name: ..., data: ..., receiver: ..., receiverOrigin: ..., nameAlias: ..., dataAlias: ..., args: {...} })
		 */
		//send()
		send : function ( nameOrOpts, data, receiver, receiverOrigin ) {

			var opts = sendArgsToOpts.apply(null, arguments);
			opts.receiverOrigin = opts.receiverOrigin || this.winOrigin;
			opts.nameAlias = opts.nameAlias || 'name';
			opts.dataAlias = opts.dataAlias || 'data';

			var message = {};
			message[opts.nameAlias] = opts.name;
			message[opts.dataAlias] = opts.data;

			if ( opts.args && typeof opts.args === 'object' ) {
				for ( var k in opts.args ) {
					if ( !( k in message ) ) {
						message[k] = opts.args[k];
					}
				}
			}

			if ( opts.receiver ) {
				var msg = JSON.stringify(message);
				if ( 'postMessage' in opts.receiver && opts.receiver.postMessage ) {
					opts.receiver.postMessage( msg, opts.receiverOrigin );
				}
			} else if ( this.receivers.length > 0 ) {
				var msg = JSON.stringify(message);
				for ( var i = 0, k = this.receivers.length; i < k; i++ ) {
					this.receivers[0].postMessage( msg, opts.receiverOrigin ); // TODO: same origin only?
				}
			}
		}
	}
	return PostMessenger;
})(window);

if (module && module.exports) {
    module.exports = PostMessenger
}