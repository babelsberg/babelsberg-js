module('users.timfelgentreff.layout.layout').requires().toRun(function() {

    Object.subclass('LayoutObject', {
        isConstraintObject: function() { return true; },
    });
    
    /**
     * Solver
     */
    LayoutObject.subclass("LayoutSolver", {
        initialize: function(algorithm) {
            this.algorithm = algorithm || new LayoutAlgorithmDefault();
            this.algorithm.setSolver(this);
            
            this.reset();
        },
        
        reset: function() {
            this.variables = [];
            this.constraints = [];
            
            this.layoutConstraintVariablesByName = {};
            this.bbbConstraintVariablesByName = {};
        },

        always: function(opts, func)  {
            func.varMapping = opts.ctx;
            var constraint = new Constraint(func, this);
            constraint.enable();
            return constraint;
        },

        constraintVariableFor: function(value, ivarname, bbbConstrainedVariable) {
            if(!value)
                return null;
            if(value && value instanceof lively.morphic.Box) { // Box
                return this.createSpecificVariable(value, ivarname, bbbConstrainedVariable, LayoutConstraintVariableBox);
            }
            if(value && ivarname === "shape") { // Shape
                return this.createSpecificVariable(value, ivarname, bbbConstrainedVariable, LayoutConstraintVariableShape);
            }
            if(value && value instanceof lively.Point && ivarname === "_Extent") { // _Extent
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
            
            this.algorithm.addVariable(layoutConstraintVariable);
        },
        
        addConstraint: function(constraint) {
            this.constraints.push(constraint);
            
            this.algorithm.addConstraint(constraint);
        },
        
        removeConstraint: function(constraint) {
            this.constraints.remove(constraint);
            
            this.algorithm.removeConstraint(constraint);
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
            this.solving = true;
            this.algorithm.solve();
            this.solving = false;
            
            this.rerender();
        },
        
        rerender: function() {
            //console.log("------- rerender -------");
            this.variables.map(function(constraintVariable) {
                //console.log("rerender", constraintVariable.name, constraintVariable);
                return constraintVariable;
            }).filter(function(constraintVariable) {
                return constraintVariable instanceof LayoutConstraintVariableBox;
            }).each(function(constraintVariable) {
                var morph = constraintVariable.value;
                //console.log("Variable", morph);
                morph.setExtent(morph.getExtent());
            });
        }
    });
Object.extend(LayoutSolver, {
    weight: 5000
});    
    LayoutObject.subclass('LayoutAlgorithm', {
        setSolver: function(solver) {
            this.layoutSolver = solver;
        },
        addVariable: function(variable) {},
        addConstraint: function(constraint) {},
        removeConstraint: function(constraint) {}
    });
    
    LayoutAlgorithm.subclass('LayoutAlgorithmDefault', {
        solve: function() {
            this.layoutSolver.constraints.each(function(constraint) {
                constraint.solve();
            });
        }
    });
    
    LayoutAlgorithm.subclass('LayoutAlgorithmDelegateCassowary', {
    initialize: function() {
        this.solver = new ClSimplexSolver();

        this.variablesByName = {};
        this.constraintsByName = {};
    },
    addVariable: function(variable) {
        if(variable instanceof LayoutConstraintVariableNumber) {
            var cassowaryVariable = this.variablesByName[variable.name] = new ClVariable(variable.name, variable.value);
            this.solver.addConstraint(new ClStayConstraint(cassowaryVariable));
        }
    },
    addConstraint: function(constraint) {
        if(constraint instanceof LayoutConstraintAspectRatio) {
            var width = this.variablesByName[constraint.left.child("shape").child("_Extent").child("x").name];
            var height = this.variablesByName[constraint.left.child("shape").child("_Extent").child("y").name];
            var aspectRatio = constraint.right;
            var cn = width.cnGeq(height.times(aspectRatio));
            this.solver.addConstraint(cn);
        }
    },
    solve: function() {
        Object.keys(this.variablesByName).each(function(name) {
            var numberVariable = this.layoutSolver.layoutConstraintVariablesByName[name];
            var bbbConstraintVariable = this.layoutSolver.bbbConstraintVariablesByName[name];
            var newValue = this.variablesByName[name].value();
            
            numberVariable.value = newValue;
            //bbbConstraintVariable.storedValue = newValue;
            //numberVariable.__cvar__.parentConstrainedVariable[numberVariable.ivarname] = newValue;
            console.log("FOOOOOO", bbbConstraintVariable, newValue, numberVariable);
        }, this);
    },
    getCassowary: function() {}
});
    
    /**
     * ConstraintVariable
     */
    LayoutObject.subclass('LayoutConstraintVariable', {
        initialize: function(name, value, solver, ivarname, bbbConstrainedVariable) {
            this.name = name;
            this.value = value;
            this.solver = solver;
            this.ivarname = ivarname;
            this.__cvar__ = bbbConstrainedVariable;

            solver.addVariable(this, bbbConstrainedVariable);

            this.__children__ = {};

            this.initChildConstraints();
        },
        value: function() {
            return this.__value__;
        },
        setValue: function(value) {
            this.__value__ = value;
        },
        initChildConstraints: function() {},
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
            if(this.parentConstraintVariable && this.parentConstraintVariable instanceof LayoutConstraintVariable) {
                this.parentConstraintVariable.changed(bool)
            }
        },
        child: function(ivarname, child) {
            if(arguments.length < 2)
                return this.__children__[ivarname];

            this.__children__[ivarname] = child;
            child.parentConstraintVariable = this;
        },
        
        // create a ConstrainedVariable for the property given by ivarname
        constrainProperty: function(ivarname) {
            var extentConstrainedVariable = ConstrainedVariable.newConstraintVariableFor(this.value, ivarname, this.__cvar__);
            if (Constraint.current) {
                extentConstrainedVariable.ensureExternalVariableFor(Constraint.current.solver);
                extentConstrainedVariable.addToConstraint(Constraint.current);
            }

            var childConstraintVariable = extentConstrainedVariable.externalVariables(this.solver);
            this.child(ivarname, childConstraintVariable);
            //console.log("FOOOOOO", ivarname, childConstraintVariable, this, childConstraintVariable.parentConstraintVariable);

            return extentConstrainedVariable;
        }
    });

    LayoutConstraintVariable.subclass('LayoutConstraintVariableBox', {
        initChildConstraints: function() {
            this.shape = this.constrainProperty("shape");
        },

        suggestValue: function(val) {
            //console.log("This is the new Box:", val, this);

            if(this.solver.solving) return val;
    
            this.changed(true);
            this.solver.solve();
        },

        /*
         * accepted functions for Boxes
         */
        sameExtent: function(rightHandSideBox) {
            return new LayoutConstraintBoxSameExtent(this, rightHandSideBox, this.solver);
        },
        getExtent: function() {
            return this
                .child("shape")
                .child("_Extent");
        },
        aspectRatio: function(rightHandSide) {
            return new LayoutConstraintAspectRatio(this, rightHandSide, this.solver);

            // TODO: use correct API
            this.aspectRatio = this.constrainProperty("aspectRatio");
            
            return this.aspectRatio;
        }
    });
    
    LayoutConstraintVariable.subclass('LayoutConstraintVariableShape', {
        initChildConstraints: function() {
            this.extent = this.constrainProperty("_Extent");
        },

        suggestValue: function(val) {
            //console.log("This is the new Shape:", val, this);
    
            if(this.solver.solving) return val;

            this.changed(true);
            this.solver.solve();
        }

        /*
         * accepted functions for Shapes
         */
    });
    
    LayoutConstraintVariable.subclass('LayoutConstraintVariablePoint', {
        initChildConstraints: function() {
            this.x = this.constrainProperty("x");
            this.y = this.constrainProperty("y");
        },
        
        suggestValue: function(val) {
            //console.log("This is the new _Extent:", val, this);

            if(this.solver.solving) return val;

            this.changed(true);
            this.solver.solve();
        },
        
        /*
         * accepted functions for Points
         */
        eqPt: function(rightHandSidePoint) {
            if(this.ivarname === "_Extent" && rightHandSidePoint.ivarname === "_Extent")
                return this.parentConstraintVariable.parentConstraintVariable.sameExtent(rightHandSidePoint.parentConstraintVariable.parentConstraintVariable);
                
            throw "eqPt does only work for _Extent attributes for now."
        }
    });
    
    LayoutConstraintVariable.subclass('LayoutConstraintVariableNumber', {
        suggestValue: function(val) {
            //console.log("This is the new Number:", val, this);
            
            if(this.solver.solving) return val;
            
            this.changed(true);
            this.solver.solve();
        }
        /*
         * accepted functions for Numbers
         */
    });
    
    LayoutConstraintVariable.subclass('LayoutConstraintVariableAspectRatio', {
        suggestValue: function(val) {
            //console.log("This is the new Number:", val, this);

            this.changed(true);
            this.solver.solve();
        },
        /*
         * accepted functions for AspectRatio
         */
        cnGeq: function(rightHandSide) {
            throw "cnEquals not yet implemented."
        }
    });

    // TODO: add further types of constraint variables
    // for Submorphs array (to enable jQuery style of definitions)

    /**
     * Constraint
     */
    LayoutObject.subclass('LayoutConstraint', {
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
        solve: function() {
            if(this.left.changed()) {
                this.left.changed(false);
                this._solve(this.left, this.right)
            }
            else
            if(this.right.changed()) {
                this.right.changed(false);
                this._solve(this.right, this.left)
            }
            else {
                this._solve(this.left, this.right);
            }
        },
        _solve: function(from, to) {
            to.value.getExtent().x = from.value.getExtent().x;
            to.value.getExtent().y = from.value.getExtent().y;
            to.value.setExtent(to.value.getExtent());
        }
    });

    LayoutConstraint.subclass('LayoutConstraintAspectRatio', {
        initialize: function(left, right, solver) {
            this.left = left;
            this.right = right;
            this.solver = solver;
        },
        solve: function() {
            if(this.left.changed()) {
                this.left.changed(false);
            }
            this.left.value.getExtent().x = this.right * this.left.value.getExtent().y;
        }
    });
/*
    LayoutConstraint.subclass('LayoutConstraintEqPt', {
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
*/
}) // end of module
