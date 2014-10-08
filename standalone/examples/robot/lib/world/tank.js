// possible constraints:
// - your direction should be normalized
// - your speed is limited to maxSpeed (cannot adjust speed?)
// - your velocity is direction.mulFloat(dt*speed)
GameObject.subclass("Tank", {
	initialize: function($super, world, pos) {
	    $super(world, "tank", pos, new Vector2(2, 2), 1);

		this.speed = 16 / 6 * world.map.tileSize.x;

        this.turretDirection = new Vector2(1,1);
        this.turretAnimation = new Animation(new AnimationSheet("assets/turret.png", 18, 18), 0.4, [0,1,2,3]);

		this.initConstraints(world);
    },
    initConstraints: function(world) {
        var that = this,
            map = world.map;

        // constraint:
        // - do not be on a wall tile
        bbb.assert({
            onError: function(error) {
                if(!error instanceof ContinuousAssertError) {
                    throw error;
                }
            },
            ctx: {
                that: that,
                map: map
            }
        }, function() {
            var pos = that.position.divVector(map.tileSize).floor();
            return map.tiles[pos.y][pos.x].canWalkThrough();
        });

        // assumption: tanks are inserted first into the world
        world.getGameObjects().each(function(tank) {
            // constraint:
            // - solve collisions
            that.onCollisionWith(tank, function(that, tank) {
                var desiredDistance = that.radius + tank.radius,
                    distVector = tank.position.sub(that.position),
                    realDistance = distVector.length(),
                    moveVector = distVector.mulFloat((desiredDistance - realDistance) / 1.9);
                tank.position.addSelf(moveVector);
                that.position.subSelf(moveVector);
                //console.log(realDistance, "post", that.position.distance(tank.position, that.radius + tank.radius));
            });
        });

        /*
        // pos -> coords
        bbb.always({
            solver: db,
            allowUnsolvableOperations: true,
            ctx: {
                world: world,
                that: this
            }, methods: function() {
                that.coordinates.formula([that.position, that.position.x, that.position.y], function(pos) {
                    return pos.divVector(world.map.tileSize).sub(new Vector2(0.5, 0.5)).floor();
                });
            }
        }, function() {
            return that.position.divVector(world.map.tileSize).sub(new Vector2(0.5, 0.5)).floor().equals(that.coordinates);
        });

        // coords -> collisionTiles
        bbb.always({
            solver: db,
            allowUnsolvableOperations: true,
            ctx: {
                map: world.map,
                that: this
            }, methods: function() {
                that.collisionTiles.formula([that.coordinates], function(coords) {
                    return {
                        upperLeft: map.get(coords),
                        bottomLeft: map.get(coords.add(new Vector2(0,1))),
                        upperRight: map.get(coords.add(new Vector2(1,0))),
                        bottomRight: map.get(coords.add(new Vector2(1,1)))
                    }
                });
            }
        }, function() {
            return that.collisionTiles.upperLeft === map.get(that.coordinates) &&
                   that.collisionTiles.bottomLeft === map.get(that.coordinates.add(new Vector2(0,1))) &&
                   that.collisionTiles.upperRight === map.get(that.coordinates.add(new Vector2(1,0))) &&
                   that.collisionTiles.bottomRight === map.get(that.coordinates.add(new Vector2(1,1)));
        });
        console.log(that.coordinates, map.get(that.coordinates),that.collisionTiles.upperLeft.index)

        var cassowary = new ClSimplexSolver();
        bbb.always({
            solver: cassowary,
            ctx: {
                that: that
            }
        }, function() {
            return ((that.collisionTiles).upperLeft).index  == 0 &&
                   ((that.collisionTiles).bottomLeft).index  == 0 &&
                   ((that.collisionTiles).upperRight).index  == 0 &&
                   ((that.collisionTiles).bottomRight).index  == 0;
        });
        */
	},

	update: function($super, dt) {
	    $super(dt);
        this.turretAnimation.update(dt);
	},

	draw: function($super, renderer) {
	    $super(renderer);
		this.turretAnimation.draw(
		    renderer, this.getWorldAABB(), this.turretDirection.getDirectedAngle(new Vector2(1,0))
		);
	}
});

Tank.subclass("PlayerTank", {
	initialize: function($super, world, pos) {
	    $super(world, pos);

		this.animation = new Animation(new AnimationSheet("assets/tank.png", 18, 18), 0.4, [0,1,2,3]);
    },

	update: function($super, dt) {
	    this.controls && this.controls.update(dt);

   	    $super(dt);
    }
});

Object.subclass("PlayerControls", {
    initialize: function(player, world, input, viewport) {
        this.player = player;
        this.world = world;
        this.input = input;
        this.viewport = viewport;

        // constraint:
        // - the player tanks turret follows the mouse
		var turretConstraint = bbb.always({
            solver: new DBPlanner(),
            ctx: {
                player: player,
                input: input
            },
            methods: function() {
                player.turretDirection.formula([input.position, input.position.x, input.position.y, player.position, player.position.x, player.position.y], function(mousePosition, mousePositionX, mousePositionY, playerPosition, playerPositionX, playerPositionY) {
                    return mousePosition.sub(playerPosition);
                });
            } }, function() {
                return player.turretDirection.equals((input.mouse).sub(player.position));
		});
		player.constraints.push(turretConstraint);
    },
    update: function(dt) {
        // move player tank
        player.velocity.set(Vector2.Zero);
        if(this.input.state("up")) this.player.velocity.addSelf(new Vector2(0, -1));
        if(this.input.state("left")) this.player.velocity.addSelf(new Vector2(-1, 0));
        if(this.input.state("down")) this.player.velocity.addSelf(new Vector2(0, 1));
        if(this.input.state("right")) this.player.velocity.addSelf(new Vector2(1, 0));

        // player fires a bullet
        if(this.input.pressed("leftclick")) {
            var direction = this.viewport.screenToWorldCoordinates(this.input.mouse)
                .sub(player.position)
                .normalizedCopy();
            var bullet = new Bullet(this.world,
                player.position.add(direction.mulFloat(player.radius + 0.25 + player.speed * dt)),
                direction);
            this.world.getGameObjects().each(function(other) {
                bullet.onCollisionWith(other, function(bullet, other) {
                    // 3 possibilities to avoid this to happen more than one time:
                    // 1. in collision callback:
                    //     if(bullet.alive && other.alive)
                    //     but get not rid of the actual constraint -> slow with more and more bullets
                    // 2. layer each game object
                    //     layer.activeOn(bullet in world)
                    //     but collision callback is linked to 2 game objects
                    // 3. in collision callback
                    //     bullet.unconstrainAND_DISABLE_ALL() to disable all linked constraints
                    //     very general; we instead keep track of these manually and disable all constraints on destroy
                    bullet.destroy();
                    other.destroy();
                });
            });
            this.world.spawn(bullet);
        }
    }
});

Tank.subclass("CPUTank", {
    initialize: function($super, world, pos) {
        $super(world, pos);

		this.animation = new Animation(new AnimationSheet("assets/tank.png", 18, 18), 0.4, [4,5,6,7]);

        this.velocity.set(new Vector2(-1,1));

        // constraint:
        // - keep velocity direction and turret direction in sync
        var that = this;
        var turretConstraint = bbb.always({
            solver: new DBPlanner(),
            ctx: {
                that: that
            },
            methods: function() {
                that.turretDirection.formula([that.velocity, that.velocity.x, that.velocity.y], function(velocity, velocityX, velocityY) {
                    return velocity;
                });
            }
        }, function() {
            return that.turretDirection.equals(that.velocity);
        });

        this.constraints.push(turretConstraint);
    },

	update: function($super, dt) {
	    // adjust direction randomly
	    this.velocity.rotateSelf(Math.PI / 180 * (Math.random() - 0.5) * 50);
        //this.velocity.set(player.position.sub(this.position));
	    $super(dt);
	}
});
