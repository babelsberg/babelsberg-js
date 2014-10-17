window.onload = function() {
	var canvasId = "game";
	
	// prepare stats
	var stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.left = '0px';
	stats.domElement.style.top = '0px';
	document.body.appendChild( stats.domElement );

	// setup game
	var canvas = document.getElementById(canvasId);
	canvas.style.position = "absolute";
	canvas.style.top = "0px";
	canvas.style.left = "0px";
	canvas.style["z-index"] = -1;
	
	var renderer = new Renderer(canvas);
	
	var input = new Input(canvasId);
	input.initKeyboard();
	input.initMouse();

	input.bind(Input.KEY.W, "up");
	input.bind(Input.KEY.A, "left");
	input.bind(Input.KEY.S, "down");
	input.bind(Input.KEY.D, "right");

	input.bind(Input.KEY.UP_ARROW, "up");
	input.bind(Input.KEY.LEFT_ARROW, "left");
	input.bind(Input.KEY.DOWN_ARROW, "down");
	input.bind(Input.KEY.RIGHT_ARROW, "right");

	input.bind(Input.KEY.MOUSE1, "leftclick");
	input.bind(Input.KEY.MOUSE2, "rightclick");
	input.bind(Input.KEY.MWHEEL_UP, "zoomIn");
	input.bind(Input.KEY.MWHEEL_DOWN, "zoomOut");

	input.bind(Input.KEY.P, "debug");
	input.bind(Input.KEY.X, "enemyFire");

	var viewport = new Viewport(
		new Vector2(30, 30* canvas.height/canvas.width),
		new Vector2(60, 60 * canvas.height/canvas.width)
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

    // do not debugdraw velocities if debug button is pressed
    cop.create("debugLayer")
        .activeOn({
            ctx: {
                input: input
            }
        }, function() {
            return input.state("debug") !== true;
        })
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

	var world, gui;

	var init = function() {
        world = new World(new AABB(
            new Vector2(-150, -150),
            new Vector2(150, 150)
        ), input, viewport);

        gui = new Gui(world, input, player, viewport);
	};

	// frame update
	var downPoint = Vector2.Zero.copy();
	var lastPoint = Vector2.Zero.copy();
	var update = function(dt) {
		if(input.pressed("leftclick")) {
			downPoint.set(input.mouse);
		}
		if(input.pressed("rightclick")) {
			lastPoint.set(input.mouse);
		}
		// viewport manipulation
		if(input.state("rightclick")) {
			viewport.translateBy(canvas, lastPoint.sub(input.mouse));
			lastPoint.set(input.mouse);
		}
		if(input.state("zoomIn")) {
			viewport.zoomIn();
		}
		if(input.state("zoomOut")) {
			viewport.zoomOut();
		}

		// update
		world.update(dt);
		gui.update(dt);

		// drawing
		renderer.clear();
		renderer.withViewport(viewport, function() {
			world.draw(renderer);
		});
		gui.draw(renderer);

		input.clearPressed();
	}

	// main loop
	var lastFrame = window.performance.now();
	function animate() {
		stats.update();

		// setup time since last call
		var time = window.performance.now();
		var dt = (time - lastFrame) / 1000;
		lastFrame = time;

		update(dt);
		requestAnimationFrame(animate);
	}
	
	// asset loading
	var imgTile, imgConcept;
	queue()
		.defer(loadImage, "assets/tileset.png")
		.defer(loadImage, "assets/tank.png")
		.defer(loadImage, "assets/turret.png")
		.defer(loadImage, "assets/bullet.png")
		.defer(loadImage, "assets/target.png")
		.await(function(error) {
			if(error) {
				console.error("error while loading");
			} else {
			    init();
				animate();
			}
		});
}
