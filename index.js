"user strict";
var MQTTEmitter = require("mqtt-emitter");
var MQTT = require("mqtt");
var isString = require("is-string");
var isObject = require("is-object");

module.exports = MQTTDispatcher;

function MQTTDispatcher(connection, options) {
	options = options || {};
	if (isString(connection)) {
		this.client = mqtt.connect(connection, options);
	} else if (isObject(connection)) {
		if (connection.on) {
			this.client = connection;
		} else {
			this.client = mqtt.connect(connection);
		}
	} else if (connection) {
		// Lolwat??
		throw new TypeError("Invalid Arguments For MQTTDispatcher");
	}

	this._init();
}

MQTTDispatcher.prototype = {
	_init: init,
	emit: emit
};

["addListener", "on", "once", "removeListener", "removeAllListeners", "listeners"].forEach(relay_call, MQTTDispatcher.prototype);

function emit(event, data) {
	this.eventQueue.push([event, data]);

	if (!this.isProcessing) {
		this.isProcessing = true;
		var item;
		while ((item = this.eventQueue.shift())) {
			try {
				this.events.emit(item[0], item[1]);
			} catch (e) {
				this.events.emit("$/error", e);
			}
		}
		this.isProcessing = false;
	}

	return this;
}

function init() {
	this.events = new MQTTEmitter();
	this.eventQueue = [];
	this.isProcessing = false;

	if (!this.client) return;

	var relay = relay_event.bind(this);
	["connect", "reconnect", "close", "offline", "error"].forEach(relay);

	client.on("message", handle_event.bind(this));

	this.events.onadd = handle_subscribe.bind(this);
	this.events.onremove = handle_unsubscribe.bind(this);
}

function handle_event(topic, message) {
	try {
		message = JSON.parse(message);
	} catch (e) {
		// Must not be JSON
	}
	this.events.emit("$in/" + topic, message);
	this.events.on("$out/#", handle_out.bind(this));
}

function handle_out(payload, params, topic) {
	var actual_topic = topic.slice(4);

	this.client.publish(actual_topic, JSON.stringify(topic));
}

function handle_subscribe(topic) {
	if (isIn(topic))
		this.client.subscribe(topic);
}

function handle_unsubscribe(topic) {
	if (isIn(topic))
		this.client.unsubscribe(topic);
}

function relay_call(name) {
	this[name] = function () {
		return this.events[name].apply(this.events, arguments);
	};
}

function relay_event(client, events, event) {
	client.on(event, function (data) {
		events.emit("$/" + event, data);
	});
}

function isIn(topic) {
	return topic.slice(0, 4) === "$in/";
}
