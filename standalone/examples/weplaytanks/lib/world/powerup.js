define(["./gameobject", "./../rendering/animation", "./../rendering/animationsheet"], function modulePowerUp(GameObject, Animation, AnimationSheet) {
    var PowerUp = GameObject.subclass("PowerUp", {
        initialize: function($super, world, pos) {
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
        }
    });

    PowerUp.Spring = PowerUp.subclass("PowerUp.Spring", {
        sheetIndex: 5,
        bestow: function(tank) {
            tank.bulletRicochets++;
        }
    });

    return PowerUp
});
