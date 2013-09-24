module('users.timfelgentreff.babelsberg.constraintinterpreter').requires('lively.ast.Interpreter', 'cop.Layers', 'users.timfelgentreff.babelsberg.cassowary_ext', 'users.timfelgentreff.babelsberg.deltablue_ext', 'users.timfelgentreff.babelsberg.core_ext').toRun(function() {

// branched from 198617

bbb = {};
Object.extend(bbb, {
    edit: function (obj, accessors) {
        var extVars = {},
            extConstraints = [],
            callback = function (newObj) {
                if (!newObj) { // end-of-edit
                    ClSimplexSolver.getInstance().endEdit();
                    extConstraints.invoke("disable");
                    var constrainedVars = extVars[ConstrainedVariable.AttrName];
                    for (key in constrainedVars) {
                        constrainedVars[key].externalVariable.removeStay();
                    };
                    // FIXME: this next part ensures we don't leak stays, but
                    //        also leads to bad effects in interaction
                    // extConstraints.each(function (ec) {
                        // ec.disable();
                        // ec.constraintvariables.select(function (ea) {
                            // return ea.isSolveable();
                        // }.bind(this)).each(function (ea) {
                            // return ea.externalVariable.removeStay();
                        // });
                    // });
                } else {
                    var newEditConstants = accessors.map(function (accessor) {
                        return newObj[accessor];
                    });
                    ClSimplexSolver.getInstance().resolveArray(newEditConstants);
                }
            };

        accessors.each(function (accessor) {
            extVars[accessor] = 0;
            if (typeof(obj[accessor]) == "function") {
                extConstraints.push((function () {
                    return extVars[accessor] == obj[accessor]();
                }).shouldBeTrue({obj: obj, extVars: extVars, accessor: accessor}));
            } else {
                extConstraints.push((function () {
                    return extVars[accessor] == obj[accessor];
                }).shouldBeTrue({obj: obj, extVars: extVars, accessor: accessor}));
            }

            ClSimplexSolver.getInstance().addEditVar(
                new Constraint((function() {
                    return extVars[accessor]; // should be a solveable var
                }).varMap({extVars: extVars, accessor: accessor})).value
            );
        });

        ClSimplexSolver.getInstance().solve();
        ClSimplexSolver.getInstance().beginEdit();
        return callback;
    }
});

cop.create("ConstraintConstructionLayer").refineObject(lively.ast, {
    get InterpreterVisitor() {
        return ConstraintInterpreterVisitor;
    }
});

Object.subclass('Constraint', {
    initialize: function(predicate, solver) {
        this._enabled = false;
        this._predicate = predicate;
        this.constraintobjects = [];
        this.constraintvariables = [];
        this.solver = solver;

        // FIXME: this global state is ugly
        try {
            Constraint.current = this;
            var constraintObject = cop.withLayers([ConstraintConstructionLayer], function () {
                return predicate.forInterpretation().apply(undefined, []);
            });
        } finally {
            Constraint.current = null;
        }
        this.addPrimitiveConstraint(constraintObject);
    },
    addPrimitiveConstraint: function(obj) {
        if (!this.constraintobjects.include(obj)) {
            this.constraintobjects.push(obj);
        }
    },
    addConstraintVariable: function(v) {
        if (!this.constraintvariables.include(v)) {
            this.constraintvariables.push(v);
        }
    },



    get predicate() {
        return this._predicate;
    },

    get priority() {
        return this._priority;
    },

    set priority(value) {
        var enabled = this._enabled;
        if (enabled) {
            this.disable();
        }
        this._priority = value;
        if (enabled) {
            this.enable();
        }
    },

    get value() {
        return this.constraintobjects.last();
    },

    enable: function() {
        if (!this._enabled) {
            this.constraintobjects.each(function (ea) {
                this.enableConstraintObject(ea);
            }.bind(this));
            this._enabled = true;
            this.solver.solve();
        }
    },

    enableConstraintObject: function(obj) {
        if (obj === true) {
            alertOK("Warning: Constraint expression returned true. Re-running whenever the value changes");
        } else if (obj === false) {
            throw "Error: Constraint expression returned false, no solver available to fix it";
        } else if (!obj.enable) {
            throw "Error: Constraint expression returned an object that does not respond to #enable";
        } else {
            obj.enable(this._priority);
        }
    },

    disable: function() {
        if (this._enabled) {
            this.constraintobjects.each(function (ea) {
                try {ea.disable()} catch(e) {}
            });
            this._enabled = false;
        }
    },

    recalculate: function() {
        var enabled = this._enabled,
            cvars = this.constraintvariables,
            assignments;
        if (enabled) {
            this.disable();
        }
        this.initialize(this.predicate, this.solver);

        cvars.select(function (ea) {
            return !this.constraintvariables.include(ea) && ea.isSolveable();
        }.bind(this)).each(function (ea) {
            return ea.externalVariable.removeStay();
        });

        if (enabled) {
            assignments = this.constraintvariables.select(function (ea) {
                return !cvars.include(ea) && ea.isSolveable();
            }).collect(function (ea) {
                // add a required constraint for the new variable
                // to keep its new value, to have the same semantics
                // as for direct assignment
                return ea.externalVariable.cnEquals(ea.getValue());
            });

            // first, try to enable the assignments, some may be completely invalid
            assignments.each(function (ea) {
                try { ea.enable(); } catch(_) { ea.enable(this.solver.strength.strong); }
            });

            try {
                // try to enable this constraints with (some) required assignments
                this.enable();
            } catch(_) {
                // if it fails, disable, make all the assignments only strong, re-enable
                this._enabled = true; // force disable to run
                this.disable();
                assignments.invoke("disable");
                assignments.invoke("enable", this.solver.strength.strong);
                this.enable();
            } finally {
                assignments.invoke("disable");
            }
        }
    },
});
Object.extend(Constraint, {
    set current(p) {
        if (!this._previous) {
            this._previous = []
        }
        if (p === null) {
            if (this._previous.length > 0) {
                this._current = this._previous.pop();
            } else {
                this._current = null;
            }
            return;
        }
        if (this._current) {
            this._previous.push(this._current);
        }
        this._current = p;
    },

    get current() {
        return this._current;
    },

});
Object.subclass('ConstrainedVariable', {
    initialize: function(obj, ivarname) {
        this.obj = obj;
        dbgOn(ivarname.match(/v\d/))
        this.ivarname = ivarname;
        this.newIvarname = "$1$1" + ivarname;
        this._constraints = [];
        this._externalVariables = {};

        var value = obj[ivarname],
            solver = this.currentSolver;

        dbgOn(!solver)
        this.ensureExternalVariableFor(solver);

        var existingSetter = obj.__lookupSetter__(this.ivarname),
            existingGetter = obj.__lookupGetter__(this.ivarname);

        if (existingGetter && !existingGetter.isConstraintAccessor) {
            obj.__defineGetter__(this.newIvarname, existingGetter);
        }
        if (existingSetter && !existingSetter.isConstraintAccessor) {
            obj.__defineSetter__(this.newIvarname, existingSetter);
        }
        // assign old value to new slot
        if (!existingGetter && !existingSetter && this.obj.hasOwnProperty(this.ivarname)) {
            this.setValue(obj[ivarname]);
        }

        try {
            obj.__defineGetter__(ivarname, function() {
                return this.getValue();
            }.bind(this));
        } catch (e) { /* Firefox raises for Array.length */ }
        var newGetter = obj.__lookupGetter__(this.ivarname);
        if (!newGetter) {
            // Chrome silently ignores __defineGetter__ for Array.length
            this.externalVariables(solver, null);
            return;
        }

        obj.__defineSetter__(ivarname, function(newValue) {
            return this.suggestValue(newValue);
        }.bind(this));
        var newSetter = obj.__lookupSetter__(this.ivarname);

        newSetter.isConstraintAccessor = true;
        newGetter.isConstraintAccessor = true;
    },
    ensureExternalVariableFor: function(solver) {
        var eVar = this.externalVariables(solver),
            value = this.obj[this.ivarname];

        if (!eVar && eVar !== null) { // don't try to create an external variable twice
            this.externalVariables(solver, solver.constraintVariableFor(value, this.ivarname));
            this.updateReadonlyConstraints();
        }
    },
    updateReadonlyConstraints: function() {
        var defVar = this.definingExternalVariable;
        this.eachExternalVariableDo(function (eVar) {
            if (eVar !== defVar) {
                eVar.setReadonly(true);
            }
        });
    },


    get currentSolver() {
        if (Constraint.current) {
            return Constraint.current.solver;
        } else {
            return null;
        }
    },


    suggestValue: function(value) {
        if (value !== this.storedValue) {
            if (this.isSolveable()) {
                this.definingExternalVariable.suggestValue(value);
                value = this.externalValue;
            }
            if (value !== this.storedValue) {
                this.setValue(value);
                this.updateDownstreamVariables(value);
                this.updateConnectedVariables();
            }
        }
        return value;
    },
    updateConnectedVariables: function() {
        // so slow :(
        this._constraints.collect(function (c) {
            return c.constraintvariables;
        }).flatten().uniqueElements().each(function (cvar) {
            cvar.updateConnectedVariables() // will store if needed
        });
    },

    updateDownstreamVariables: function(value) {
        var defVar = this.definingExternalVariable;
        this.eachExternalVariableDo(function (ea) {
            if (ea !== defVar) {
                ea.setReadonly(false);
                ea.suggestValue(value);
                ea.setReadonly(true);
            }
        });

        this.setValue(value);
        // recalc
        this._constraints.each(function (c) {
            var eVar = this.externalVariables(c.solver);
            if (!eVar) {
                c.recalculate();
            }
        }.bind(this));
    },


    addToConstraint: function(constraint) {
        if (!this._constraints.include(constraint)) {
            this._constraints.push(constraint);
        }
        constraint.addConstraintVariable(this);
    },
    get definingSolver() {
        var solver = {weight: -1000};
        this.eachExternalVariableDo(function (eVar) {
            if (eVar) {
                var s = eVar.__solver__;
                if (s.weight > solver.weight) {
                    solver = s;
                }
            }
        });
        return solver;
    },
    get definingExternalVariable() {
        return this.externalVariables(this.definingSolver);
    },





    isSolveable: function() {
        return !!this.externalVariable;
    },

    get storedValue() {
        return this.obj[this.newIvarname];
    },
    get externalValue() {
        var value;
        if (typeof(this.externalVariable.value) == "function") {
            value = this.externalVariable.value();
        } else {
            value = this.externalVariable.value;
        }
        return value;
    },


    setValue: function(value) {
        this.obj[this.newIvarname] = value;
    },
    eachExternalVariableDo: function(func) {
        func.bind(this);
        for (key in this._externalVariables) {
            var eVar = this._externalVariables[key];
            if (eVar) { func(eVar, key); }
        }
    },

    getValue: function() {
        if (this.isSolveable()) {
            return this.externalValue;
        } else {
            return this.storedValue;
        }
    },


    get externalVariable() {
        if (this.currentSolver) {
            return this.externalVariables(this.currentSolver);
        } else {
            return this.definingExternalVariable;
        }
    },
    externalVariables: function(solver, value) {
        if (!solver.__uuid__) {
            solver.__uuid__ = new UUID().id
        }
        if (arguments.length === 1) {
            return this._externalVariables[solver.__uuid__];
        } else {
            if (value) {
                value.__solver__ = value.__solver__ || solver;
            }
            this._externalVariables[solver.__uuid__] = value || null;
        }
    }
})

lively.ast.InterpreterVisitor.subclass('ConstraintInterpreterVisitor', {

    visitModifyingSet: function($super, node) {
        // TODO: equality constraints for set
        return $super(node);
    },
    visitSet: function($super, node) {
        // TODO: equality constraints for set
        return $super(node);
    },

    visitThis: function($super, node) {
        return $super(node);
    },
    visitVariable: function($super, node) {
        return $super(node);
    },
    invoke: function($super, node, recv, func, argValues) {
        if (recv && recv.isConstraintObject) {
            var forInterpretation = func.forInterpretation;
            func.forInterpretation = undefined;
            try {
                return cop.withoutLayers([ConstraintConstructionLayer], function() {
                    return $super(node, recv, func, argValues);
                });
            } finally {
                func.forInterpretation = forInterpretation;
            }
        } else if (recv === lively.Class || lively.Class.isClass(func)) {
            return cop.withoutLayers([ConstraintConstructionLayer], function() {
                return $super(node, recv, func, argValues);
            });
        } else {
            return cop.withLayers([ConstraintConstructionLayer], function() {
                return $super(node, recv, func, argValues);
            });
        }
    },
    visitBinaryOp: function($super, node) {
        if (node.name.match(/[\*\+\/\-]|==|<=|>=|&&/)) {
            var leftVal = this.visit(node.left),
                rightVal = this.visit(node.right);
            switch (node.name) {
               case '&&':
                    Constraint.current.addPrimitiveConstraint(leftVal);
                    dbgOn(typeof(leftVal) != "object")
                    return rightVal;
               case '+':
                    if (leftVal.isConstraintObject && leftVal.plus) {
                        return leftVal.plus(rightVal);
                    } else {
                        return leftVal + rightVal;
                    };
                case '-':
                    if (leftVal.isConstraintObject && leftVal.minus) {
                        return leftVal.minus(rightVal);
                    } else {
                        return leftVal + rightVal;
                    };
                case '*':
                    if (leftVal.isConstraintObject && leftVal.times) {
                        return leftVal.times(rightVal);
                    } else {
                        return leftVal * rightVal;
                    };
                case '/':
                    if (leftVal.isConstraintObject && leftVal.divide) {
                        return leftVal.divide(rightVal);
                    } else {
                        return leftVal / rightVal;
                    };
                case '<=':
                    if (leftVal.isConstraintObject && leftVal.cnLeq) {
                        return leftVal.cnLeq(rightVal);
                    } else {
                        return leftVal <= rightVal;
                    };
                case '>=':
                    if (leftVal.isConstraintObject && leftVal.cnGeq) {
                        return leftVal.cnGeq(rightVal);
                    } else {
                        return leftVal >= rightVal;
                    };
                case '==':
                    if (leftVal.isConstraintObject && leftVal.cnEquals) {
                        return leftVal.cnEquals(rightVal);
                    } else {
                        return leftVal == rightVal;
                    };
            }
        }
        return $super(node);
    },


    visitGetSlot: function(node) {
        var obj = this.visit(node.obj),
            name = this.visit(node.slotName),
            cvar;
        if (obj === Global || (obj instanceof lively.Module)) {
            return obj[name];
        }

        cvar = ConstrainedVariable.newConstraintVariableFor(obj, name);
        if (Constraint.current) {
            cvar.ensureExternalVariableFor(Constraint.current.solver);
            cvar.addToConstraint(Constraint.current);
        }
        if (cvar && cvar.isSolveable()) {
            return cvar.externalVariable;
        } else {
            return obj[name];
        }
    },

    shouldInterpret: function(frame, func) {
        return (!(this.isNative(func) ||
                 lively.Class.isClass(func))) &&
                 typeof(func.forInterpretation) == "function"
    },
})

ConstrainedVariable.AttrName = "__constrainedVariables__";
Object.extend(ConstrainedVariable, {
    findConstraintVariableFor: function(obj, ivarname) {
        var l = obj[ConstrainedVariable.AttrName ];
        if (l && l[ivarname]) {
            return l[ivarname];
        } else {
            return null;
        }
    },

    newConstraintVariableFor: function(obj, ivarname) {
        var cvar = this.findConstraintVariableFor(obj, ivarname);
        if (!cvar) {
            cvar = new ConstrainedVariable(obj, ivarname);
            obj[ConstrainedVariable.AttrName] = obj[ConstrainedVariable.AttrName] || {};
            obj[ConstrainedVariable.AttrName][ivarname] = cvar;
        }
        return cvar;
    }
})

ObjectLinearizerPlugin.subclass('DoNotSerializeConstraintPlugin',
'plugin interface', {
    ignoreProp: function (obj, key, value) {
        return key === ConstrainedVariable.AttrName || (value instanceof Constraint)
    },
});
lively.persistence.pluginsForLively.push(DoNotSerializeConstraintPlugin);

}) // end of module