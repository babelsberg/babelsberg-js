module('users.timfelgentreff.experimental.assert').requires('users.timfelgentreff.babelsberg.constraintinterpreter').toRun(function() {

	JSLoader.loadJs(module('users.timfelgentreff.csp.underscore-min').uri());

	/***************************************************************
	 * Continuous asserts
	 ***************************************************************/
	// TODO: improve syntax of bbb.assert
	// TODO: multiple asserts and multiple variable interconnected
	// TODO: enable and disable AssertConstraints
	
	Error.subclass("ContinuousAssertError", {
		initialize: function MyError(msg) {
			if (Error.captureStackTrace) {
				Error.captureStackTrace(this, MyError);
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
	    	console.log("AssertSolver.always");
	        var ctx = opts.ctx;
	        func.varMapping = ctx;
	        var cobj = new Constraint(func, this);
	        cobj.addPrimitiveConstraint(new AssertSolver.Constraint(this, cobj));
	        cobj.enable();
	        return cobj;
	    },
	    constraintVariableFor: function(value, ivarname, bbbCVar) {
	    	console.log("AssertSolver.constraintVariableFor", value, ivarname, bbbCVar);
	    	return new AssertSolver.Variable(this, value, ivarname, bbbCVar);
	    },
	    solve: function() {
	    	console.log("AssertSolver.solve");
	    	this.check();
	    },
	    check: function() {
	    	console.log("AssertSolver.check");
	    	if(this.constraint && typeof this.constraint.predicate === "function")
	    		if(!this.constraint.predicate())
	    			throw new ContinuousAssertError(this.message);
	    },
	    weight: 10
	});
	
	Object.subclass("AssertSolver.Variable", {
		initialize: function(solver, value, ivarname, bbbCVar) {
	    	console.log("AssertSolver.Variable.initialize");
			this.solver = solver;
			this.__val__ = value;
		},
	    isConstraintObject: function() { return true; },
	    toFulfill: function(assertPredicate) {
	    	console.log("AssertSolver.Variable.toFulfill", assertPredicate);
	    	this.assertPredicate = assertPredicate;
	    },
	    suggestValue: function(value) {
	    	console.log("AssertSolver.Variable.suggestValue", value);
	    	this.__val__ = value;
	    	this.solver.solve();
	    	return this.__val__;
	    },
	    value: function() {
	    	return this.__val__;
	    },
	    setReadonly: function(bool) {
	    	this.readonly = bool;
	    	console.log("AssertSolver.Variable.setReadonly", bool);
	    },
	    isReadonly: function() {
	    	console.log("AssertSolver.Variable.isReadonly");
	        return this.readonly;
	    }
	});
	
	Object.subclass("AssertSolver.Constraint", {
	    isConstraintObject: function() { return true; },
	    initialize: function(solver, bbbConstraint) {
	    	console.log("AssertSolver.Constraint.initialize");
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
	    	console.log("AssertSolver.Constraint.enable");
	    },
	    disable: function() {
	    	console.log("AssertSolver.Constraint.disable");
	    }
	});
	
	Object.extend(Babelsberg.prototype, {
		assert: function(opts, func) {
			opts.solver = new AssertSolver(opts.message);
			//opts.allowUnsolvableOperations = true;
			//opts.allowTests = true;
			//opts.debugging = true;
	        this.always(opts, func);
		}
	});
	
});
