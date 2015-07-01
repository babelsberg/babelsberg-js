contentLoaded(window, function() {

    var canvas = new fabric.Canvas('c', { selection: false, stateful: false });
    window.canvas = canvas;
    fabric.Object.prototype.originX = fabric.Object.prototype.originY = 
        'center';

    function makeCircle(left, top) {
        var c = new fabric.Circle({
            left: left,
            top: top,
            strokeWidth: 2,
            radius: 3,
            fill: 'black',
            stroke: 'black',
            selectable: false
        });
        c.hasControls = c.hasBorders = false;
        return c;
    }

    fabric.Circle.prototype.myCenter = function() {
        return new fabric.Point(this.left,this.top);
    };

    function makeLine(coords) {
        return new fabric.Line(coords, {
            fill: 'black',
            stroke: 'black',
            strokeWidth: 2,
            selectable: false
        });
    }

    fabric.Line.prototype.myEnd1 = function() {
        return new fabric.Point(this.x1,this.y1);
    };

    fabric.Line.prototype.myEnd2 = function() {
        return new fabric.Point(this.x2,this.y2);
    };

    var side1 = makeLine([ 200, 100, 410, 320 ]),
        side2 = makeLine([ 410, 320, 210, 450 ]),
        side3 = makeLine([ 210, 450,  60, 200 ]),
        side4 = makeLine([  60, 200, 200, 100 ]),
        mid1  = makeLine([ 130, 150, 305, 210 ]),
        mid2  = makeLine([ 305, 210, 305, 385 ]),
        mid3  = makeLine([ 305, 385, 135, 325 ]),
        mid4  = makeLine([ 130, 325, 130, 150 ]);

    var p1 = makeCircle(side1.get('x1'), side1.get('y1')),
        p2 = makeCircle(side2.get('x1'), side2.get('y1')),
        p3 = makeCircle(side3.get('x1'), side3.get('y1')),
        p4 = makeCircle(side4.get('x1'), side4.get('y1')),
        m1 = makeCircle( mid1.get('x2'),  mid1.get('y2')),
        m2 = makeCircle( mid2.get('x2'),  mid2.get('y2')),
        m3 = makeCircle( mid3.get('x2'),  mid3.get('y2')),
        m4 = makeCircle( mid4.get('x2'),  mid4.get('y2'));

    canvas.add(side1, side2, side3, side4,
               mid1, mid2, mid3, mid4,
               p1, p2, p3, p4, m1, m2, m3, m4);

    canvas.on('object:moving', function(e) {
        // var now = performance.now()
        canvas._objects.each(function (o) { o.set(o); o.setCoords(); });
    });

    //setup default solver
    bbb.defaultSolver = new ClSimplexSolver();

    // add constraints connecting the circles and endpoints of the 4 sides
    always: {side1.myEnd1().eq(p1.myCenter())}
    always: {side1.myEnd2().eq(p2.myCenter())}

    always: {side2.myEnd1().eq(p2.myCenter())}
    always: {side2.myEnd2().eq(p3.myCenter())}

    always: {side3.myEnd1().eq(p3.myCenter())}
    always: {side3.myEnd2().eq(p4.myCenter())}

    always: {side4.myEnd1().eq(p4.myCenter())}
    always: {side4.myEnd2().eq(p1.myCenter())}

    // add constraints on the midpoints and ends of the midlines

    always: {mid1.myEnd1().eq(m4.myCenter())}
    always: {mid1.myEnd2().eq(m1.myCenter())}

    always: {mid2.myEnd1().eq(m1.myCenter())}
    always: {mid2.myEnd2().eq(m2.myCenter())}

    always: {mid3.myEnd1().eq(m2.myCenter())}
    always: {mid3.myEnd2().eq(m3.myCenter())}

    always: {mid4.myEnd1().eq(m3.myCenter())}
    always: {mid4.myEnd2().eq(m4.myCenter())}

    // add midpoint constraints
    always: { side1.myEnd1().add(side1.myEnd2()).eq(mid1.myEnd1().multiply(2))}
    always: { side2.myEnd1().add(side2.myEnd2()).eq(mid2.myEnd1().multiply(2))}
    always: { side3.myEnd1().add(side3.myEnd2()).eq(mid3.myEnd1().multiply(2))}
    always: { side4.myEnd1().add(side4.myEnd2()).eq(mid4.myEnd1().multiply(2))}

    stay: {
        // A hack to work around the split stay problem
        priority: "medium"
        p1.left && p1.top && p3.top && p3.left
    }

    // always: {side1.x1+side1.x2 == 2*mid1.x2};
    // always: {side1.y1+side1.y2 == 2*mid1.y2}
    // always: {side2.x1+side2.x2 == 2*mid2.x2};
    // always: {side2.y1+side2.y2 == 2*mid2.y2}
    // always: {side3.x1+side3.x2 == 2*mid3.x2};
    // always: {side3.y1+side3.y2 == 2*mid3.y2}
    // always: {side4.x1+side4.x2 == 2*mid4.x2};
    // always: {side4.y1+side4.y2 == 2*mid4.y2}

    function moveit(p) {
        var cb = bbb.edit(p, ['left','top']);
        canvas.on('mouse:move', function(options) {
            if (options.e.buttons==0) {
                canvas.off('mouse:move');
                cb();
            };
            cb([options.e.x, options.e.y]);
            canvas._objects.each(function (o) { o.set(o); o.setCoords(); });
            canvas.renderAll();
        });
    };

    canvas.on('mouse:down', function(options) {
        [p1,p2,p3,p4,m1,m2,m3,m4].map(function(p) {
            if (p.containsPoint(canvas.getPointer(options.e))) {
                moveit(p)
            }});
    });

});
