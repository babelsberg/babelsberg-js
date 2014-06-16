module('users.timfelgentreff.z3.CommandLineZ3').requires('users.timfelgentreff.z3.NaClZ3', "lively.ide.CommandLineInterface").toRun(function() {
    NaCLZ3.subclass("CommandLineZ3", {
        loadModule: function () {
            // No module used
        },
    
        postMessage: function (string) {
            string = "(set-option :pp.decimal true)\n" +
                string +
                ("\n(check-sat)\n(get-value (" + this.variables.inject("", function (acc, v) {
                    return acc + v.name + " "
                }) + "))");
            // console.log(string);
            var commandString = this.constructor.z3Path + ' -T:4 -smt2 -in',
                self = this;
            
            
            lively.ide.CommandLineInterface.run(
                commandString,
                {sync: this.sync, stdin: string},
                function (r) {
                    this.applyResult(r.getStdout() + r.getStderr());
                }.bind(this)
            );
        },
        initialize: function($super, sync) {
            this.sync = !!(sync || true);
            $super();
        },
        applyResult: function(result) {
            debugger
            // console.log(result);
            if (result.startsWith("sat")/* || result.indexOf("\nsat\n") != -1 */) {
                var idx = result.indexOf("sat\n");
                result = result.slice(idx + "sat".length, result.length - 1);
                // remove outer parens
                result = result.trim().slice(1, result.length - 1);
        
                var assignments = result.split("\n").map(function (str) {
                    var both = str.trim().slice(1, str.length - 1).split(" ");
                    if (both.length < 2) return;
                    both = [both[0].trim(), both.slice(1, both.length).join(" ").trim()];
                    
                    var name = both[0];
                    var value = this.parseAndEvalSexpr(both[1]);
                    return {name: name, value: value};
                }.bind(this));
                assignments.each(function (a) {
                    this.varsByName[a.name].value = a.value;
                    if (!this.sync) {
                        this.cvarsByName[a.name].suggestValue(a.value);
                    }
                }.bind(this));
            } else if (result.startsWith("unsat")) {
                debugger
                throw "Unsatisfiable constraint system";
            } else {
                throw "Z3 failed to solve this system";
            }
        },
    });

Object.extend(CommandLineZ3, {
    modulePath: module('users.timfelgentreff.z3.CommandLineZ3').relativePath().replace("CommandLineZ3.js", ""),
    z3Path: lively.ide.CommandLineInterface.cwd() + "/" + Config.codeBase.replace(Config.rootPath, "") + CommandLineZ3.modulePath + "z3"
});


}) // end of module
