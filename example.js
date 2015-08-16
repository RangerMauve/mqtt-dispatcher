var MQTTDispatcher = require("./");

var dispatcher = new MQTTDispatcher();

var log = console.log.bind(console);

dispatcher.on("#", log);

dispatcher.on("foo/bar", function (payload, params, topic) {
	console.log("Always comes first");
	dispatcher.emit("bar", "fizz");
});

dispatcher.on("bar", function (payload, params, topic) {
	console.log("Always comes third");
});

dispatcher.on("foo/#", function (payload, params, topic) {
	console.log("Always comes second");
});

dispatcher.emit("foo/bar", "baz");
