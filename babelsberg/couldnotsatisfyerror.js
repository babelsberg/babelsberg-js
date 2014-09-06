module('users.timfelgentreff.babelsberg.couldnotsatisfyerror').requires().toRun(function() {
	Error.subclass("CouldNotSatisfyError", {
		initialize: function CouldNotSatisfyError(msg) {
			if (Error.captureStackTrace) {
				Error.captureStackTrace(this, CouldNotSatisfyError);
			} else {
				this.stack = (new Error).stack || '';
			}
			this.message = msg;
		},
		name: "CouldNotSatisfyError"
	});
});
