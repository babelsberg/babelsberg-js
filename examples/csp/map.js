contentLoaded(window, function() {
    var InitializedEmZ3 = new EmZ3();
    var relax = Relax();
    var dirty = false;
    var colors = ["#fcaf3e", "#8ae234", "#729fcf", "#ef2929"],
        defaultStateNames = _.map(["AUT", "BEL", "CZE", "FRA", "DEU",
                                   // "HUN", "GRE", "HRV", "MKD", "BGR", "LTU", "MNE",
                                   "ROU", "SVK", "SVN", "SRB", "BIH", "CS-KM", "ALB",
                                   "LUX", "NLD", "POL", "CHE", "ITA", "NOR", "SWE", "FIN",
            "GBR", "IRL", "DNK",
            "ESP",
            "PRT"], function (name) {
                                   return "countries/" + name + ".geo.json";
                               });
    intersectionCache = {};
    var intersectStates = function(s1, s2) {
        var cache = intersectionCache[s1.name];
        if (!cache) {
            cache = {};
            intersectionCache[s1.name] = cache;
        }
        if (cache[s2.name] == undefined) {
            cache[s2.name] = Intersection.intersectStates(s1, s2);
        }
        return cache[s2.name];
    };

    // drawing
    var applyPathToContext = function(path, ctx) {
        var last = _.last(path);
        ctx.moveTo(last[0], last[1]);
        _.each(path, function(point) {
            ctx.lineTo(point[0], point[1]);
        });
    };

    var drawMultipolygon = function(polygon, ctx) {
        ctx.beginPath();
        _.each(polygon.coordinates, function(coords) {
            applyPathToContext(coords, ctx);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    };

    var selectedColor = colors[colors.length - 1];
    var colorsDiv = document.getElementById('colors');
    _.each(colors, function (color, index) {
        var input = document.createElement("input");
        input.type = "radio";
        input.name = "color-selection";
        input.id = color;
        input.value = color;
        input.checked = true;
        input.onchange = (function () {
            if (input.checked) {
                selectedColor = color;
            }
        });
        colorsDiv.appendChild(input);
        var label = document.createElement("label");
        label.for = color;
        label.style = "background-color: " + color;
        label.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
        colorsDiv.appendChild(label);
        colorsDiv.appendChild(document.createElement("br"));
    });

    var timesDiv = document.getElementById('times');
    var solverSelect = document.getElementById('solver');
    solverSelect.onchange = (function () {
        doIt.call();
    });

    // _.each(document.getElementsByName("country"), function(n) {
    //     if (defaultStateNames.indexOf(n.value) >= 0) {
    //         n.checked = true;
    //     }
    //     n.onchange = (function () {
    //         doIt.call();
    //     });
    // });

    var loaded = function(error /*, states ... */) {
        if (solverSelect.value === "EmZ3") {
            bbb.defaultSolver = InitializedEmZ3;
            dirty = true;
        } else {
            bbb.defaultSolver = new (eval(solverSelect.value))();
        }
        if (dirty) {
            // InitializedEmZ3 = new EmZ3();
            // InitializedEmZ3.reset();
            InitializedEmZ3.variables = [];
            InitializedEmZ3.cvarsByName = {};
            InitializedEmZ3.varsByName = {};
            InitializedEmZ3.constraints = [];
            InitializedEmZ3.domains = [];
            InitializedEmZ3.domainsByName = {};
            dirty = false;
        }

        // prepare data
        var states = _.chain(arguments)
            .filter(function(state, index) {
                return index !== 0;
            })
            .pluck("features")
            .pluck(0)
            .map(function(state) {
                var geometry = state.geometry;
                if(geometry.type === "Polygon")
                    geometry.coordinates = [geometry.coordinates];
                geometry.coordinates = _.pluck(geometry.coordinates, 0);
                return {
                    geometry: geometry,
                    name: state.properties.name,
                    color: new Number(0)
                };
            })
            .map(function(state) {
                state.geometry.aabbs = _.map(state.geometry.coordinates, AABB.fromPath);
                return state;
            })
            .value();

        var t0, tTotal = 0;
        // define domains for colors
        _.each(states, function(state, index) {
            t0 = performance.now();
            always: { state.color.is in colors }
            tTotal = tTotal + (performance.now() - t0);
        });

        // ... and constrain neighbored countries
        _.each(states, function(state1, index1) {
            _.each(states, function(state2, index2) {
                if(index1 < index2 && intersectStates(state1, state2)) {
                    // console.log(state1.name + " - " + state2.name);
                    t0 = performance.now();
                    always: { state1.color != state2.color }
                    tTotal = tTotal + (performance.now() - t0);
                }
            }, this);
        }, this);

        function logTime() {
            var el = document.createElement("div");
            el.innerText = solverSelect.value + " - time: " + tTotal + "ms";
            timesDiv.insertBefore(el, timesDiv.firstChild);
        }
        logTime();

        var worldAABB = _.reduce(states, function(mem, state) {
            var stateAABB = _.reduce(state.geometry.aabbs, function(mem, aabb) {
                return mem.combine(aabb);
            });
            return mem.combine(stateAABB);
        }, new AABB([], []));

        // always: {
        //     solver: relax;
        //     worldToCanvasFactor == ro(worldHeight) / ro(canvasHeight);
        // }

        // prepare canvas
        var worldWidth = worldAABB.max[0] - worldAABB.min[0],
            worldHeight = worldAABB.max[1] - worldAABB.min[1],
            canvasWidth = 800,
            canvasHeight = worldHeight / worldWidth * canvasWidth,
            worldToCanvasFactor = canvasHeight / worldHeight,
            worldLeft = worldAABB.min[0],
            worldTop = worldAABB.min[1],
            c = document.getElementById("canvas"),
            ctx = c.getContext("2d");

        function redraw() {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.save();
            ctx.translate(canvasWidth / 2, canvasHeight / 2);
            ctx.scale(canvasWidth, canvasHeight);
            ctx.scale(1, -1);
            ctx.scale(1 / worldWidth, 1 / worldHeight);
            ctx.translate(
                -(worldAABB.max[0] + worldAABB.min[0])/2,
                -(worldAABB.max[1] + worldAABB.min[1])/2
            );

            // draw polygons
            _.each(states, function(state) {
                ctx.fillStyle = state.color;
                drawMultipolygon(state.geometry, ctx);
            });

            ctx.restore();
        };

        c.addEventListener("click", function(evt) {
            var state = _.find(states, function(state, index) {
                var worldX = evt.offsetX / worldToCanvasFactor + worldLeft,
                    worldY = (canvasHeight - evt.offsetY) / worldToCanvasFactor + worldTop;
                return Intersection.geometryContainsPoint(state.geometry, [worldX, worldY]);
            });
            if (state) {
                console.log("You clicked on: " + state.name);
                t0, tTotal = 0;
                t0 = performance.now();
                state.color = selectedColor;
                tTotal = tTotal + (performance.now() - t0);
                logTime();
                redraw();
            }
            return false;
        });

        c.width = canvasWidth;
        c.height = canvasHeight;

        ctx.strokeStyle = "black";
        ctx.lineWidth = 1/8;

        redraw();
    };

    doIt = function() {
        var stateNames;
        var checkedStates = _.map(
            _.filter(document.getElementsByName("country"), function(node) {
                return node.checked;
            }),
            function(node) {
                return node.value;
            });
        if (checkedStates.length > 0) {
            stateNames = checkedStates;
        } else {
            stateNames = defaultStateNames;
        }
        var q = queue();
        _.each(stateNames, function(file) {
            q.defer(d3.json, file);
        });
        q.await(loaded);
    }
    doIt();
});
