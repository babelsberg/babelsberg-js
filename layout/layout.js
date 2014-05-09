module('users.timfelgentreff.layout.layout').requires().toRun(function() {

    Object.subclass('LayoutObject', {
        isConstraintObject: function() { return true; },
    });
    
    /*
     * Solver
     */
    LayoutObject.subclass("LayoutSolver", {
        initialize: function(){
            this.reset();
        },
        
        reset: function() {
            this.variables = [];
            this.constraints = [];
            
            this.layoutConstraintVariablesByName = {};
            this.bbbConstraintVariablesByName = {};
        },

        always: function(opts, func)  {
            console.log(opts);
            console.log(func);
            
            func.varMapping = opts.ctx;
            var constraint = new Constraint(func, this);
            constraint.enable();
            return constraint;
        },
        constraintVariableFor: function(value, ivarname, bbbConstraintVariable) {
            if(!value)
                return null;
            if(value && value instanceof lively.morphic.Box) {
                console.log("constraintVariable for Box");
                var name = ivarname + "" + this.variables.length;
                var v = new LayoutConstraintVariableBox(name, value, this);
                this.addVariable(v, bbbConstraintVariable);
                return v;
            }
            if(value && value instanceof lively.Point && ivarname === "_Extent") {
                console.log("constraintVariable for _Extent");
                var name = ivarname + "" + this.variables.length;
                var v = new LayoutConstraintVariablePoint(name, value, this);
                this.addVariable(v, bbbConstraintVariable);
                return v;
            };
            if(value instanceof Number) {
                // TODO: add ConstraintVariable for x and y coordinates
            }
            return null;
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
            console.log("------- solve -------", arguments);
            this.constraints.reverse().each(function(constraint) {
                console.log(constraint);
                constraint.solve();
            });
        }
    });
    
    LayoutObject.subclass('LayoutPlan', {
        initialize: function(solver) {
            this.solver = solver;
        }
    });
    
    /**
     * ConstraintVariable
     */
    LayoutObject.subclass('LayoutConstraintVariable', {
        initialize: function(name, value, solver) {
            this.name = name;
            this.value = value;
            this.solver = solver;
        },
        setReadonly: function(bool) {
            // TODO: add some constraint to hold a constant value
            if (bool && !this.readonlyConstraint) {
                
            } else if (!bool && this.readonlyConstraint) {
                
            }
        },
        isReadonly: function() {
            return !!this.readonlyConstraint;
        }
    });

    LayoutConstraintVariable.subclass('LayoutConstraintVariableBox', {
        initialize: function($super, name, value, solver) {
            $super(name, value, solver);
            
            this.extent = this.constrainExtent(value);
        },

        constrainExtent: function(value) {
            var extentConstrainedVariable = ConstrainedVariable.newConstraintVariableFor(value.shape, "_Extent");
            if (Constraint.current) {
                extentConstrainedVariable.ensureExternalVariableFor(Constraint.current.solver);
                extentConstrainedVariable.addToConstraint(Constraint.current);
            }
            // HACK: replace hard reference with plan implementation
            extentConstrainedVariable.box = this;
            
            return extentConstrainedVariable;
            
            // TODO: constrain x and y coordinates as well
            // var xConstrainedVariable = 0;
            // var yConstrainedVariable = 0;
        },
        
        /*
         * accepted functions for Boxes
         */
        sameExtent: function(rightHandSideBox) {
            return new LayoutConstraintBoxSameExtent(this, rightHandSideBox, this.solver);
        }
    });
    
    LayoutConstraintVariable.subclass('LayoutConstraintVariablePoint', {
        suggestValue: function(val) {
            console.log("This is the new _Extent:", val, this);
            // HACK: replace hard reference with plan implementation
            this.__cvar__.box.changed = true;
            this.solver.solve();
        }
        /*
         * accepted functions for Points
         */
    });

    // TODO: add further types of constraint variables
    // for shape
    // for Submorphs array (to enable jQuery style of definitions)
    // for primitive numbers
    
    /**
     * Constraint
     */
    Layout.Object.subclass('LayoutConstraint', {
        enable: function (strength) {
            // TODO: consider strength
            this.solver.addConstraint(this);
        },
    
        disable: function () {
            this.solver.removeConstraint(this);
        }
    });
    
    LayoutConstraint.subclass('LayoutConstraintBoxSameExtent', {
        initialize: function(left, right, solver) {
            this.left = left;
            this.right = right;
            this.solver = solver;
        },
        solve: function(point) {
            if(this.left.changed) {
                this.left.changed = false;
                this.right.value.setExtent(this.left.value.getExtent());
            } else {
                this.left.value.setExtent(this.right.value.getExtent());
            }
        }
    });
}) // end of module
