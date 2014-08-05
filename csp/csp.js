/* 
 * CSP.JS
 *
 * A constraint satisfaction problem solver in Javascript.
 *
 * By Niels Joubert https://github.com/njoubert/csp.js
 */
module('users.timfelgentreff.csp.csp').requires().toRun(function() {

var util = {
    mixin: function(target, src) {
      for (var name in src) {
        if (src.hasOwnProperty(name) && !target.hasOwnProperty(name)) {
          target[name] = src[name];
        }
      }
    },
    hashcopy: function(obj) {
      var ret = obj.constructor();
      for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
          ret[p] = obj[p];
        }
      }
      return ret;
    }
};

/* 
 * DiscreteFinite.JS
 *
 * Implementation for a discrete, finite-domain CSP solver
 *
 *
 */
 
  /* 
   * Variable
   */
  var Variable = function(name,domain) {
    this.name = name;
    this.domain = domain;
  };
  
  Variable.prototype.toString = function() {
    return "" + this.name + " => [" + this.domain.toString() + "]";
  };

  /* 
   * Constraint 
   */
  var Constraint = function(variables, fn) {
    this.fn = fn;
    this.variables = variables;
  };
  
  Constraint.prototype.toString = function() {
    return "(" + this.variables.toString() + ") => " + this.fn.toString();
  };
  
  /* 
   * Problem 
   */ 
  var Problem = function() {
    this.solver = new RecursiveBacktrackingSolver();
    this.variables = {};
    this.constraints = [];
  };
  
  Problem.prototype.addVariable = function(name, domain) {
    this.variables[name] = new Variable(name,domain);
  };

  Problem.prototype.addConstraint = function(variables, fn) {
    this.constraints.push(new Constraint(variables, fn));
  };
	  
  Problem.prototype.removeConstraint = function(constraint) {
	var index = this.constraints.indexOf(constraint);
	if(index > -1) {
	    this.constraints.splice(index, 1).push(new Constraint(variables, fn));
	} else {
		throw "attempt to removed a non-existing element";
	}
  };
		  
  Problem.prototype.setSolver = function(solver) {
    this.solver = solver;
  };
  
  Problem.prototype.getSolution = function(restrictedDomains) {
    return this.solver.getSolution(this, restrictedDomains);
  };

  Problem.prototype.getAssignmentFor = function(name) {
    return this.solver.getAssignmentFor(name);
  };

  /* 
   * Solver 
   */
  var RecursiveBacktrackingSolver = function() {
    this.assignments = {};
  };
  
  RecursiveBacktrackingSolver.prototype.getSolution = function(csp, restrictedDomains) {
    var assignment = {};
    var satisfiable = this.solve(csp, assignment, csp.variables, csp.constraints, true, restrictedDomains);
    return satisfiable;
  };

  RecursiveBacktrackingSolver.prototype.getAssignmentFor = function(name) {
    return this.assignments[name];
  };

  RecursiveBacktrackingSolver.prototype.solve = function(csp, assignments, variables, constraints, single, restrictedDomains) {
	  var domainByName = this.prepareSolving(csp, assignments, variables, constraints, single, restrictedDomains);
	  
	  var fulfilled = this.recursiveSolve(csp, assignments, variables, constraints, single, domainByName);
	  
	  return fulfilled;
  };

  RecursiveBacktrackingSolver.prototype.prepareSolving = function(csp, assignments, variables, constraints, single, restrictedDomains) {
	  var domainByName = _.defaults(restrictedDomains, variables);

	  return domainByName;
  };

	RecursiveBacktrackingSolver.prototype.recursiveSolve = function(csp, assignments, variables, constraints, single, domainByName) {
		if(_.size(domainByName) === 0) {
			var fulfilled = this.checkAssignments(csp, assignments, variables, constraints, single, domainByName);
			return fulfilled;
		} else {
			var current = _.chain(domainByName)
				.keys()
				.first()
				.value();
			var remainingDomain = _.omit(domainByName, current);
			var currentDomain = domainByName[current].domain;
			var fulfillingValue = _.find(currentDomain, function(val) {
				this.assignments[current] = val;
				var fulfilled = this.recursiveSolve(csp, assignments, variables, constraints, single, remainingDomain);
				return fulfilled;
			}, this);
			return typeof fulfillingValue !== "undefined";
		};
	};

	RecursiveBacktrackingSolver.prototype.checkAssignments = function(csp, assignments, variables, constraints, single, domainByName) {
		var constraintsFulfilled =_.every(constraints, function(constraint) {
			return constraint.fn();
		}, this);

		if(constraintsFulfilled) {
			this.summitSolution(csp, assignments, variables, constraints, single, domainByName);
		}
		
		return constraintsFulfilled;
	};

	RecursiveBacktrackingSolver.prototype.summitSolution = function(csp, assignments, variables, constraints, single, domainByName) {
	};

/*
 * Public API
 */
Object.subclass("_csp", {});
Object.extend(_csp, {
	version: "0.1",
    DiscreteProblem: Problem
});

});