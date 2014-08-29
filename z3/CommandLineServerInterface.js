lively.ide = lively.ide || {};
if (!lively.ide.CommandLineInterface) {
    lively.ide.CommandLineInterface = {
        run: function (commandString, options, thenDo) {
            throw "The deployment should have defined lively.ide.CommandLineInterface.run"
        },
        runAll: function (commandSpecs, thenDo) {
            throw "The deployment should have defined lively.ide.CommandLineInterface.runAll"
        },
        cwd: function () {
            throw "The deployment should have defined lively.ide.CommandLineInterface.cwd"
        },
    }
}
