module('users.timfelgentreff.babelsberg.tests').requires('lively.TestFramework', 'users.timfelgentreff.babelsberg.constraintinterpreter').toRun(function() {

TestCase.subclass('ConstraintTest', {
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





    exampleThermometer: function() {
        // enter comment here
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


})


TestCase.subclass('PropagationTest', {
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
    testArithmetic: function() {
        var o = {x: 0, y: 0, z: 0};

        (function () {
            return x + y == z;
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
TestCase.subclass('InteractionTest', {
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
            o.b.formula([o.a], function (a, b) {
                if (a && b <= 15) {
                    return 16;
                } else if (!a && b > 15) {
                    return 15;
                } else {
                    return b;
                }
            });
        }, {o: o});
        debugger
        this.assert(!o.a, "deltablue is downstream from cassowary and has to change a");
        this.assert(o.b === 11, "deltablue is downstream from cassowary and has to change a");

        o.b = 20;
        this.assert(o.a, "deltablue changed a");
        this.assert(o.b === 20, "cassowary updated this");
    },
});
}) // end of module