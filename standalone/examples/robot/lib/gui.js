var Gui = function(world, input, player, viewport) {
    this.input = input;
    this.player = player;

    var spriteSheet = new AnimationSheet("assets/target.png", 52, 52);
    var crossHairsAnimation = new Animation(spriteSheet, 100, [0]);
    var bubbleAnimation = new Animation(spriteSheet, 100, [1]);

    this.bubbles = [0.2, 0.4, 0.6, 0.8, 1.0].map(function(t, i) {
        var bubble = new Gui.Bubble(t == 1.0 ? crossHairsAnimation : bubbleAnimation, t, world, input, player, viewport);
        // TODO: add constraints here
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
    this.position.set(
        this.input.mouse.mulFloat(this.t).add(
            this.viewport.worldToScreenCoordinates(this.player.position).mulFloat(1-this.t)
        )
    );
};

Gui.Bubble.prototype.draw = function(renderer) {
    var halfSize = new Vector2(13, 13);
    this.animation.draw(renderer, new AABB(
        this.position.sub(halfSize),
        this.position.add(halfSize)
    ));
};
