define(function moduleViewport() {
    var Scale = Object.subclass("Scale", {
        initialize: function() {
            this.domain(0, 1);
            this.range(0, 1);
        },
        domain: function(dFrom, dTo) {
            this.dFrom = dFrom;
            this.dTo = dTo;
        },
        range: function(rFrom, rTo) {
            this.rFrom = rFrom;
            this.rTo = rTo;
        },
        scale: function(x) {
            var r = this.rTo - this.rFrom,
                d = this.dTo - this.dFrom,
                X = x - this.dFrom;
            return r * X / d + this.rFrom;
        },
        invert: function(y) {
            var Y = y - this.rFrom,
                d = this.dTo - this.dFrom,
                r = this.rTo - this.rFrom;
            return Y * d / r + this.dFrom;
        }
    });

    var Viewport = Object.subclass("Viewport", {
        initialize: function(middlePoint, extent) {
            this.point = middlePoint;
            this.extent = extent;
            this.scrollFactor = 1;

            this._initialize();
        },
        _initialize: function() {
            // scaling
            this.scaleX = new Scale();
            this.scaleY = new Scale();
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

            this.scaleX.domain(middlePoint.x - extend.x / 2, middlePoint.x + extend.x / 2);
            this.scaleY.domain(middlePoint.y - extend.y / 2, middlePoint.y + extend.y / 2);
        },

        // HACK: hard coded canvas extent
        // Ranges are given in screen coordinates.
        resetScaleRange: function() {
            this.scaleX.range(0, 800);
            this.scaleY.range(0, 600);
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
                this.scaleX.scale(vector.x),
                this.scaleY.scale(vector.y)
            );
        }
    });

    return Viewport;
});
