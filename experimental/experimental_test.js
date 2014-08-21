module('users.timfelgentreff.experimental.experimental_test').requires('lively.TestFramework').toRun(function() {

TestCase.subclass('users.timfelgentreff.experimental.experimental_test.AssertTest', {
	setUp: function() {
		Point = function(x, y) {
			this.x = x;
			this.y = y;
		};
		Point.prototype.distance = function(ext) {
			var distX = ext.x - this.x;
			var distY = ext.y - this.y;
			return Math.sqrt(distX * distX + distY * distY);
		};
		Point.prototype.extent = function(ext) {
			return new Rectangle(this.x, this.y, ext.x, ext.y);
		};
		Point.prototype.leq = function(other) {
			return this.x <= other.x && this.y <= other.y;
		}
		Point.prototype.add = function(other) {
			var x = this.x + other.x;
			var y = this.y + other.y;
			return new Point(x, y);
		};
		
		Rectangle = function(left, bottom, width, height) {
			this.origin = new Point(left, bottom);
			this.extent = new Point(width, height);
		};
		Rectangle.prototype.contains = function(point) {
			var upperRightCorner = this.origin.add(this.extent);
			return this.origin.leq(point) &&
				point.leq(upperRightCorner);
		};
		
		this.Point = Point;
		this.Rectangle = Rectangle;
	},
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
	testComplexFunction: function() {
		var pt1 = new this.Point(2,3);
		var pt2 = new this.Point(5,7);
		this.assert(pt1.distance(pt2) === 5, "distance not correct, distance: " + pt1.distance(pt2));
		
		bbb.assert({
			message: "distance to pt2 point is not 5",
			ctx: {
				pt1: pt1,
				pt2: pt2
			}
		}, function() {
			[pt1.distance(pt2) === 5];
			pt1.x.toFulfill(function() {
				return pt1.distance(pt2) === 5;
			});
		});
		
		// valid assignment
		pt2.x = -1;
		this.assert(pt2.x === -1, "assignment did not work, pt2.x: " + pt2.x);
		this.assert(pt2.y === 7, "modified unassigned variable, pt2.y: " + pt2.y);
		
		// invalid assignment
		this.assertWithError(
			ContinuousAssertError,
			function() {
				pt2.x = 3;
			},
			"no ContinuousAssertError was thrown"
		);
	},
	testComplexObject: function() {
		var pt = new this.Point(4,4);
		var rect = new this.Rectangle(0, 0, 5, 5);

		this.assert(rect.contains(pt), "pt not contained by rectangle");
		
		bbb.assert({
			message: "rect does not include pt",
			ctx: {
				rect: rect,
				pt: pt
			}
		}, function() {
			rect.contains(pt);
			pt.x.toFulfill(function() {
				return rect.contains(pt);
			});
		});
		
		this.assertWithError(
			ContinuousAssertError,
			function() {
				rect.origin = new this.Point(3,4.5);
			},
			"no ContinuousAssertError was thrown (1)"
		);
		this.assertWithError(
			ContinuousAssertError,
			function() {
				rect.origin.x = 4.5;
			},
			"no ContinuousAssertError was thrown (2)"
		);
		
		rect.origin = new this.Point(3,3);
		this.assertWithError(
			ContinuousAssertError,
			function() {
				rect.origin.x = 4.5;
			},
			"newly assigned point was not re-constrained"
		);
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
	// TODO
	testMultipleAssertionsOnSameObject: function() {
		this.assert(true);
    },
	// TODO
	testIntegrationWithOtherSolvers: function() {
		this.assert(true);
	}
});

}); // end of module
