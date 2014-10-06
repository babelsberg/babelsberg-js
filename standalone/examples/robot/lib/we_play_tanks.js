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

	var viewport = new Viewport(
		new Vector2(30, 30* canvas.height/canvas.width),
		new Vector2(60, 60 * canvas.height/canvas.width)
	);

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
        });

	var world, gui;

	var init = function() {
        world = new World(new AABB(
            new Vector2(-150, -150),
            new Vector2(150, 150)
        ));

        player = new PlayerTank(world, new Vector2(15, 12), input);
        world.spawn(player);
        cpu = new CPUTank(world, new Vector2(28, 6))
        world.spawn(cpu);

        player.onCollisionWith(cpu, function(player, cpu) {
            var desiredDistance = player.radius + cpu.radius,
                distVector = cpu.position.sub(player.position),
                realDistance = distVector.length(),
                moveVector = distVector.mulFloat((desiredDistance - realDistance) / 1.9);
            cpu.position.addSelf(moveVector);
            player.position.subSelf(moveVector);
            console.log(realDistance, "push", player.position.distance(cpu.position, player.radius + cpu.radius));
        });

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

        // player fires a bullet
        if(input.pressed("leftclick")) {
            var direction = viewport.screenToWorldCoordinates(input.mouse)
                .sub(player.position)
                .normalizedCopy();
            var bullet = new Bullet(world,
                player.position.add(direction.mulFloat(player.radius + 0.25 + player.speed * dt)),
                direction);
            world.getGameObjects().each(function(other) {
                bullet.onCollisionWith(other, function(bullet, other) {
                    bullet.destroy();
                    other.destroy();
                });
            });
            world.spawn(bullet);
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
