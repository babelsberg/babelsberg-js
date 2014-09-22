module('users.borning.playground').requires("users.timfelgentreff.babelsberg.tests").toRun(function() {

TestCase.subclass('users.borning.playground.PlaygroundTests', {
    testPointAdd: function() {
        var pt1 = pt(10, 15),
            pt2 = pt(20, 35),
            pt3 = pt(0, 0);
        (function () {
            return pt1.addPt(pt2).equals(pt3);
        }).shouldBeTrue({pt1: pt1, pt2: pt2, pt3: pt3});
        this.assert(pt1.addPt(pt2).equals(pt3));
    },
    testSimple2: function() {
        var x = 5;
        this.assert(x==5);
    },
    testSimple: function() {
        var pt1 = pt(10, 15);
        this.assert(pt1.equals(pt1));
    },
testPointAdd: function() {
    var pt1 = pt(10, 15),
    pt2 = pt(20, 35),
    pt3 = pt(0, 0);
    bbb.always({
        ctx: {
            pt1: pt1,
            pt2: pt2,
            pt3: pt3,
            _$_self: this.doitContext || this
        }
    }, function() {
        return pt1.addPt(pt2).equals(pt3);;
    });
        this.assert(pt1.addPt(pt2).equals(pt3));
    }
    
    //        this.assert(pt1.addPt(pt2).equals(pt3));

    
    //        this.assert(pt1.addPt(pt2).equals(pt3));

    
    //        this.assert(pt1.addPt(pt2).equals(pt3));

    
    
    
//            this.assert(expected.equals(pt3));

    
    
    
//            this.assert(expected.equals(pt3));

    
    
    
//            this.assert(expected.equals(pt3));

    
    
    
//            this.assert(expected.equals(pt3));
,
    testPointEquals: function() {
        var pt1 = pt(10, 10),
            pt2 = pt(20, 20);
        (function () {
            return pt1.equals(pt2);
        }).shouldBeTrue({pt1: pt1, pt2: pt2});
        this.assert(pt1.equals(pt2));
    },


})

}); // end of module
