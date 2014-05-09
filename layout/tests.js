module('users.timfelgentreff.layout.tests').requires('lively.TestFramework', 'users.timfelgentreff.babelsberg.constraintinterpreter', 'users.timfelgentreff.layout.layout').toRun(function() {

TestCase.subclass('users.timfelgentreff.layout.tests.SimpleLayoutTest', {
    setUp: function() {},
    tearDown: function() {},
    
    /*
     * Creates a Box with 2 child Boxes constrained to the same extent.
     */
    fixtureSameExtent: function() {
        this.layoutSolver = new LayoutSolver();
        
        var parent = new lively.morphic.Box(pt(7,7).extent(pt(300,300)));
        parent.addMorph(parent.child1 = new lively.morphic.Morph.makeRectangle(10, 10, 100, 250));
        parent.addMorph(parent.child2 = new lively.morphic.Morph.makeRectangle(150, 10, 130, 200));

        bbb.always({
            solver: this.layoutSolver,
            ctx: {
                parent: parent,
                _$_self: this.doitContext || this
            }
        }, function() {
            return parent.child1.sameExtent(parent.child2);;
        });

        return parent;
    },
    testSameExtent: function () {
        var parent = this.fixtureSameExtent();
        
        this.assertEquals(parent.child1.getExtent(), parent.child2.getExtent(), "Boxes do not have the same extent after constraint definition.");
    },
    testSameExtentAssignmentLeft: function () {
        var parent = this.fixtureSameExtent();
        var expectedExtent = pt(70,35);
        parent.child1.setExtent(expectedExtent);
        
        this.assertEquals(parent.child1.getExtent(), parent.child2.getExtent(), "Boxes do not have the same extent after assignment.");
        this.assertEquals(expectedExtent, parent.child1.getExtent(), "Box does not have the assigned extent.");
        this.assertEquals(expectedExtent, parent.child2.getExtent(), "Box does not have the assigned extent.");
    },
    testSameExtentAssignmentRight: function () {
        var parent = this.fixtureSameExtent();
        var expectedExtent = pt(70,35);
        parent.child2.setExtent(expectedExtent);
        
        this.assertEquals(parent.child1.getExtent(), parent.child2.getExtent(), "Boxes do not have the same extent after assignment.");
        this.assertEquals(expectedExtent, parent.child1.getExtent(), "Box does not have the assigned extent.");
        this.assertEquals(expectedExtent, parent.child2.getExtent(), "Box does not have the assigned extent.");
    },
    test2IndependentSameExtents: function () {
        this.layoutSolver = new LayoutSolver();
        
        var parent = new lively.morphic.Box(pt(7,7).extent(pt(300,300)));
        parent.addMorph(parent.child1 = new lively.morphic.Box(pt(10,10).extent(pt(100,250))));
        parent.addMorph(parent.child2 = new lively.morphic.Box(pt(150,10).extent(pt(130, 200))));
        parent.addMorph(parent.child3 = new lively.morphic.Box(pt(10,10).extent(pt(300,250))));
        parent.addMorph(parent.child4 = new lively.morphic.Box(pt(150,10).extent(pt(330, 200))));

        bbb.always({
            solver: this.layoutSolver,
            ctx: {
                parent: parent,
                _$_self: this.doitContext || this
            }
        }, function() {
            return parent.child1.sameExtent(parent.child2);;
        });
        
        bbb.always({
            solver: this.layoutSolver,
            ctx: {
                parent: parent,
                _$_self: this.doitContext || this
            }
        }, function() {
            return parent.child3.sameExtent(parent.child4);;
        });

        this.assertEquals(parent.child1.getExtent(), parent.child2.getExtent(), "Boxes do not have the same extent after constraint definition.");
        this.assertEquals(parent.child3.getExtent(), parent.child4.getExtent(), "Boxes do not have the same extent after constraint definition.");
    },
    test2ChainOfSameExtents: function () {
        this.layoutSolver = new LayoutSolver();
        
        var parent = new lively.morphic.Box(pt(7,7).extent(pt(300,300)));
        parent.addMorph(parent.child1 = new lively.morphic.Box(pt(10,10).extent(pt(10,20))));
        parent.addMorph(parent.child2 = new lively.morphic.Box(pt(150,10).extent(pt(130, 200))));
        parent.addMorph(parent.child3 = new lively.morphic.Box(pt(10,10).extent(pt(300,250))));
        parent.addMorph(parent.child4 = new lively.morphic.Box(pt(150,10).extent(pt(330, 200))));

        bbb.always({
            solver: this.layoutSolver,
            ctx: {
                parent: parent,
                _$_self: this.doitContext || this
            }
        }, function() {
            return parent.child1.sameExtent(parent.child2);;
        });
        
        bbb.always({
            solver: this.layoutSolver,
            ctx: {
                parent: parent,
                _$_self: this.doitContext || this
            }
        }, function() {
            return parent.child2.sameExtent(parent.child3);;
        });
        
        bbb.always({
            solver: this.layoutSolver,
            ctx: {
                parent: parent,
                _$_self: this.doitContext || this
            }
        }, function() {
            return parent.child3.sameExtent(parent.child4);;
        });
        
        this.assertEquals(parent.child1.getExtent(), parent.child2.getExtent(), "Boxes do not have the same extent after constraint definition.");
        this.assertEquals(parent.child2.getExtent(), parent.child3.getExtent(), "Boxes do not have the same extent after constraint definition.");
        this.assertEquals(parent.child3.getExtent(), parent.child4.getExtent(), "Boxes do not have the same extent after constraint definition.");
    }
});

}) // end of module
