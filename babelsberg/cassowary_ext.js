module('users.timfelgentreff.babelsberg.cassowary_ext').requires('users.timfelgentreff.cassowary.DwarfCassowary').toRun(function() {

Function.addMethods({
    shouldBeTrue: function (priority, ctx) {
        if (!ctx) {
            ctx = priority;
            priority = undefined;
        }
        this.varMapping = ctx;
        var constraint = new Constraint(this, ClSimplexSolver.getInstance());
        constraint.priority = priority;
        constraint.enable();
        return constraint;
    }
})

ClSimplexSolver.addMethods({
    isConstraintObject: function() {
        return true;
    },
    constraintVariableFor: function(value, ivarname) {
        if ((typeof(value) == "number") || (value === null) || (value instanceof Number)) {
            var v = new ClVariable(value + 0 /* coerce back into primitive */);
            v.stay();
            return v;
        } else {
            return null;
        }
    },
    get strength() {
        return ClStrength;
    },
    weight: 1000,
});

Object.extend(ClSimplexSolver, {
    getInstance: function() {
        if (!this["$$instance"]) {
            this["$$instance"] = new ClSimplexSolver();
            this["$$instance"].setAutosolve(false);
        }
        return this["$$instance"];
    },

    resetInstance: function() {
        this["$$instance"] = undefined;
    }
});

ClAbstractVariable.addMethods({
    isConstraintObject: function() {
        return true;
    },

    stay: function(strength) {
        var cn = new ClStayConstraint(this, strength || ClStrength.weak, 1.0);
        ClSimplexSolver.getInstance().addConstraint(cn);
        this.stayConstraint = cn;
        return cn;
    },
    removeStay: function() {
        if (this.stayConstraint) {
            try {
                ClSimplexSolver.getInstance().removeConstraint(this.stayConstraint);
            } catch(_) {
                this.stayConstraint = null;
            }
        }
    },




    suggestValue: function(value) {
        var c = this.cnEquals(value),
            s = ClSimplexSolver.getInstance();
        s.addConstraint(c);
        s.solve();
        s.removeConstraint(c);
    },
    setReadonly: function(bool) {
        if (bool && !this.readonlyConstraint) {
            var cn = new ClStayConstraint(this, ClStrength.required, 1.0);
            ClSimplexSolver.getInstance().addConstraint(cn);
            this.readonlyConstraint = cn;
            return cn;
        } else if (!bool && this.readonlyConstraint) {
            ClSimplexSolver.getInstance().removeConstraint(this.readonlyConstraint);
            this.readonlyConstraint = undefined;
        }
    },


    plus: function(value) {
        return new ClLinearExpression(this).plus(value);
    },

    minus: function(value) {
        return (new ClLinearExpression(this)).minus(value);
    },

    times: function(value) {
        return new ClLinearExpression(this).times(value);
    },

    divide: function(value) {
        return new ClLinearExpression(this).divide(value);
    },

    cnGeq: function(value) {
        return new ClLinearExpression(this).cnGeq(value);
    },

    cnLeq: function(value) {
        return new ClLinearExpression(this).cnLeq(value);
    },

    cnEquals: function(value) {
        return new ClLinearExpression(this).cnEquals(value);
    },
});

ClLinearExpression.addMethods({
    isConstraintObject: function() {
        return true;
    },

    cnGeq: function(value) {
        return new ClLinearInequality(this.minus(value));
    },

    cnLeq: function(value) {
        if (!(value instanceof ClLinearExpression)) {
            value = new ClLinearExpression(value);
        }
        if (!value.minus) debugger;
        return new ClLinearInequality(value.minus(this));
    },

    cnEquals: function(value) {
        return new ClLinearEquation(this, value);
    },
    
    plus: function(expr /*ClLinearExpression*/) {
    if (expr instanceof ClLinearExpression) {
      return this.clone().addExpression(expr, 1.0);
    } else if (expr instanceof ClVariable) {
      return this.clone().addVariable(expr, 1.0);
    } else if (typeof(expr) == "number") {
      return this.clone().addExpression(new ClLinearExpression(expr), 1.0);
    } else {
        throw "Not supported: plus with " + expr;
    }
  },

  minus: function(expr /*ClLinearExpression*/) {
    if (expr instanceof ClLinearExpression) {
      return this.clone().addExpression(expr, -1.0);
    } else if (expr instanceof ClVariable) {
      return this.clone().addVariable(expr, -1.0);
    } else if (typeof(expr) == "number") {
      return this.clone().addExpression(new ClLinearExpression(expr), -1.0);
    } else {
        throw "Not supported: minus with " + expr;
    }
  },


  divide: function(x) {
    if (typeof(x) == 'number') {
      if (CL.approx(x, 0.0)) {
        throw new ExCLNonlinearExpression();
      }
      return this.times(1.0 / x);
    } else if (x instanceof ClLinearExpression) {
      if (!x.isConstant) {
        throw new ExCLNonlinearExpression();
      }
      return this.times(1.0 / x._constant);
    } else {
        throw "Not supported: divide with " + expr;
    }
  },
});

ClConstraint.addMethods({
    isConstraintObject: function() {
        return true;
    },

    enable: function(strength) {
        if (strength) {
            this.setStrength(strength);
        }
        ClSimplexSolver.getInstance().addConstraint(this);
    },
    disable: function() {
        ClSimplexSolver.getInstance().removeConstraint(this);
    }

});

}) // end of module