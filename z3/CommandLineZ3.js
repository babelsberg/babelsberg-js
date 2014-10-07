module('users.timfelgentreff.z3.CommandLineZ3').requires('users.timfelgentreff.z3.NaClZ3', "lively.ide.CommandLineInterface").toRun(function() {
    NaCLZ3.subclass("CommandLineZ3", {
        loadModule: function () {
            // No module used
        },
    get strength() {
        return {
            required: undefined, // default strength
            strong: 10,
            medium: 5,
            weak: 1
        }
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
            result = result.replace(/ ?\|->.*\n/m, ""); // Z3-opt has this in the beginning
            result = result.replace(/\(error.*\n/m, "");
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
                    this.varsByName[a.name].updateStay();
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
    solve: function () {
        var decls = [""].concat(this.variables).reduce(function (acc, v) {
            return acc + "\n" + v.printDeclaration();
        });
        var constraints = ["\n"].concat(this.constraints).reduce(function (acc, c) {
            if (c.strength) {
                return acc + "\n" + "(assert-soft " + c.print() + " :weight " + c.strength + ")"
            } else {
                return acc + "\n" + "(assert " + c.print() + ")";
            }
        });
        this.postMessage(decls + constraints);
        return decls + constraints;
    },
    constraintVariableFor: function($super, value, ivarname, cvar) {
        var cvar = $super(value, ivarname, cvar);
        if (cvar && this.constructor === CommandLineZ3) {
            // XXX: only add stays for this specific solver for now
            cvar.stay();
        }
        return cvar;
    },
    always: function($super, opts, func) {
        var prio = opts.priority;
        delete opts.priority; // not supported by NaClZ3
        var result = cop.withLayers([CommandLineZ3Layer], function () {
            return $super(opts, func);
        });
        if (prio && prio !== this.strength.required) {
            result.priority = prio;
        }
        return result;
    },
    });
if (window.Config && window.Config.codeBase) {
    // Only in Lively
    Object.extend(CommandLineZ3, {
        modulePath: module('users.timfelgentreff.z3.CommandLineZ3').relativePath().replace("CommandLineZ3.js", "")
    });
    Object.extend(CommandLineZ3, {
        z3Path: lively.ide.CommandLineInterface.cwd() + "/" + Config.codeBase.replace(Config.rootPath, "") + CommandLineZ3.modulePath + "z3"
    });
} else {
    Object.extend(CommandLineZ3, {
        get z3Path() {
            console.error("Standalone deployment must define CommandLineZ3.z3Path");
        }
    });
}
cop.create('CommandLineZ3Layer').
refineObject(Global, {
    get NaCLZ3Variable() {
        return CommandLineZ3Variable
    }
}).
refineClass(NaCLZ3Constraint, {
    enable: function (strength) {
        this.strength = strength;
        this.solver.addConstraint(this);
    }
})
NaCLZ3Variable.subclass('CommandLineZ3Variable', {
    stay: function (strength) {
        strength = strength || this.solver.strength.weak;
        if (!this._stayCn) {
            this._stayCn = new NaCLZ3BinaryExpression("=", this, this.value, this.solver);
            this._stayCn.strength = strength;
            this.solver.addConstraint(this._stayCn);
        }
    },
    removeStay: function() {
        if (this._stayCn) {
            this._stayCn.disable();
            delete this._stayCn;
        }
    },
    updateStay: function () {
        if (this._stayCn) {
            var s = this._stayCn.strength;
            this.solver.removeConstraint(this._stayCn);
            this._stayCn = new NaCLZ3BinaryExpression("=", this, this.value, this.solver);
            this._stayCn.strength = s;
            this.solver.addConstraint(this._stayCn);
        }
    }
});


}) // end of module
