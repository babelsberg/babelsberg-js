module('users.timfelgentreff.babelsberg.deltablue_ext').requires('users.timfelgentreff.deltablue.deltablue').toRun(function() {

Function.addMethods({
    shouldBeSatisfiedWith: function(priority, methods, ctx) {
        // method for deltablue constraint (for now)
        if (!ctx) {
            ctx = methods;
            methods = priority;
            priority = DBStrength.required;
        }
        return DBPlanner.getInstance().always({
            priority: priority,
            methods: methods,
            ctx: ctx
        }, this);
    }
});

JSLoader.loadJs(module('users.timfelgentreff.babelsberg.uglify').uri());
Object.subclass('FormulaTransform', {
    
});

DBPlanner.addMethods({
    isConstraintObject: function() {
        return true;
    },
    constraintVariableFor: function(value, ivarname) {
        return new DBVariable(ivarname, value, this);
    },
    get strength() {
        return DBStrength;
    },
    always: function(opts, func) {
        if (Object.isString(opts.priority)) {
            opts.priority = this.strength[opts.priority];
        }
        //func.allowUnsolvableOperations = true; // XXX TODO: find out if we need this
        var planner = this,
            ctx = opts.ctx,
            priority = opts.priority,
            methods = opts.methods;
        func.varMapping = ctx;
        if (!methods) {
            methods = func;
            func = undefined;
        }
        methods.varMapping = ctx;
        var cobj = new Constraint(methods, planner);
        var formulas = cobj.constraintvariables.collect(function (v) {
            var v = v.externalVariables(planner);
            return v ? v.removeFormula() : null;
        }).compact();

        if (formulas.length > 0) {
            var constraint = new UserDBConstraint(priority, func, function (c) {
                formulas.each(function (m) {
                    var inputs = m.inputs.select(function (input) {
                        return input instanceof DBVariable
                    });
                    dbgOn(inputs.length !== m.inputs.length);
                    c.formula(m.output, inputs, m.func);
                });
            }, planner);
            cobj.addPrimitiveConstraint(constraint);
        };
        cobj.priority = priority;
        cobj.enable();
        return cobj;
    },


    weight: 100,
    addEditVar: function(v) {
        if (!this.currentEdits) {
            this.currentEdits = new DBOrderedCollection();
        }
        var edit = new EditDBConstraint(v, DBStrength.REQUIRED, this);
        this.currentEdits.add(edit);
        return edit;
    },
    solve: function() {
        // not required
    },

    beginEdit: function() {
        if (this.currentEditPlan) {
            throw "Trying to run nested edits - this isn't supported"
        }
        if (!this.currentEdits) {
            throw "No edit variables - cannot beginEdit"
        }
        this.currentEditPlan = this.extractDBPlanFromDBConstraints(this.currentEdits);
    },
    endEdit: function() {
        if (this.currentEdits && this.currentEdits.length !== 0) {
            this.currentEdits.elms.each(function (edit) {
                edit.destroyDBConstraint();
            })
        }
        this.currentEditPlan = null;
    },
    resolveArray: function(newValues) {
        if (!this.currentEdits) {
            throw "resolveArray only valid in edit"
        }
        this.currentEdits.elms.each(function (edit, idx) {
            edit.myOutput.value = newValues[idx];
        })
        this.currentEditPlan.execute();
    }
})

Object.extend(DBPlanner, {
    getInstance: function() {
        if (!this["$$instance"]) {
            this["$$instance"] = new DBPlanner();
        }
        return this["$$instance"];
    },

    resetInstance: function() {
        this["$$instance"] = undefined;
    }
});

Object.extend(DBStrength, {
    required: DBStrength.REQUIRED,
    strong: DBStrength.STRONG_DEFAULT,
    medium: DBStrength.NORMAL,
    weak: DBStrength.WEAK_DEFAULT
});

DBVariable.addMethods({
    isConstraintObject: function() {
        return true;
    },

    stay: function(strength) {
        var cn = new StayDBConstraint(this, strength || DBStrength.WEAK_DEFAULT, this.planner);
        cn.enable();
        this._stayConstraint = cn;
        return cn;
    },
    setReadonly: function(bool) {
        if (bool && !this.readonlyConstraint) {
            var cn = new StayDBConstraint(this, DBStrength.required, this.planner);
            cn.enable();
            this.readonlyConstraint = cn;
            return cn;
        } else if (!bool && this.readonlyConstraint) {
            this.readonlyConstraint.disable();
            this.readonlyConstraint = undefined;
        }
    },
    isReadonly: function() {
        return !!this.readonlyConstraint;
    },


    formula: function (inputs, func) {
        if (!Constraint.current) {
            throw "invalid outside constraint construction"
        }
        // var constraint = new Constraint(func, Constraint.current.solver),
        //     inputs = constraint.constraintvariables
        if (this.__formula__) {
            throw "two formulas for the same variable " + this;
        }
        this.__formula__ = {output: this, inputs: inputs, func: func};
    },


    removeFormula: function () {
        var f = this.__formula__;
        this.__formula__ = undefined;
        if (!f) {
            f = this.deriveFormula();
        }
        return f;
    },
    deriveFormula: function() {
        // TODO
        return;
    },

    removeStay: function() {
        if (this._stayConstraint) {
            try {
                this.planner.removeConstraint(this._stayConstraint);
            } catch(_) {
                this._stayConstraint = null;
            }
        }
    },

    suggestValue: function(value) {
        this.assignValue(value);
    },
    
    prepareEdit: function() {
        if (this.editConstraint) {
            // ignore?
        } else {
            this.editConstraint = this.planner.addEditVar(this);
        }
    },
    
    finishEdit: function() {
        this.editConstraint = null;
    },
    cnIdentical: function(other) {
        if (!(other instanceof DBVariable)) {
            other = new DBVariable("___", other, this.planner);
            var stay = new StayDBConstraint(other, DBStrength.required, this.planner);
            stay.enable(DBStrength.required);
        }
        return new EqualityDBConstraint(this, other, DBStrength.required, Constraint.current.solver);
    },
    cnEquals: function(other) {
        if (!(other instanceof DBVariable)) {
            other = new DBVariable("constant/" + other, other, this.planner);
            Constraint.current.addPrimitiveConstraint(
                new StayDBConstraint(other, DBStrength.required, this.planner)
            );
        }
        
        var self = this;
        cloneFunc = function (fromObj) {
            if (fromObj.clone) {
                return fromObj.clone();
            } else if (fromObj.copy) {
                return fromObj.copy();
            } else {
                return fromObj; // regress to identity constraint
            }
        }
        
        return new UserDBConstraint(
            function (c) {
                c.formula(self, [other], cloneFunc);
                c.formula(other, [self], cloneFunc);
            },
            Constraint.current.solver
        );
    },
    equals: function(argument) {
        return this.cnEquals(argument);
    },
})


DBConstraint.addMethods({
    isConstraintObject: function () {
        return true;
    },

    enable: function (priority) {
        this.strength = priority || this.strength;
        this.addDBConstraint()
    },

    disable: function () {
        this.destroyDBConstraint()
    }
});
EqualityDBConstraint.addMethods({
    setExecuteFunction: function (func) {
        var orig = this.execute.$originalFunction || this.execute;
        func.$originalFunction = orig;
        this.execute = func;
    },
    
    unsetExecuteFunction: function () {
        this.execute = this.execute.$originalFunction || this.execute;
    }
});}) // end of module
