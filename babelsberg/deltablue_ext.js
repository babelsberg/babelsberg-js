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
        var planner = this,
            ctx = opts.ctx,
            priority = opts.priority,
            methods = opts.methods;

        func.varMapping = ctx;
        if (methods) {
            methods.varMapping = ctx;
            var formulas = new Constraint(methods, planner).constraintvariables.collect(function (v) {
                var v = v.externalVariables(planner);
                return v ? v.removeFormula() : null;
            }).compact();
        }

        var constraint = new UserDBConstraint(priority, func, function (c) {
            formulas.each(function (m) {
                c.formula(m.output, m.inputs, m.func);
            });
        }, planner);
        constraint.priority = priority;
        constraint.enable();
        return constraint;
    },


    weight: 100,
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
        return f;
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
}) // end of module