contentLoaded(window, function() {

	// setup canvas
	var canvas = new fabric.Canvas('canvas');
	fabric.Object.prototype.transparentCorners = false;
	
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
	
	window.rects = {
		red: red,
		green: green,
		blue: blue,
		yellow: yellow
	};

	//setup default solver
	bbb.defaultSolver = new ClSimplexSolver();
	
	// code editor
	var codeEditor = document.getElementById('code');
	
	var editorCallback = function() {
		bbb.defaultSolver = new ClSimplexSolver();
		
		// remove old constraints
		Object.keys(window.rects).each(function(name) {
			bbb.unconstrainAll(window.rects[name]);
		});

		codeEditor.style.border = "3px solid green";
		try {
			execute(this.value, window.rects);
		} catch (e) {
			codeEditor.style.border = "3px solid red";
			throw e;
		}
		
		// rerender for immediate changes
		canvas.renderAll();
	};
	
	codeEditor.onkeyup = editorCallback;

	codeEditor.value =
	"always: {\n" +
	"	this.red.top == this.green.top;\n" +
	"}\n" +
	"always: {\n" +
	"	this.red.left + this.green.left == 500;\n" +
	"}\n" +
	"always: {\n" +
	"	this.red.top == this.yellow.top;\n" +
	"}\n" +
	"always: {\n" +
	"	this.red.left == this.yellow.left;\n" +
	"}\n" +
	"always: {\n" +
	"	this.yellow.angle == this.yellow.top;\n" +
	"}\n" +
	"always: {\n" +
	"	this.blue.angle >= 90;\n" +
	"}\n" +
	"always: {\n" +
	"	this.blue.angle <= 270;\n" +
	"}\n";
	editorCallback.call(codeEditor);

	canvas.add(red, green, blue, yellow);
});