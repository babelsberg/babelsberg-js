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
			cobj.allowFailing = true;
	        cobj.addPrimitiveConstraint(new AssertSolver.Constraint(this, cobj, func));
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
	    initialize: function(solver, bbbConstraint, func) {
	    	//console.log("AssertSolver.Constraint.initialize");
			this.enabled = false;
	    	this.solver = solver;
	    	this.solver.constraint = this;
			this.bbbConstraint = bbbConstraint;

	    	// extract predicate from bbbConstraint
	    	this.predicate = func;/*_.chain(bbbConstraint.constraintvariables)
	    		.map(function(variable) {
	    			return variable.externalVariables(this.solver);
	    		}, this)
	    		.find(function(externalVariable) {
	    			return typeof externalVariable.assertPredicate === "function";
	    		})
	    		.value()
	    		//.assertPredicate;*/
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
	    	//console.log("TriggerSolver.always");
	        var ctx = opts.ctx;
	        func.varMapping = ctx;
	        var cobj = new Constraint(func, this);
			cobj.allowFailing = true;
	        cobj.addPrimitiveConstraint(new AssertSolver.Constraint(this, cobj, func));
			if(!opts.postponeEnabling) { cobj.enable(); }
	        return cobj;
	    },
	    solve: function() {
	    	//console.log("TriggerSolver.solve", this.constraint.predicate());
	    	if(this.constraint &&
				this.constraint.enabled &&
				typeof this.constraint.predicate === "function"
			) {
	    		if(this.constraint.predicate()) {
					if(!this.triggeredOnce) {
						this.triggeredOnce = true;
						this.callback.call(this.constraint.bbbConstraint);
					}
				} else {
					this.triggeredOnce = false;
				}
			}
	    },
	    weight: 10
	});
	
	Object.extend(Babelsberg.prototype, {
		trigger: function(opts, func) {
			opts.solver = new TriggerSolver(opts.callback);
			opts.allowUnsolvableOperations = true;
			opts.allowTests = true;
			//opts.debugging = true;
	        return this.always(opts, func);
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
	    	//console.log("LayerActivationSolver.always");
	        var ctx = opts.ctx;
	        func.varMapping = ctx;
	        var cobj = new Constraint(func, this);
			cobj.allowFailing = true;
	        cobj.addPrimitiveConstraint(new AssertSolver.Constraint(this, cobj, func));
			cobj.enable();
	        return cobj;
	    },
	    solve: function() {
	    	//console.log("LayerActivationSolver.solve", this.constraint.predicate());
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
	
	// hotfix
	// instead of cop.GlobalLayers.removeAt(idx); just use standard conform splice method
	Object.extend(cop, {
		disableLayer: function(layer) {
			var idx = cop.GlobalLayers.indexOf(layer)
			if (idx < 0) return;
			cop.GlobalLayers.splice(idx, 1);
			cop.invalidateLayerComposition();
		},
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

	var copWithLayers = cop.withLayers;
	var copWithoutLayers = cop.withoutLayers;
	var copEnableLayer = cop.enableLayer;
	var copDisableLayer = cop.disableLayer;
	Object.extend(cop, {
		/* Layer Activation */
		withLayers: function withLayers(layers, func) {
			layers.forEach(function(layer) { layer._activate(); });

			try {
				return copWithLayers.apply(this, arguments);
			} finally {
				layers.forEach(function(layer) { layer._deactivate(); });
			}
		},

		withoutLayers: function withoutLayers(layers, func) {
			layers.forEach(function(layer) { layer._deactivate(); });
			
			try {
				return copWithoutLayers.apply(this, arguments);
			} finally {
				layers.forEach(function(layer) { layer._activate(); });
			}
		},

		/* Global Layer Activation */
		enableLayer: function(layer) {
			layer._activate();
			return copEnableLayer.apply(this, arguments);
		},

		disableLayer: function(layer) {
			layer._deactivate();
			return copDisableLayer.apply(this, arguments);
		}
	});

});
