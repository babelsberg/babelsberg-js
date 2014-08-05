contentLoaded(window, function() {
   
(function() {
	
(function() {
	var colors = ["blue", "black", "brown", "white"];
	var man = {
		shoes: "foo",
		shirt: "foo",
		pants: "foo",
		hat: "foo"
	};
    var solver = bbb.defaultSolver = new csp.Solver();
	
    solver.newVariable(man, "shoes", ["brown", "black"]);
    solver.newVariable(man, "shirt", ["white", "blue", "brown"]);
    solver.newVariable(man, "pants", ["blue", "black", "brown", "white"]);
    solver.newVariable(man, "hat", ["brown"]);
    
    always: { man.shoes === man.hat }
    always: { man.shoes !== man.pants }
    always: { man.shoes !== man.shirt }
    always: { man.shirt !== man.pants }
    console.log(man.shoes, man.pants, man.shirt, man.hat);
})();

return;

    // Babelsberg sample
    var Vector = function(x, y) {
    	this.x = x;
    	this.y = y;
    };
    var Rect = function(ox, oy, ex, ey) {
    	this.origin = new Vector(ox, oy);
    	this.extent = new Vector(ex, ey);
    };
    Rect.prototype.getArea = function() {
    	var e = this.extent;
    	return e.x * e.y;
    };
    Rect.prototype.toString = function() {
    	return "Rect(" +
    	this.origin.x + ", "+ 
    	this.origin.y + ", "+ 
    	this.extent.x + ", "+ 
    	this.extent.y + ")";
    };

    var foo = {
    	r1: new Rect(1,2,3,4)
    };
    
    var solver = new csp.Solver();
    
    var possibleRects = [];
    for(var ox = 0; ox < 5; ox++) {
        for(var oy = 0; oy < 5; oy++) {
            for(var ex = 0; ex < 5; ex++) {
                for(var ey = 0; ey < 5; ey++) {
                    possibleRects.push(new Rect(ox, oy, ex, ey));
                }	
            }	
        }
    }
    var h1 = solver.addVariable(foo, "r1", possibleRects);
    
    always: { solver: solver
    	args: [h1]
    	foo.r1.origin.x <= 3
    }
})();

});
