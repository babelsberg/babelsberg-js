contentLoaded(window, function() {

	// setup canvas
	var canvas = new fabric.Canvas('canvas', { backgroundColor: "#cccccc" });
	
	var red = new fabric.Rect({
		width: 200, height: 100, left: 0, top: 50, angle: 0,
		fill: 'rgba(255,0,0,0.5)'
	});
	
	var green = new fabric.Rect({
		width: 100, height: 100, left: 350, top: 250, angle: 0,
		fill: 'rgba(0,255,0,0.5)'
	});
	
	var blue = new fabric.Rect({
		width: 50, height: 100, left: 275, top: 350, angle: 0,
		fill: 'rgba(0,0,255,0.5)'
	});
	
	var yellow = new fabric.Rect({
		width: 50, height: 100, left: 75, top: 350, angle: 0,
		fill: 'rgba(255,255,0,0.5)'
	});
	
	//setup constraints
	cassowarySolver = new ClSimplexSolver();

	always: { solver: cassowarySolver
	    red.top == green.top;
	}
	always: { solver: cassowarySolver
	    red.left + green.left == 500;
	}
	always: { solver: cassowarySolver
	    red.top + red.currentHeight == yellow.top;
	}
	always: { solver: cassowarySolver
	    red.left == yellow.left;
	}
	always: { solver: cassowarySolver
	    blue.angle >= 90;
	}
	always: { solver: cassowarySolver
	    blue.angle <= 270;
	}


	canvas.add(red, green, blue, yellow);
	window.rects = {
		red: red,
		green: green,
		blue: blue,
		yellow: yellow
	};
	
	
	
	
});