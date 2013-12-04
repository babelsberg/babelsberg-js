module('users.timfelgentreff.babelsberg.tests').requires('lively.TestFramework', 'users.timfelgentreff.babelsberg.constraintinterpreter').toRun(function() {

TestCase.subclass('users.timfelgentreff.babelsberg.tests.ConstraintTest', {
    testSimple: function () {
        ClSimplexSolver.resetInstance();
        var obj = {a: 2, b: 3};
        (function () {
            return obj.a + obj.b == 3;
        }).shouldBeTrue({obj: obj});
        this.assert(obj.a + obj.b == 3, "Solver failed")
    },

    testInequality: function() {
        var obj = {a: 8};
        (function () {
            return obj.a >= 100
        }).shouldBeTrue({obj: obj});
        this.assert(obj.a == 100);
        obj.a = 110;
        this.assert(obj.a == 110);
    },

    testSimplePath: function () {
        ClSimplexSolver.resetInstance();
        var pointA = pt(1,2),
            pointB = pt(2,3),
            o = {a: pointA, b: pointB};
        (function () {
            return o.a.x + 100 <= o.b.x;
        }).shouldBeTrue({o: o});
        this.assert(pointA.x + 100 <= pointB.x, "Solver failed")
    },
    testSimplePathInvalidation: function () {
        ClSimplexSolver.resetInstance();
        var pointA = pt(1,2),
            pointB = pt(2,3),
            o = {a: pointA, b: pointB};
        (function () {
            return o.a.x + 100 <= o.b.x;
        }).shouldBeTrue({o: o});
        this.assert(pointA.x + 100 <= pointB.x, "Solver failed");
        pointA = pt(12, 12);
        o.a = pointA;
        this.assert(pointA.x + 100 <= pointB.x, "Recalculating Path failed");
    },

    testTemperatureExample: function() {
        ClSimplexSolver.resetInstance();

        var obj = {fahrenheit: 212, centigrade: 100};

        (function () {
            return obj.fahrenheit - 32 == obj.centigrade * 1.8;
        }).shouldBeTrue({obj: obj});

        this.assert(CL.approx(obj.fahrenheit - 32, obj.centigrade * 1.8));
        obj.fahrenheit = 100;
        this.assert(CL.approx(obj.fahrenheit - 32, obj.centigrade * 1.8));
        obj.centigrade = 121;
        this.assert(CL.approx(obj.fahrenheit - 32, obj.centigrade * 1.8));
    },
    testUndefinedVariables: function() {
        var obj = {};
        bbb.always({
            solver: ClSimplexSolver.getInstance(),
            ctx: {obj: obj}
        }, function () {
            return obj.a + obj.b == obj.c;
        })
    },

    testRecalculateForTextInput: function() {
        var obj = {
                txt: new lively.morphic.Text(),
                a: 10
            };
        obj.txt.setTextString("5");

        (function () {
            return obj.a == obj.txt.getTextString();
        }).shouldBeTrue({obj: obj});
        this.assert(obj.a == obj.txt.getTextString());
        
        obj.txt.setTextString("15");
        this.assert(obj.a == obj.txt.getTextString());
        this.assert(obj.a === 15)
    },

    testSimpleAssign: function () {
        ClSimplexSolver.resetInstance();
        var obj = {a: 2, b: 3};
        (function () {
            return obj.a + obj.b == 3;
        }).shouldBeTrue({obj: obj});
        this.assert(obj.a + obj.b == 3, "Solver failed");
        obj.a = -5;
        this.assert(obj.a + obj.b == 3, "Constraint violated after assignment");
    },

    testAssignStay: function() {
        var obj = {a: 2, b: 3};
        (function () {
            return obj.a + obj.b == 3;
        }).shouldBeTrue({obj: obj});
        this.assert(obj.a + obj.b == 3, "Solver failed");
        obj.a = -5;
        this.assert(obj.a + obj.b == 3, "Constraint violated after assignment");
        this.assert(obj.a == -5, "Assignment without effect");
    },

    testPointEquals: function() {
        var pt1 = pt(10, 10),
            pt2 = pt(20, 20);
        (function () {
            return pt1.equals(pt2);
        }).shouldBeTrue({pt1: pt1, pt2: pt2});
        this.assert(pt1.equals(pt2));
    },

    testPointAddition: function() {
        var pt1 = pt(10, 10),
            pt2 = pt(20, 20),
            pt3 = pt(0, 0);
        (function () {
            return pt1.addPt(pt2).equals(pt3);
        }).shouldBeTrue({pt1: pt1, pt2: pt2, pt3: pt3});

        this.assert(pt1.addPt(pt2).equals(pt3));
    },

    testPointAssignment: function() {
        var obj = {p: pt(10, 10)};
        (function () {
            return obj.p.x >= 100 && obj.p.y >= 100;
        }).shouldBeTrue({obj: obj});

        this.assert(pt(100, 100).leqPt(obj.p));

        obj.p.x = 150;
        this.assert(pt(100, 100).leqPt(obj.p));
        this.assert(obj.p.x === 150);

        obj.p = pt(150, 100);
        this.assert(pt(100, 100).leqPt(obj.p));
        this.assert(obj.p.x === 150, "point assignment failed to keep the new point intact");
    },

    testPointAssignmentComplex: function() {
        var obj = {p: pt(10, 10), p2: pt(20, 20)};
        (function () {
            return (obj.p.equals(obj.p2) &&
                    obj.p.x >= 100 &&
                    obj.p.y >= 100);
        }).shouldBeTrue({obj: obj});

        this.assert(pt(100, 100).leqPt(obj.p));
        this.assert(obj.p.equals(obj.p2));

        obj.p.x = 150;
        this.assert(pt(100, 100).leqPt(obj.p));
        this.assert(obj.p.x === 150);
        this.assert(obj.p.equals(obj.p2));

        obj.p = pt(150, 100);
        this.assert(obj.p.equals(obj.p2));
        this.assert(obj.p.equals(pt(150, 100)), "point assignment failed to keep the new point intact");

        obj.p2 = pt(200, 200);
        this.assert(obj.p.equals(obj.p2), "Expected " + obj.p + " to equal " + obj.p2);
        this.assert(obj.p.equals(pt(200, 200)), "Expected " + obj.p + " to equal 200@200");
    },

    testPointAssignmentComplexScaled: function() {
        var obj = {p: pt(10, 10), p2: pt(20, 20)};
        (function () {
            return (obj.p.equals(obj.p2.scaleBy(2)) &&
                    obj.p.x >= 100 &&
                    obj.p.y >= 100);
        }).shouldBeTrue({obj: obj});

        this.assert(pt(100, 100).leqPt(obj.p));
        this.assert(obj.p.equals(obj.p2.scaleBy(2)));

        obj.p.x = 150;
        this.assert(pt(100, 100).leqPt(obj.p));
        this.assert(obj.p.x === 150);
        this.assert(obj.p.equals(obj.p2.scaleBy(2)));

        obj.p = pt(150, 100);
        this.assert(obj.p.equals(obj.p2.scaleBy(2)));
        this.assert(obj.p.equals(pt(150, 100)), "point assignment failed to keep the new point intact");

        obj.p2 = pt(200, 200);
        this.assert(obj.p.equals(obj.p2.scaleBy(2)),
                    "Expected " + obj.p + " to equal " + obj.p2 + " scaled by 2");
        this.assert(obj.p2.equals(pt(200, 200)),
                    "Expected " + obj.p2 + " to equal 200@200");

        obj.p2 = pt(15, 15);
        this.assert(obj.p.equals(obj.p2.scaleBy(2)));
        this.assert(obj.p2.equals(pt(50, 50)));
    },

    testSimpleReadonly: function() {
        var obj = {
            a: 10,
            b: 0
        };
        bbb.always({
            solver: ClSimplexSolver.getInstance(),
            ctx: {
                obj: obj,
                r: bbb.readonly
            }
        }, function() {
            return r(obj.a) == obj.b;
        });
        this.assert(obj.a == 10);
        this.assert(obj.b == 10);
        
        ClSimplexSolver.resetInstance();
        var obj2 = {
            a: 10,
            b: 0
        };
        bbb.always({
            solver: ClSimplexSolver.getInstance(),
            ctx: {
                obj2: obj2,
                r: bbb.readonly
            }
        }, function() {
            return obj2.a == r(obj2.b);
        });
        this.assert(obj2.a == 0);
        this.assert(obj2.b == 0);

        ClSimplexSolver.resetInstance();
        var obj3 = {
            a: 10,
            b: 0
        };
        try {
            bbb.always({
                solver: ClSimplexSolver.getInstance(),
                ctx: {
                        obj3: obj3,
                        r: bbb.readonly
                }
            }, function() {
                    return r(obj3.a) == r(obj3.b);
            });
            this.assert(false, "this constraint should throw an exception, because both variables are readonly");
        } catch(e) {}
    },

    testItemReadonly: function() {
        var i = {
                time: 1,
                value: 2,
                sum: 0,
            },
            i2 = {
                time: 2,
                value: 3,
                sum: 0,
            },
            solver = new ClSimplexSolver();
        solver.setAutosolve(false);
        bbb.always({solver: solver, ctx: {i: i, r: bbb.readonly}}, function () {
            return i.sum >= 0;
        });
        bbb.always({solver: solver, ctx: {i: i2, r: bbb.readonly}}, function () {
            return i.sum >= 0;
        });
        
        bbb.always({solver: solver, ctx: {i: i, r: bbb.readonly}}, function () {
            if (i.prev) {
                return i.sum == r(i.value) + i.prev.sum;
            } else {
                return i.sum == r(i.value);
            }
        });
        bbb.always({solver: solver, ctx: {i: i2, r: bbb.readonly}}, function () {
            if (i.prev) {
                return i.sum == r(i.value) + i.prev.sum;
            } else {
                return i.sum == r(i.value);
            }
        });
        this.assert(i.sum == 2, "expected sum to equal 2, got " + i.sum);
        this.assert(i2.sum == 3, "expected sum to equal 3, got " + i2.sum);
        i2.prev = i;
        this.assert(i.sum == 2, "expected sum to equal 2, got " + i.sum);
        this.assert(i2.sum == 5, "expected sum to equal 5, got " + i2.sum);
        i2.prev = {sum: 100}
        this.assert(i2.sum == 103, "expected sum to equal 103, got " + i2.sum);
    },

    testConjunction: function() {
        var ctx = {a: 10, b: 100, c: 1000, d: 10000},
            constraint = (function () {
                return ctx.a == ctx.b && ctx.c == ctx.d
            }).shouldBeTrue({ctx: ctx});

        this.assert(ctx.a == ctx.b && ctx.c == ctx.d);
        // should have two primitive constraints
        this.assert(constraint.constraintobjects.length == 2);
    },

    setUp: function() {
        ClSimplexSolver.resetInstance();
    }
});

TestCase.subclass('users.timfelgentreff.babelsberg.tests.PerformanceTests', {
    Iterations: 100,
    testImperativeDragSimulation: function () {
        var mouse = {},
            mercury = {},
            thermometer = {},
            temperature = 0,
            gray = {},
            white = {},
            display = {};
        
        for (var i = 0; i < this.Iterations; i++) {
            mouse.location_y = i
            var old = mercury.top
            mercury.top = mouse.location_y
            if (mercury.top > thermometer.top) {
                mercury.top = thermometer.top
            }
            temperature = mercury.top
            if (old < mercury.top) {
                // moves upwards (draws over the white)
                gray.top = mercury.top
            } else {
                // moves downwards (draws over the gray)
                white.bottom = mercury.top
            }
            display.number = temperature
        }
    },
    setUp: function() {
        this.thermometer = lively.PartsBin.getPart("Thermometer", "users/timfelgentreff/PartsBin/");
        this.thermometer.remove();
    },

    testThermometer: function() {
        var c = this.thermometer.get("Celsius");
        for(var i = 0; i < 100; i++) {
            try {
                c.value = (i % 30) / 100.0;
            } catch(e) {} // ignore
        }
    },
    testMidpointEdit: function() {
        var cassowary = new ClSimplexSolver(),
            deltablue = new DBPlanner();
        cassowary.setAutosolve(false);
        hand = $world.firstHand();
        
        pos = hand.getPosition().addPt(pt(200, 0));
        start = $part('Rectangle', 'PartsBin/Basic').openInWorld(pos);
        end = $part('Rectangle', 'PartsBin/Basic').openInWorld(pos.addXY(100,100));
        [start,end].invoke('applyStyle', {extent: pt(10,10)});
        midP = $part('Ellipse', 'PartsBin/Basic').openInWorld(pos);
        midP.setExtent(pt(20,20));
        
        // ugly: we need a script to force render refresh
        midP.addScript(function update() {
            this.setPosition(this.getPosition());
            start.setPosition(start.getPosition());
        });
        midP.startStepping(100, 'update') // this can be solved with an additional DeltaBlue constraint
                                          // see the C/F converter label update for code -- Tim
        
        // constraint
        (function () {
            var center = start.getPosition().addPt(end.getPosition()).scaleBy(0.5);
            return midP.getPosition().eqPt(center);
        }).shouldBeTrue({midP: midP, start: start, end: end});
        
        // start editing.
        // first argument is the object to be edited, the second a list of accessors or fields
        // note that in the JavaScript implementation, the accessor methods have to return a single value
        // the Ruby version does not have this limitation (so we could write
        //      bbb.edit(start, ["getPosition"])
        // ), but I haven't ported that, yet.
        editCallback = bbb.edit(start.getPosition(), ["x", "y"]);
        this.onMouseMove = function (evt) {
            editCallback(evt.getPosition().addPt(pt(20, 20)));
        }
        
        // end edit by calling callback without values
        editCallback();
        editCallback = null;
        
        // cleanup
        this.onMouseMove = function (evt) {};
        [start,end,midP].invoke('remove');
        start = end = midP = hand = null;
    },


    
    testDeclarativeDragSimulation: function () {
        var ctx = {
                mouse: {location_y: 0},
                mercury: {top: 0, bottom: 0},
                thermometer: {top: 0, bottom: 0},
                temperature: {c: 0},
                gray: {top: 0, bottom: 0},
                white: {top: 0, bottom: 0},
                display: {number: 0}},
            solver = new ClSimplexSolver();
        solver.setAutosolve(false);
        
        bbb.always({solver: solver, ctx: ctx}, function () { return temperature.c == mercury.top });
        bbb.always({solver: solver, ctx: ctx}, function () { return white.top == thermometer.top });
        bbb.always({solver: solver, ctx: ctx}, function () { return white.bottom == mercury.top });
        bbb.always({solver: solver, ctx: ctx}, function () { return gray.top == mercury.top });
        bbb.always({solver: solver, ctx: ctx}, function () { return gray.bottom == mercury.bottom });
        bbb.always({solver: solver, ctx: ctx}, function () { return display.number == temperature.c });
        bbb.always({solver: solver, ctx: ctx}, function () { return mercury.top == mouse.location_y });
        bbb.always({solver: solver, ctx: ctx}, function () { return mercury.top <= thermometer.top });
        bbb.always({solver: solver, ctx: ctx}, function () { return mercury.bottom == thermometer.bottom });

        for (var i = 0; i < this.Iterations; i++) {
            ctx.mouse.location_y = i
        }
    },
    
    testEditDragSimulation: function () {
        var ctx = {
                mouse: {location_y: 0},
                mercury: {top: 0, bottom: 0},
                thermometer: {top: 0, bottom: 0},
                temperature: {c: 0},
                gray: {top: 0, bottom: 0},
                white: {top: 0, bottom: 0},
                display: {number: 0}};
        ClSimplexSolver.resetInstance();
        var solver = ClSimplexSolver.getInstance();
        
        bbb.always({solver: solver, ctx: ctx}, function () { return temperature.c == mercury.top });
        bbb.always({solver: solver, ctx: ctx}, function () { return white.top == thermometer.top });
        bbb.always({solver: solver, ctx: ctx}, function () { return white.bottom == mercury.top });
        bbb.always({solver: solver, ctx: ctx}, function () { return gray.top == mercury.top });
        bbb.always({solver: solver, ctx: ctx}, function () { return gray.bottom == mercury.bottom });
        bbb.always({solver: solver, ctx: ctx}, function () { return display.number == temperature.c });
        bbb.always({solver: solver, ctx: ctx}, function () { return mercury.top == mouse.location_y });
        bbb.always({solver: solver, ctx: ctx}, function () { return mercury.top <= thermometer.top });
        bbb.always({solver: solver, ctx: ctx}, function () { return mercury.bottom == thermometer.bottom });

        var cb = bbb.edit(ctx.mouse, ["location_y"]);
        for (var i = 0; i < this.Iterations; i++) {
            cb(i);
        }
        // cb();
    },
});


TestCase.subclass('users.timfelgentreff.babelsberg.tests.PropagationTest', {
    testSimplePropagation: function() {
        var o = {string: "0",
                 number: 0};

        (function () {
            return o.string == o.number + "";
        }).shouldBeSatisfiedWith(function () {
            o.string.formula([o.number], function (num) { return num + "" });
            o.number.formula([o.string], function (str) { return parseInt(str) });
        }, {o: o});

        this.assert(o.string === o.number + "");
        o.string = "1"
        this.assert(o.number === 1);
        o.number = 12
        this.assert(o.string === "12");
    },
    testBoolPropagation: function () {
        var o = {a: true,
                 b: 10};

        (function () {
            return o.a == (o.b > 15)
        }).shouldBeSatisfiedWith(function () {
            o.a.formula([o.b], function (b, a) { return b > 15 });
            o.b.formula([o.a], function (a, b) { return a ? 16 : 15 });
        }, {o: o});

        this.assert(!o.a, "deltablue changed a");
        o.b = 20;
        this.assert(o.a, "deltablue changed a");
        o.a = false;
        this.assert(o.b === 15, "deltablue changed b");
        o.b = 20;
        this.assert(o.a, "deltablue changed a");
        o.a = true;
        this.assert(o.b === 20, "deltablue didn't change b, because the predicate was satisfied");
    },

    testArithmetic: function() {
        var o = {x: 0, y: 0, z: 0};

        (function () {
            return o.x + o.y == o.z;
        }).shouldBeSatisfiedWith(function () {
            o.x.formula([o.y, o.z], function (y, z) { debugger; return z - y });
            o.y.formula([o.x, o.z], function (x, z) { debugger; return z - x });
            o.z.formula([o.x, o.y], function (x, y) { debugger; return x + y });
        }, {o: o});

        this.assert(o.x + o.y == o.z);
        o.x = 10;
        this.assert(o.x == 10);
        this.assert(o.x + o.y == o.z);
        o.y = 15;
        this.assert(o.y == 15);
        this.assert(o.x + o.y == o.z);
        o.z = 100;
        this.assert(o.z == 100);
        this.assert(o.x + o.y == o.z);
    },

    testDeltaBlueUserFunction: function() {
        var planner = new DBPlanner(),
            string = new DBVariable("string", "0", planner),
            number = new DBVariable("number", 0, planner);

        var constraint = new UserDBConstraint(function (c) {
            c.formula(string, [number], function (num) { return num + ""; });
            c.formula(number, [string], function (str) { return parseInt(str); });
        }, planner);
        constraint.addDBConstraint();

        number.assignValue(10);
        this.assert(number.value === 10, "new value should stick");
        this.assert(string.value === "10", "new value should propagate");

        string.assignValue("12");
        this.assert(number.value === 12, "new value should propagate");
        this.assert(string.value === "12", "new value should stick");
    },
    setUp: function() {
        DBPlanner.resetInstance()
    }


});
TestCase.subclass('users.timfelgentreff.babelsberg.tests.InteractionTest', {
    testInteractionAssignment: function () {
        var o = {a: true,
                 b: 10};

        (function () { return o.b >= 11 }).shouldBeTrue({o: o});
        this.assert(o.a, "a unchanged");
        this.assert(o.b === 11, "b fixed");

        (function () {
            return o.a == (o.b > 15)
        }).shouldBeSatisfiedWith(function () {
            o.a.formula([o.b], function (b, a) { return b > 15 });
            o.b.formula([o.a], function (a, b) { return a ? 16 : 15 });
        }, {o: o});
        this.assert(!o.a, "deltablue is downstream from cassowary and has to change a");
        this.assert(o.b === 11, "deltablue is downstream from cassowary and has to change a");

        o.b = 20;
        this.assert(o.a, "deltablue changed a");
        this.assert(o.b === 20, "cassowary updated this");
    },
    testInteractionAssignmentIndirect: function () {
        var o = {a: true,
                 b: 10,
                 c: 5};

        (function () { return o.b + o.c >= 20 }).shouldBeTrue({o: o});
        this.assert(o.a, "a unchanged");
        this.assert(o.b === 15, "b fixed " + o.b);

        (function () {
            return o.a == (o.b > 15)
        }).shouldBeSatisfiedWith(function () {
            o.a.formula([o.b], function (b, a) { return b > 15 });
            o.b.formula([o.a], function (a, b) { return a ? 16 : 15 });
        }, {o: o});
        this.assert(!o.a, "deltablue is downstream from cassowary and has to change a to " + o.a);
        this.assert(o.b === 15, "deltablue is downstream from cassowary and has to change a");

        o.c = 1;
        this.assert(o.a, "deltablue changed a");
        this.assert(o.b === 19, "cassowary updated this");
    },
});
}) // end of module