module('users.timfelgentreff.backtalk.constraints').requires('users.timfelgentreff.backtalk.backtalk').
toRun(function() {

backtalk.BinaryConstraint.subclass('backtalk.EqualityConstraint', {
    enforceArcConsistency: function() {
        var intersection = this.valuesToExploreA().intersect(this.valuesToExploreB());
        this.variableA.valuesToExplore = intersection;
        this.variableB.valuesToExplore = intersection;
    },
    isConsistent: function() {
        if (this.variableA.currentValue == this.variableB.currentValue) {
            return true;
        }
        try {
            return this.variableA.equals(this.variableB);
        } catch(_) {}
        try {
            return this.variableA.eq(this.variableB);
        } catch(_) {}
        return false;
    }
});
backtalk.BinaryConstraint.subclass('backtalk.InequalityConstraint', {
    enforceArcConsistency: function() {
        var valA = this.valuesToExploreA(),
            valB = this.valuesToExploreB();
        if (valA.size > 1 && valB.size > 1) {
            return;
        } else if (valA.size === 0) {
            this.variableB.valuesToExplore = [];
            return;
        } else if (valB.size === 0) {
            this.variableA.valuesToExplore = [];
            return;
        }

        if (valA.size == 1) {
            for (let value of valB) {
                if (valA.has(value)) {
                    valB.delete(value);
                    break;
                }
            }
        } else if (valB.size == 1) {
            for (let value of valA) {
                if (valB.has(value)) {
                    valA.delete(value);
                    break;
                }
            }
        }
    },
    isConsistent: function() {
        let valA = this.valuesToExploreA(),
            valB = this.valuesToExploreB();
        if (valA.size > 1 && valB.size > 1) {
            return true;
        }
        if (valA.size == 1) {
            for (let value of valB) {
                if (valA.has(value)) {
                    return false;
                }
            }
        }
        if (valB.size == 1) {
            for (let value of valA) {
                if (valB.has(value)) {
                    return false;
                }
            }
        }
        return true;
    }
});
backtalk.BinaryConstraint.subclass('backtalk.FunctionBinaryConstraint', {
    initialize: function($super, a, b, func) {
        $super(a, b);
        this.func = func;
    },
    enforceArcConsistency: function() {
        var sizeA = this.valuesToExploreA().size,
            sizeB = this.valuesToExploreB().size,
            self = this,
            previousSizeA, previousSizeB;
        cond();
        while (previousSizeA !== sizeA && previousSizeB !== sizeB) {
            cond();
        }

        function cond() {
            var valB = self.valuesToExploreB();
            self.variableA.filterToSelect(function (a) {
                for (let b of valB) {
                    if (self.func(a, b)) {
                        return true;
                    }
                }
                return false;
            });
            var valA = self.valuesToExploreA();
            self.variableB.filterToSelect(function (b) {
                for (let a of valA) {
                    if (self.func(a, b)) {
                        return true;
                    }
                }
                return false;
            });
            previousSizeA = sizeA;
            sizeA = self.valuesToExploreA().size;
            previousSizeB = sizeB;
            sizeB = self.valuesToExploreB().size;
        };
    },
    isConsistent: function() {
        var valA = this.valuesToExploreA(),
            valB = this.valuesToExploreB(),
            ok = false;
        for (let a of valA) {
            ok = false;
            for (let b of valB) {
                if (this.func(a, b)) {
                    ok = true;
                    break;
                }
            }
            if (!ok) return false;
        }

        for (let b of valB) {
            ok = false;
            for (let a of valA) {
                if (this.func(a, b)) {
                    ok = true;
                    break;
                }
            }
            if (!ok) return false;
        }

        return true;
    }
});

backtalk.UnaryConstraint.subclass('backtalk.FunctionUnaryConstraint', {
    enforceArcConsistency: function() {
        this.variable.filterToSelect(function (v) {
            return this.func(v);
        }.bind(this));
    },
    isConsistent: function() {
        for (let v of this.valuesToExplore()) {
            if (!this.func(v)) {
                return false;
            }
        }
        return true;
    },
    initialize: function($super, v, func) {
        $super(v);
        this.func = func;
    }
});

}) // end of module
