module('users.timfelgentreff.babelsberg.csp_ext').requires('users.timfelgentreff.csp.csp').toRun(function() {
	Object.subclass("csp.Solver", {
	    isConstraintObject: function() {
	        return true;
	    },

		initialize: function() {
			this.p = new _csp.DiscreteProblem();
		},
		newVariable: function(obj, varname, domain) {
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
            
            // TODO:
            // solve problem
            // unconstrain and throw error if no solution could be found (no element in domain)
		},
		constraintVariableFor: function(value, ivarname) {
			if(!this._current) {
				return null;
			}

			var vari = new csp.Variable(
				this,
				this._current.obj,
				this._current.varname,
				this._current.domain
			);
			return vari;
	    },
	    weight: 1000,
	    always: function (opts, func) {
	    	this.p.addConstraint([], func);
	    	this.p.getSolution();
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

		initialize: function(solver, obj, varname, domain) {
			this.solver = solver;
			this.obj = obj;
			this.varname = varname;
			this.domain = domain;
			this.cspname = csp.Solver.getUniqueName();
			
			this.cspvariable = this.solver.p.addVariable(this.cspname, domain);
			
			this.solver.p.solver.assignments[this.cspname] = this.domain[0];
		},
		
		// TODO:
		// check if assignment is contained in the domain -> early error
        // clear/save previous assignments
        // add 'value' as assignment
        // (try to) solve
        // possible restore previous assignments if a error occurs/no solution
	    suggestValue: function(value) {
	    	console.log("suggest value", value);
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
