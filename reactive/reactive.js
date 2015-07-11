module('users.timfelgentreff.reactive.reactive').requires('users.timfelgentreff.babelsberg.constraintinterpreter', 'cop.Layers').toRun(function() {

	JSLoader.loadJs(module('users.timfelgentreff.csp.underscore-min').uri());

	/***************************************************************
	 * Abstract Reactive Solver
	 ***************************************************************/
	
	Object.subclass("ReactiveSolver", {
	    isConstraintObject: true,
	    constraintVariableFor: function(value, ivarname, bbbCVar) {
	    	return new ReactiveSolver.Variable(this, value, ivarname, bbbCVar);
	    },
	    weight: 10000,
        solverName: 'reactive',
        supportsMethods: function() { return false; },
        supportsSoftConstraints: function() { return false; },
        supportedDataTypes: function() { return ['number']; /* XXX: is this correct? */ }
	});
	
	Object.subclass("ReactiveSolver.Variable", {
	    isConstraintObject: true,
		initialize: function(solver, value, ivarname, bbbCVar) {
			this.solver = solver;
			this.__val__ = value;
		},
	    suggestValue: function(value) {
			if(this.__val__ === value) { return value; }
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

			// re-constrain variables
			if (typeof(value) == 'object' || typeof(value) == 'function') {
			    // only recalculate to reconstraint complex objects
                var bbbConstraint = this.solver.constraint.bbbConstraint;
                var enabled = bbbConstraint._enabled;
                bbbConstraint.initialize(bbbConstraint.predicate, bbbConstraint.solver);
                bbbConstraint.addPrimitiveConstraint(this.solver.constraint);
                if(enabled) bbbConstraint.enable();
			}

	    	return this.__val__;
	    },
	    value: function() {
	    	return this.__val__;
	    },
	    setReadonly: function(bool) {
	    	this.readonly = bool;
	    },
	    isReadonly: function() {
	        return this.readonly;
	    },
	    cnEquals: function() {
	        return new ReactiveSolver.PrimitiveConstraint(this, arguments);
	    }
	});
	
	Object.subclass("ReactiveSolver.PrimitiveConstraint", {
	    isConstraintObject: true,
	    initialize: function(variable, args) {
			this.enabled = false;
	    	this.solver = variable.solver;
	    },
	    enable: function() {
			this.enabled = true;
	    },
	    disable: function() {
			this.enabled = false;
	    }
	});
	
	Object.subclass("ReactiveSolver.Constraint", {
	    isConstraintObject: true,
	    initialize: function(solver, bbbConstraint, func) {
			this.enabled = false;
	    	this.solver = solver;
	    	this.solver.constraint = this;
			this.bbbConstraint = bbbConstraint;

	    	this.predicate = func;
	    },
	    enable: function() {
			this.enabled = true;
	    },
	    disable: function() {
			this.enabled = false;
	    }
	});
	
	/***************************************************************
	 * Continuous asserts
	 ***************************************************************/
	
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
	
	ReactiveSolver.subclass("AssertSolver", {
		initialize: function(message) {
			this.message = message;
		},
	    always: function(opts, func) {
	        var ctx = opts.ctx;
	        func.varMapping = ctx;
	        var cobj = new Constraint(func, this);
			cobj.allowFailing = true;
	        cobj.addPrimitiveConstraint(new ReactiveSolver.Constraint(this, cobj, func));
			try {
				if(!opts.postponeEnabling) { cobj.enable(); }
			} catch(e) {
				if(e instanceof ContinuousAssertError) {
					cobj.disable();
				}
				throw e;
			}
	        return cobj;
	    },
	    solve: function() {
	    	if(this.constraint && this.constraint.enabled && typeof this.constraint.predicate === "function")
	    		if(!this.constraint.predicate())
	    			throw new ContinuousAssertError(this.message);
	    }
	});
ReactiveSolver.subclass("RecalculateSolver", {
		initialize: function(message) {
			this.message = message;
		},
	    always: function(opts, func) {
	        var ctx = opts.ctx;
	        func.varMapping = ctx;
	        this.constraint = new Constraint(func, this);
	        this.predicate = func;
			this.constraint.allowFailing = true;
			try {
				if(!opts.postponeEnabling) { this.constraint.enable(); }
			} catch(e) {
				if(e instanceof ContinuousAssertError) {
					this.constraint.disable();
				}
				throw e;
			}
	        return this.constraint;
	    },
	    solve: function() {
	        debugger
	    	if(this.constraint && this.constraint.enabled)
	    		this.constraint.bbbConstraint.initialize(this.constraint.predicate, this);
	    }
	});
Object.extend(Babelsberg.prototype, {
		assert: function(opts, func) {
			opts.solver = new AssertSolver(opts.message);
			opts.allowUnsolvableOperations = true;
			opts.allowTests = true;
			//opts.debugging = true;
	        return this.always(opts, func);
		}
	});

	/***************************************************************
	 * Triggering
	 ***************************************************************/
	AssertSolver.subclass("TriggerSolver", {
		initialize: function(callback) {
			this.callback = callback;
			this.triggeredOnce = false;
		},
	    always: function(opts, func) {
	        var ctx = opts.ctx;
	        func.varMapping = ctx;
	        var cobj = new Constraint(func, this);
			cobj.allowFailing = true;
	        cobj.addPrimitiveConstraint(new ReactiveSolver.Constraint(this, cobj, func));
			if(!opts.postponeEnabling) { cobj.enable(); }
	        return cobj;
	    },
	    solve: function() {
	    	if(this.constraint &&
				this.constraint.enabled &&
				typeof this.constraint.predicate === "function"
			) {
	    		if(this.constraint.predicate()) {
					if(!this.triggeredOnce) {
						this.triggeredOnce = true;
						bbb.addCallback(this.callback, this.constraint.bbbConstraint, []);
					}
				} else {
					this.triggeredOnce = false;
				}
			}
	    },
	    weight: 10
	});
	
	AssertSolver.subclass("__TriggerDefinition__", {
		initialize: function(opts, func) {
			this.opts = opts;
			this.func = func;
		},
	    trigger: function(callback) {
			this.opts.callback = callback;
			return bbb.trigger(this.opts, this.func);
		}
	});

	Object.extend(Babelsberg.prototype, {
		trigger: function(opts, func) {
			opts.solver = new TriggerSolver(opts.callback);
			opts.allowUnsolvableOperations = true;
			opts.allowTests = true;
			//opts.debugging = true;
	        return this.always(opts, func);
		},
		when: function(opts, func) {
			return new __TriggerDefinition__(opts, func);
		}
	});

	/***************************************************************
	 * Layer activation
	 ***************************************************************/
	AssertSolver.subclass("LayerActivationSolver", {
		initialize: function(layer) {
			this.layer = layer;
		},
	    always: function(opts, func) {
	        var ctx = opts.ctx;
	        func.varMapping = ctx;
	        var cobj = new Constraint(func, this);
			cobj.allowFailing = true;
	        cobj.addPrimitiveConstraint(new ReactiveSolver.Constraint(this, cobj, func));
			cobj.enable();
	        return cobj;
	    },
	    solve: function() {
	    	if(this.constraint &&
				this.constraint.enabled &&
				typeof this.constraint.predicate === "function"
			) {
				var predicateFulfilled = this.constraint.predicate();
	    		if(predicateFulfilled && !this.layer.isGlobal()) {
	    			this.layer.beGlobal();
				} else  if(!predicateFulfilled && this.layer.isGlobal()) {
	    			this.layer.beNotGlobal();
				}
			}
	    },
	    weight: 10
	});
	
	Object.extend(Layer.prototype, {
		activeOn: function(opts, func) {
			opts.solver = new LayerActivationSolver(this);
			opts.allowUnsolvableOperations = true;
			opts.allowTests = true;
			//opts.debugging = true;
	        bbb.always(opts, func);
			
			return this;
		}
	});
	
	/***************************************************************
	 * Scoped constraints
	 ***************************************************************/
	Object.extend(Layer.prototype, {
		always: function(opts, func) {
			opts.postponeEnabling = !this.isGlobal();
			var cobj = bbb.always(opts, func);

			this.constraintObjects = this.constraintObjects || [];
			this.constraintObjects.push(cobj);
		},
		assert: function(opts, func) {
			opts.postponeEnabling = !this.isGlobal();
			var cobj = bbb.assert(opts, func);

			this.constraintObjects = this.constraintObjects || [];
			this.constraintObjects.push(cobj);
		},
		trigger: function(opts, func) {
			opts.postponeEnabling = !this.isGlobal();
			var cobj = bbb.trigger(opts, func);

			this.constraintObjects = this.constraintObjects || [];
			this.constraintObjects.push(cobj);
		},
		_activate: function() {
			this.constraintObjects = this.constraintObjects || [];
			this.constraintObjects.forEach(function(cobj) {
				cobj.enable();
			});
		},
		_deactivate: function() {
			this.constraintObjects = this.constraintObjects || [];
			this.constraintObjects.forEach(function(cobj) {
				cobj.disable();
			});
		}
	});

	/* Layer Activation */
	cop.withLayers = cop.withLayers.wrap(function(callOriginal, layers, func) {
		layers.forEach(function(layer) { layer._activate(); });

		try {
			return callOriginal(layers, func);
		} finally {
			layers.forEach(function(layer) { layer._deactivate(); });
		}
	});

	cop.withoutLayers = cop.withoutLayers.wrap(function(callOriginal, layers, func) {
		layers.forEach(function(layer) { layer._deactivate(); });
		
		try {
			return callOriginal(layers, func);
		} finally {
			layers.forEach(function(layer) { layer._activate(); });
		}
	});

	/* Global Layer Activation */
	cop.enableLayer = cop.enableLayer.wrap(function(callOriginal, layer) {
		layer._activate();
		return callOriginal(layer);
	});

	cop.disableLayer = cop.disableLayer.wrap(function(callOriginal, layer) {
		layer._deactivate();
		return callOriginal(layer);
	});
});
