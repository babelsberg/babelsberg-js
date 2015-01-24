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

    var PowerUp = Object.subclass("PowerUp", {
        initialize: function(duration) {
            this.duration = duration;
        },
        activate: function(tank) {
            this.getTarget(tank).each(function(target) {
                this.setupTimer(target);
            }, this);

        },
        getTarget: function(tank) {
            return [tank];
        },
        setupTimer: function(tank) {
            if(tank.powerUps[this.key]) {
                tank.powerUps[this.key].reset();
            } else {
                var timer = new Timer(this.duration);
                this.bestow(tank, timer.activeLayer);
                tank.powerUps[this.key] = timer;
            }
        }
    });

    PowerUp.Spring = PowerUp.subclass("PowerUp.Spring", {
        key: "spring",
        sheetIndex: [5],
        bestow: function(tank, layer) {
            layer.refineObject(tank, {
                getBulletRicochets: function() {
                    return cop.proceed() + 1;
                }
            });
        }
    });
    PowerUp.Shield = PowerUp.subclass("PowerUp.Shield", {
        key: "shield",
        sheetIndex: [4],
        bestow: function(tank, layer) {
            layer.refineObject(tank, {
                destroy: function() {}
            });
        }
    });
    PowerUp.Sticky = PowerUp.subclass("PowerUp.Sticky", {
        key: "sticky",
        sheetIndex: [27],
        bestow: function(tank, layer) {
            layer.refineObject(tank, {
                move: function() {}
            });
        }
    });
    PowerUp.Homing = PowerUp.subclass("PowerUp.Homing", {
        key: "homing",
        sheetIndex: [6],
        bestow: function(tank, layer) {
            layer.refineObject(tank, {
                destroy: function() {}
            });
        }
    });

    var Collectible = GameObject.subclass("Collectible", {
        initialize: function($super, world, description) {
            var pos = Vector2.fromJson(description.position);
            $super(world, "powerup", pos, new Vector2(1.5, 1.5), 0.75, Vector2.Zero.copy(), 0);

            this.powerUp = new PowerUp[description.type](description.timeout);
            this.animation = new Animation(new AnimationSheet("powerups.png", 20, 20), 1.0, this.powerUp.sheetIndex);

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
            this.powerUp.activate(tank);
        }
    });

    return Collectible;
});
