define([], function Editor() {
    return Object.subclass("Editor", {
        initialize: function(game) {
            this.game = game;
        },

        draw: function(renderer) {
        }
    });
});
