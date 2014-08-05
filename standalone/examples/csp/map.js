contentLoaded(window, function() {
   
(function() {
	// non-Babelsberg sample 1
    var p = new _csp.DiscreteProblem();
    
    p.addVariable("a", [1,2,3]);
    p.addVariable("b", [4,5,6]);
    p.addVariable("c", [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]);
    
    p.addConstraint(
      ["a", "b"],
      function(a, b) { return a*2 === b; }
    );

    p.addConstraint(
      ["b", "c"],
      function(b, c) { return b*2 === c; }
    );
    
	// non-Babelsberg sample 2
    var p2 = new _csp.DiscreteProblem();

    allVars = [];
    for (var a = 65; a < 91; a++) {
      allVars.push(String.fromCharCode(a));
      p2.addVariable(String.fromCharCode(a), [0,1,2,3]);
    }

    p2.addConstraint(
      ["A", "B"],
      function(a, b) { return (a === 2); }
    );
    
    var sol2 = p2.getSolution()
    p2s = document.getElementById("p2_out");
    for (var j in sol2) {
      if (!sol2.hasOwnProperty(j)) continue;
      p2s.innerHTML += (j + "=" + sol2[j] + " ");
    }
    if (sol2["A"] != 2) {
      document.getElementById("p2_bug").innerHTML = "A should be 2! Bug when using \"0\" as value!";
      
    }

    // show results
    document.getElementById("version").innerHTML = _csp.version;
    
    vhtml = document.getElementById("variables");
    vhtml.innerHTML = "";
    for (v in p.variables) {
      if (!p.variables.hasOwnProperty(v)) continue;
      vhtml.innerHTML += (p.variables[v].toString() + "<br/>");
    }
    
    document.getElementById("constraints").innerHTML = p.constraints.reduce(function(pV, cV, i, a) {
      return pV + cV + "<br/>"; 
    }, "")
    
    var sol = p.getSolution();
    var sh = document.getElementById("solution");
    for (var v in sol) {
      if (!sol.hasOwnProperty(v)) continue;
      sh.innerHTML += (v + " = " + sol[v] + "<br/>");
    }
    
    var allSoln = p.getSolutions();
    var sh = document.getElementById("allsolutions");
    for (var i in allSoln) {
      if (!allSoln.hasOwnProperty(i)) continue;
      var soln = allSoln[i];
      sh.innerHTML += "{ ";
      for (var j in soln) {
        if (!soln.hasOwnProperty(j)) continue;
        sh.innerHTML += (j + "=" + soln[j] + " ");
      }
      sh.innerHTML += "}<br/>"
    }
    
})();
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
	
    var sho = solver.newVariable(man, "shoes", colors);
    solver.newVariable(man, "shirt", colors);
    solver.newVariable(man, "pants", colors);
    var hat = solver.newVariable(man, "hat", colors);
    
    man.hat = "white";
    
    always: { man.shoes === man.hat }
    always: { man.shoes !== man.pants }
    always: { man.shoes !== man.shirt }
    always: { man.shirt !== man.pants }

    always: { man.hat === "brown" }
    always: { man.shoes === "brown" || man.shoes === "black" }
    always: { ["white", "blue", "brown"].indexOf(man.shirt) > -1 }

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
