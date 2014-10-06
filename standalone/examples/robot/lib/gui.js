var Gui = function(world, input, player, viewport) {
    this.input = input;
    this.player = player;

    var spriteSheet = new AnimationSheet("assets/target.png", 52, 52);
    var crossHairsAnimation = new Animation(spriteSheet, 100, [0]);
    var bubbleAnimation = new Animation(spriteSheet, 100, [1]);

    this.bubbles = [0.2, 0.4, 0.6, 0.8, 1.0].map(function(t, i) {
        var bubble = new Gui.Bubble(t == 1.0 ? crossHairsAnimation : bubbleAnimation, t, world, input, player, viewport);
        // TODO: add constraints here
        bbb.always({
            solver: new DBPlanner(),
            ctx: {
                bubble: bubble,
                player: player,
                input: input,
                t: t,
                viewport: viewport
            },
            methods: function() {
                bubble.position.formula([input.mouse, input.mouse.x, input.mouse.y, player.position, player.position.x, player.position.y], function(mouse, mouseX, mouseY, srcPosition, srcPositionX, srcPositionY) {
                    return mouse.mulFloat(t).add(
                        viewport.worldToScreenCoordinates(srcPosition).mulFloat(1-t)
                    );
                });
            } }, function() {
            var r = bubble.position.equals(input.mouse.mulFloat(t).add(
                viewport.worldToScreenCoordinates(player.position).mulFloat(1-t)
            ));
            return r;
        });
        return bubble;
    });

};

Gui.prototype.update = function(dt) {
    this.bubbles.forEach(function(bubble) {
        bubble.update(dt);
    });
};

Gui.prototype.draw = function(renderer) {
    this.bubbles.forEach(function(bubble) {
        bubble.draw(renderer);
    });
};

Gui.Bubble = function(animation, t, world, input, player, viewport) {
    this.animation = animation;
    this.position = Vector2.Zero.copy();

    this.t = t;
    this.input = input;
    this.viewport = viewport;
    this.player = player;
};

Gui.Bubble.prototype.update = function(dt) {
    this.animation.update(dt);
};

Gui.Bubble.prototype.draw = function(renderer) {
    var halfSize = new Vector2(13, 13);
    this.animation.draw(renderer, new AABB(
        this.position.sub(halfSize),
        this.position.add(halfSize)
    ));
};
