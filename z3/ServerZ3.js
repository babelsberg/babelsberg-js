CommandLineZ3.subclass("ServerZ3", {
    loadModule: function () {
        Z3ServerInterface.evalSync("(set-option :pp.decimal true)", function (err, result) {
            if (err) throw err;
        });
    },
    
    reset: function () {
        Z3ServerInterface.resetZ3Server();
        return this;
    },

    postMessage: function (string) {
        Z3ServerInterface.evalSync( // TODO: avoid resetting, introduce bool variables to track constraints
            "(reset)\n" +
                string +
                "(check-sat)\n" +
                "(get-value (" + this.variables.inject("", function (acc, v) {
                    return acc + v.name + " "
                }) + "))",
            function (err, result) {
                if (err) throw err;
                this.applyResult(result);
            }.bind(this)
        );
    },
    initialize: function($super, sync) {
        $super(sync);
    },

});
