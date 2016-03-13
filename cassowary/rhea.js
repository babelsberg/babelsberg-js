module("users.timfelgentreff.rhea").requires().toRun(function() {
    Object.subclass("CassowaryRhea", {
        initialize: function(url) {
            url = typeof url !== 'undefined' ? url : "/cassowary/rhea.emscripten.js";
            this.loadModule(url);
            this.initializeModule();
            this.solver = new this.rhea.SimplexSolver();
            this.variables = [];
        },
        loadModule: function(url) {
            this.rhea = null;
            var _this = this;

            var request = new XMLHttpRequest();
            request.onreadystatechange = function () {
                var DONE = request.DONE || 4;
                if (request.readyState === DONE){
                    if (request.status == 200) {
                        // emscripten puts Module into global namespace if it
                        // determines that it runs in the web
                        // save potential old window.Module
                        var oldWindowModule;
                        if (window.Module) {
                            oldWindowModule = window.Module;
                        }

                        console.log("Evaluating asmjs code...");
                        _this._rhea = new Function(request.responseText)();

                        if (oldWindowModule) {
                            window.Module = oldWindowModule;
                        } else {
                            delete window.Module;
                        }
                    } else {
                        console.error("Error while loading ", moduleUrl);
                    }
                }
            };
            request.open("GET", url, false); // synchronous request
            request.send();
        },
        initializeModule: function() {
            var _this = this;

            function ReferenceCounterRoot () {
                var children = [];

                this.add = function () {
                    for(var i = 0; i < arguments.length; i++) {
                        arguments[i].rc.increment();
                        children.push(arguments[i]);
                    }
                };
                this.deleteAll = function () {
                    children.forEach(function (child) {
                        child.delete();
                    });
                    children = [];
                };
            }

            function ReferenceCounter (self) {
                var counter = 0;
                var children = [];

                self.rc = {
                    increment: function () {
                        counter++;
                    },
                    add: function () {
                        for(var i = 0; i < arguments.length; i++) {
                            arguments[i].rc.increment();
                            children.push(arguments[i]);
                        }
                    }
                };
                self.delete = function () {
                    counter--;
                    if (counter == 0) {
                        if (typeof self.base != "undefined") {
                            self.base.delete();
                        }
                        children.forEach(function (child) {
                        child.delete();
                        });
                    } else if (counter < 0) {
                        throw new Error("Object already deleted");
                    }
                };
            }

            function isExpression(a) { return a instanceof Expression; }
            function isVariable(a) { return a instanceof Variable; }
            function isEquation(a) { return a instanceof Equation; }
            function isInequality(a) { return a instanceof Inequality; }
            function isConstraint(a) { return a instanceof Constraint; }
            function isNumber(a) { return typeof a == "number"; }

            function extend(target, mixin) {
                for(var key in mixin) {
                    if (mixin.hasOwnProperty(key)) {
                        target[key] = mixin[key];
                    }
                }
                return target;
            }

            var ASTMixin = {
                setSolver: function (solver) {
                    this.solver = solver;
                    return this;
                },
                cnEquals: function(r) {
                    return new Equation(this, r).setSolver(this.solver);
                },
                cnGeq: function(r) {
                    return new Inequality(this, ">=", r).setSolver(this.solver);
                },
                cnLeq: function(r) {
                    return new Inequality(this, "<=", r).setSolver(this.solver);
                },
                isConstraintObject: true,
                cnIdentical: function(value) {
                    return this.cnEquals(value);
                }
            };

            var EnableDisableMixin = {
                enable: function() {
                    this.solver.addConstraint(this);
                },
                disable: function() {
                    this.solver.removeConstraint(this);
                }
            }

            function Variable(obj) {
                ReferenceCounter(this);
                extend(this, ASTMixin);
                var v;
                if (obj && typeof obj.value == "number") {
                    v = new _this._rhea.Module.Variable(obj.value);
                } else {
                    v = new _this._rhea.Module.Variable();
                }
                Object.defineProperty(this, "base", { enumerable: false, readonly: true, value: v });
                Object.defineProperty(this, "value", { get: function () { return v.value(); } });
                this.set = function (value) { v.set_value(value); };
                this.stay = function() {
                    // this.solver.addStay(this);
                },
                this.removeStay = function() {
                    throw new Error("Not implemented: Variable.removeStay");
                },
                this.suggestValue = function(value) {
                    if (value !== this.value) {
                        this.solver.addEditVar(this);
                        this.solver.beginEdit();
                        this.solver.suggestValue(this, value);
                        this.solver.endEdit();
                        this.solver.removeAllEditVars();
                    }
                },
                this.prepareEdit = function() {
                    // solver.addEditVar(this);
                    // solver.beginEdit();
                },
                this.finishEdit = function() {
                    // solver.endEdit();
                },
                this.setReadonly = function (bool) {},
                this.isReadonly = function (bool) {
                    return false;
                },
                this.divide = function(r) {
                    return _this.rhea.divide(this, r).setSolver(this.solver);
                },
                this.times = function(r) {
                    return _this.rhea.times(this, r).setSolver(this.solver);
                },
                this.minus = function(r) {
                    return _this.rhea.minus(this, r).setSolver(this.solver);
                },
                this.plus = function(r) {
                    return _this.rhea.plus(this, r).setSolver(this.solver);
                }
            }

            function plus(e1, e2) { return new Expression(e1, "+", e2); }
            function minus(e1, e2) { return new Expression(e1, "-", e2); }
            function times(e1, e2) { return new Expression(e1, "*", e2); }
            function divide(e1, e2) { return new Expression(e1, "/", e2); }

            function Expression(v1, op, v2) {
                ReferenceCounter(this);
                extend(this, ASTMixin);
                var e;

                if (arguments.length == 1 && isNumber(v1)) {
                    e = _this._rhea.Module.createExpressionConst(v1);
                } else if (isExpression(v1) && isExpression(v2)) {
                    e = _this._rhea.Module.createExpressionExpExp(v1.base, op, v2.base);
                    this.rc.add(v1, v2);
                } else if (isExpression(v1) && isVariable(v2)) {
                    e = _this._rhea.Module.createExpressionExpVar(v1.base, op, v2.base);
                    this.rc.add(v1, v2);
                } else if (isVariable(v1) && isExpression(v2)) {
                    e = _this._rhea.Module.createExpressionVarExp(v1.base, op, v2.base);
                    this.rc.add(v1, v2);
                } else if (isVariable(v1) && isVariable(v2)) {
                    e = _this._rhea.Module.createExpressionVarVar(v1.base, op, v2.base);
                    this.rc.add(v1, v2);
                } else if (isVariable(v1) && isNumber(v2)) {
                    e = _this._rhea.Module.createExpressionVarConst(v1.base, op, v2);
                    this.rc.add(v1);
                } else if (isNumber(v1) && isVariable(v2)) {
                    e = _this._rhea.Module.createExpressionConstVar(v1, op, v2.base);
                    this.rc.add(v2);
                } else {
                    throw new TypeError("Invalid arguments");
                }

                this.evaluate = function () { return e.evaluate(); };
                Object.defineProperty(this, "base", { enumerable: false, readonly: true, value: e });
            }

            function Equation(v1, v2) {
                ReferenceCounter(this);
                extend(this, ASTMixin);
                extend(this, EnableDisableMixin);
                var e;

                if (isExpression(v1) && isVariable(v2)) {
                    e = _this._rhea.Module.createEquationExpVar(v1.base, v2.base);
                    this.rc.add(v1, v2);
                } else if (isVariable(v1) && isExpression(v2)) {
                    e = _this._rhea.Module.createEquationVarExp(v1.base, v2.base);
                    this.rc.add(v1, v2);
                } else if (isVariable(v1) && isVariable(v2)) {
                    e = _this._rhea.Module.createEquationVarVar(v1.base, v2.base);
                    this.rc.add(v1, v2);
                } else if (isExpression(v1) && isExpression(v2)) {
                    e = _this._rhea.Module.createEquationExpExp(v1.base, v2.base);
                    this.rc.add(v1, v2);
                } else if (isExpression(v1) && isNumber(v2)) {
                    var e2 = new Expression(v2);
                    e = _this._rhea.Module.createEquationExpExp(v1.base, e2.base);
                    this.rc.add(v1, e2);
                } else if (isNumber(v1) && isExpression(v2)) {
                    var e1 = new Expression(v1);
                    e = _this._rhea.Module.createEquationExpExp(v2.base, e1.base);
                    this.rc.add(v2, e1);
                } else if (isVariable(v1) && isNumber(v2)) {
                    e = _this._rhea.Module.createEquationVarConst(v1.base, v2);
                    this.rc.add(v1);
                } else if (isNumber(v1) && isVariable(v2)) {
                    e = _this._rhea.Module.createEquationVarConst(v2.base, v1);
                    this.rc.add(v2);
                } else {
                    throw new TypeError("Invalid arguments");
                }

                this.isSatisfied = function () { return e.is_satisfied(); };
                Object.defineProperty(this, "base", { enumerable: false, readonly: true, value: e });
            }

            function Inequality(v1, op, v2) {
                ReferenceCounter(this);
                extend(this, ASTMixin);
                extend(this, EnableDisableMixin);
                var e;

                if (isExpression(v1) && isExpression(v2)) {
                    e = _this._rhea.Module.createInequalityExpExp(v1.base, op, v2.base);
                    this.rc.add(v1, v2);
                } else if (isVariable(v1) && isExpression(v2)) {
                    e = _this._rhea.Module.createInequalityVarExp(v1.base, op, v2.base);
                    this.rc.add(v1, v2);
                } else if (isExpression(v1) && isVariable(v2)) {
                    e = _this._rhea.Module.createInequalityVarExp(v2.base, op, v1.base);
                    this.rc.add(v1, v2);
                } else if (isVariable(v1) && isVariable(v2)) {
                    e = _this._rhea.Module.createInequalityVarVar(v1.base, op, v2.base);
                    this.rc.add(v1, v2);
                } else if (isVariable(v1) && isNumber(v2)) {
                    e = _this._rhea.Module.createInequalityVarConst(v1.base, op, v2);
                    this.rc.add(v1);
                } else if (isNumber(v1) && isVariable(v2)) {
                    e = _this._rhea.Module.createInequalityVarConst(v1, op, v2.base);
                    this.rc.add(v2);
                } else if (isExpression(v1) && isNumber(v2)) {
                    var e2 = new Expression(v2);
                    e = _this._rhea.Module.createInequalityExpExp(v1.base, op, e2.base);
                    this.rc.add(v1, e2);
                } else if (isNumber(v1) && isExpression(v2)) {
                    var e1 = new Expression(v1);
                    e = _this._rhea.Module.createInequalityExpExp(v1.base, op, v2.base);
                    this.rc.add(e1, v2);
                } else {
                    throw new TypeError("Invalid arguments");
                }

                this.isSatisfied = function () { return e.is_satisfied(); };
                Object.defineProperty(this, "base", { enumerable: false, readonly: true, value: e });
            }

            function Constraint(e1) {
                ReferenceCounter(this);
                extend(this, ASTMixin);
                extend(this, EnableDisableMixin);
                var c;

                if (isEquation(e1)) {
                    c = _this._rhea.Module.createConstraintEq(e1.base);
                    this.rc.add(e1);
                } else if (isInequality(e1)) {
                    c = _this._rhea.Module.createConstraintIneq(e1.base);
                    this.rc.add(e1);
                } else {
                    throw new TypeError("Invalid arguments");
                }

                this.isSatisfied = function () { return c.is_satisfied(); };
                Object.defineProperty(this, "base", { enumerable: false, readonly: true, value: c });
            }

            function SimplexSolver() {
                ReferenceCounter(this);
                var solver = new _this.rhea.Module.SimplexSolver();

                this.addConstraint = function (c) {
                    if (isConstraint(c)) {
                        solver.add_constraint(c.base);
                        this.rc.add(c);
                    } else if (isEquation(c) || isInequality(c)) {
                        this.addConstraint(new Constraint(c));
                    } else {
                        throw new TypeError("Invalid arguments");
                    }
                };

                this.addConstraints = function (constraints) {
                    for(var i = 0; i < constraints.length; i++) {
                        this.addConstraint(constraints[i]);
                    }
                };

                this.addStay = function (v) {
                    if (isVariable(v)) {
                        solver.add_stay(v.base);
                    } else {
                        throw new TypeError("Invalid arguments");
                    }
                };

                this.addEditVar = function (v) {
                    if (isVariable(v)) {
                        solver.add_edit_var(v.base);
                    } else {
                        throw new TypeError("Invalid arguments");
                    }
                };

                this.removeConstraint = function (c) {
                    if (isConstraint(c)) {
                        solver.remove_constraint(c.base);
                    } else {
                        throw new TypeError("Invalid arguments");
                    }
                };

                this.removeStay = function (c) {
                    if (isVariable(c)) {
                        solver.remove_stay(c.base);
                    } else {
                        throw new TypeError("Invalid arguments");
                    }
                };

                this.removeAllEditVars = function () { solver.remove_all_edit_vars(); };
                this.solve = function () { solver.solve(); };
                this.beginEdit = function () { solver.begin_edit(); };
                this.endEdit = function () { solver.end_edit(); };


                this.suggest = function (v, value) {
                    if (isVariable(v)) {
                        solver.suggest(v.base, value);
                    } else {
                        throw new TypeError("Invalid arguments");
                    }
                };

                this.suggestValue = function (v, value) {
                    if (isVariable(v)) {
                        solver.suggest_value(v.base, value);
                    } else {
                        throw new TypeError("Invalid arguments");
                    }
                };

                Object.defineProperty(this, "base", { enumerable: false, readonly: true, value: solver });
            }

            this.rhea = {
                Variable : Variable,
                Expression: Expression,
                Equation: Equation,
                Inequality: Inequality,
                SimplexSolver: SimplexSolver,
                Constraint: Constraint,
                GEQ: ">=",
                LEQ: "<=",
                plus: plus,
                minus: minus,
                times: times,
                divide: divide,
                ReferenceCounterRoot: ReferenceCounterRoot,
                ReferenceCounter: ReferenceCounter,
                Module: this._rhea.Module
            };
        },
        always: function(opts, func) {
            if (opts.priority) throw new Error("Not implemented: CustomSolver.always - Priority");
            func.varMapping = opts.ctx;
            var constraint = new Constraint(func, this);
            // constraint.enable();
            return constraint;
        },
        constraintVariableFor: function(value, ivarname, cvar) {
            if ("number" == typeof value || null === value || value instanceof Number) {
                var v = new this.rhea.Variable({ value: value + 0 });
                v.setSolver(this.solver);
                this.solver.addStay(v);
                v.name = ivarname + "" + this.variables.length;
                return v
            }
            return null
        },
        isConstraintObject: true,
        get strength() {
            throw new Error("Not implemented: CustomSolver.strength");
        },
        weight: 500,
        solveOnce: function(c) {
            this.solver.addConstraint(c);
            try {
                this.solve()
            } finally {
                this.solver.removeConstraint(c)
            }
        },
        removeVariable: function(v) {
            throw new Error("Not implemented: CustomSolver.removeVariable");
        },
        addVariable: function(v, cvar) {
            this.variables.push(v);
        },
        addConstraint: function(c) {
            this.solver.addConstraint(c);
        },
        removeConstraint: function(c) {
            throw new Error("Not implemented: CustomSolver.removeConstraint");
        },
        solve: function() {
            this.solver.solve();
        }
    });
});
