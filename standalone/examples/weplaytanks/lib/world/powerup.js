define(["./gameobject", "./../rendering/animation", "./../rendering/animationsheet"], function modulePowerUp(GameObject, Animation, AnimationSheet) {
    var Timer = Object.subclass("Timer", {
        initialize: function(time) {
            var that = this;

            this.time = this.startingTime = time;
            this.activeLayer = new Layer().activeOn({
                ctx: {
                    that: that
                }
            }, function() {
                return that.time > 0;
            });
        },
        update: function(dt) {
            this.time -= dt;
        },
        reset: function() {
            this.time = this.startingTime;
        }
    });

    var Collectible = GameObject.subclass("Collectible", {
        sheetIndex: 5,
        initialize: function($super, world, description) {
            var pos = Vector2.fromJson(description.position);
            $super(world, "powerup", pos, new Vector2(1.5, 1.5), 0.75, Vector2.Zero.copy(), 0);

            this.animation = new Animation(new AnimationSheet("powerups.png", 20, 20), 1.0, [this.sheetIndex]);

            this.initConstraints();
        },
        initConstraints: function() {
            // assumption: powerups are inserted right after tanks into the world
            this.world.getGameObjects().each(function(other) {
                if(other.name != "tank") { return; }

                // constraint:
                // - get powerup by touching it
                this.onCollisionWith(other, function(that, tank) {
                    that.bestow(tank);
                    that.destroy();
                });
            }, this);
        },
        bestow: function(tank) {

        }
    });

    Collectible.Spring = Collectible.subclass("Collectible.Spring", {
        bestow: function(tank) {
            if(tank.powerUps.spring) {
                tank.powerUps.spring.reset();
            } else {
                var timer = new Timer(10);
                timer.activeLayer.refineObject(tank, {
                    getBulletRicochets: function() {
                        return cop.proceed() + 1;
                    }
                });

                tank.powerUps.spring = timer;
            }
        }
    });

    return Collectible;
});
