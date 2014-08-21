module('users.timfelgentreff.experimental.assert').requires('users.timfelgentreff.babelsberg.constraintinterpreter').toRun(function() {

	JSLoader.loadJs(module('users.timfelgentreff.csp.underscore-min').uri());

	/***************************************************************
	 * Continuous asserts
	 ***************************************************************/
	// TODO: improve syntax of bbb.assert
	// TODO: multiple asserts and multiple variable interconnected
	// TODO: enable and disable AssertConstraints
	// TODO: integration with other solvers
	
	Error.subclass("ContinuousAssertError", {
		initialize: function ContinuousAssertError(msg) {
			if (Error.captureStackTrace) {
				Error.captureStackTrace(this, ContinuousAssertError);
			} else {
				this.stack = (new Error).stack || '';
			}
			this.message = msg;
		},
		name: "ContinuousAssertError"
	});
	
	Object.subclass("AssertSolver", {
		initialize: function(message) {
			this.message = message;
		},
	    isConstraintObject: function() { return true; },
	    always: function(opts, func) {
	    	//console.log("AssertSolver.always");
	        var ctx = opts.ctx;
	        func.varMapping = ctx;
	        var cobj = new Constraint(func, this);
	        cobj.addPrimitiveConstraint(new AssertSolver.Constraint(this, cobj));
			try {
				cobj.enable();
			} catch(e) {
				if(e instanceof ContinuousAssertError) {
					cobj.disable();
				}
				throw e;
			}
	        return cobj;
	    },
	    constraintVariableFor: function(value, ivarname, bbbCVar) {
	    	//console.log("AssertSolver.constraintVariableFor", value, ivarname, bbbCVar);
	    	return new AssertSolver.Variable(this, value, ivarname, bbbCVar);
	    },
	    solve: function() {
	    	//console.log("AssertSolver.solve");
	    	this.check();
	    },
	    check: function() {
	    	//console.log("AssertSolver.check");
	    	if(this.constraint && this.constraint.enabled && typeof this.constraint.predicate === "function")
	    		if(!this.constraint.predicate())
	    			throw new ContinuousAssertError(this.message);
	    },
	    weight: 10
	});
	
	Object.subclass("AssertSolver.Variable", {
		initialize: function(solver, value, ivarname, bbbCVar) {
	    	//console.log("AssertSolver.Variable.initialize");
			this.solver = solver;
			this.__val__ = value;
		},
	    isConstraintObject: function() { return true; },
	    toFulfill: function(assertPredicate) {
	    	//console.log("AssertSolver.Variable.toFulfill", assertPredicate);
	    	this.assertPredicate = assertPredicate;
	    },
	    suggestValue: function(value) {
	    	//console.log("AssertSolver.Variable.suggestValue", value);
			var prev = this.__val__;
	    	this.__val__ = value;
			try {
				this.solver.solve();
			} catch(e) {
				// revert value in case of a violated assertion
				if(e instanceof ContinuousAssertError) {
					this.__val__ = prev;
				}
				throw e;
			}
	    	return this.__val__;
	    },
	    value: function() {
	    	return this.__val__;
	    },
	    setReadonly: function(bool) {
	    	//console.log("AssertSolver.Variable.setReadonly", bool);
	    	this.readonly = bool;
	    },
	    isReadonly: function() {
	    	//console.log("AssertSolver.Variable.isReadonly");
	        return this.readonly;
	    },
	    cnEquals: function() {
	    	//console.log("AssertSolver.Variable.cnEquals");
	        return new AssertSolver.PrimitiveConstraint(this, arguments);
	    }
	});
	
	Object.subclass("AssertSolver.PrimitiveConstraint", {
	    isConstraintObject: function() { return true; },
	    initialize: function(variable, args) {
	    	//console.log("AssertSolver.PrimitiveConstraint.initialize", variable, args);
			this.enabled = false;
	    	this.solver = variable.solver;
	    },
	    enable: function() {
	    	//console.log("AssertSolver.PrimitiveConstraint.enable");
			this.enabled = true;
	    },
	    disable: function() {
	    	//console.log("AssertSolver.PrimitiveConstraint.disable");
			this.enabled = false;
	    }
	});
	
	Object.subclass("AssertSolver.Constraint", {
	    isConstraintObject: function() { return true; },
	    initialize: function(solver, bbbConstraint) {
	    	//console.log("AssertSolver.Constraint.initialize");
			this.enabled = false;
	    	this.solver = solver;
	    	this.solver.constraint = this;

	    	// extract predicate from bbbConstraint
	    	this.predicate = _.chain(bbbConstraint.constraintvariables)
	    		.map(function(variable) {
	    			return variable.externalVariables(this.solver);
	    		}, this)
	    		.find(function(externalVariable) {
	    			return typeof externalVariable.assertPredicate === "function";
	    		})
	    		.value()
	    		.assertPredicate;
	    },
	    enable: function() {
	    	//console.log("AssertSolver.Constraint.enable");
			this.enabled = true;
	    },
	    disable: function() {
	    	//console.log("AssertSolver.Constraint.disable");
			this.enabled = false;
	    }
	});
	
	/***************************************************************
	 * Continuous asserts
	 ***************************************************************/
	AssertSolver.subclass("TriggerSolver", {
		initialize: function(callback) {
			this.callback = callback;
			this.triggeredOnce = false;
		},
	    always: function(opts, func) {
	    	//console.log("TriggerSolver.always");
	        var ctx = opts.ctx;
	        func.varMapping = ctx;
	        var cobj = new Constraint(func, this);
	        cobj.addPrimitiveConstraint(new AssertSolver.Constraint(this, cobj));
			cobj.enable();
	        return cobj;
	    },
	    solve: function() {
	    	console.log("TriggerSolver.solve", this.constraint.predicate());
	    	if(this.constraint &&
				this.constraint.enabled &&
				typeof this.constraint.predicate === "function" &&
				!this.triggeredOnce
			) {
	    		if(this.constraint.predicate()) {
					this.triggeredOnce = true;
					this.constraint.disable();
	    			this.callback();
				} else {
					// resetOnFalse?
				}
			}
	    },
	    weight: 10
	});
	
	Object.extend(Babelsberg.prototype, {
		assert: function(opts, func) {
			opts.solver = new AssertSolver(opts.message);
			opts.allowUnsolvableOperations = true;
			opts.allowTests = true;
			//opts.debugging = true;
	        this.always(opts, func);
		},
		trigger: function(opts, func) {
			opts.solver = new TriggerSolver(opts.callback);
			opts.allowUnsolvableOperations = true;
			opts.allowTests = true;
			//opts.debugging = true;
	        this.always(opts, func);
		}
	});
	
	Object.extend(Babelsberg.prototype, {
	});
	
});
