module('users.timfelgentreff.z3.NaClZ3').requires().toRun(function() {

    Object.subclass("NaCLZ3", {
    loadModule: function (url) {
        if (this.embedMorph) {
            this.embedMorph.remove();
        }
        if (!this.uuid) {
            this.uuid = new UUID().id;
        }
        this.url = url || NaCLZ3.url;
        this.embedMorph = new lively.morphic.HtmlWrapperMorph(pt(50,50));
        this.embedMorph.asJQuery().html('<div id="' + this.uuid + '">\
            <embed name="nacl_module"\
                id="' + this.uuid + 'z3"\
                width=0 height=0\
                src="' + this.url + '/z3.nmf"\
                type="application/x-nacl" />\
        </div>');
        this.embedMorph.openInWorld();
        var listener = document.getElementById(this.uuid);
        listener.addEventListener('load', this.moduleDidLoad.bind(this), true);
        listener.addEventListener('message', this.handleMessage.bind(this), true);
        listener.addEventListener('crash', function () {
            alert("Z3 crashed, reloading.");
            this.loadModule(url);
        }.bind(this), true);
    },
    
    moduleDidLoad: function () {
        alertOK("NaCLZ3 loaded");
        this.module = document.getElementById(this.uuid + "z3");
        this.solve();
    },
    
    get isLoaded() {
        return !!this.module;
    },
    
    handleMessage: function (message) {
        this.applyResults(message.data);
    },
    applyResults: function(rawData) {
        var data = rawData.replace(/{([a-z]+):/g, "{\"$1\":").replace(/'/g, '"').replace(/\n/g, ","),
            response = JSON.parse(data.replace(/^{([a-z]):/, "{\"\1\":"));
        if (response.info) {
            console.log(response.info)
        } else if (response.error) {
            throw response.error;
        } else if (response.result) {
            assignments = response.result.split(",").map(function (str) {
                var both = str.split("->");
                if (both.length !== 2) return;
                
                name = both[0].trim();
                value = parseFloat(both[1].trim());
                if (value === NaN) {
                    throw "Error assigning result " + both[1].trim();
                }
                return {name: name, value: value};
            });
            assignments.each(function (a) {
                this.varsByName[a.name].value = a.value;
                this.cvarsByName[a.name].suggestValue(a.value);
            }.bind(this));
        }
    },
    
    postMessage: function (string) {
        if (!this.isLoaded) {
            alert("Z3 not ready, will solve when loaded.");
        } else {
            this.module.postMessage(string);
        }
    },
    initialize: function(url) {
        this.loadModule(url);
        this.variables = [];
        this.cvarsByName = {};
        this.varsByName = {};
        this.constraints = [];
    },
    always: function(opts, func) {
        if (opts.priority) {
            throw "soft constraints not implemented for Z3";
        }
        func.varMapping = opts.ctx;
        var constraint = new Constraint(func, this);
        constraint.enable();
        return constraint;
    },
    constraintVariableFor: function(value, ivarname, cvar) {
        if ((typeof(value) == "number") || (value === null) || (value instanceof Number)) {
            var name = ivarname + "" + this.variables.length;
            var v = new NaCLZ3Variable(name, value + 0 /* coerce back into primitive */, this);
            this.addVariable(v, cvar);
            return v;
        } else {
            return null;
        }
    },
    isConstraintObject: function() {
        return true;
    },
    get strength() {
        throw "strength (and soft constraints) not implemented for Z3, yet"
    },
    weight: 500,
    
    addVariable: function(v, cvar) {
        this.variables.push(v);
        this.cvarsByName[v.name] = cvar;
        this.varsByName[v.name] = v;
    }
    ,
    addConstraint: function(c) {
        this.constraints.push(c);
    },
    removeConstraint: function(c) {
        this.constraints.remove(c);
    },
    solve: function () {
        var decls = [""].concat(this.variables).reduce(function (acc, v) {
            return acc + "\n" + v.printDeclaration();
        });
        var constraints = ["\n"].concat(this.constraints).reduce(function (acc, c) {
            return acc + "\n" + "(assert " + c.print() + ")";
        });
        this.postMessage(decls + constraints);
        return decls + constraints;
    },
});

    NaCLZ3.url = URL.codeBase.withFilename(module('users.timfelgentreff.z3.NaClZ3').relativePath()).dirname();

    Object.subclass('NaCLZ3Ast', {
    cnEquals: function (r) {
        return new NaCLZ3BinaryExpression("=", this, r, this.solver);
    },
    cnGeq: function (r) {
        return new NaCLZ3BinaryExpression(">=", this, r, this.solver);
    },
    cnGreater: function (r) {
        return new NaCLZ3BinaryExpression(">", this, r, this.solver);
    },
    cnLeq: function (r) {
        return new NaCLZ3BinaryExpression("<=", this, r, this.solver);
    },
    cnLess: function (r) {
        return new NaCLZ3BinaryExpression("<", this, r, this.solver);
    },
    divide: function (r) {
        return new NaCLZ3BinaryExpression("/", this, r, this.solver);
    },
    times: function (r) {
        return new NaCLZ3BinaryExpression("*", this, r, this.solver);
    },
    sin: function() {
        return new NaCLZ3UnaryExpression("sin", this, this.solver);
    },
    cos: function() {
        return new NaCLZ3UnaryExpression("cos", this, this.solver);
    },
    minus: function (r) {
        return new NaCLZ3BinaryExpression("-", this, r, this.solver);
    },
    print: function() {
        throw "my subclass should have overridden `print'"
    },
    plus: function (r) {
        return new NaCLZ3BinaryExpression("+", this, r, this.solver);
    },
    pow: function (r) {
        return new NaCLZ3BinaryExpression("^", this, r, this.solver);
    },
    isConstraintObject: function() {
        return true;
    },
    });

    NaCLZ3Ast.subclass('NaCLZ3Variable', {
    initialize: function(name, value, solver) {
        this.name = name;
        this.value = value;
        this.solver = solver;
    },
    stay: function(strength) {
        throw "stay constraints not implemented for Z3 (yet)"
    },
    removeStay: function() {
        // throw "stay constraints not implemented for Z3 (yet)"
        // pass
    },
    suggestValue: function(value) {
        if (value === this.value) return;

        var c = this.cnEquals(value),
            s = this.solver;
        s.addConstraint(c);
        try {
            s.solve();
        } finally {
            s.removeConstraint(c);
        }
    },
    setReadonly: function(bool) {
        if (bool && !this.readonlyConstraint) {
            var cn = this.cnEquals(this.value);
            this.solver.addConstraint(cn);
            this.readonlyConstraint = cn;
            return cn;
        } else if (!bool && this.readonlyConstraint) {
            this.solver.removeConstraint(this.readonlyConstraint);
            this.readonlyConstraint = undefined;
        }
    },
    isReadonly: function() {
        return !!this.readonlyConstraint;
    },
    cnIdentical: function(value) {
        return this.cnEquals(value); // the same for numbers
    },
    
    print: function() {
        return this.name;
    },
    printDeclaration: function() {
        return "(declare-fun " + this.name + " () Real)"
    },
    
    prepareEdit: function() {
        throw "Z3 does not support editing"
    },
    finishEdit: function() {
        throw "Z3 does not support editing"
    },
    });

NaCLZ3Ast.subclass('NaCLZ3Constant', {
    initialize: function (value, solver) {
        this.value = value;
        this.solver = solver;
    },
    
    print: function () {
        return "" + this.value;
    }
});

NaCLZ3Ast.subclass('NaCLZ3Constraint', {
    enable: function (strength) {
        if (strength && strength !== "required") {
            throw "Z3 does not support soft constraints (yet)"
        }
        this.solver.addConstraint(this);
    },
    disable: function () {
        this.solver.removeConstraint(this);
    },
});

NaCLZ3Constraint.subclass('NaCLZ3BinaryExpression', {
    initialize: function (op, left, right, solver) {
        this.solver = solver;
        this.op = op;
        this.left = this.z3object(left);
        this.right = this.z3object(right);
    },
    z3object: function(obj) {
        if (obj instanceof NaCLZ3Ast) {
            return obj;
        } else {
            return new NaCLZ3Constant(parseFloat(obj), this.solver);
        }
    },
    print: function () {
        return "(" + this.op + " " + this.left.print() + " " + this.right.print() + ")"
    }
});

NaCLZ3Constraint.subclass('NaCLZ3UnaryExpression', {
    initialize: function (op, arg,  solver) {
        this.solver = solver;
        this.op = op;
        this.arg = arg;
    },
    print: function () {
        return "(" + this.op + " " + this.arg.print() + ")"
    }
});
}) // end of module
