module('users.timfelgentreff.babelsberg.csp_ext').requires('users.timfelgentreff.csp.csp').toRun(function() {
	Object.subclass("csp.Solver", {
	    isConstraintObject: function() {
	        return true;
	    },

		initialize: function() {
			this.p = new _csp.DiscreteProblem();
		},
		newVariable: function(obj, varname, domain) {
			if(domain.length === 0) {
				throw "Empty domain not allowed";
			}
			
			var temp = Constraint.current;
			Constraint.current = { solver: this };
			
			this._current = {
				obj: obj,
				varname: varname,
				domain: domain
			};

            var bbbConstraintVariable = ConstrainedVariable.newConstraintVariableFor(obj, varname);
            bbbConstraintVariable.ensureExternalVariableFor(this);
            Constraint.current = temp;
            
            var cspConstraintVariable = bbbConstraintVariable.externalVariables(this);
			
            delete this._current;
		},
		constraintVariableFor: function(value, ivarname) {
			if(!this._current) {
				return null;
			}

			var vari = new csp.Variable(
				this,
				this._current.obj,
				this._current.varname,
				value,
				this._current.domain
			);
			return vari;
	    },
	    weight: 1000,
	    always: function (opts, func) {
	    	var constraint  = this.p.addConstraint([], func);
	    	var satisfiable = this.p.getSolution({});
	    	if(!satisfiable) {
	    		this.p.removeConstraint(constraint);
	    		throw "constraint cannot be satisfied";
	    	}
	    }
	});
	Object.extend(csp.Solver, {
		weight: 1000,
		uniqueName: 42,
		getUniqueName: function() {
			return 'var' + csp.Solver.uniqueName++;
		}
	});
	
	Object.subclass("csp.Variable", {
	    isConstraintObject: function() {
	        return true;
	    },

		initialize: function(solver, obj, varname, value, domain) {
			this.solver = solver;
			this.obj = obj;
			this.varname = varname;
			this.domain = domain;
			this.cspname = csp.Solver.getUniqueName();
			
			this.cspvariable = this.solver.p.addVariable(this.cspname, domain);
			
			var valueToAssign = this.domain.indexOf(value) > -1 ? value : this.domain[0];
			this.solver.p.solver.assignments[this.cspname] = valueToAssign;
		},
		
	    suggestValue: function(value) {
	    	// throw error if assigned value does not match the corresponding domain
	    	var inDomain = this.domain.indexOf(value) > -1;
	    	if(!inDomain) {
	    		throw "assigned value is not contained in domain";
	    	}
	    	
	    	// save previous assignments for possible later restoration.
	    	var save = _.clone(this.solver.p.solver.assignments);
	    	
	    	// add a restricted domain with a fake Variable-object
	    	var restrictedDomains = {};
	    	restrictedDomains[this.cspname] = {domain: [value]};

	    	// try to satisfy all constraint
	    	var satisfiable = this.solver.p.getSolution(restrictedDomains);
	    	if(!satisfiable) {
	    		// restore assignments
	    		_.extend(this.solver.p.solver.assignments, save);
	    		throw "assignment makes constraints not satisfiable";
	    	}
	    },

	    value: function() {
	    	return this.solver.p.getAssignmentFor(this.cspname);
	    },
	    
	    setReadonly: function(bool) { /* ignored */ },
	    isReadonly: function() {
	        return false;
	    }
	});

}); // end of module
