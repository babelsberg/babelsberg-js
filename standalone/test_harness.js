Object.subclass("TestCase", {
    assert: function (bool, msg) {
	if (!bool) {
	    throw new Error("Assertion failed " + msg);
	}
    },
    runAll: function () {
	for (var l in this) {
	    if (l.match(/^test/)) {
		var p = this[l];
		if (typeof(p) == "function") {
		    try {
			console.log(l);
			this.setUp && this.setUp();
			p.apply(this);
			this.tearDown && this.tearDown();
		    } catch (e) {
		    	console.error(e);
		    }
		}
	    }
	}
    }
});

Object.subclass("lively.Point", {
    initialize: function(x, y) {
	this.x = x;
	this.y = y;
	return this;
    },
    addPt: function(p) {
	return pt(this.x + p.x, this.y + p.y);
    },
    equals: function(p) {
	return this.eqPt(p);
    },
    eqPt: function(p) {
	return this.x == p.x && this.y == p.y
    },
    leqPt: function(p) {
	return this.x <= p.x && this.y <= p.y
    },
    scaleBy: function(scalar) {
	return pt(this.x * scalar, this.y * scalar);
    }
});
window.pt = (function (x, y) {
    return new lively.Point(x,y);
});

window.alertOK = (function(msg) {
    console.log(msg);
});

window.Color = {
    rgb: function(r,g,b) {
	var c = {r: r, g: g, b: b};
	c.equals = function (o) {
	    return o.r == this.r && o.b == this.b && o.b == this.b
	}.bind(c);
    }
}
