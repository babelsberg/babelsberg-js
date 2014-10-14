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
            return that.getTile(that.position).canWalkThrough();
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
	    $super(dt);
        this.turretAnimation.update(dt);

	    this.controls && this.controls.update(dt);
	},

	draw: function($super, renderer) {
	    $super(renderer);
		this.turretAnimation.draw(
		    renderer, this.getWorldAABB(true), this.turretDirection.getDirectedAngle(new Vector2(1,0))
		);
	},

    fireBullet: function(world, dt) {
        if(this.bullets == 0) { return; }

        var direction = this.turretDirection.normalizedCopy();
        var position = this.position.add(direction.mulFloat(this.radius + 0.25 + dt));
        // blowback
        this.position.subSelf(direction.mulFloat(1));

        if(!this.getTile(position).canFlyThrough()) { return; }

        this.bullets--;
        var bullet = new Bullet(world,
            position,
            direction,
            this,
            this.bulletRicochets,
            this.bulletSpeed
        );
        world.getGameObjects().each(function(other) {
            if(other === this) { return; }
            bullet.onCollisionWith(other, Bullet.detonate);
        }, this);
        world.spawn(bullet);
    },
    destroy: function($super) {
        $super();
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
