cop.create("UnconstrainAndDisableAllLayer")
    .refineClass(Babelsberg, {
        unconstrain: function(obj, accessor) {
            var cvar = ConstrainedVariable.findConstraintVariableFor(obj, accessor);
            cvar._constraints.each(function(constraint) {
                constraint.disable();
            });
            cop.proceed(obj, accessor);
        }
    })
    //.beGlobal();

Object.subclass("Game", {
    initialize: function(canvasId) {
        this.buildCanvas(canvasId);
        this.buildInput(canvasId);
        this.renderer = new Renderer(this.canvas);
        this.buildViewport();
        this.constrainDebugLayer();
        this.levels = new LevelPointer();
    },
    buildCanvas: function(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.canvas.style.position = "absolute";
        this.canvas.style.top = "0px";
        this.canvas.style.left = "0px";
        this.canvas.style["z-index"] = -1;
    },
    buildInput: function(canvasId) {
        this.input = new Input(canvasId);

        this.input.bind(Input.KEY.W, "up");
        this.input.bind(Input.KEY.A, "left");
        this.input.bind(Input.KEY.S, "down");
        this.input.bind(Input.KEY.D, "right");

        this.input.bind(Input.KEY.UP_ARROW, "up");
        this.input.bind(Input.KEY.LEFT_ARROW, "left");
        this.input.bind(Input.KEY.DOWN_ARROW, "down");
        this.input.bind(Input.KEY.RIGHT_ARROW, "right");

        this.input.bind(Input.KEY.MOUSE1, "leftclick");
        this.input.bind(Input.KEY.MOUSE2, "rightclick");
        this.input.bind(Input.KEY.MWHEEL_UP, "zoomIn");
        this.input.bind(Input.KEY.MWHEEL_DOWN, "zoomOut");

        this.input.bind(Input.KEY.P, "debug");
    },
    buildViewport: function() {
        var input = this.input,
            viewport = this.viewport = new Viewport(
                new Vector2(30, 30* this.canvas.height/this.canvas.width),
                new Vector2(60, 60 * this.canvas.height/this.canvas.width)
            );

        // constraint:
        // - keep input position in world and mouse on screen in sync
        bbb.always({
            solver: new DBPlanner(),
            ctx: {
                input: input,
                viewport: viewport
            },
            methods: function() {
                input.position.formula([input.mouse, input.mouse.x, input.mouse.y], function(mouse, mouseX, mouseY) {
                    return viewport.screenToWorldCoordinates(mouse);
                });
            }
        }, function() {
            return input.position.equals(viewport.screenToWorldCoordinates(input.mouse));
        });
    },
    constrainDebugLayer: function() {
        var input = this.input;

        // do not debugdraw velocities if debug button is pressed
        DebugLayer.activeOn({
            ctx: {
                input: input
            }
        }, function() {
            return input.switchedOn("debug") == true;
        });
    },
    prepare: function() {
        this.resetLevel();
    },
    resetLevel: function() {
        // TODO: eliminate duplications
        this.cleanUp();
        var builder = new WorldBuilder(this);
        this.world = builder.buildWorld(this.levels.get());

        this.gui = new Gui(this.world, this.input, player, this.viewport);
    },
    nextLevel: function() {
        this.cleanUp();
        var builder = new WorldBuilder(this);
        this.world = builder.buildWorld(this.levels.next());

        this.gui = new Gui(this.world, this.input, player, this.viewport);
    },
    cleanUp: function() {
        // TODO
    },
    update: function(dt) {
        this.updatePhysics(dt);
        this.gui.update(dt);
        this.draw();

        this.input.clearPressed();
    },
    updatePhysics: function(dt) {
        this.world.update(dt);
    },
    draw: function() {
        this.renderer.clear();
        this.renderer.withViewport(this.viewport, (function() {
            this.world.draw(this.renderer);
        }).bind(this));
        this.gui.draw(this.renderer);
    }
});

cop.create("DebugLayer")
    .refineClass(GameObject, {
        draw: function(renderer) {
            cop.proceed(renderer);
            renderer.drawLine(this.position, this.position.add(this.velocity), "red", 1, 3);
        }
    })
    .refineClass(CPUControls, {
        getTargetTiles: function() {
            var tiles = cop.proceed();

            tiles.each(function(tile) {
                tile.marked = tile.canFlyThrough() ? this.color : "red";
            }, this);

            return tiles;
        }
    });

cop.create("AdjustViewportManuallyLayer")
    .refineClass(Game, {
        initialize: function(canvasId) {
            cop.proceed(canvasId);

            this.downPoint = Vector2.Zero.copy();
            this.lastPoint = Vector2.Zero.copy();
        },
        update: function(dt) {
            if(this.input.pressed("leftclick")) {
                this.downPoint.set(this.input.mouse);
            }
            if(this.input.pressed("rightclick")) {
                this.lastPoint.set(this.input.mouse);
            }
            // viewport manipulation
            if(this.input.state("rightclick")) {
                this.viewport.translateBy(this.canvas, this.lastPoint.sub(this.input.mouse));
                this.lastPoint.set(this.input.mouse);
            }
            if(this.input.state("zoomIn")) {
                this.viewport.zoomIn();
            }
            if(this.input.state("zoomOut")) {
                this.viewport.zoomOut();
            }

            cop.proceed(dt);
        }
    })
    .beGlobal();

Object.subclass("Timer", {
    initialize: function() {
        this.lastFrame = window.performance.now();

        // TODO: minimal framerate constraint
    },
    // returns time since last call
    update: function() {
        var time = window.performance.now(),
            dt = (time - this.lastFrame) / 1000;
        this.lastFrame = time;
        return dt;
    }
});

Object.subclass("Loop", {
    initialize: function(func) {
        this.func = func;
    },
    start: function() {
        this.update();
    },
    update: function() {
        this.func();
        requestAnimationFrame(this.update.bind(this));
    }
});

function loadJSON(path, callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
	xobj.open('GET', path, true); // Replace 'my_data' with the path to your file
	xobj.onreadystatechange = function () {
        if (xobj.readyState == 4) {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            // Parse JSON string into object
            var actual_JSON = JSON.parse(xobj.responseText);
            callback(actual_JSON);
        }
    };
    xobj.send(null);
};

loadLevel = function(index, path, callback) {
    loadJSON("assets/levels/" + path, function(json) {
        Levels[index] = json;
        callback(null, json);
     });
};

window.onload = function() {
    var canvasId = "game",
        game = new Game(canvasId);

    // prepare stats
    var stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    document.body.appendChild( stats.domElement );

    // main loop
    var timer = new Timer();
    function animate() {
        stats.update();
        var dt = timer.update();
        game.update(dt);
    }
    var loop = new Loop(animate);

    // asset loading
    queue()
        .defer(loadLevel, 0, '0_tutorial.json')
        .defer(loadLevel, 1, '1_movingtank.json')
        .defer(loadLevel, 2, '2_multipletanks.json')
        .defer(loadLevel, 3, '3_grid.json')
        .defer(loadLevel, 4, '4_hunter.json')
        .defer(loadLevel, 5, '5_borderline.json')
        .defer(loadLevel, 6, '6_hunter2.json')
        .defer(loadLevel, 7, '7_demo.json')
        .defer(loadImage, "tileset.png")
        .defer(loadImage, "tank.png")
        .defer(loadImage, "turret.png")
        .defer(loadImage, "bullet.png")
        .defer(loadImage, "target.png")
        .await(function(error) {
            if(error) {
                console.error("error while loading", error);
            } else {
                console.log(arguments[1]);
                game.prepare();
                loop.start();
            }
        });
};
