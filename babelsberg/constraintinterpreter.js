module('users.timfelgentreff.babelsberg.constraintinterpreter').requires(
    'users.timfelgentreff.jsinterpreter.Interpreter',
    'cop.Layers',
    'users.timfelgentreff.babelsberg.cassowary_ext',
    'users.timfelgentreff.babelsberg.deltablue_ext',
    'users.timfelgentreff.babelsberg.csp_ext',
    'users.timfelgentreff.babelsberg.core_ext',
    'users.timfelgentreff.babelsberg.src_transform',
    'users.timfelgentreff.babelsberg.babelsberg-lively',
    'users.timfelgentreff.sutherland.relax_bbb').
toRun(function() {

/**
 * The interface to create, maintain and remove constraints.
 * @class Babelsberg
 */
Object.subclass('Babelsberg', {

    initialize: function() {
        this.defaultSolvers = [new ClSimplexSolver(), new DBPlanner(), new csp.Solver()];
        this.defaultReevaluationInterval = 1000;
        this.callbacks = [];
    },

    isConstraintObject: true,

    /**
     * Removes the listener on the given property of the given object.
     * @function Babelsberg#unconstrain
     * @public
     * @param {Object} obj The object whose property should be unconstrained.
     * @param {string} accessor The name of the property to be unconstrained.
     */
    unconstrain: function(obj, accessor) {
        if (!obj) return;
        var cvar = ConstrainedVariable.findConstraintVariableFor(obj, accessor);
        if (!cvar) return;
        var cGetter = obj.__lookupGetter__(accessor),
            cSetter = obj.__lookupSetter__(accessor);
        if (!cGetter && !cSetter) {
            return;
        }
        if (!cGetter.isConstraintAccessor || !cSetter.isConstraintAccessor) {
            throw 'too many accessors - ' +
                'unconstrain only works for the very simple case now';
        }
        ConstrainedVariable.deleteConstraintVariableFor(obj, accessor);
        var newName = cvar.newIvarname;
        var existingSetter = obj.__lookupSetter__(newName),
            existingGetter = obj.__lookupGetter__(newName);
        if (existingGetter) {
            obj.__defineGetter__(accessor, existingGetter);
        }
        if (existingSetter) {
            obj.__defineSetter__(accessor, existingSetter);
        }
        if (!existingSetter || !existingGetter) {
            delete obj[accessor];
        }
        obj[accessor] = obj[newName];
        delete obj[newName];

        // recursive unconstrain
        var child = obj[accessor];
        bbb.unconstrainAll(child);
    },

    /**
     * Removes all listener on the given object.
     * @function Babelsberg#unconstrainAll
     * @public
     * @param {Object} obj The object whose property should be unconstrained.
     */
    unconstrainAll: function(obj) {
        if (obj && obj instanceof Object) {
            Object.keys(obj).each(function(property, index) {
                var cvar = ConstrainedVariable.findConstraintVariableFor(
                    obj,
                    property
                );
                if (!cvar) return;
                var cGetter = obj.__lookupGetter__(property),
                    cSetter = obj.__lookupSetter__(property);
                if (!cGetter && !cSetter) return;
                if (!cGetter.isConstraintAccessor || !cSetter.isConstraintAccessor) {
                    return;
                }

                bbb.unconstrain(obj, property);
            });
        }

    },

    /**
     * Some solvers, like Cassowary and DeltaBlue, handle assignments
     * by using temporary constraint that reflects the
     * assignments. The creation and deletion of these constraints can
     * be costly if assignments are done frequently. The edit function
     * is one way to deal with this issue. Use it on attributes that
     * are frequently modified for better performance.
     * @function Babelsberg#edit
     * @public
     * @param {Object} obj An object that is modified quite often.
     * @param {string[]} accessors The property names of the properties that are modified.
     * @return {function} {
     *    A callback that can be used to assign new values to the given properties.
     * }
     * @example Example usage of bbb.edit
     * var s = new DBPlanner(),
     *     obj = {int: 42, str: "42"};
     *
     * // Keep the attributes 'str' and 'int' in sync.
     * bbb.always({
     *     solver: deltablue,
     *     ctx: {
     *         obj: obj
     *     }, methods: function() {
     *         obj.int.formula([obj.str], function (str) { return parseInt(str); });
     *         obj.str.formula([obj.int], function (int) { return int + ""; })
     *     }
     * }, function () {
     *     return obj.int + "" === obj.str;
     * });
     *
     * // Create an edit constraint for frequent assignments on obj.int.
     * var callback = bbb.edit(obj, ["int"]);
     * // Assign 17 as the new value of obj.int. Constraints are solved automatically.
     * callback([17]);
     */
    edit: function(obj, accessors) {
        var extVars = {},
            cVars = {},
            extConstraints = [],
            solvers = [],
            callback = function(newObj) {
                if (!newObj) { // end-of-edit
                    for (var prop in extVars) {
                        extVars[prop].each(function(evar) {
                            evar.finishEdit();
                        });
                    }
                    solvers.invoke('endEdit');
                } else {
                    var newEditConstants = newObj;
                    if (!Object.isArray(newObj)) {
                        newEditConstants = accessors.map(function(accessor) {
                            return newObj[accessor];
                        });
                    }
                    solvers.invoke('resolveArray', newEditConstants);
                    accessors.each(function(a) {
                        cVars[a].suggestValue(cVars[a].externalValue);
                        // extVars[a] = extVars[a]; // set the value,
                        // propagates change to other property
                        // accessors calls the setters does not
                        // recurse into solvers, because they have
                        // already adopted the correct value
                    });
                }
            };

        accessors.each(function(accessor) {
            var cvar = ConstrainedVariable.findConstraintVariableFor(obj, accessor);
            if (!cvar) {
                throw 'Cannot edit ' + obj + '["' + accessor +
                    '"], because it isn\'t constrained';
            }
            var evars = Properties.values(cvar._externalVariables);
            if (evars.compact().length < evars.length) {
                throw 'Cannot edit ' + obj + '["' + accessor +
                    '"], because it is in a recalculate relation';
            }
            var hasEditSolver = cvar.solvers.any(function(s) {
                return !Object.isFunction(s.beginEdit);
            });
            if (hasEditSolver) {
                throw 'Cannot edit ' + obj + '["' + accessor +
                    '"], because it is in a no-edit solver';
            }
            cVars[accessor] = cvar;
            extVars[accessor] = evars;
            solvers = solvers.concat(cvar.solvers).uniq();
            evars.each(function(evar) {
                evar.prepareEdit();
            });
        });

        solvers.invoke('beginEdit');
        return callback;
    },

    /**
     * Marks the given object as readonly. This functionality is only
     * supported for some solvers.
     * @function Babelsberg#readonly
     * @public
     * @param {Object} obj The object that should not be modified.
     * @example Example usage of bbb.readonly
     * var s = new ClSimplexSolver(),
     *     pt = {x: 1, y: 2, z: 3};
     *
     * // The x and y coordinate of the point should sum up to its z coordinate.
     * // Cassowary is not allowed to change the value of pt.y in order to
     * // fulfill this constraint.
     * always: { solver: s
     *     pt.x + bbb.readonly(pt.y) == pt.z
     * }
     *
     * // This assignment cannot modify pt.y, but rather changes pt.z.
     * pt.x = 4;
     */
    readonly: function(obj) {
        if (obj.isConstraintObject) {
            obj.setReadonly(true);
        } else {
            if (Constraint.current && Constraint.current.solver) {
                Properties.own(obj).each(function(ea) {
                    var cvar = ConstrainedVariable.newConstraintVariableFor(obj, ea);
                    cvar.addToConstraint(Constraint.current);
                    cvar.ensureExternalVariableFor(Constraint.current.solver);
                    if (cvar.isSolveable()) {
                        bbb.readonly(cvar.externalVariables(Constraint.current.solver));
                    }
                });
            }
        }
        return obj;
    },

    /**
     * Creates a constraint equivalent to the given function.
     * @function Babelsberg#always
     * @public
     * @param {Object} opts An options object to configure the constraint construction.
     * @param {Object} opts.ctx The local scope in which the given function is executed.
     * @param {Object} [opts.solver] The solver to maintain the constraint.
     * @param {boolean} [opts.allowTests=false]
     *     If true, allows to specify assertions rather than solvable constraints.
     * @param {boolean} [opts.allowUnsolvableOperations=false]
     *     If true, allows the use of operations that are not supported by the solver.
     * @param {boolean} [opts.debugging=false]
     *     If true, calls debugger at certain points during constraint construction.
     * @param {boolean} [opts.logTimings=false]
     *     If true, prints solver timings to console.
     * @param {boolean} [opts.logReasons=false]
     *     If true, logs why certain solvers are not used for a constraint.
     * @param {function} func The constraint to be fulfilled.
     */
    always: function(opts, func) {
        var solvers = this.chooseSolvers(opts.solver),
            errors = [];

        func.allowTests = (opts.allowTests === true);
        func.allowUnsolvableOperations = (opts.allowUnsolvableOperations === true);
        func.debugging = opts.debugging;
        func.onError = opts.onError;
        //TODO: remove this from all solver implementations or move to filterSolvers
        func.varMapping = opts.ctx;

        solvers = this.filterSolvers(solvers, opts, func);
        var constraints = this.createEquivalentConstraints(solvers, opts, func, errors);
        var constraint = this.chooseConstraint(constraints, opts, errors);
        if (!opts.postponeEnabling && constraint) {
            try {
                constraint.isAnyVariableCurrentlySuggested = true; // do not increase
                                                                   // updateCounter
                try {
                    constraint.enable();
                } finally {
                    constraint.isAnyVariableCurrentlySuggested = false;
                }
            } catch (e) {
                errors.push(e);
                constraint.disable();
                constraint.abandon();
                constraint = null;
            }
        }
        if (constraint) {
            this.abandonAllConstraintsExcept(constraint, constraints);
        } else {
            if (typeof opts.onError === 'function') {
                bbb.addCallback(opts.onError, opts.onError.constraint, errors);
            } else {
                bbb.addCallback(function(e) {
                    e = e || new Error('No solver available!');
                    e.errors = Array.from(arguments);
                    throw e;
                }, null, errors);
            }
        }
        bbb.processCallbacks();
        return constraint;
    },

    abandonAllConstraintsExcept: function(constraintToKeep, constraints) {
        constraints.each(function(each) {
            if (each !== constraintToKeep && each !== null)
                each.abandon();
        });
    },

    stay: function(opts, func) {
        func.allowTests = (opts.allowTests === true);
        func.allowUnsolvableOperations = (opts.allowUnsolvableOperations === true);
        func.debugging = opts.debugging;
        func.onError = opts.onError;
        func.varMapping = opts.ctx;
        var solver = (opts.solver || this.defaultSolver),
            c = new Constraint(func, solver);
        c.constraintvariables.each(function(cv) {
            try {
                cv.externalVariables(solver).stay(opts.priority);
            } catch (e) {
                console.log('Warning: could not add stay to ' + cv.ivarname);
            }
        }.bind(this));
        return true;
    },

    /**
     * Creates a constraint equivalent to the given function through
     * Babelsberg#always, and then disables it immediately
     * @function Babelsberg#once
     * @public
     */
    once: function(opts, func) {
        var constraint = this.always(opts, func);
        constraint.disable();
        return constraint;
    },

    chooseSolvers: function(optSolver) {
        if (optSolver) {
            return [optSolver];
        } else if (this.defaultSolver) {
            return [this.defaultSolver];
        } else if (this.defaultSolvers.length > 0) {
            return this.defaultSolvers;
        } else {
            return [];
            // throw new Error('Must pass a solver, or set defaultSolver.');
        }
    },

    filterSolvers: function(solvers, opts, func) {
        var result = [];

        // FIXME: this global state is ugly
        bbb.seenTypes = {};
        bbb.seenFiniteDomain = false;
        try {
            cop.withLayers([ConstraintInspectionLayer], function() {
                func.forInterpretation().apply(undefined, []);
            });
        } catch (e) {
            bbb.seenTypes = {};
            bbb.seenFiniteDomain = false;
            if (opts.logReasons) {
                console.warn('Parsing the expression for types failed, ' +
                   'will not check types:', e);
            }
        }

        solvers.each(function(solver) {
            if (opts.methods && !solver.supportsMethods()) {
                if (opts.logReasons) {
                    console.log('Ignoring ' + solver.solverName +
                        ' because it does not support opts.methods');
                }
                return false;
            }

            if (opts.priority && opts.priority != 'required' &&
                !solver.supportsSoftConstraints()) {
                if (opts.logReasons) {
                    console.log('Ignoring ' + solver.solverName +
                        ' because it does not support soft constraints');
                }
                return false;
            }

            if (bbb.seenFiniteDomain && !solver.supportsFiniteDomains()) {
                if (opts.logReasons) {
                    console.log('Ignoring ' + solver.solverName +
                        ' because it does not support finite domains');
                }
                return false;
            }

            for (var type in bbb.seenTypes) {
                if (solver.supportedDataTypes().indexOf(type) == -1) {
                    if (opts.logReasons) {
                        console.log('Ignoring ' + solver.solverName +
                            ' because it does not support ' + type + ' variables');
                    }
                    return false;
                }
            }

            result.push(solver);
        });

        delete bbb.seenTypes;
        delete bbb.seenFiniteDomain;
        return result;
    },

    /**
     * Create a Constraint for opts and func for each of the specified solvers.
     * Return an array of the created Constraints.
     */
    createEquivalentConstraints: function(solvers, opts, func, errors) {
        var constraints = [];
        solvers.each(function(solver) {
            try {
                var optsForSolver = Object.clone(opts);
                var constraint = solver.always(optsForSolver, func);
                if (typeof opts.reevaluationInterval === 'number')
                    constraint.reevaluationInterval = opts.reevaluationInterval;
                constraint.opts = optsForSolver;
                constraint.originalOpts = opts;
                constraints.push(constraint);
            } catch (e) {
                errors.push(e);
                return;
            }
        });
        return constraints;
    },

    /**
     * Choose one of the specified constraints which performs best according to the
     * requirements laid out in opts.
     */
    chooseConstraint: function(constraints, opts, errors) {
        if (constraints.length === 1)
            return constraints[0];
        var constraint = null;
        var previouslyEnabledConstraints = [];
        // make sure all constraints are disabled before the comparison
        constraints.each(function(each) {
            if (each._enabled)
                previouslyEnabledConstraints.push(each);
            each.disable();
        });
        for (var i = 0; i < constraints.length; i++) {
            try {
                Constraint.current = constraints[i];
                constraints[i].enable(true);
                constraints[i].disable();
            } catch (e) {
                errors.push(e);
                constraints[i].disable();
                constraints[i].abandon();
                constraints[i] = null;
            } finally {
                Constraint.current = null;
            }
        }
        var minIndex = -1;
        var constraint = null;
        if (opts.optimizationPriority === undefined) {
            opts.optimizationPriority = ['time', 'numberOfChangedVariables'];
        }
        var minimumConstraintMetrics = {};
        for (var i = 0; i < opts.optimizationPriority.length; i++) {
            minimumConstraintMetrics[opts.optimizationPriority[i]] = Number.MAX_VALUE;
        }
        for (var i = 0; i < constraints.length; i++) {
            if (!constraints[i]) {
                continue;
            }
            for (var m = 0; m < opts.optimizationPriority.length; m++) {
                var metricName = opts.optimizationPriority[m];
                var iMetric = constraints[i].comparisonMetrics[metricName];
                if (typeof iMetric === 'function') {
                    iMetric = iMetric.call(constraints[i].comparisonMetrics);
                }
                var currentMinimum = minimumConstraintMetrics[metricName];
                if (typeof currentMinimum === 'function') {
                    currentMinimum = currentMinimum.call(minimumConstraintMetrics);
                }
                if (iMetric > currentMinimum) {
                    break; // do not check further metrics
                }
                if (iMetric != currentMinimum) {
                    // iMetric is either smaller or NaN
                    minimumConstraintMetrics = constraints[i].comparisonMetrics;
                    minIndex = i;
                    if (iMetric < currentMinimum) {
                        break; // do not check further metrics
                    }
                }
            }
        }
        if (minIndex > -1) {
            constraint = constraints[minIndex];
            console.log('Selected best solver: ' + constraint.solver.solverName);
        }
        return constraint;
    },

    /**
     * Creates a constraint equivalent to the given function through
     * Babelsberg#always, and then disables it immediately
     * @function Babelsberg#once
     * @public
     */
    once: function(opts, func) {
        var constraint = this.always(opts, func);
        constraint.disable();
        return constraint;
    },

    reevaluateSolverSelection: function(currentConstraint, updatedConstraintVariable) {
        var currentSolver = currentConstraint.solver;
        var func = currentConstraint._predicate;
        var opts = currentConstraint.originalOpts;
        var solvers = this.chooseSolvers(opts.solver);
        solvers = solvers.filter(function(each) { return each !== currentSolver; });
        solvers = this.filterSolvers(solvers, opts, func);
        if (solvers.length < 1)
            return; // no other solver is qualified to enforce this constraint
        var errors = [];
        var constraints = this.createEquivalentConstraints(solvers, opts, func, errors);
        constraints.push(currentConstraint);
        var constraint = this.chooseConstraint(constraints, opts, errors);
        if (constraint !== currentConstraint) {
            currentConstraint.solver = constraint.solver;
            // yes, constraint does not replace currentConstraint, only its solver
            currentConstraint.resetDefiningSolverOfVariables();
        }
        this.abandonAllConstraintsExcept(currentConstraint, constraints);
        currentConstraint.enable();
    },

    addCallback: function(func, context, args) {
        this.callbacks.push({
            func: func,
            context: context,
            args: args || []
        });
    },

    processCallbacks: function() {
        (function() {
            while (bbb.callbacks.length > 0) {
                var cb = bbb.callbacks.shift();
                cb.func.apply(cb.context, cb.args);
            }
        }).recursionGuard(bbb, 'isProcessingCallbacks');
    },

    isValueClass: function(variable) {
        // TODO: add more value classes
        return variable instanceof lively.Point;
    }
});

Object.extend(Global, {
    /**
     * A globally accessible instance of {@link Babelsberg}
     * @global
     */
    bbb: new Babelsberg()
});

users.timfelgentreff.jsinterpreter.Send.addMethods({
    get args() {
        return this._$args || [];
    },

    set args(value) {
        this._$args = value;
    }
});

cop.create('ConstraintInspectionLayer')
.refineClass(users.timfelgentreff.jsinterpreter.InterpreterVisitor, {
    visitGetSlot: function(node) {
        var obj = this.visit(node.obj),
            name = this.visit(node.slotName),
            value = obj[name];

        if (!(node._parent instanceof users.timfelgentreff.jsinterpreter.GetSlot) &&
            !(node._parent instanceof users.timfelgentreff.jsinterpreter.Send) &&
            !(node._parent instanceof users.timfelgentreff.jsinterpreter.Call) &&
            value != undefined && !bbb.isValueClass(value)) {
            bbb.seenTypes[typeof value] = true;
        }
        return value;
    },
    visitNumber: function(node) {
        if (!(node._parent instanceof users.timfelgentreff.jsinterpreter.GetSlot)) {
            bbb.seenTypes[typeof node.value] = true;
        }
        return node.value;
    },
    visitString: function(node) {
        if (!(node._parent instanceof users.timfelgentreff.jsinterpreter.GetSlot)) {
            bbb.seenTypes[typeof node.value] = true;
        }
        return node.value;
    },
    visitBinaryOp: function(node) {
        if (node.name == 'in' &&
            node.right instanceof users.timfelgentreff.jsinterpreter.ArrayLiteral) {
            bbb.seenFiniteDomain = true;
        }
        cop.proceed(node);
    },
    //FIXME: copy&paste from constraintconstructionlayer
    shouldInterpret: function(frame, func) {
        if (func.sourceModule ===
                Global.users.timfelgentreff.babelsberg.constraintinterpreter) {
            return false;
        }
        if (func.declaredClass === 'Babelsberg') {
            return false;
        }
        var nativeClass = lively.Class.isClass(func) && func.superclass === undefined;
        return (!(this.isNative(func) || nativeClass)) &&
                 typeof(func.forInterpretation) == 'function';
    }
});

cop.create('ConstraintConstructionLayer')
.refineObject(users.timfelgentreff.jsinterpreter, {
    get InterpreterVisitor() {
        return ConstraintInterpreterVisitor;
    }
}).refineClass(users.timfelgentreff.jsinterpreter.Send, {
    asFunction: function(optFunc) {
        var initializer = optFunc.prototype.initialize.ast().asFunction();
        initializer.original = optFunc;
        return initializer;
    }
}).refineClass(users.timfelgentreff.jsinterpreter.GetSlot, {
    set: function(value, frame, interpreter) {
        var obj = interpreter.visit(this.obj),
            name = interpreter.visit(this.slotName);
        if (obj === Global || (obj instanceof lively.Module)) {
            return obj[name] = value;
        }
        if (obj && obj.isConstraintObject) {
            obj = this.getConstraintObjectValue(obj);
        }

        obj[name] = value;
        cvar = ConstrainedVariable.newConstraintVariableFor(obj, name);
        if (Constraint.current) {
            cvar.ensureExternalVariableFor(Constraint.current.solver);
            cvar.addToConstraint(Constraint.current);
            if (cvar.isSolveable()) {
                Constraint.current.addPrimitiveConstraint(
                    cvar.externalVariable.cnEquals(value)
                );
            }
        }
    }
});

/**
 * Represents an invariant.
 * @class Constraint
 */
Object.subclass('Constraint', {
    initialize: function(predicate, solver) {
        var constraintObject;
        this._enabled = false;
        this._predicate = predicate;
        if (typeof predicate.onError === 'function') {
            this.onError = predicate.onError;
            this.onError.constraint = this;
        }
        this.constraintobjects = [];
        this.constraintvariables = [];
        this.solver = solver;
        this.reevaluationInterval = bbb.defaultReevaluationInterval;
        this.updateCounter = 0;

        // FIXME: this global state is ugly
        try {
            Constraint.current = this;
            constraintObject = cop.withLayers([ConstraintConstructionLayer], function() {
                return predicate.forInterpretation().apply(undefined, []);
            });
        } finally {
            Constraint.current = null;
        }
        this.addPrimitiveConstraint(constraintObject);
    },
    addPrimitiveConstraint: function(obj) {
        if (typeof(obj) != 'undefined' && !this.constraintobjects.include(obj)) {
            if (!obj.enable) this.haltIfDebugging();
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
    get allowUnsolvableOperations() {
        this.haltIfDebugging();
        return !!this.predicate.allowUnsolvableOperations;
    },
    haltIfDebugging: function() {
        if (this.predicate.debugging) debugger;
    },
    get allowTests() {
        this.haltIfDebugging();
        return !!this.predicate.allowTests;
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

    /**
     * Enables this constraint. This is done automatically after
     * constraint construction by most solvers.
     * @function Constraint#enable
     * @param {boolean} [bCompare] signifies that there are multiple
     *                              solvers to be compared
     * @public
     */
    enable: function(bCompare) {
        if (!this._enabled) {
            Constraint.enabledConstraintsGuard.tick();
            this.constraintobjects.each(function(ea) {
                this.enableConstraintObject(ea);
            }.bind(this));
            if (this.constraintobjects.length === 0) {
                throw new Error('BUG: No constraintobjects were created.');
            }
            this._enabled = true;
            this.constraintvariables.each(function(v) {v._resetIsSolveable();});
            var begin = performance.now();
            this.solver.solve();
            var end = performance.now();
            if (this.opts.logTimings) {
                console.log((this.solver ? this.solver.solverName : '(no solver)') +
                    ' took ' + (end - begin) + ' ms to solve in enable');
            }

            var changedVariables = 0;
            var variableAssigments = {};
            this.constraintvariables.each(function(ea) {
                var value = ea.getValue();
                var oldValue = ea.storedValue;
                if (oldValue !== value) {
                    variableAssigments[ea.ivarname] = {oldValue: oldValue,
                        newValue: value};
                    changedVariables += 1;
                }
                // solveForConnectedVariables might eventually
                // call updateDownstreamExternalVariables, too.
                // We need this first, however, for the case when
                // this newly enabled constraint is the new
                // highest-weight solver
                if (!bCompare) {
                    ea.updateDownstreamExternalVariables(value);
                    ea.solveForConnectedVariables(value);
                }
            });
            this.comparisonMetrics = {time: end - begin,
                numberOfChangedVariables: changedVariables,
                assignments: variableAssigments};
            Object.extend(this.comparisonMetrics, {
               squaredChangeDistance: function() {
                   var sumOfSquaredDistances = 0;
                   for (var varname in this.assignments) {
                       var assignment = this.assignments[varname];
                       var distance = assignment.newValue - assignment.oldValue;
                       sumOfSquaredDistances += distance * distance;
                   }
                   return sumOfSquaredDistances;
               }
            });
        }
    },

    enableConstraintObject: function(obj, optPriority) {
        if (obj === true) {
            if (this.allowTests) {
                this.isTest = true;
                // alertOK(
                //     'Warning: Constraint expression returned true. ' +
                //         'Re-running whenever the value changes'
                // );
            } else {
                throw new Error(
                    'Constraint expression returned true, but was not marked as test. ' +
                        'If you expected this to be solveable, check that there are ' +
                        'no operations in this that cannot be solved by the selected ' +
                        "solver (e.g. Cassowary does not support `<', only `<='). " +
                        'Otherwise, if you think this is ok, you must pass ' +
                        "`allowTests: true' as option to the constraint."
                );
            }
        } else if (obj === false) {
            if (!this.allowFailing) {
                throw new Error(
                    'Constraint expression returned false, no solver available to fix it'
                );
            }
        } else if (!obj.enable) {
            var e = new Error(
                'Constraint expression returned an ' +
                    'object that does not respond to #enable'
            );
            e.obj = obj;
            e.constraint = this;
            throw e;
        } else {
            obj.solver = this.solver; // XXX: Bit of a hack, should really write it so
                                      // this gets passed through from the variables
            obj.enable(optPriority || this._priority);
        }
    },

    /**
     * Disables this constraint. It is not further maintained until
     * its {@link Constraint#enable|re-enabling}.
     * @function Constraint#disable
     * @public
     */
    disable: function() {
        if (this._enabled) {
            Constraint.enabledConstraintsGuard.tick();
            this.constraintobjects.each(function(ea) {
                try {ea.disable()} catch (e) {}
            });
            this._enabled = false;
        }
    },

    recalculate: function() {
        if (!this._enabled) return;
        // TODO: Fix this so it uses the split-stay result, i.e. just
        // increase the stay for the newly assigned value
        if (this.isTest && !this.solver) {
            debugger;
            // TODO: If this is a test and there is no solver,
            // we can safely just run this as an assert
        }

        var enabled = this._enabled,
            cvars = this.constraintvariables,
            self = this,
            assignments;
        if (enabled) {
            this.disable();
        }
        this.initialize(this.predicate, this.solver);

        cvars.select(function(ea) {
            // all the cvars that are not in this constraint anymore
            return !this.constraintvariables.include(ea) && ea.isSolveable();
        }.bind(this)).each(function(ea) {
            return ea.externalVariable.removeStay();
        });

        if (enabled) {
            this.enable();

            assignments = this.constraintvariables.select(function(ea) {
                // all the cvars that are new after this recalculation
                return !cvars.include(ea) && ea.isSolveable();
            }).collect(function(ea) {
                // add a required constraint for the new variable
                // to keep its new value, to have the same semantics
                // as for direct assignment
                return ea.externalVariable.cnIdentical(ea.getValue());
            });

            assignments.each(function(ea) {
                try {
                    self.enableConstraintObject(ea);
                } catch (_) {
                    // if the assignment cannot be completely satisfied, make it strong
                    self.enableConstraintObject(ea, self.solver.strength.strong);
                }
            });

            try {
                // try to enable this constraints with (some) required assignments
                this.enable();
            } catch (_) {
                // if it fails, disable, make all the assignments only strong, re-enable
                this._enabled = true; // force disable to run
                this.disable();
                assignments.invoke('disable');
                assignments.invoke(
                    'enable',
                    this.solver.strength && this.solver.strength.strong
                );
                this.enable();
            } finally {
                assignments.invoke('disable');
            }
        }
    },


    /**
     * Indicate that this Constraint will never be enabled again.
     * Causes external variables of related ConstrainedVariables to be detached
     * if they were connected to their solver only via this Constraint.
     */
    abandon: function() {
        this.constraintvariables.each(function(eachVar) {
            eachVar.abandonConstraint(this);
        }, this);
        // TODO: eject those external variables also from their solvers if possible
        // because the solvers might be put to use somewhere else and should not be
        // bothered with old (possibly duplicated) variables, should they?
    },

    resetDefiningSolverOfVariables: function() {
        this.constraintvariables.each(function(eachVar) {
            eachVar.resetDefiningSolver();
        });
    }
});
Object.extend(Constraint, {
    set current(p) {
        if (!this._previous) {
            this._previous = [];
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

    enabledConstraintsGuard: new Guard()
});

Object.subclass('ConstrainedVariable', {
    initialize: function(obj, ivarname, optParentCVar) {
        this.__uuid__ = Strings.newUUID();
        this.obj = obj;
        this.ivarname = ivarname;
        this.newIvarname = '$1$1' + ivarname;
        this.parentConstrainedVariable = optParentCVar;
        this._constraints = [];
        this._externalVariables = {};
        this._isSolveable = false;
        this._definingSolver = null;
        var value = obj[ivarname],
            solver = this.currentSolver;

        dbgOn(!solver);
        this.ensureExternalVariableFor(solver);

        this.wrapProperties(obj, solver);
    },
    wrapProperties: function(obj, solver) {
        var existingSetter = obj.__lookupSetter__(this.ivarname),
            existingGetter = obj.__lookupGetter__(this.ivarname);

        if (existingGetter && !existingGetter.isConstraintAccessor) {
            obj.__defineGetter__(this.newIvarname, existingGetter);
        }
        if (existingSetter && !existingSetter.isConstraintAccessor) {
            obj.__defineSetter__(this.newIvarname, existingSetter);
        }
        // assign old value to new slot
        if (!existingGetter &&
            !existingSetter &&
            this.obj.hasOwnProperty(this.ivarname)) {
            this.setValue(obj[this.ivarname]);
        }

        try {
            obj.__defineGetter__(this.ivarname, function() {
                return this.getValue();
            }.bind(this));
        } catch (e) { /* Firefox raises for Array.length */ }
        var newGetter = obj.__lookupGetter__(this.ivarname);
        if (!newGetter) {
            // Chrome silently ignores __defineGetter__ for Array.length
            this.externalVariables(solver, null);
            return;
        }

        obj.__defineSetter__(this.ivarname, function(newValue) {
            return this.suggestValue(newValue, 'source');
        }.bind(this));
        var newSetter = obj.__lookupSetter__(this.ivarname);

        if (newSetter) newSetter.isConstraintAccessor = true;
        if (newGetter) newGetter.isConstraintAccessor = true;
    },
    ensureExternalVariableFor: function(solver) {
        var eVar = this.externalVariables(solver),
            value = this.obj[this.ivarname];

        if (!eVar && eVar !== null) { // don't try to create an external variable twice
            this.externalVariables(
                solver,
                solver.constraintVariableFor(value, this.ivarname, this)
            );
        }
    },



    get currentSolver() {
        if (Constraint.current) {
            return Constraint.current.solver;
        } else {
            return null;
        }
    },

    suggestValue: function(value, source, force) {
        if (ConstrainedVariable.$$callingSetters) {
            return value;
        } else if (force || value !== this.storedValue) {
            var callSetters = !ConstrainedVariable.$$optionalSetters,
                oldValue = this.storedValue,
                solver = this.definingSolver;
            var definingConstraint = this.definingConstraint;

            ConstrainedVariable.$$optionalSetters =
                ConstrainedVariable.$$optionalSetters || [];

            try {
                var isInitiatingSuggestForDefiningConstraint = false;
                if (definingConstraint !== null) {
                    isInitiatingSuggestForDefiningConstraint =
                        !definingConstraint.isAnyVariableCurrentlySuggested;
                    definingConstraint.isAnyVariableCurrentlySuggested = true;
                }
                var begin = performance.now();
                // never uses multiple solvers, since it gets the defining Solver
                this.solveForPrimarySolver(value, oldValue, solver, source, force);
                if (definingConstraint && definingConstraint.opts.logTimings) {
                    console.log((solver ? solver.solverName : '(no solver)') +
                        ' took ' + (performance.now() - begin) + ' ms' +
                        ' to solve for ' + this.ivarname + ' in suggestValue');
                }
                if (isInitiatingSuggestForDefiningConstraint) {
                    definingConstraint.updateCounter += 1;
                    if (definingConstraint.updateCounter >=
                        definingConstraint.reevaluationInterval) {
                            bbb.reevaluateSolverSelection(definingConstraint, this);
                            definingConstraint.updateCounter = 0;
                        }
                }
                this.solveForConnectedVariables(value, oldValue, source, force);
                this.findAndOptionallyCallSetters(callSetters);
            } catch (e) {
                if (this.getValue() !== oldValue) {
                    throw new Error('solving failed, but variable changed to ' +
                        this.getValue() + ' from ' + oldValue);
                }
                this.addErrorCallback(e);
            } finally {
                this.ensureClearSetters(callSetters);
                if (this.isSolveable() && solver && source) {
                    // was bumped up in solveForPrimarySolver
                    this.bumpSolverWeight(solver, 'down');
                }
                if (isInitiatingSuggestForDefiningConstraint) {
                    definingConstraint.isAnyVariableCurrentlySuggested = false;
                }
            }
            bbb.processCallbacks();
        }
        return value;
    },

    solveForPrimarySolver: function(value, priorValue, solver, source) {
        if (this.isSolveable()) {
            (function() {
                var wasReadonly = false,
                // recursionGuard per externalVariable?
                eVar = this.definingExternalVariable;
                if (eVar) {
                    try {
                        if (solver && source) {
                            this.bumpSolverWeight(solver, 'up');
                        }
                        wasReadonly = eVar.isReadonly();
                        eVar.setReadonly(false);
                        eVar.suggestValue(value);
                    } finally {
                        eVar.setReadonly(wasReadonly);
                    }
                }
            }).bind(this).recursionGuard(
                ConstrainedVariable.isSuggestingValue,
                this.__uuid__
            );
        }
    },

    bumpSolverWeight: function(solver, direction) {
        if (direction == 'up') {
            solver.weight += 987654321; // XXX Magic Number
        } else {
            solver.weight -= 987654321;
        }
        this.findTransitiveConnectedVariables().each(function(cvar) {
            cvar.setDownstreamReadonly(direction == 'up');
        });
    },

    solveForConnectedVariables: function(value, priorValue, source, force) {
        if (force || value !== this.storedValue) {
            (function() {
                try {
                    // this.setValue(value);
                    this.updateDownstreamVariables(value);
                    this.updateConnectedVariables(value);
                } catch (e) {
                    if (source) {
                        // is freeing the recursionGuard here necessary?
                        this.suggestValue(priorValue, source, 'force');
                        this.$$isStoring = false;
                    }
                    throw e; // XXX: Lively checks type, so wrap for top-level
                }
            }).bind(this).recursionGuard(this, '$$isStoring');
        }
    },

    findAndOptionallyCallSetters: function(callSetters) {
        if (this.isSolveable()) {
            var getterSetterPair = this.findOptionalSetter();
            if (getterSetterPair) {
                ConstrainedVariable.$$optionalSetters.push(
                    getterSetterPair
                );
            }
        }
        if (callSetters) {
            this.callSetters.recursionGuard(ConstrainedVariable, '$$callingSetters');
        }
    },

    addErrorCallback: function(e) {
        var catchingConstraint = this._constraints.find(function(constraint) {
            return typeof constraint.onError === 'function';
        });
        if (catchingConstraint) {
            bbb.addCallback(catchingConstraint.onError, catchingConstraint, [e]);
        } else {
            throw e;
        }
    },

    callSetters: function() {
        var recvs = [],
        setters = [];
        ConstrainedVariable.$$optionalSetters.each(function(ea) {
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
            } catch (e) {
                alert(e);
            }
        });
    },

    findOptionalSetter: function() {
        if (this.setterObj) return this.setterObj;

        if (this.setter) {
            this.setterObj = {recv: this.recv, getter: this.getter, setter: this.setter};
        } else if (this.parentConstrainedVariable) {
            this.setterObj = this.parentConstrainedVariable.findOptionalSetter();
        }
        return this.setterObj;
    },

    ensureClearSetters: function(callSetters) {
        if (callSetters) {
            ConstrainedVariable.$$optionalSetters = null;
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
            var setter = value.replace('get', 'set');
            if (Object.isFunction(this.recv[setter])) {
                this.setter = setter;
            }
        }
    },
    set recv(value) {
        this.$recv = value;
        if (this.getter) {
            var setter = this.getter.replace('get', 'set');
            if (Object.isFunction(value[setter])) {
                this.setter = setter;
            }
        }
    },
    setDownstreamReadonly: function(bool) {
        if (bool && !this.$$downstreamReadonlyVars) {
            // flushCaches
            var defVar = this.definingExternalVariable;
            this.$$downstreamReadonlyVars = [];
            this.eachExternalVariableDo(function(eVar) {
                if (eVar !== defVar) {
                    if (!eVar.isReadonly()) {
                        eVar.setReadonly(true);
                        this.$$downstreamReadonlyVars.push(eVar);
                    }
                }
            }.bind(this));
        } else if (!bool && this.$$downstreamReadonlyVars) {
            this.$$downstreamReadonlyVars.each(function(eVar) {
                eVar.setReadonly(false);
            }.bind(this));
            this.$$downstreamReadonlyVars = null;
        }
    },
    findTransitiveConnectedVariables: function(ary) {
        return Constraint.enabledConstraintsGuard.call(this.__uuid__, function() {
            return this._findTransitiveConnectedVariables(ary || []);
        }.bind(this));
    },
    _findTransitiveConnectedVariables: function(ary) {
        // XXX soooo slowwww
        var self = this;
        if (ary.indexOf(this) !== -1) return;

        ary.push(this);
        this._constraints.each(function(c) {
            return c.constraintvariables.each(function(cvar) {
                cvar.findTransitiveConnectedVariables(ary);
            });
        });
        return ary;
    },
    updateConnectedVariables: function() {
        // so slow :(
        var self = this;
        this._constraints.collect(function(c) {
            return c.constraintvariables;
        }).flatten().uniq().each(function(cvar) {
            cvar.suggestValue(cvar.getValue()); // will store and recurse only if needed
        });
    },

    updateDownstreamVariables: function(value) {
        this.updateDownstreamExternalVariables(value);
        this.updateDownstreamUnsolvableVariables(value);
    },

    updateDownstreamExternalVariables: function(value) {
        var defVar = this.definingExternalVariable;
        this.eachExternalVariableDo(function(ea) {
            if (ea !== defVar) {
                var wasReadonly = ea.isReadonly();
                ea.setReadonly(false);
                ea.suggestValue(value);
                ea.setReadonly(wasReadonly);
            }
        });
    },

    updateDownstreamUnsolvableVariables: function(value) {
        if (!this.isValueClass()) {
            this.recalculateDownstreamConstraints(value);
        } else {
            this.updateValueClassParts(value);
        }
    },

    recalculateDownstreamConstraints: function(value) {
        this.setValue(value);
        this._constraints.each(function(c) {
            var eVar = this.externalVariables(c.solver);
            if (!eVar) {
                c.recalculate();
            }
        }.bind(this));
    },

    updateValueClassParts: function(value) {
        (function() {
            for (key in this.storedValue[ConstrainedVariable.AttrName]) {
                var cvar = this.storedValue[ConstrainedVariable.AttrName][key];
                cvar.suggestValue(value[key]);
            }
        }).bind(this).recursionGuard(this, '$$valueClassUpdate');
    },

    addToConstraint: function(constraint) {
        if (!this._constraints.include(constraint)) {
            this._constraints.push(constraint);
        }
        constraint.addConstraintVariable(this);
    },
    get definingSolver() {
        if (Constraint.current || this._hasMultipleSolvers) {
            // no fast path for variables with multiple solvers for now
            this._definingSolver = null;
            var defining = this._searchDefiningSolverAndConstraint();
            return defining.solver;
        } else if (!this._definingSolver) {
            var defining = this._searchDefiningSolverAndConstraint();
            this._definingConstraint = defining.constraint;
            return this._definingSolver = defining.solver;
        } else {
            return this._definingSolver;
        }
    },
    get definingConstraint() {
        return this._definingConstraint ||
            this._searchDefiningSolverAndConstraint().constraint;
    },
    _searchDefiningSolverAndConstraint: function() {
        var solver = {weight: -1000, fake: true, solverName: '(fake)'};
        var constraint = null;
        var solvers = [];
        this.eachExternalVariableDo(function(eVar) {
            var s = eVar.__solver__;

            if (!s.fake) {
                solvers.push(s);
            }

            var hasEnabledConstraint = false;
            var enabledConstraint = null;
            for (var i = 0; i < this._constraints.length; i++) {
                if (this._constraints[i].solver === s &&
                    this._constraints[i]._enabled) {
                        enabledConstraint = this._constraints[i];
                        hasEnabledConstraint = true;
                        break;
                    }
            }

            if (this._constraints.length > 0 && !hasEnabledConstraint)
                return;

            if (!solver.fake && hasEnabledConstraint) {
                this._hasMultipleSolvers = true;
            }


            if (s.weight > solver.weight) {
                solver = s;
                constraint = enabledConstraint;
            }
        }.bind(this));

        if (solver.fake) {
            return {solver: null, constraint: null};
        }

        return {solver: solver, constraint: constraint};
    },

    resetDefiningSolver: function() {
        this._definingSolver = null;
    },

    get solvers() {
        var solvers = [];
        this.eachExternalVariableDo(function(eVar) {
            var s = eVar.__solver__;
            solvers.push(s);
        });
        return solvers.uniq();
    },
    get definingExternalVariable() {
        if (this.definingSolver) {
            return this.externalVariables(this.definingSolver);
        } else {
            return null;
        }
    },

    isSolveable: function() {
        return Constraint.current ? !!this.externalVariable : this._isSolveable;
    },

    _resetIsSolveable: function() {
        this._isSolveable = !!this.definingExternalVariable;
    },

    isValueClass: function() {
        return !this.isSolveable() && bbb.isValueClass(this.storedValue);
    },

    get storedValue() {
        return this.obj[this.newIvarname];
    },

    get externalValue() {
        var value;
        return this.pvtGetExternalValue(this.externalVariable);
    },

    pvtGetExternalValue: function(evar) {
        if (typeof(evar.value) == 'function') {
            return evar.value();
        } else {
            return evar.value;
        }
    },

    setValue: function(value) {
        this.obj[this.newIvarname] = value;
    },
    eachExternalVariableDo: function(func) {
        func.bind(this);
        for (var key in this._externalVariables) {
            var eVar = this._externalVariables[key];
            if (eVar) { func(eVar); }
        }
    },

    getValue: function() {
        if (this.isSolveable() && this.hasEnabledConstraint()) {
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
            solver.__uuid__ = Strings.newUUID();
        }
        if (arguments.length === 1) {
            return this._externalVariables[solver.__uuid__];
        } else {
            if (value) {
                value.__solver__ = value.__solver__ || solver;
                if (value.__cvar__ && !(value.__cvar__ === this)) {
                    throw 'Inconsistent external variable. This should not happen!';
                }
                value.__cvar__ = this;
            }
            this._externalVariables[solver.__uuid__] = value || null;
            this._resetIsSolveable();
        }
    },

    /**
     * Removes all external variables which are used only by the specified Constraint.
     * @param {Constraint} abandonedConstraint the Constraint about to be purged
     */
    abandonConstraint: function(abandonedConstraint) {
        // remove abandonedConstraint from this._constraints
        var abandonedIndex = this._constraints.indexOf(abandonedConstraint);
        if (abandonedIndex !== -1)
            this._constraints.splice(abandonedIndex, 1);
        // collect all external variables which can be detached
        var externalVariableKeysToRemove = Object.keys(this._externalVariables).findAll(
            function(eachSolverUUID) {
                var externalVariable = this._externalVariables[eachSolverUUID];
                if (externalVariable === null)
                    return true; // delete the nulls by the way
                var hasSomeOtherConstraintForThisSolver = this._constraints.some(
                    function(eachConstraint) {
                        return eachConstraint.solver === externalVariable.__solver__;
                    });
                return !hasSomeOtherConstraintForThisSolver;
            }.bind(this));
        // detach collected external variables
        externalVariableKeysToRemove.each(function(each) {
            delete this._externalVariables[each];
        }.bind(this));
    },

    hasEnabledConstraint: function() {
        return this._constraints.length == 0 ||
            this._constraints.some(function(constraint) {
                return constraint._enabled;
            });
    }
});

users.timfelgentreff.jsinterpreter.InterpreterVisitor.
        subclass('ConstraintInterpreterVisitor', {

    binaryExpressionMap: {
        // operation: [method, reverseMethod (or undefined)]
        '+': ['plus', 'plus'],
        '-': ['minus'],
        '*': ['times', 'times'],
        '/': ['divide'],
        '%': ['modulo'],
        '==': ['cnEquals', 'cnEquals'],
        '===': ['cnIdentical', 'cnIdentical'],
        '<=': ['cnLeq', 'cnGeq'],
        '>=': ['cnGeq', 'cnLeq'],
        '<': ['cnLess', 'cnGreater'],
        '>': ['cnGreater', 'cnLess'],
        '||': ['cnOr', 'cnOr'],
        '!=': ['cnNeq', 'cnNeq'],
        '!==': ['cnNotIdentical', 'cnNotIdentical']
    },

    alternativeExpressionsMapTo: {
        '+': '-',
        '<=': '<',
        '>=': '>',
        '==': '==='
    },

    get alternativeExpressionsMap() {
        var map = {};
        Properties.own(this.alternativeExpressionsMapTo).each(function(ea) {
            map[this.alternativeExpressionsMapTo[ea]] = ea;
            map[ea] = this.alternativeExpressionsMapTo[ea];
        }.bind(this));
        return map;
    },



    getConstraintObjectValue: function(o) {
        if (o === undefined || !o.isConstraintObject) return o;
        var value = o.value;
        if (typeof(value) == 'function') {
            return value.apply(o);
        } else {
            return value;
        }
    },
    errorIfUnsolvable: function(op, l, r, res) {
        if (typeof(res) == 'undefined') {
            res = r;
            r = undefined;
        }

        if (!(l.isConstraintObject || (r && r.isConstraintObject)) ||
                Constraint.current.allowUnsolvableOperations) {
            return ((typeof(res) == 'function') ? res() : res);
        } else {
            var msg = '`' + op + "'" + ' not allowed on ' + l,
                alternative;
            if (r !== undefined) {
                msg = 'Binary op ' + msg + ' and ' + r;

                var altOp = this.alternativeExpressionsMap[op];
                if (altOp) {
                    if (l[this.binaryExpressionMap[altOp][0]] ||
                        r[this.binaryExpressionMap[altOp][1]]) {
                        alternative = altOp;
                    }
                }
            }
            if (!alternative && Constraint.current.solver.alternativeOperationFor) {
                alternative = Constraint.current.solver.alternativeOperationFor(op);
            }

            msg += ". If you want to allow this, pass `allowUnsolvableOperations'" +
                'to the constraint.';
            if (alternative) {
                msg += ' You can also rewrite the code to use ' +
                    alternative + ' instead.';
            }
            throw new Error(msg);
        }
    },

    visitVariable: function($super, node) {
        return $super(node);
    },

    visitCond: function($super, node) {
        var frame = this.currentFrame,
            condVal = this.visit(node.condExpr);
        if (condVal && condVal.isConstraintObject) {
            debugger;
            var self = this;
            condVal = this.getConstraintObjectValue(condVal);
            if (!condVal) {
                condVal = cop.withoutLayers([ConstraintConstructionLayer], function() {
                    // XXX: this will cause GetSlot to call $super, so
                    // we don't get constrainded vars
                    return self.visit(node.condExpr);
                });
                debugger;
            }
        }
        return condVal ? this.visit(node.trueExpr) : this.visit(node.falseExpr);
    },

    visitUnaryOp: function($super, node) {
        var frame = this.currentFrame,
            val = this.visit(node.expr),
            rVal = this.getConstraintObjectValue(val),
            msg = 'Unary op `' + node.name + "'";

        switch (node.name) {
            case '-':
                if (val && val.isConstraintObject && val.times) {
                    return val.times(-1);
                } else {
                    return this.errorIfUnsolvable(msg, val, -rVal);
                }
            case '!':
                if (val && val.isConstraintObject && val.not) {
                    return val.not();
                } else {
                    return !val;
                    // return this.errorIfUnsolvable(msg, val, !val);
                }
            case '~':
                return this.errorIfUnsolvable(msg, val, ~rVal);
            case 'typeof':
                return this.errorIfUnsolvable(msg, val, typeof(rVal));
            default:
              throw new Error('No semantics for unary op ' + node.name);
        }
    },

    invoke: function($super, node, recv, func, argValues) {
        if (!func && (!recv || !recv.isConstraintObject)) {
            var error = 'No such method: ' + recv + '.' +
                (node.property && node.property.value);
            alert(error);
            throw new Error(error);
        }
        if (recv && recv.isConstraintObject) {
            if (func) {
                var forInterpretation = func.forInterpretation;
                func.forInterpretation = undefined;
                var prevNode = bbb.currentNode,
                    prevInterp = bbb.currentInterpreter;
                bbb.currentInterpreter = this;
                bbb.currentNode = node;
                try {
                    return cop.withoutLayers([ConstraintConstructionLayer], function() {
                        return $super(node, recv, func, argValues);
                    });
                } catch (e) {
                    // TIM: send doesNotUnderstand to solver variable?
                    return this.errorIfUnsolvable(
                        (node.property && node.property.value),
                        recv,
                        (function() {
                            var value = this.getConstraintObjectValue(recv);
                            var prop = this.visit(node.property);
                            return this.invoke(node, value, value[prop], argValues);
                        }).bind(this)
                    );
                } finally {
                    func.forInterpretation = forInterpretation;
                    bbb.currentInterpreter = prevInterp;
                    bbb.currentNode = prevNode;
                }
            } else {
                return this.errorIfUnsolvable(
                    (node.property && node.property.value),
                    recv,
                    (function() {
                        var value = this.getConstraintObjectValue(recv);
                        var prop = this.visit(node.property);
                        return this.invoke(node, value, value[prop], argValues);
                    }).bind(this)
                );
            }
        } else if (func === Date) {
            return new func();
        } else if (recv === Math) {
            if (func === Math.sqrt && argValues[0].pow || argValues[0].sqrt) {
                if (argValues[0].pow) {
                    return this.invoke(node, argValues[0], argValues[0].pow, [0.5]);
                } else {
                    return this.invoke(node, argValues[0], argValues[0].sqrt, []);
                }
            } else if (func === Math.pow && argValues[0].pow) {
                return this.invoke(node, argValues[0], argValues[0].pow, [argValues[1]]);
            } else if (func === Math.sin && argValues[0].sin) {
                return this.invoke(node, argValues[0], argValues[0].sin, []);
            } else if (func === Math.cos && argValues[0].cos) {
                return this.invoke(node, argValues[0], argValues[0].cos, []);
            } else {
                return $super(node, recv, func,
                              argValues.map(this.getConstraintObjectValue));
            }
        } else {
            return cop.withLayers([ConstraintConstructionLayer], function() {
                return $super(node, recv, func, argValues);
            });
        }
    },
    visitBinaryOp: function($super, node) {
        var prevNode = bbb.currentNode,
            prevInterp = bbb.currentInterpreter;
        bbb.currentInterpreter = this;
        bbb.currentNode = node;
        try {
            return this.pvtVisitBinaryOp($super, node);
        } finally {
            bbb.currentInterpreter = prevInterp;
            bbb.currentNode = prevNode;
        }
    },

    pvtVisitBinaryOp: function(mySuper, node) {
        var op = node.name;

        // /* Only supported */ if (node.name.match(/[\*\+\/\-]|==|<=|>=|===|<|>|\|\|/)) {
        var leftVal = this.visit(node.left),
            rightVal = this.visit(node.right);

        if (leftVal === undefined) leftVal = 0;
        if (rightVal === undefined) rightVal = 0;

        var rLeftVal = (leftVal && leftVal.isConstraintObject) ?
            this.getConstraintObjectValue(leftVal) :
            leftVal,
            rRightVal = (rightVal && rightVal.isConstraintObject) ?
            this.getConstraintObjectValue(rightVal) :
            rightVal;
        switch (node.name) {
            case '&&':
                if (!leftVal) return leftVal;
                if (leftVal === true || leftVal.isConstraintObject) {
                    if (typeof(leftVal.cnAnd) == 'function') {
                        return leftVal.cnAnd(rightVal);
                    } else {
                        Constraint.current.addPrimitiveConstraint(leftVal);
                    }
                } else {
                    Constraint.current.haltIfDebugging(); // XXX: Sure?
                }
                return rightVal;
            case '-':
                if (rightVal.isConstraintObject &&
                    rightVal.plus &&
                    Object.isNumber(leftVal)) {
                    return rightVal.plus(-leftVal);
                } // special case for reversing minus - allowed to fall through to default
            case 'in':
                if (node.name != '-') {
                    if (leftVal.isConstraintObject && leftVal.cnIn) {
                        return leftVal.cnIn(rightVal);
                    } else if (this.$finiteDomainProperty) {
                        var lV = this.$finiteDomainProperty;
                        delete this.$finiteDomainProperty;
                        if (lV.cnIn) {
                            return lV.cnIn(rightVal);
                        }
                    } // TODO: rightVal->contains if !leftVal.isConstraintObject
                // special case for reversing minus - allowed to
                // fall through to default
                }
            default:
                var method = this.binaryExpressionMap[node.name];
                if (method) {
                    if (leftVal && leftVal.isConstraintObject &&
                        typeof(leftVal[method[0]]) == 'function') {
                        return leftVal[method[0]](rightVal);
                    } else if (rightVal && rightVal.isConstraintObject &&
                               typeof(rightVal[method[1]]) == 'function') {
                        return rightVal[method[1]](leftVal);
                    } else {
                        return this.errorIfUnsolvable(
                            op,
                            leftVal,
                            rightVal,
                            eval('rLeftVal ' + node.name + ' rRightVal')
                        );
                    }
                } else {
                    return this.errorIfUnsolvable(op, leftVal, rightVal, mySuper(node));
                }
        }
    },


    visitGetSlot: function($super, node) {
        if (cop.currentLayers().indexOf(ConstraintConstructionLayer) === -1) {
            // XXX: See visitCond
            return $super(node);
        }
        var obj = this.visit(node.obj),
            name = this.visit(node.slotName),
            cobj = (obj ? obj[ConstrainedVariable.ThisAttrName] : undefined),
            cvar;
        if (obj === Global ||
            (obj instanceof lively.Module) /*|| (typeof(obj) == "string")*/) {
            return obj[name];
        }
        if (name && name.isConstraintObject) {
            name = this.getConstraintObjectValue(name);
        }
        if (obj && obj.isConstraintObject) {
            if (obj['cn' + name]) {
                return obj['cn' + name]; // XXX: TODO: Document this
            } else if (name === 'is') {
                // possibly a finite domain definition
                this.$finiteDomainProperty = obj;
            } else {
                cobj = obj.__cvar__;
                obj = this.getConstraintObjectValue(obj);
            }
        }

        cvar = ConstrainedVariable.newConstraintVariableFor(obj, name, cobj);
        if (Constraint.current) {
            cvar.ensureExternalVariableFor(Constraint.current.solver);
            cvar.addToConstraint(Constraint.current);
        }
        if (cvar && cvar.isSolveable()) {
            return cvar.externalVariable;
        } else {
            var retval = obj[name];
            if (!retval || !retval.isConstraintObject) {
                var objStr = Strings.safeToString(obj),
                    retStr = Strings.safeToString(retval);
                console.log(
                    Constraint.current.solver.constructor.name +
                        ' cannot reason about the variable ' + objStr + '[' +
                        name + '], a ' + retStr + ' of type ' +
                        (typeof(retval) == 'object' ?
                         retval.constructor.name :
                         typeof(retval))
                );
                Constraint.current.haltIfDebugging();
            }
            if (retval) {
                switch (typeof(retval)) {
                case 'object':
                case 'function':
                    retval[ConstrainedVariable.ThisAttrName] = cvar;
                    break;
                case 'number':
                    new Number(retval)[ConstrainedVariable.ThisAttrName] = cvar;
                    break;
                case 'string':
                    new String(retval)[ConstrainedVariable.ThisAttrName] = cvar;
                    break;
                case 'boolean': break;
                default: throw 'Error - ' +
                        'we cannot store the constrained var attribute on ' +
                        retval + ' of type ' + typeof(retval);
                }
            }
            return retval;
        }
    },
    visitReturn: function($super, node) {
        var retVal = $super(node);
        if (retVal) {
            var cvar = retVal[ConstrainedVariable.ThisAttrName];
            if (retVal.isConstraintObject) {
                cvar = retVal.__cvar__;
            }
            if (cvar) {
                var parentFunc = node.parentFunction();
                if (parentFunc) {
                    cvar.getter = parentFunc.name();
                    cvar.recv = this.currentFrame.mapping['this'];
                }
            }
        }
        return retVal;
    },



    shouldInterpret: function(frame, func) {
        if (func.sourceModule ===
                Global.users.timfelgentreff.babelsberg.constraintinterpreter) {
            return false;
        }
        if (func.declaredClass === 'Babelsberg') {
            return false;
        }
        var nativeClass = lively.Class.isClass(func) && func.superclass === undefined;
        return (!(this.isNative(func) || nativeClass)) &&
                 typeof(func.forInterpretation) == 'function';
    },
    getCurrentScope: function() {
        var scope = {};
        var frame = this.currentFrame;
        while (frame) {
            if (frame.mapping === Global) { // reached global scope
                return scope;
            }
            for (var key in frame.mapping) {
                scope[key] = frame.mapping[key];
            }
            var mapping = frame.func.getVarMapping();
            if (mapping) {
                for (var key in mapping) {
                    scope[key] = mapping[key];
                }
            }
            frame = frame.getContainingScope();
        }
        return scope;
    },
    newObject: function($super, func) {
        if (func.original) {
            return $super(func.original);
        } else {
            return $super(func);
        }
    }

});

ConstrainedVariable.AttrName = '__constrainedVariables__';
ConstrainedVariable.ThisAttrName = '__lastConstrainedVariableForThis__';
Object.extend(ConstrainedVariable, {
    findConstraintVariableFor: function(obj, ivarname) {
        var l = obj[ConstrainedVariable.AttrName];
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
        var l = obj[ConstrainedVariable.AttrName];
        if (l && l[ivarname]) {
            delete l[ivarname];
        }
    },

    isSuggestingValue: {}
});

Object.subclass('PrimitiveCObjectRegistry', {});
Object.extend(PrimitiveCObjectRegistry, {
    registry: {},

    // stores last seen cvars for objects weakly
    set: function(obj, cobj) {
        PrimitiveCObjectRegistry.registry[obj] = cobj;
    },
    get: function(obj) {
        return PrimitiveCObjectRegistry.registry[obj];
    }
});

Number.prototype.__defineGetter__(ConstrainedVariable.ThisAttrName, function() {
    return PrimitiveCObjectRegistry.get(this + 0 /* coerce back into prim */);
});
Number.prototype.__defineGetter__(ConstrainedVariable.AttrName, function() {
    return {};
});
Number.prototype.__defineSetter__(ConstrainedVariable.ThisAttrName, function(v) {
    PrimitiveCObjectRegistry.set(this + 0 /* coerce back into prim */, v);
});
String.prototype.__defineGetter__(ConstrainedVariable.ThisAttrName, function() {
    return PrimitiveCObjectRegistry.get(this + '' /* coerce back into prim */);
});
String.prototype.__defineGetter__(ConstrainedVariable.AttrName, function() {
    return {};
});
String.prototype.__defineSetter__(ConstrainedVariable.ThisAttrName, function(v) {
    PrimitiveCObjectRegistry.set(this + '' /* coerce back into prim */, v);
});


});
