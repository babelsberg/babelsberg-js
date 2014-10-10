// possible constraints:
// - your direction should be normalized
// - your speed is limited to maxSpeed (cannot adjust speed?)
// - your velocity is direction.mulFloat(dt*speed)
GameObject.subclass("Tank", {
	initialize: function($super, world, pos, vel, dir, config) {
	    $super(world, "tank", pos, new Vector2(2, 2), 1, vel, config.speed);

        this.turretDirection = dir;
        this.turretAnimation = new Animation(new AnimationSheet("assets/turret.png", 18, 18), 0.4, [0,1,2,3]);

        this.bullets = config.bullets;
        this.bulletRicochets = config.bulletRicochets;
        this.bulletSpeed = config.bulletSpeed;

		this.initConstraints();
    },
    initConstraints: function() {
        var that = this,
            map = this.world.map;

        // constraint:
        // - do not be on a wall tile
        bbb.assert({
            // collision solving is already provided by the babelsberg.assert
            // method and its ability the revert to a valid state
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
            // collision detection against the current tile
            var pos = that.position.divVector(map.tileSize).floor();
            return map.tiles[pos.y][pos.x].canWalkThrough();
        });

        // assumption: tanks are inserted first into the world
        this.world.getGameObjects().each(function(tank) {
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
	},

	update: function($super, dt) {
	    this.controls && this.controls.update(dt);

	    $super(dt);
        this.turretAnimation.update(dt);
	},

	draw: function($super, renderer) {
	    $super(renderer);
		this.turretAnimation.draw(
		    renderer, this.getWorldAABB(true), this.turretDirection.getDirectedAngle(new Vector2(1,0))
		);
	},

    fireBullet: function(world, dt) {
        if(this.bullets == 0) { return; }
        this.bullets--;

        var direction = this.turretDirection.normalizedCopy();
        var bullet = new Bullet(world,
            this.position.add(direction.mulFloat(this.radius + 0.25 + this.speed * dt)),
            direction,
            this,
            this.bulletRicochets,
            this.bulletSpeed
        );
        world.getGameObjects().each(function(other) {
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
        world.spawn(bullet);
    }
});

Tank.subclass("PlayerTank", {
	initialize: function($super, world, pos, vel, dir, config) {
	    $super(world, pos, vel, dir, config);

		this.animation = new Animation(new AnimationSheet("assets/tank.png", 18, 18), 0.4, [0,1,2,3]);
    }
});

Tank.subclass("CPUTank", {
    initialize: function($super, world, pos, vel, dir, config) {
        $super(world, pos, vel, dir, config);

		this.animation = new Animation(new AnimationSheet("assets/tank.png", 18, 18), 0.4, [4,5,6,7]);

        // constraint:
        // - keep velocity direction and turret direction in sync
        /*
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
        */
	}
});

Tank.SPEED_IMMOBILE = 0;
Tank.SPEED_NORMAL = 16 / 6;
Tank.SPEED_SLOW = 0.5 * Tank.SPEED_NORMAL;
Tank.SPEED_FAST = 1.5 * Tank.SPEED_NORMAL;
