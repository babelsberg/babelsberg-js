define(function loop() {
    var Loop = Object.subclass("Loop", {
        initialize: function(func) {
            this.func = func;
        },
        start: function() {
            this.update();
        },
        update: function() {
            this.func();
            requestAnimationFrame(this.update.bind(this));
        }
    });

    return Loop;
});
