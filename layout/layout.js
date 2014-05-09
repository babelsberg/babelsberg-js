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
            if(value && ivarname === "shape") {
                console.log("constraintVariable for shape");
                var name = ivarname + "" + this.variables.length;
                var v = new LayoutConstraintVariableShape(name, value, this);
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
            console.log("value:", value);
            if(typeof value === "number") {
                // TODO: add ConstraintVariable for x and y coordinates
                console.log("constraintVariable for Number");
                var name = ivarname + "" + this.variables.length;
                var v = new LayoutConstraintVariableNumber(name, value, this);
                this.addVariable(v, bbbConstraintVariable);
                return v;
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
        },
        changed: function(bool) {
            if(arguments.length == 0) return this.__changed__;
            
            this.__changed__ = bool;
            
            // propagate changed flag upwards
            if(this.__parent__ && this.__parent__ instanceof LayoutConstraintVariable) {
                this.__parent__.changed(bool)
            }
        }
    });

    LayoutConstraintVariable.subclass('LayoutConstraintVariableBox', {
        initialize: function($super, name, value, solver) {
            $super(name, value, solver);
            
            this.extent = this.constrainExtent(value);
        },

        constrainExtent: function(value) {
            var extentConstrainedVariable = ConstrainedVariable.newConstraintVariableFor(value, "shape");
            if (Constraint.current) {
                extentConstrainedVariable.ensureExternalVariableFor(Constraint.current.solver);
                extentConstrainedVariable.addToConstraint(Constraint.current);
            }

            var layoutConstraintVariable = extentConstrainedVariable.externalVariables(this.solver);
            layoutConstraintVariable.__parent__ = this;
            return extentConstrainedVariable;
        },
        
        /*
         * accepted functions for Boxes
         */
        sameExtent: function(rightHandSideBox) {
            return new LayoutConstraintBoxSameExtent(this, rightHandSideBox, this.solver);
        }
    });
    
    LayoutConstraintVariable.subclass('LayoutConstraintVariableShape', {
        initialize: function($super, name, value, solver) {
            $super(name, value, solver);
            
            this.extent = this.constrainExtent(value);
        },

        constrainExtent: function(value) {
            var extentConstrainedVariable = ConstrainedVariable.newConstraintVariableFor(value, "_Extent");
            if (Constraint.current) {
                extentConstrainedVariable.ensureExternalVariableFor(Constraint.current.solver);
                extentConstrainedVariable.addToConstraint(Constraint.current);
            }

            var layoutConstraintVariable = extentConstrainedVariable.externalVariables(this.solver);
            layoutConstraintVariable.__parent__ = this;

            return extentConstrainedVariable;
        }
        
        /*
         * accepted functions for Shapes
         */
    });
    
    LayoutConstraintVariable.subclass('LayoutConstraintVariablePoint', {
        initialize: function($super, name, value, solver) {
            $super(name, value, solver);
            
            this.x = this.constrainX(value);
            this.y = this.constrainY(value);
        },

        constrainX: function(value) {
            var extentConstrainedVariable = ConstrainedVariable.newConstraintVariableFor(value, "x");
            if (Constraint.current) {
                extentConstrainedVariable.ensureExternalVariableFor(Constraint.current.solver);
                extentConstrainedVariable.addToConstraint(Constraint.current);
            }

            var layoutConstraintVariable = extentConstrainedVariable.externalVariables(this.solver);
            layoutConstraintVariable.__parent__ = this;

            return extentConstrainedVariable;
        },
        
        constrainY: function(value) {
            var extentConstrainedVariable = ConstrainedVariable.newConstraintVariableFor(value, "y");
            if (Constraint.current) {
                extentConstrainedVariable.ensureExternalVariableFor(Constraint.current.solver);
                extentConstrainedVariable.addToConstraint(Constraint.current);
            }

            var layoutConstraintVariable = extentConstrainedVariable.externalVariables(this.solver);
            layoutConstraintVariable.__parent__ = this;

            return extentConstrainedVariable;
        },
        
        suggestValue: function(val) {
            console.log("This is the new _Extent:", val, this);
            // HACK: replace hard reference with plan implementation
            this.changed(true);
            this.solver.solve();
        }
        
        /*
         * accepted functions for Points
         */
    });
    
    LayoutConstraintVariable.subclass('LayoutConstraintVariableNumber', {
        /*
         * accepted functions for Numbers
         */
    });

    // TODO: add further types of constraint variables
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
            if(this.left.changed()) {
                this.left.changed(false);
                this.right.value.setExtent(this.left.value.getExtent());
            } else {
                this.left.value.setExtent(this.right.value.getExtent());
            }
        }
    });
}) // end of module
