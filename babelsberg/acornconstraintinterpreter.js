module('users.timfelgentreff.babelsberg.constraintinterpreter').requires('lively.ast.AcornInterpreter', 'cop.Layers', 'users.timfelgentreff.babelsberg.cassowary_ext', 'users.timfelgentreff.babelsberg.deltablue_ext', 'users.timfelgentreff.babelsberg.core_ext', 'users.timfelgentreff.babelsberg.src_transform').toRun(function() {

// branched from 198617

Object.subclass("Babelsberg", {
    isConstraintObject: function () {
        return true;
    },
    
    unconstrain: function (obj, accessor) {
        if (!obj) return;
        var cvar = ConstrainedVariable.findConstraintVariableFor(obj, accessor);
        if (!cvar) return;
        var cGetter = obj.__lookupSetter__(accessor), //// not __lookupGetter__ ?
            cSetter = obj.__lookupSetter__(accessor);
        if (!cGetter && !cSetter) {
            return;
        }
        if (!cGetter.isConstraintAccessor || !cSetter.isConstraintAccessor) {
            throw "too many accessors - unconstrain only works for the very simple case now"
        }
        ConstrainedVariable.deleteConstraintVariableFor(obj, accessor);
        var newName = cvar.newIvarname;
        var existingSetter = obj.__lookupSetter__(newName),
            existingGetter = obj.__lookupGetter__(newName);
        if (existingGetter) {
            obj.__defineGetter__(this.accessor, existingGetter);
        }
        if (existingSetter) {
            obj.__defineSetter__(this.accessor, existingSetter);
        }
        if (!existingSetter || !existingGetter) {
            delete obj[accessor];
        }
        obj[accessor] = obj[newName];
        delete obj[newName]
    },
    
    edit: function (obj, accessors) {
        var extVars = {},
            cVars = {},
            extConstraints = [],
            solvers = [],
            callback = function (newObj) {
                if (!newObj) { // end-of-edit
                    for (var prop in extVars) {
                        extVars[prop].each(function (evar) {
                            evar.finishEdit();
                        });
                    }
                    solvers.invoke("endEdit");
                } else {
                    var newEditConstants = newObj;
                    if (!Object.isArray(newObj)) {
                        newEditConstants = accessors.map(function (accessor) {
                            return newObj[accessor];
                        });
                    }
                    solvers.invoke("resolveArray", newEditConstants);
                    accessors.each(function (a) {
                        cVars[a].suggestValue(cVars[a].externalValue);
                        // extVars[a] = extVars[a]; // set the value,
                                                 // propagates change to other property accessors
                                                 // calls the setters
                                                 // does not recurse into solvers, because they have already
                                                 // adopted the correct value
                    })
                }
            };

        accessors.each(function (accessor) {
            var cvar = ConstrainedVariable.findConstraintVariableFor(obj, accessor);
            if (!cvar) {
                throw "Cannot edit " + obj + '["' + accessor + '"], because it isn\'t constrained'
            }
            var evars = Properties.values(cvar._externalVariables);
            if (evars.compact().length < evars.length) {
                throw "Cannot edit " + obj + '["' + accessor + '"], because it is in a recalculate relation'
            }
            if (cvar.solvers.any(function (s) { return !Object.isFunction(s.beginEdit) })) {
                throw "Cannot edit " + obj + '["' + accessor + '"], because it is in a no-edit solver'
            }
            cVars[accessor] = cvar;
            extVars[accessor] = evars;
            solvers = solvers.concat(cvar.solvers).uniq();
            evars.each(function (evar) {
                evar.prepareEdit();
            });
        });

        solvers.invoke("beginEdit");
        return callback;
    },
    readonly: function(obj) {
        if (obj.isConstraintObject) {
            obj.setReadonly(true);
        } else {
            if (Constraint.current && Constraint.current.solver) {
                Properties.own(obj).each(function (ea) {
                    var cvar = ConstrainedVariable.newConstraintVariableFor(obj, ea);
                    cvar.addToConstraint(Constraint.current);
                    cvar.ensureExternalVariableFor(Constraint.current.solver);
                    if (cvar.isSolveable()) {
                        bbb.readonly(cvar.externalVariables(Constraint.current.solver))
                    }
                });
            }
        }
        return obj;
    },

    always: function(opts, func) {
        var solver = opts.solver || this.defaultSolver;
        if (!solver) throw "Must explicitely pass a solver for now";
        return solver.always(opts, func);
    }

});
Object.extend(Global, {
    bbb: new Babelsberg()
});

cop.create('MorphSetConstrainedPositionLayer').refineClass(lively.morphic.Morph, {
    setPosition: function(newPos) {
        if (this.editCb) {
            this.editCb(newPos);
            return this.renderContextDispatch('setPosition', newPos);
        } else {
            return cop.proceed(newPos);
        }
    },
}).refineClass(lively.morphic.DragHalo, {
    dragStartAction: function() {
        this.targetMorph.editCb = bbb.edit(this.targetMorph.getPosition(), ["x", "y"]);
        return cop.proceed.apply(this, arguments);
    },
    dragEndAction: function() {
        this.targetMorph.editCb();
        return cop.proceed.apply(this, arguments);
    }
});

cop.create("ConstraintConstructionLayer").refineObject(lively.ast.AcornInterpreter, {
    get Interpreter() {
        return ConstraintInterpreter;
    }
})
// .refineClass(lively.ast.Send, {
//     asFunction: function(optFunc) {
//         var initializer = optFunc.prototype.initialize.ast().asFunction();
//         initializer.original = optFunc;
//         return initializer;
//     }
// });

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
            var interp = new ConstraintInterpreter();
            var constraintObject = cop.withLayers([ConstraintConstructionLayer], function () {
                return interp.run(lively.ast.acorn.parse("(" + predicate + ")()"), predicate.varMapping);
            });
        } finally {
            Constraint.current = null;
        }
        this.addPrimitiveConstraint(constraintObject); //// isn't constraintObject always undefined in this scope?
    },
    addPrimitiveConstraint: function(obj) {
        if (obj && !this.constraintobjects.include(obj)) {
            this.constraintobjects.push(obj);
        }
    },
    addConstraintVariable: function(v) {
        if (v && !this.constraintvariables.include(v)) {
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

    enableConstraintObject: function(obj, optPriority) {
        if (obj === true) {
            alertOK("Warning: Constraint expression returned true. Re-running whenever the value changes");
        } else if (obj === false) {
            throw "Error: Constraint expression returned false, no solver available to fix it";
        } else if (!obj.enable) {
            throw "Error: Constraint expression returned an object that does not respond to #enable";
        } else {
            obj.solver = this.solver; // XXX: Bit of a hack, should really write it so
                                      // this gets passed through from the variables
            obj.enable(optPriority || this._priority);
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
        // TODO: Fix this so it uses the split-stay result, i.e. just increase the stay for the newly assigned value
        var enabled = this._enabled,
            cvars = this.constraintvariables,
            self = this,
            assignments;
        if (enabled) {
            this.disable();
        }
        this.initialize(this.predicate, this.solver);

        cvars.select(function (ea) {
            // all the cvars that are not in this constraint anymore
            return !this.constraintvariables.include(ea) && ea.isSolveable();
        }.bind(this)).each(function (ea) {
            return ea.externalVariable.removeStay();
        });

        if (enabled) {
            assignments = this.constraintvariables.select(function (ea) {
                // all the cvars that are new after this recalculation
                return !cvars.include(ea) && ea.isSolveable();
            }).collect(function (ea) {
                // add a required constraint for the new variable
                // to keep its new value, to have the same semantics
                // as for direct assignment
                return ea.externalVariable.cnIdentical(ea.getValue());
            });

            assignments.each(function (ea) {
                try {
                    self.enableConstraintObject(ea);
                } catch(_) { // if the assignment cannot be completely satisfied, make it strong
                    self.enableConstraintObject(ea, self.solver.strength.strong);
                }
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
    initialize: function(obj, ivarname, optParentCVar) {
        this.obj = obj;
        this.ivarname = ivarname;
        this.newIvarname = "$1$1" + ivarname;
        this.parentConstrainedVariable = optParentCVar;
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

        this.cachedDefiningSolver = null;
        this.cachedDefiningVar = null;
        if (!eVar && eVar !== null) { // don't try to create an external variable twice
            this.externalVariables(solver, solver.constraintVariableFor(value, this.ivarname, this));
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
        if (ConstrainedVariable.$$callingSetters) {
	        return value;
        }

        if (value !== this.storedValue) {
            var callSetters = !ConstrainedVariable.$$optionalSetters;
            ConstrainedVariable.$$optionalSetters = ConstrainedVariable.$$optionalSetters || [];
            try {
                if (this.isSolveable() && !ConstrainedVariable.isSuggestingValue) {
                    var wasReadonly = false,
                        eVar = this.definingExternalVariable;
                    try {
                        ConstrainedVariable.isSuggestingValue = true;
                        wasReadonly = eVar.isReadonly();
                        eVar.setReadonly(false);
                        eVar.suggestValue(value);
                        value = this.externalValue;
                    } finally {
                        eVar.setReadonly(wasReadonly);
                        ConstrainedVariable.isSuggestingValue = false;
                    }
                }
                if (value !== this.storedValue && !this.$$isStoring) {
                    this.$$isStoring = true;
                    try {
                        if (this.isSolveable()) {
                            var getterSetterPair = this.findOptionalSetter();
                            if (getterSetterPair) {
                                ConstrainedVariable.$$optionalSetters.push(getterSetterPair);
                            }
                        }
                        this.setValue(value);
                        this.updateDownstreamVariables(value);
                        this.updateConnectedVariables();
                    } finally {
                        this.$$isStoring = false;
                    }
                }
                if (callSetters) {
                    ConstrainedVariable.$$callingSetters = true;
                    var recvs = [],
                        setters = [];
                    ConstrainedVariable.$$optionalSetters.each(function (ea) {
                        var recvIdx = recvs.indexOf(ea.recv);
                        if (recvIdx === -1) {
                            recvIdx = recvs.length;
                            recvs.push(ea.recv);
                        }
                        setters[recvIdx] = setters[recvIdx] || [];
                        // If we have already called this setter for this recv, skip
                        if (setters[recvIdx].indexOf(ea.setter) !== -1) return;
                        setters[recvIdx].push(ea.setter);
                        try {
                            ea.recv[ea.setter](ea.recv[ea.getter]());
                        } catch(e) {
                            alert(e);
                        };
                    });
                    ConstrainedVariable.$$callingSetters = false;
                }
            } finally {
                if (callSetters) {
                    ConstrainedVariable.$$optionalSetters = null;
                }
            }
        }
        return value;
    },

    findOptionalSetter: function() {
        if (this.setter) {
            return {recv: this.recv, getter: this.getter, setter: this.setter};
        } else {
            if (this.parentConstrainedVariable) {
                return this.parentConstrainedVariable.findOptionalSetter()
            }
        }
    },

    get getter() {
        return this.$getter;
    },
    get recv() {
        return this.$recv;
    },
    set getter(value) {
        this.$getter = value;
        if (this.recv) {
            var setter = value.replace("get", "set");
            if (Object.isFunction(this.recv[setter])) {
                this.setter = setter;
            }
        }
    },
    set recv(value) {
        this.$recv = value;
        if (this.getter) {
            var setter = this.getter.replace("get", "set");
            if (Object.isFunction(value[setter])) {
                this.setter = setter;
            }
        }
    },
    updateConnectedVariables: function() {
        // so slow :(
        var self = this;
        this._constraints.collect(function (c) {
            return c.constraintvariables;
        }).flatten().uniq().each(function (cvar) {
            cvar.suggestValue(cvar.getValue()) // will store and recurse only if needed
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
        if (!this.cachedDefiningSolver) {
            var solver = {weight: -1000};
            this.eachExternalVariableDo(function (eVar) {
                if (eVar) {
                    var s = eVar.__solver__;
                    if (s.weight > solver.weight) {
                        solver = s;
                    }
                }
            });
            this.cachedDefiningSolver = solver;
        }
        return this.cachedDefiningSolver;
    },
    get solvers() {
        var solvers = [];
        this.eachExternalVariableDo(function (eVar) {
            if (eVar) {
                var s = eVar.__solver__;
                solvers.push(s)
            }
        });
        return solvers;
    },
    get definingExternalVariable() {
        if (!this.cachedDefiningVar) { 
            this.cachedDefiningVar = this.externalVariables(this.definingSolver);
        }
        return this.cachedDefiningVar;
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
            solver.__uuid__ = Strings.newUUID()
        }
        if (arguments.length === 1) {
            return this._externalVariables[solver.__uuid__];
        } else {
            if (value) {
                value.__solver__ = value.__solver__ || solver;
                if (value.__cvar__ && !(value.__cvar__ === this)) {
                    throw "Inconsistent external variable. This should not happen!";
                }
                value.__cvar__ = this;
            }
            this._externalVariables[solver.__uuid__] = value || null;
        }
    }
})

lively.ast.AcornInterpreter.Interpreter.subclass('ConstraintInterpreter', {




    getConstraintObjectValue: function(o) {
        var value = o.value;
        if (typeof(value) == "function") {
            return value();
        } else {
            return value;
        }
    },



    visitIfStatement: function($super, node, state) {
         var oldResult = state.result,
            frame = state.currentFrame;
        this.accept(node.test, state);
        var condVal = state.result;
        state.result = oldResult;

        if (frame.isResuming() && this.wantsInterpretation(node.consequent, frame)) {
            condVal = true; // resuming node inside true branch
        }
        if (condVal && condVal.isConstraintObject) {
            debugger
            var self = this;
            condVal = this.getConstraintObjectValue(condVal);
            if (!condVal) {
                condVal = cop.withoutLayers([ConstraintConstructionLayer], function() {
                    // XXX: this will cause GetSlot to call $super, so we don't get constrainded vars
                    this.accept(node.consequent, state);
                    return state.result;
                });
                state.result = oldResult;
                debugger
            }
        }
        
        if (condVal) {
            this.accept(node.consequent, state);
        } else if (node.alternate) {
            this.accept(node.alternate, state);
        }
    },

    visitUnaryExpression: function($super, node, state) {
        // Below copied from AcornInterpreter.Interpreter
        if (node.operator == 'delete') {
            node = node.argument;
            if (node.type == 'Identifier') {
                // do not delete
                try {
                    state.currentFrame.getScope().findScope(node.name);
                    state.result = false;
                } catch (e) { // should be ReferenceError
                    state.result = true;
                }
            } else if (node.type == 'MemberExpression') {
                this.accept(node.object, state);
                var obj = state.result, prop;
                if ((node.property.type == 'Identifier') && !node.computed)
                    prop = node.property.name;
                else {
                    this.accept(node.property, state);
                    prop = state.result;
                }
                state.result = delete obj[prop];
            } else
                throw new Error('Delete not yet implemented for ' + node.type + '!');
            return;
        }

        this.accept(node.argument, state);
        /* BEGIN BABELSBERG MOD */
        if (state.result && state.result.isConstraintObject) {
            // TODO: check if this always does what we want
            state.result = this.getConstraintObjectValue(state.result);
        }
        /* END BABELSBERG MOD */
        switch (node.operator) {
            case '-':       state.result = -state.result; break;
            case '+':       state.result = +state.result; break;
            case '!':       state.result = !state.result; break;
            case '~':       state.result = ~state.result; break;
            case 'typeof':  state.result = typeof state.result; break;
            case 'void':    state.result = void state.result; break; // or undefined?
            default: throw new Error('No semantics for UnaryExpression with ' + node.operator + ' operator!');
        }
    },

    invoke: function($super, recv, func, argValues, frame, isNew) {
        if (!func && (!recv || !recv.isConstraintObject)) {
            var error = "No such method: " + recv + "." +  (func && func.name())
            alert(error)
            throw error
        };
        if (func && this.shouldInterpret(frame, func)) {
            debugger
            func = this.fetchInterpretedFunction(func, isNew) || func;
        }
        if (recv && recv.isConstraintObject) {
            if (func) {
                func.isInterpretableFunction = false;
                return cop.withoutLayers([ConstraintConstructionLayer], function() {
                    return $super(recv, func, argValues, frame, isNew);
                });
            } else {
                // XXX: tried to call a function on this that this constraintobject does not understand.
                //      we'll just forward to the value, I guess?
                var value = this.getConstraintObjectValue(recv);
                var prop = func.name();
                return this.invoke(value, value[prop], argValues, frame, isNew);
            }
        } else if (recv === Math) {
            if (func === Math.sqrt && argValues[0].pow || argValues[0].sqrt) {
                if (argValues[0].pow) {
                    return this.invoke(argValues[0], argValues[0].pow, [0.5], frame, isNew);
                } else {
                    return this.invoke(argValues[0], argValues[0].sqrt, [], frame, isNew);
                }
            } else if (func === Math.pow && argValues[0].pow) {
                return this.invoke(argValues[0], argValues[0].pow, [argValues[1]], frame, isNew);
            } else if (func === Math.sin && argValues[0].sin) {
                return this.invoke(argValues[0], argValues[0].sin, [], frame, isNew);
            } else if (func === Math.cos && argValues[0].cos) {
                return this.invoke(argValues[0], argValues[0].cos, [], frame, isNew);
            } else {
                return $super(recv, func, argValues, frame, isNew);
            }
        } else {
            return cop.withLayers([ConstraintConstructionLayer], function() {
                return $super(recv, func, argValues, frame, isNew);
            });
        }
    },
    fetchInterpretedFunction: function(func, isNew) {
        // recreate scopes
        // FIXME: duplicate from lively.ast.Rewriting > UnwindException.prototype.createAndShiftFrame
        var scope, topScope, newScope,
            fState = func._cachedScopeObject;
        if (fState) {
            do {
                newScope = new lively.ast.AcornInterpreter.Scope(fState[1]); // varMapping
                if (scope)
                    scope.setParentScope(newScope);
                else
                    topScope = newScope;
                scope = newScope
                fState = fState[2]; // parentFrameState
            } while (fState && fState != Global);
            
            // recreate lively.ast.AcornInterpreter.Function object
            func = new lively.ast.AcornInterpreter.Function(func._cachedAst, topScope);
            return func.asFunction();
        } else {
            // XXX: HACKY DEEP-INTERPRETATION FROM SOURCE
            var initializer;
            if (isNew) {
                // XXX?
                initializer = func;
                func = func.prototype.initialize;
            }
        
            func = new lively.ast.AcornInterpreter.Function(
                    lively.ast.acorn.parseFunction(func.toString()),
                    new lively.ast.AcornInterpreter.Scope(Global)
            );
            var ast = func.asFunction();
            ast.original = initializer;
            return ast;
        }
    },

    visitLogicalExpression: function($super, node, state) {
        if (node.operator === "&&") {
            this.accept(node.left, state);
            var leftVal = state.result;
            this.accept(node.right, state);
            var rightVal = state.result;
            Constraint.current.addPrimitiveConstraint(leftVal);
            dbgOn(typeof(leftVal) != "object")
            state.result = rightVal;
        } else {
            $super(node, state);
        }
    },
    visitBinaryExpression: function($super, node, state) {
        if (node.operator.match(/[\*\+\/\-]|==|<=|>=|===/)) {
            this.accept(node.left, state);
            var leftVal = state.result;
            this.accept(node.right, state);
            var rightVal = state.result;
            
            if (leftVal === undefined) leftVal = 0;
            if (rightVal === undefined) rightVal = 0;
            
            var rLeftVal = leftVal.isConstraintObject ? this.getConstraintObjectValue(leftVal) : leftVal,
                rRightVal = rightVal.isConstraintObject ? this.getConstraintObjectValue(rightVal) : rightVal;                    
            switch (node.operator) {
               case '+':
                    if (leftVal.isConstraintObject && leftVal.plus) {
                        state.result = leftVal.plus(rightVal);
                    } else if (rightVal.isConstraintObject && rightVal.plus) {
                        state.result = rightVal.plus(leftVal);
                    } else {
                        state.result = rLeftVal + rRightVal;
                    };
                    break;
                case '-':
                    if (leftVal.isConstraintObject && leftVal.minus) {
                        state.result = leftVal.minus(rightVal);
                    } else if (rightVal.isConstraintObject && rightVal.plus && Object.isNumber(leftVal)) {
                        state.result = rightVal.plus(-leftVal);
                    } else {
                        state.result = rLeftVal - rRightVal;
                    };
                    break;
                case '*':
                    if (leftVal.isConstraintObject && leftVal.times) {
                        state.result = leftVal.times(rightVal);
                    } else if (rightVal.isConstraintObject && rightVal.times) {
                        state.result = rightVal.times(leftVal);
                    } else {
                        state.result = rLeftVal * rRightVal;
                    };
                    break;
                case '/':
                    if (leftVal.isConstraintObject && leftVal.divide) {
                        state.result = leftVal.divide(rightVal);
                    } else {
                        state.result = rLeftVal / rRightVal;
                    };
                    break;
                case '<=':
                    if (leftVal.isConstraintObject && leftVal.cnLeq) {
                        state.result = leftVal.cnLeq(rightVal);
                    } else if (rightVal.isConstraintObject && rightVal.cnGeq) {
                        state.result = rightVal.cnGeq(leftVal);
                    } else {
                        state.result = rLeftVal <= rRightVal;
                    };
                    break;
                case '>=':
                    if (leftVal.isConstraintObject && leftVal.cnGeq) {
                        state.result = leftVal.cnGeq(rightVal);
                    } else if (rightVal.isConstraintObject && rightVal.cnLeq) {
                        state.result = rightVal.cnLeq(leftVal);
                    } else {
                        state.result = rLeftVal >= rRightVal;
                    };
                    break;
                case '==':
                    if (leftVal.isConstraintObject && leftVal.cnEquals) {
                        state.result = leftVal.cnEquals(rightVal);
                    } else if (rightVal.isConstraintObject && rightVal.cnEquals) {
                        state.result = rightVal.cnEquals(leftVal);
                    } else {
                        state.result = rLeftVal == rRightVal;
                    };
                    break;
                case '===':
                    if (leftVal.isConstraintObject && leftVal.cnIdentical) {
                        state.result = leftVal.cnIdentical(rightVal);
                    } else if (rightVal.isConstraintObject && rightVal.cnIdentical) {
                        state.result = rightVal.cnIdentical(leftVal);
                    } else {
                        state.result = rLeftVal === rRightVal;
                    };
                    break;
            }
        } else {
            $super(node, state);
        }
    },



    visitMemberExpression: function($super, node, state) {
        if (cop.currentLayers().indexOf(ConstraintConstructionLayer) === -1) {
            // XXX: See visitIfStatement
            return $super(node, state);
        }
        // BEGIN COPIED FROM ACORN
        this.accept(node.object, state);
        var object = state.result,
            property;
        if ((node.property.type == 'Identifier') && !node.computed)
            property = node.property.name;
        else {
            this.accept(node.property, state);
            property = state.result;
        }
        // END COPIED FROM ACORN
        var cobj = (object ? object[ConstrainedVariable.ThisAttrName] : undefined),
            cvar;
        if (object === Global || (object instanceof lively.Module)) {
            return object[property];
        }
        if (object && object.isConstraintObject) {
            cobj = object.__cvar__;
            object = this.getConstraintObjectValue(object);
        }

        cvar = ConstrainedVariable.newConstraintVariableFor(object, property, cobj);
        if (Constraint.current) {
            cvar.ensureExternalVariableFor(Constraint.current.solver);
            cvar.addToConstraint(Constraint.current);
        }
        if (cvar && cvar.isSolveable()) {
            state.result = cvar.externalVariable;
        } else {
            var getter = object.__lookupGetter__(property);
            if (getter) {
                state.result = this.invoke(object, getter, [], state.currentFrame, false/*isNew*/)
            } else {
                var retval = object[property];
                if (retval) {
                    retval[ConstrainedVariable.ThisAttrName] = cvar;
                }
                state.result = retval;
            }
        }
    },
    visitReturnStatement: function($super, node, state) {
        $super(node, state);
        var retVal = state.result;
        if (retVal) {
            var cvar = retVal[ConstrainedVariable.ThisAttrName];
            if (retVal.isConstraintObject) {
                cvar = retVal.__cvar__;
            }
            if (cvar) {
                var parentFunc = node.parentFunction();
                if (parentFunc) {
                    cvar.getter = parentFunc.name();
                    cvar.recv = this.currentFrame.mapping["this"];
                }
            }
        }
    },



    shouldInterpret: function($super, frame, func) {
        if (func.sourceModule === Global.users.timfelgentreff.babelsberg.constraintinterpreter) {
            return false;
        }
        if (func.declaredClass === "Babelsberg") {
            return false;
        }
        if (typeof(func.forInterpretation) == "function"){
            debugger
            return false;
        }
        var nativeClass = lively.Class.isClass(func) && func.superclass === undefined;
        return !nativeClass && $super(frame, func);
    },
    setSlot: function($super, node, state) {
        // BEGIN COPIED FROM ACORN
        if (node.type != 'MemberExpression')
            throw new Error('setSlot can only be called with a MemberExpression node');
        var value = state.result;
        this.accept(node.object, state);
        var obj = state.result, prop;
        if (node.property.type == 'Identifier' && !node.computed) {
            prop = node.property.name;
        } else {
            this.accept(node.property, state);
            prop = state.result;
        }
        // END COPIED FROM ACORN
        if (obj === Global || (obj instanceof lively.Module)) {
            return obj[prop] = value;
        }
        if (obj && obj.isConstraintObject) {
            obj = this.getConstraintObjectValue(obj);
        }
        // BEGIN COPIED FROM ACORN
        var setter = obj.__lookupSetter__(prop);
        if (setter) {
            this.invoke(obj, setter, [value], state.currentFrame, false/*isNew*/);
        } else if (obj === state.currentFrame.arguments) {
            obj[prop] = value;
            state.currentFrame.setArguments(obj);
        } else {
            obj[prop] = value;
        }
        state.result = value;
        // END COPIED FROM ACORN
        var cvar = ConstrainedVariable.newConstraintVariableFor(obj, prop);
        if (Constraint.current) {
            cvar.ensureExternalVariableFor(Constraint.current.solver);
            cvar.addToConstraint(Constraint.current);
            if (cvar.isSolveable()) {
                Constraint.current.addPrimitiveConstraint(cvar.externalVariable.cnEquals(value));
            }
        }
    },
    newObject: function($super, func) {
        if (func.original) {
            return $super(func.original);
        } else {
            return $super(func);
        }
    },

})

ConstrainedVariable.AttrName = "__constrainedVariables__";
ConstrainedVariable.ThisAttrName = "__lastConstrainedVariableForThis__";
Object.extend(ConstrainedVariable, {
    findConstraintVariableFor: function(obj, ivarname) {
        var l = obj[ConstrainedVariable.AttrName ];
        if (l && l[ivarname]) {
            return l[ivarname];
        } else {
            return null;
        }
    },

    newConstraintVariableFor: function(obj, ivarname, cobj) {
        var cvar = this.findConstraintVariableFor(obj, ivarname);
        if (!cvar) {
            cvar = new ConstrainedVariable(obj, ivarname, cobj);
            obj[ConstrainedVariable.AttrName] = obj[ConstrainedVariable.AttrName] || {};
            obj[ConstrainedVariable.AttrName][ivarname] = cvar;
        }
        return cvar;
    },
    
    deleteConstraintVariableFor: function(obj, ivarname) {
        var l = obj[ConstrainedVariable.AttrName ];
        if (l && l[ivarname]) {
            delete l[ivarname];
        }
    },

    isSuggestingValue: false,
})

ObjectLinearizerPlugin.subclass('DoNotSerializeConstraintPlugin',
'plugin interface', {
    ignoreProp: function (obj, key, value) {
        return (key === ConstrainedVariable.AttrName ||
                key === ConstrainedVariable.ThisAttrName ||
                (value instanceof Constraint))
    },
});
lively.persistence.pluginsForLively.push(DoNotSerializeConstraintPlugin);

})
