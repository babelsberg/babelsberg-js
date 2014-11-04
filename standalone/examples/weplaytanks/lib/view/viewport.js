Object.subclass("Viewport", {
	initialize: function(middlePoint, extent) {
		this.point = middlePoint;
		this.extent = extent;
		this.scrollFactor = 1;
		
		this._initialize();
	},
	_initialize: function() {
		// scaling
		this.scaleX = d3.scale.linear();
		this.scaleY = d3.scale.linear();
		this.resetScaleRange();
		
		this.update();
	},

	update: function() {
		this.jumpToPoint(this.point);
	},

	// manipulation
	jumpToPoint: function(vector) {
		this.point.set(vector);
		this.updateScales();
	},

	translateBy: function(canvas, vector) {
		this.point.addSelf(this.extent.divVector(
			new Vector2(canvas.width, canvas.height)
		).mulVector(vector));
		this.updateScales();
	},

	zoomIn: function() {
		this.extent.mulFloatSelf(1.1);
		this.updateScales();
	},

	zoomOut: function() {
		this.extent.mulFloatSelf(0.9);
		this.updateScales();
	},
	
	updateScales: function() {
		var middlePoint = this.point;
		var extend = this.extent;
		
		this.scaleX.domain([
			middlePoint.x - extend.x / 2,
			middlePoint.x + extend.x / 2
		]);
		this.scaleY.domain([
			middlePoint.y - extend.y / 2,
			middlePoint.y + extend.y / 2
		]);
	},
	
	// HACK: hard coded canvas extent
	// Ranges are given in screen coordinates.
	resetScaleRange: function() {
		this.scaleX.range([0, 800]);
		this.scaleY.range([0, 600]);
	},

	// converting between screen and world
	screenToWorldCoordinates: function(vector) {
		return new Vector2(
			this.scaleX.invert(vector.x),
			this.scaleY.invert(vector.y)
		);
	},

	worldToScreenCoordinates: function(vector) {
		return new Vector2(
			this.scaleX(vector.x),
			this.scaleY(vector.y)
        );
    }
});
