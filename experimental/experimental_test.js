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
	testMultipleAssertionsOnSameObject: function() {
    	var pt = {x: 1, y: 2};
    	
    	bbb.assert({
			message: "x-coordinate is not positive",
    		ctx: {
    			pt: pt
    		}
    	}, function() {
    		[pt.x];
    		pt.x.toFulfill(function() {
    			return pt.x >= 0;
    		});
    	});
    	bbb.assert({
			message: "x-coordinate is greater then 10",
    		ctx: {
    			pt: pt
    		}
    	}, function() {
    		[pt.x];
    		pt.x.toFulfill(function() {
    			return pt.x <= 10;
    		});
    	});
		this.assert(pt.x === 1, "constraint construction modified variable, pt.x: " + pt.x);
		
		// valid assignment
		pt.x = 7;
		this.assert(pt.x === 7, "assignment did not work, pt.x: " + pt.x);
		
		// invalid assignment with respect to first assertion
		this.assertWithError(
			ContinuousAssertError,
			function() { pt.x = -1; },
			"no ContinuousAssertError was thrown"
		);
		this.assert(pt.x === 7, "assignment to variable not reverted, pt.x: " + pt.x);
		
		// invalid assignment with respect to second assertion
		this.assertWithError(
			ContinuousAssertError,
			function() { pt.x = 11; },
			"no ContinuousAssertError was thrown"
		);
		this.assert(pt.x === 7, "assignment to variable not reverted, pt.x: " + pt.x);
    },
	// TODO
	testIntegrationWithOtherSolvers: function() {
		this.assert(true);
	}
});

TestCase.subclass('users.timfelgentreff.experimental.experimental_test.TriggerTest', {
	setUp: function() {
		var Player = function(hp) {
			this.alive = true;
			this.hp = hp;
		};
		Player.prototype.die = function() {
			this.alive = false;
		};

		this.Player = Player;
	},
    testTriggerSolver: function() {
    	var p = new this.Player(2);
    	
    	bbb.trigger({
			callback: p.die.bind(p),
    		ctx: {
    			p: p
    		}
    	}, function() {
    		[p.hp];
    		p.hp.toFulfill(function() {
    			return p.hp <=  0;
    		});
    	});
		this.assert(p.hp === 2, "constraint construction modified variable, p.hp: " + p.hp);
		this.assert(p.alive === true, "constraint construction modified variable, p.alive: " + p.alive);

		// valid assignment
		p.hp--;
		this.assert(p.hp === 1, "assignment did not work, p.hp: " + p.hp);
		this.assert(p.alive === true, "modified unassigned variable, p.alive: " + p.alive);

		// triggering assignment
		p.hp--;
		this.assert(p.hp === 0, "assignment did not work, p.hp: " + p.hp);
		this.assert(p.alive === false, "desired callback was not triggered");
	},
    testRecursiveTriggering: function() {
		var Domino = function(id, next) {
			this.id = id;
			this.next = next;
			this.standing = true;
		};
		Domino.prototype.pushNext = function() {
			if(this.next instanceof Domino) {
				this.next.push();
			}
		};
		Domino.prototype.push = function() {
			this.standing = false;
		};
		
		var domino3 = new Domino(3),
			domino2 = new Domino(2, domino3),
			domino1 = new Domino(1, domino2);
    	
    	bbb.trigger({
			callback: domino1.pushNext.bind(domino1),
    		ctx: {
    			domino1: domino1
    		}
    	}, function() {
    		[domino1.standing];
    		domino1.standing.toFulfill(function() {
    			return !domino1.standing;
    		});
    	});
    	bbb.trigger({
			callback: domino2.pushNext.bind(domino2),
    		ctx: {
    			domino2: domino2
    		}
    	}, function() {
    		[domino2.standing];
    		domino2.standing.toFulfill(function() {
    			return !domino2.standing;
    		});
    	});
    	bbb.trigger({
			callback: domino3.pushNext.bind(domino3),
    		ctx: {
    			domino3: domino3
    		}
    	}, function() {
    		[domino3.standing];
    		domino3.standing.toFulfill(function() {
    			return !domino3.standing;
    		});
    	});
		
		domino1.push();
		this.assert(!domino1.standing, "domino1 still stands");
		this.assert(!domino2.standing, "domino2 still stands");
		this.assert(!domino3.standing, "domino3 still stands");
	},
	// TODO
    testInteractingWithAssertions: function() {
	},
    testImmediateTrigger: function() {
    	var p = new this.Player(-5);
    	
    	bbb.trigger({
			callback: p.die.bind(p),
    		ctx: {
    			p: p
    		}
    	}, function() {
    		[p.hp];
    		p.hp.toFulfill(function() {
    			return p.hp <=  0;
    		});
    	});
		this.assert(p.hp === -5, "assignment did not work, p.hp: " + p.hp);
		this.assert(p.alive === false, "desired callback was not triggered");
	}
});

}); // end of module
