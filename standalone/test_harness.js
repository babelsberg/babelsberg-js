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
		this.x = x || 0;
		this.y = y || 0;
		return this;
    },
    addPt: function(p) {
        if (arguments.length != 1) throw ('addPt() only takes 1 parameter.');

        return new lively.Point(this.x + p.x, this.y + p.y);
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
    scaleBy: function(scaleX, scaleYOrUndefined) {
        return new lively.Point(this.x * scaleX, this.y * (scaleYOrUndefined||scaleX));
    }
});

Object.subclass("lively.morphic.Slider", {
    initialize: function(/* ignored */) {
    	this.val = 0;
    },
    getValue: function() {
        return this.val;
    },
    setValue: function(val) {
        return this.val = val;
    }
});

Object.subclass("lively.morphic.Text", {
    initialize: function(ignored, string) {
		this.textString = string || "";
    },
    getTextString: function() {
    	return this.textString;
    },
    setTextString: function(string) {
    	return this.textString = string;
    }
});

window.pt = (function (x, y) {
    return new lively.Point(x,y);
});

window.rect = (function() {
	// TODO:
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
