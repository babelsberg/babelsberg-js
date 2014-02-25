module('users.timfelgentreff.z3.CommandLineZ3').requires('users.timfelgentreff.z3.NaClZ3').toRun(function() {
    NaCLZ3.subclass("CommandLineZ3", {
    loadModule: function () {
        // No module used
    },
    evalFloat: function(arg) {
        if (arg.match(/\//)) {
            var nomden = arg.split("/")
            return parseFloat(nomden[0])/parseFloat(nomden[1])
        } else {
            return parseFloat(arg)
        }
    },
    postMessage: function (string) {
        string += ("\n(check-sat)\n(get-value (" + this.variables.inject("", function (acc, v) {
            return acc + v.name + " "
        }) + "))");
        console.log(string);
        var commandString = CommandLineZ3.z3Path + ' -smt2 -in',
            self = this;
        
        lively.ide.CommandLineInterface.run(
            commandString,
            {sync: true, stdin: string},
            function (r) {
                this.applyResult(r.getStdout());
            }.bind(this)
        );
    },
    initialize: function($super) {
        $super();
    },
    applyResult: function(result) {
        console.log(result);
        if (result.startsWith("sat")) {
            result = result.slice("sat".length, result.length - 1);
            // remove outer parens
            result = result.trim().slice(1, result.length - 1);
    
            assignments = result.split("\n").map(function (str) {
                var both = str.trim().slice(1, str.length - 1).split(" ");
                if (both.length < 2) return;
                both = [both[0].trim(), both.slice(1, both.length).join(" ").trim()];
                
                var name = both[0];
                var value = this.parseAndEvalSexpr(both[1]);
                return {name: name, value: value};
            }.bind(this));
            assignments.each(function (a) {
                this.varsByName[a.name].value = a.value;
                this.cvarsByName[a.name].suggestValue(a.value);
            }.bind(this));
        } else if (result.startsWith("unsat")) {
            throw "Unsatisfiable constraint system";
        } else {
            throw "Z3 failed to solve this system";
        }
    },
    parseAndEvalSexpr: function(sexp) {
        var fl = parseFloat(sexp);
        if (!isNaN(fl)) return fl;
        
        var atomEnd = [' ', '"', "'", ')', '(', '\x0b', '\n', '\r', '\x0c', '\t']

        var stack = [],
            atom = [],
            i = 0,
            length = sexp.length;
        while (i < length) {
            var c = sexp[i]
            var reading_tuple = atom.length > 0
            if (!reading_tuple) {
                if (c == '(') {
                    stack.push([]);
                } else if (c == ')') {
                    var pred = stack.length - 2;
                    if (pred >= 0) {
                        stack[pred].push(String(this.evaluateSexpr(stack.pop())));
                    } else {
                        return this.evaluateSexpr(stack.pop());
                    }
                } else if (c.match(/\s/) !== null) {
                    // pass
                } else {
                    atom.push(c);
                }
            } else {
                if (atomEnd.indexOf(c) !== -1) {
                    stack[stack.length - 1].push(atom.join(""));
                    atom = [];
                    i -= 1; // do not skip this
                } else {
                    atom.push(c)
                }
            }
            i += 1;
        }
        throw "NotImplementedError(whatever this is) " + sexp;
    },
    evaluateSexpr: function(l) {
        var op = l[0],
            self = this,
            args = l.slice(1, l.length).map(function (arg) { return self.evalFloat(arg); });
        
        switch (op) {
            case "sin":
                return Math.sin(args[0])
            case "cos":
                return Math.cos(args[0])
            case "tan":
                return Math.tan(args[0])
            case "asin":
                return Math.asin(args[0])
            case "acos":
                return Math.acos(args[0])
            case "atan":
                return Math.atan(args[0])
            case "+":
                return args[0] + args[1]
            case "-":
                if (args.length == 1) {
                    return -args[0]
                } else {
                    return args[0] - args[1]
                }
            case "*":
                return args[0] * args[1]
            case "/":
                return args[0] / args[1]
            case "**":
                return Math.pow(args[0], args[1])
            default:
                throw op + ' in sexprs returned from Z3'
        }
    },
});
CommandLineZ3.modulePath = module('users.timfelgentreff.z3.CommandLineZ3').relativePath().replace("CommandLineZ3.js", "");
CommandLineZ3.z3Path = lively.ide.CommandLineInterface.cwd() + Config.codeBase.replace(Config.rootPath, "") + CommandLineZ3.modulePath + "z3";
}) // end of module
