module('users.timfelgentreff.experimental.experimental_test').requires('lively.TestFramework').toRun(function() {

TestCase.subclass('users.timfelgentreff.experimental.experimental_test.AssertTest', {
	assertWithError: function(ErrorType, func, msg) {
		var errorThrown = false;
		try {
			func();
		} catch(e) {
			if(e instanceof ErrorType) {
				errorThrown = true;
			} else {
				throw e;
			}
		}
		this.assert(errorThrown, msg);
	},
    testAssertSolver: function() {
    	var pt = {x: 1, y: 2};
    	
    	bbb.assert({
			message: "expected error",
    		ctx: {
    			pt: pt
    		}
    	}, function() {
    		[pt.x, pt.y];
    		pt.x.toFulfill(function() {
    			return pt.y > pt.x;
    		});
    	});
		this.assert(pt.x === 1, "constraint construction modified variable, pt.x: " + pt.x);
		this.assert(pt.y === 2, "constraint construction modified variable, pt.y: " + pt.y);

		// valid assignment
		pt.x = 0;
		this.assert(pt.x === 0, "assignment did not work, pt.x: " + pt.x);
		this.assert(pt.y === 2, "modified unassigned variable, pt.y: " + pt.y);
		
		// invalid assignment
		this.assertWithError(
			ContinuousAssertError,
			function() { pt.y = -1; },
			"no ContinuousAssertError was thrown"
		);
    },
	testFailOnConstraintConstruction: function() {
    	var pt = {x: 1, y: 2};
    	
		this.assertWithError(
			ContinuousAssertError,
			function() {
				bbb.assert({
					message: "expected error",
					ctx: {
						pt: pt
					}
				}, function() {
					[pt.x, pt.y];
					pt.x.toFulfill(function() {
						return pt.x === pt.y;
					});
				});
			},
			"no ContinuousAssertError was thrown"
		);
		this.assert(pt.x === 1, "assertion construction modified variable, pt.x: " + pt.x);
		this.assert(pt.y === 2, "assertion construction modified variable, pt.y: " + pt.y);

		pt.x = 0;
		this.assert(pt.x === 0, "assignment did not work, pt.x: " + pt.x);
		this.assert(pt.y === 2, "modified unassigned variable, pt.y: " + pt.y);
    },
	testComplexObject: function() {
		this.assert(true);
    },
	testInvalidAssignmentRevertsValue: function() {
    	var pt = {x: 1, y: 2};
    	
    	bbb.assert({
			message: "expected error",
    		ctx: {
    			pt: pt
    		}
    	}, function() {
    		[pt.x, pt.y];
    		pt.x.toFulfill(function() {
    			return pt.y > pt.x;
    		});
    	});

		this.assertWithError(
			ContinuousAssertError,
			function() { pt.y = -1; },
			"no ContinuousAssertError was thrown"
		);
		this.assert(pt.x === 1, "another variable was modified, pt.x: " + pt.x);
		this.assert(pt.y === 2, "assignment to variable not reverted, pt.y: " + pt.y);
   },
	testMultipleAssertionsOnSameObject: function() {
		this.assert(true);
    },
	testIntegrationWithOtherSolvers: function() {
		this.assert(true);
	}
});

}); // end of module
