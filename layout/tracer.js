module('users.timfelgentreff.layout.tracer').requires('users.timfelgentreff.layout.core').toRun(function() {
    /**
     * Solver
     */
    LayoutObject.subclass("TracingSolver", {
        initialize: function(algorithm) {
            this.cassowary = new ClSimplexSolver();
            this.cassowary.setAutosolve(false);
            this.reset();
        },
        
        reset: function() {
            this.variables = [];
            this.constraints = [];
            
            this.layoutConstraintVariablesByName = {};
            this.bbbConstraintVariablesByName = {};
        },
        always: function(opts, func)  {
            func.allowUnsolvableOperations = true;
            func.varMapping = opts.ctx;
            var constraint = new Constraint(func, this);
            constraint.enable();
            return constraint;
        },
        constraintVariableFor: function(value, ivarname, bbbConstrainedVariable) {
            if(typeof value == "undefined")
                return null;
            if(value && value instanceof lively.morphic.Box) { // Box
                return this.createSpecificVariable(value, ivarname, bbbConstrainedVariable, LayoutConstraintVariableBox);
            }
            if(value && ivarname === "shape") { // Shape
                return this.createSpecificVariable(value, ivarname, bbbConstrainedVariable, LayoutConstraintVariableShape);
            }
            if(value && value instanceof lively.Point && (ivarname === "_Extent" || ivarname === "_Position")) {
                return this.createSpecificVariable(value, ivarname, bbbConstrainedVariable, LayoutConstraintVariablePoint);
            };
            if(typeof value === "number" && (ivarname === "x" || ivarname === "y")) { // x or y
                return this.createSpecificVariable(value, ivarname, bbbConstrainedVariable, LayoutConstraintVariableNumber);
            }
            return null;
        },
        
        createSpecificVariable: function(value, ivarname, bbbConstrainedVariable, variableClass) {
            var name = ivarname + "" + this.variables.length;
            var v = new (variableClass)(name, value, this, ivarname, bbbConstrainedVariable);
            return v;
        },
        
        addVariable: function(layoutConstraintVariable, bbbConstraintVariable) {
            this.variables.push(layoutConstraintVariable);
            this.bbbConstraintVariablesByName[layoutConstraintVariable.name] = bbbConstraintVariable;
            this.layoutConstraintVariablesByName[layoutConstraintVariable.name] = layoutConstraintVariable;
            
        },
        
        addConstraint: function(constraint) {
            this.constraints.push(constraint);
            
        },
        
        removeConstraint: function(constraint) {
            this.constraints.remove(constraint);
            
        },
        
        solveOnce: function(constraint) {
            this.addConstraint(constraint);
            try {
                this.solve();
            } finally {
                this.removeConstraint(constraint);
            }
        },
        
        solve: function() {
            this.cassowary.solve();
            
            this.rerender();
        },
        
        rerender: function() {
            this.variables.filter(function(constraintVariable) {
                return constraintVariable instanceof LayoutConstraintVariableBox;
            }).each(function(constraintVariable) {
                var morph = constraintVariable.value();
                //morph.setPosition(pt(constraintVariable.child("_Position").x, constraintVariable.child("_Position").y));
                morph.renderUsing(morph.renderContext());
            });
        }
    });
    TracingSolver.addMethods({
        weight: 10000
    });


}) // end of module
