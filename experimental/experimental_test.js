module('users.timfelgentreff.experimental.experimental_test').requires('lively.TestFramework').toRun(function() {

TestCase.subclass('users.timfelgentreff.experimental.experimental_test.AssertTest', {
    testAssertSolver: function() {
    	var pt = {x: 1, y: 2};
    	
		console.log("CONSTRAINT CONSTRUCTION");
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

		console.log("CORRECT ASSIGNMENT");
		pt.x = 0;
		
    	console.log("INVALID ASSIGNMENT");
    	pt.y = -1;
    	console.log(pt.y);
    }
});

}); // end of module
