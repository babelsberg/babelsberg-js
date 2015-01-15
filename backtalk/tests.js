module('users.timfelgentreff.backtalk.tests').requires('users.timfelgentreff.backtalk.backtalk', 'users.timfelgentreff.backtalk.constraints', 'lively.TestFramework').toRun(function() {

TestCase.subclass('backtalk.VariableTest', {
    setUp: function() {
        this.variable = backtalk.Variable.labelFromTo('x', 1, 3);
    },
    testConnectionBetweenValuesToExploreAndCurrentValue: function () {
	    this.variable.currentValue = 2;
	    this.variable.valuesToExplore = [];
    	this.assert(this.variable.valuesToExplore.length === 0);
    	this.assert(!this.variable.currentValue);
    }
});


TestCase.subclass('backtalk.BinaryConstraintTest', {
    setUp: function() {
        this.variable1 = backtalk.Variable.labelFromTo('v1', 1, 10);
        this.variable2 = backtalk.Variable.labelFromTo('v2', 2, 12);
        this.constraint = new backtalk.EqualityConstraint(this.variable1, this.variable2);
    },
    testDomainWipedOut: function() {
        this.assert(!this.constraint.domainWipedOut());
        this.variable1.valuesToExplore = [];
        this.assert(this.constraint.domainWipedOut());
        this.variable1.reset();
        this.variable2.valuesToExplore = [];
        this.assert(this.constraint.domainWipedOut());
    },
    testReferencesAfterVariableRemoval: function() {
        var expectedConstraints, expectedVariables, newVariable;
	    newVariable = new backtalk.Variable('x', 1, 2);
	    this.constraint.variableA = newVariable;
	    expectedConstraints = [this.constraint];
    	expectedVariables = [this.variable2, newVariable];
	    this.assert(this.variable1.constraints.length === 0);
    	this.assert(this.variable2.constraints.equals(expectedConstraints));
    	this.assert(this.constraint.variables().intersect(expectedVariables).length === expectedVariables.length);
    }
});
backtalk.BinaryConstraintTest.subclass('backtalk.CSPTest', {
    setUp: function($super) {
        $super();
        this.variable3 = backtalk.Variable.labelFromTo('v3', 5, 8);
        this.variable4 = backtalk.Variable.labelFromTo('v4', 3, 6);
        this.constraint2 = new backtalk.EqualityConstraint(this.variable3, this.variable4);
        this.csp = backtalk.CSP.labelVariables('cspTest', [this.variable1, this.variable2]);
    },
});

backtalk.CSPTest.subclass('backtalk.SolverTest', {
    setUp: function($super) {
        $super();
        this.csp.addVariable(this.variable3);
    	this.csp.addVariable(this.variable4);
    	this.solver = new backtalk.SolverForTest(this.csp)
    	this.solver.reset();
    },
    testAllSolutionsOnATrivialCSP: function() {
	    var expectedSolution,solutions;
    	this.variable1.domain = [3]
    	this.variable2.domain = [3]
    	this.variable3.domain = [6]
    	this.variable4.domain = [6]
    	solutions = this.solver.allSolutions();
    	this.assert(solutions.length === 1)
    	this.assert(solutions[0].keys.equals([this.variable1, this.variable2, this.variable3, this.variable4]));
    	this.assert(solutions[0][this.variable1.uuid] === 3)
    	this.assert(solutions[0][this.variable2.uuid] === 3)
    	this.assert(solutions[0][this.variable3.uuid] === 6)
    	this.assert(solutions[0][this.variable4.uuid] === 6)
    },
    testAllSolutions: function() {
        var solutions, v1, v2, v3, v4;
        solutions = this.solver.allSolutions();
        this.assert(this.solver.explorationFinished());
        this.assert(solutions.uniq().length === 18)
        solutions.each(function (s) {
            v1 = s[this.variable1.uuid]
            v2 = s[this.variable2.uuid]
            this.assert(v1 == v2)
            v3 = s[this.variable3.uuid]
            v4 = s[this.variable4.uuid]
            this.assert(v3 == v4)
        }.bind(this));
    }
});

backtalk.Solver.subclass('backtalk.SolverForTest', {
    propagateInstantiationFor: function(constraint) {
	    return constraint.enforceArcConsistency();
    }
});

}) // end of module
