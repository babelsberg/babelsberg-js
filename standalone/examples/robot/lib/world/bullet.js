GameObject.subclass("Bullet", {
	initialize: function($super, world, pos, vel, tank, ricochets, speed) {
	    $super(world, "bullet", pos, new Vector2(0.5, 0.5), 0.25, vel);

		this.animation = new Animation(new AnimationSheet("assets/bullet.png", 7, 7), 0.2, [0,1,2,3,2,1]);

        this.maxReflections = ricochets;
        this.reflectionCount = 0;

   		this.speed = speed * world.map.tileSize.x;

		this.initConstraints();
		this.tank = tank;
	},

	initConstraints: function() {
        var that = this,
            map = this.world.map,
            db = new DBPlanner();

        // constraint idea:
        // separate this into 2 constraints
        // one constraint that triggers the vertical reflection
        // the other just listens on the y-coordinate for the horizontal reflection
        var vertical = bbb.trigger({
            callback: function() {
                if(that.reflectionCount++ == that.maxReflections) {
                    this.disable();
                    that.destroy();
                } else {
                    that.velocity.x *= -1;
                }
            },
            ctx: {
                that: that,
                map: map
            }
        }, function() {
            var pp = that.prevPosition.divVector(map.tileSize).floor();
            var x = that.position.divVector(map.tileSize).floor().x;
            return map.tiles[pp.y][pp.x].canFlyThrough() && !(map.tiles[pp.y][x].canFlyThrough());
        });
        var horizontal = bbb.trigger({
            callback: function() {
                if(that.reflectionCount++ == that.maxReflections) {
                    this.disable();
                    that.destroy();
                } else {
                    that.velocity.y *= -1;
                }
            },
            ctx: {
                that: that,
                map: map
            }
        }, function() {
            var pp = that.prevPosition.divVector(map.tileSize).floor();
            var y = that.position.divVector(map.tileSize).floor().y;
            return map.tiles[pp.y][pp.x].canFlyThrough() && !(map.tiles[y][pp.x].canFlyThrough());
        });

        this.constraints.push(vertical, horizontal);
	},
	destroy: function($super) {
        $super();
        this.tank.bullets++;
	}
});

Bullet.SPEED_NORMAL = 16 / 3.7;
Bullet.SPEED_FAST = 1.5 * Bullet.SPEED_NORMAL;
