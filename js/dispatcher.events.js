// JavaScript Document

var EventDispatcher = Class.create({
	
	initialize : function () {
		this.eventListeners = {};
		this.uuid = this.guid();
	},
    	
	addEventListener : function (event, func) {
		if (!this.eventListeners[event]) {
			this.eventListeners[event] = [];
		}
		this.eventListeners[event].push(func);
	},
	
	removeEventListener : function (event, func) {
		if (this.eventListeners[event]) {
			var indexOfListener = this.eventListeners[event].indexOf(func);
			if (indexOfListener >= 0) {
				this.eventListeners[event].splice(indexOfListener, 1);
			}
		}
	},
	
	/**
	 * Dispatches custom events.
	 *
	 * @param event - The event type string
	 * @param arguments - Either an array of arguments or a custom event object
	 */
	dispatchEvent : function (event, arguments) 
	{
		var args = [];
		
		if (arguments != null)
		{
			if (arguments instanceof Array) {
				// as an array of arguments
				var argLen = arguments.length;
				for (var i = 0; i < argLen; i++) {
					args.push(arguments[i]);
				}
			} else {
				// as a structured custom event 
				args.push(arguments);
			}
		}
		if (this.eventListeners[event]) {
			var len = this.eventListeners[event].length;
			for (var j = 0; j < len; j++) {
				this.eventListeners[event][j].apply(this, args);
			}
		}
		return this;
	},
	
	// GUID / UUID
	s4 : function () {
		return Math.floor((1 + Math.random()) * 0x10000)
				   .toString(16)
				   .substring(1);
	},
	
	guid : function () {
		return this.s4() + this.s4() + this.s4() + this.s4() + 
			   this.s4() + this.s4() + this.s4() + this.s4();
	}
	
});