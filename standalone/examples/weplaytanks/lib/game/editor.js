define([
    "./../rendering/animation",
    "./../rendering/animationsheet"
], function Editor(
    Animation,
    AnimationSheet
) {

    return Object.subclass("Editor", {
        initialize: function(game) {
            this.game = game;
            this.animation = new Animation(new AnimationSheet("powerups.png", 20, 20), 0.25, [21, 22, 23, 22]);
            var input = game.input;

            EditorLayer
                .activeOn({
                    ctx: {
                        input: input
                    }
                }, function() {
                    return input.switchedOn("pause");
                }).trigger({
                    callback: this.modifyTileType.bind(this),
                    ctx: {
                        input: input
                    }
                }, function() {
                    return input.pressed("leftclick");
                });
        },

        update: function(dt) {
            this.animation.update(dt);
        },

        draw: function(renderer) {
            var map = this.game.world.map,
                size = map.tileSize,
                index = map.positionToCoordinates(this.game.input.position)
                min = index.mulVector(size)
                max = min.add(size);

            this.animation.draw(renderer, new AABB(min, max));
        },

        modifyTileType: function() {
            var map = this.game.world.map;
            var tile = map.get(
                map.positionToCoordinates(this.game.input.position)
            );
            tile.index = (tile.index + 1) % 3;
        }
    });
});
