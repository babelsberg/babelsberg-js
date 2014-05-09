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
            if(value && value instanceof lively.morphic.Box) { // Box
                return this.createSpecificVariable(value, ivarname, bbbConstraintVariable, LayoutConstraintVariableBox);
            }
            if(value && ivarname === "shape") { // Shape
                return this.createSpecificVariable(value, ivarname, bbbConstraintVariable, LayoutConstraintVariableShape);
            }
            if(value && value instanceof lively.Point && ivarname === "_Extent") { // _Extent
                return this.createSpecificVariable(value, ivarname, bbbConstraintVariable, LayoutConstraintVariablePoint);
            };
            if(typeof value === "number") { // x or y
                return this.createSpecificVariable(value, ivarname, bbbConstraintVariable, LayoutConstraintVariableNumber);
            }
            return null;
        },
        
        createSpecificVariable: function(value, ivarname, bbbConstraintVariable, variableClass) {
            var name = ivarname + "" + this.variables.length;
            var v = new (variableClass)(name, value, this);
            this.addVariable(v, bbbConstraintVariable);
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
        },
        
        // create a ConstrainedVariable for the property given by ivarname
        constrainProperty: function(value, ivarname) {
            var extentConstrainedVariable = ConstrainedVariable.newConstraintVariableFor(value, ivarname);
            if (Constraint.current) {
                extentConstrainedVariable.ensureExternalVariableFor(Constraint.current.solver);
                extentConstrainedVariable.addToConstraint(Constraint.current);
            }

            var layoutConstraintVariable = extentConstrainedVariable.externalVariables(this.solver);
            layoutConstraintVariable.__parent__ = this;
            return extentConstrainedVariable;
        },
        
    });

    LayoutConstraintVariable.subclass('LayoutConstraintVariableBox', {
        initialize: function($super, name, value, solver) {
            $super(name, value, solver);
            
            this.shape = this.constrainProperty(value, "shape");
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
            
            this.extent = this.constrainProperty(value, "_Extent");
        }

        /*
         * accepted functions for Shapes
         */
    });
    
    LayoutConstraintVariable.subclass('LayoutConstraintVariablePoint', {
        initialize: function($super, name, value, solver) {
            $super(name, value, solver);
            
            this.x = this.constrainProperty(value, "x");
            this.y = this.constrainProperty(value, "y");
        },
        
        suggestValue: function(val) {
            console.log("This is the new _Extent:", val, this);

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
