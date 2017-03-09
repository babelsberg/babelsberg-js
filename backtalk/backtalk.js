module('users.timfelgentreff.backtalk.backtalk').requires().toRun(function() {

Object.subclass('backtalk.Object', {
    get uuid() {
        return this._uuid || (this._uuid = Strings.newUUID());
    }
});

backtalk.Object.subclass('backtalk.Variable', {
    addConstraint: function (cnstr) {
        if (this.constraints.indexOf(cnstr) !== -1) return;
        this.constraints.push(cnstr);
    },
    removeConstraint: function (cnstr) {
        this.constraints.remove(cnstr);
    },
    nextValue: function () {
        if (this.currentValue) {
            this.valuesToExplore.delete(this.currentValue);
        } else if (this._firstValueToExplore) {
            this.currentValue = this._firstValueToExplore;
            this._firstValueToExplore = undefined;
            return this.currentValue;
        }
        for (let value of this.valuesToExplore) {
            this.currentValue = value;
            return value;
        }
    },
    resetCurrentValue: function () {
        this.currentValue = undefined;
    },
    domainWipedOut: function () {
        return this.valuesToExplore.size === 0;
    },
    isInstantiated: function () {
        return this.currentValue !== undefined && this.currentValue !== null && this.valuesToExplore.has(this.currentValue);
    },
    filterToReject: function (filter) {
        for (let value of this.valuesToExplore) {
            if (filter(value)) {
                this.valuesToExplore.delete(value);
            }
        }
    },
    filterToSelect: function (filter) {
        for (let value of this.valuesToExplore) {
            if (!filter(value)) {
                this.valuesToExplore.delete(value);
            }
        }
    },
    get valuesToExplore() {
        return this._valuesToExplore;
    },
    set valuesToExplore(set) {
        this._valuesToExplore = new Set(set);
        if (this._valuesToExplore.size === 0) {
            this.resetCurrentValue();
        }
    },
    initialize: function() {
        this.constraints = [];
        this.valuesToExplore = [];
        this.resetCurrentValue();
    },
    reset: function(no_stays) {
        var current = this.currentValue;
        this.resetCurrentValue();
        this.valuesToExplore = this.domain;
        if (!no_stays && this.domain.has(current)) {
            this._firstValueToExplore = current;
        }
    },
    get domain() {
        return this._domain;
    },
    set domain(d) {
        this._domain = new Set(d);
        this.valuesToExplore = d;
    }
});

Object.extend(backtalk.Variable, {
    labelDomain: function (l, d) {
        var v = new backtalk.Variable();
        v.label = l;
        v.domain = d;
        return v;
    },
    labelFromTo: function (l, lower, upper) {
        var v = new backtalk.Variable();
        v.label = l;
        v.domain = Array.range(lower, upper);
        return v;
    }
});

backtalk.Object.subclass('backtalk.Solver', {
    allSolutions: function() {
        this.reset();
        var allSolutions = [];
        while (!this.explorationFinished()) {
            this.exploreCspStep();
            if (this.solutionFound()) {
                var solution = this.solution();
                if (allSolutions.indexOf(solution) === -1) {
                    allSolutions.push(solution);
                }
                this.stepBackward();
            }
        }
        return allSolutions.uniq();
    },
    chooseAPreviousContext: function() {
        return this.contexts.last();
    },
    chooseAVariable: function() {
        if (this.backTrackFlag) {
            return this.currentVariable;
        } else {
            for (let v of this.variables()) {
                if (!v.isInstantiated()) {
                    return v;
                }
            };
            return undefined;
        }
    },
    chooseVariableAndValue: function() {
        this.currentVariable = this.chooseAVariable();
        this.currentVariable.nextValue();
    },
    exploreCspStep: function() {
        while (!this.domainWipedOut()) {
            this.stepForward();
            if (this.solutionFound()) {
                return this;
            }
        }
        this.stepBackward();
        return undefined;
    },
    firstSolution: function(no_stays) {
        this.reset(no_stays);
        var t0 = performance.now(),
            timeout = this.timeout / 2;
        while (!(this.solutionFound() || this.explorationFinished())) {
            this.exploreCspStep();
            if (timeout && (performance.now() - t0) > timeout) {
                if (no_stays) {
                    throw "Couldn't find a solution within the timeout";
                }
                console.log("PANIC: We're taking too much time, forget the stays");
                return this.firstSolution(true);
            }
        }
        return this.solution();
    },
    propagateInstantiationFor: function(constraint) {
        return constraint.filter();
    },
    propagateInstantiationOfCurrentVariable: function() {
        if (this.currentVariable.currentValue) {
            this.currentVariable.valuesToExplore = [this.currentVariable.currentValue];
        }
        var sortedConstraints = this.sortedConstraintsForPropagation();
        for (let constraint of sortedConstraints) {
            this.propagateInstantiationFor(constraint);
            if (constraint.domainWipedOut()) {
                return;
            }
        };
    },
    sortedConstraintsForPropagation: function() {
        return this.currentVariable.constraints;
    },
    stepBackward: function() {
        if (this.contexts.length === 0) {
            return this;
        } else {
            var ctx = this.chooseAPreviousContext();
            this.restoreContext(ctx);
            this.backTrackFlag = true;
            return undefined;
        }
    },
    stepForward: function() {
        this.chooseVariableAndValue();
        this.saveContext();
        this.propagateInstantiationOfCurrentVariable();
        this.backTrackFlag = false;
    },
    set currentVariable(v) {
        this._currentVariable = v;
        if (!this.firstChosenVariable) {
            this.firstChosenVariable = v;
        }
    },
    get currentVariable() {
        return this._currentVariable;
    },
    solution: function() {
        if (!this.solutionFound()) {
            return undefined;
        } else {
            var solution = {keys: []};
            this.variables().forEach(function (v) {
                solution[v.uuid] = v.currentValue;
                solution.keys.push(v);
            });
            return solution;
        }
    },
    variables: function() {
        return this.csp.variables;
    },
    domainWipedOut: function() {
        if (this.currentVariable &&
            this.backTrackFlag &&
            this.currentVariable.valuesToExplore.size === 0) {
            return true;
        } else {
            for (let v of this.variables()) {
                if (v.domainWipedOut()) {
                    return true;
                }
            }
            return false;
        }
    },
    explorationFinished: function() {
        if (!this.firstChosenVariable) {
            for (let v of this.variables()) {
                if (v.domain.size === 0) {
                    return true;
                }
            }
            return false;
        } else {
            return (this.firstChosenVariable === this.currentVariable &&
                    this.firstChosenVariable.valuesToExplore.size === 0);
        }
    },
    solutionFound: function() {
        for (let v of this.variables()) {
            if (!v.isInstantiated()) {
                return false;
            }
        }
        var constraints = this.csp.constraints();
        for (let c of constraints) {
            if (!c.isSatisfied()) {
                return false;
            }
        }
        return true;
    },
    initialize: function(csp, timeout) {
        this.csp = csp;
        this.timeout = timeout || 0;
        this.reset();
    },
    reset: function(no_stays) {
        this.csp && this.csp.reset(no_stays);
        this.contexts = [];
        this.currentVariable = undefined;
        this.firstChosenVariable = undefined;
        this.backTrackFlag = false;
    },
    restoreContext: function(ctx) {
        this.contexts.remove(ctx);
        ctx.restoreInSolver(this);
    },
    saveContext: function() {
        this.contexts.push(new backtalk.Context(this));
    }
});

Object.extend(backtalk.Solver, {
    on: function (csp) {
        var solver = new backtalk.Solver();
        solver.csp = csp;
        return solver;
    }
});

backtalk.Object.subclass('backtalk.Context', {
    initialize: function(solver) {
        if (solver) {
            this.fromSolver(solver);
        }
    },
    currentValueFor: function(v) {
        return this.currentValuesDict[v.uuid];
    },
    fromSolver: function(solver) {
        this.valuesToExploreDict = {keys: []};
        this.currentValuesDict = {keys: []};
        solver.variables().forEach(function (v) {
            this.valuesToExploreDict[v.uuid] = new Set(v.valuesToExplore);
            this.valuesToExploreDict.keys.push(v);
            if (v.isInstantiated()) {
                this.currentValuesDict[v.uuid] = v.currentValue;
                this.currentValuesDict.keys.push(v);
            }
        }.bind(this));
        this.currentVariable = solver.currentVariable;
    },
    restoreInSolver: function(solver) {
        this.valuesToExploreDict.keys.forEach(function (v) {
            v.valuesToExplore = this.valuesToExploreDict[v.uuid];
        }.bind(this));
        this.currentValuesDict.keys.forEach(function (v) {
            v.currentValue = this.currentValuesDict[v.uuid];
        }.bind(this));
        solver.currentVariable = this.currentVariable;
    },
    valuesToExploreFor: function(v) {
        return this.valuesToExploreDict[v.uuid];
    }
});

Object.extend(backtalk.Context, {
    fromSolver: function (solver) {
        return new backtalk.Context(solver);
    }
});

backtalk.Object.subclass('backtalk.Constraint', {
    domainWipedOut: function() {
        for (let v of this.variables()) {
            if (v.domainWipedOut()) return true;
        }
        return false;
    },
    isInstantiated: function() {
        for (let v of this.variables()) {
            if (!v.isInstantiated()) return false;
        }
        return true;
    },
    filter: function() {
        this.enforceArcConsistency();
    },
    isNotConsistent: function() {
        return !this.isConsistent();
    },
    isSatisfied: function() {
        return this.isInstantiated() && this.isConsistent();
    }
});

backtalk.Constraint.subclass('backtalk.UnaryConstraint', {
    initialize: function(v) {
        this.variable = v;
    },
    valuesToExplore: function() {
        return this.variable.valuesToExplore;
    },
    get variable() {
        return this._variable;
    },
    set variable(v) {
        if (this._variable) {
            this._variable.removeConstraint(this);
        }
        this._variable = v;
        if (v) v.addConstraint(this);
    },
    variables: function() {
        return [this.variable];
    }
});


backtalk.Constraint.subclass('backtalk.BinaryConstraint', {
    initialize: function(a, b) {
        this.variableA = a;
        this.variableB = b;
    },
    valuesToExploreA: function() {
        return this.variableA.valuesToExplore;
    },
    valuesToExploreB: function() {
        return this.variableB.valuesToExplore;
    },
    get variableA() {
        return this._variableA;
    },
    set variableA(v) {
        if (this._variableA) {
            this._variableA.removeConstraint(this);
        }
        this._variableA = v;
        v.addConstraint(this);
    },
    get variableB() {
        return this._variableB;
    },
    set variableB(v) {
        if (this._variableB) {
            this._variableB.removeConstraint(this);
        }
        this._variableB = v;
        if (v) v.addConstraint(this);
    },
    variables: function() {
        if (this.variableA === this.variableB) {
            return [this.variableA];
        } else {
            return [this.variableA, this.variableB];
        }
    }
});

backtalk.Object.subclass('backtalk.CSP', {
    initialize: function() {
        this.variables = new Set();
    },
    addVariable: function(v) {
        this.variables.add(v);
    },
    constraints: function() {
        var s = new Set();
        for (let v of this.variables) {
            for (let c of v.constraints) {
                s.add(c);
            }
        }
        return s;
    },
    domainWipedOut: function() {
        for (let v of this.variables) {
            if (v.domainWipedOut()) {
                return true;
            }
        }
        return false;
    },
    instantiatedConstraints: function() {
        var cs = [];
        for (let c of this.constraints()) {
            if (c.isInstantiated()) {
                cs.push(c);
            }
        }
        return cs;
    },
    removeVariable: function(v) {
        this.variables.delete(v);
    },
    reset: function(no_stays) {
        for (let v of this.variables) {
            v.reset(no_stays);
        }
    }
});
Object.extend(backtalk.CSP, {
    labelVariables: function (l, v) {
        var csp = new backtalk.CSP();
        csp.label = l;
        csp.variables = v;
        return csp;
    }
});
}); // end of module
