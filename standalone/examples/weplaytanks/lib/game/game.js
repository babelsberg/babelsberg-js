define([
    "./../input",
    "./../gui",
    "./../view/viewport",
    "./../world/worldbuilder",
    "./../rendering/renderer",
    "./../game/debuglayer"
], function Game(
    Input,
    Gui,
    Viewport,
    // TODO: extract WorldBuilder, Tile, ... from World
    WorldBuilder,
    Renderer,
    DebugLayer
) {
    var Game = Object.subclass("Game", {
        initialize: function(canvasId) {
            this.buildCanvas(canvasId);
            this.buildInput(canvasId);
            this.renderer = new Renderer(this.canvas);
            this.buildViewport();
            this.constrainDebugLayer();
            this.levels = new LevelPointer();
        },
        buildCanvas: function(canvasId) {
            this.canvas = document.getElementById(canvasId);
            this.canvas.style.position = "absolute";
            this.canvas.style.top = "0px";
            this.canvas.style.left = "0px";
            this.canvas.style["z-index"] = -1;
        },
        buildInput: function(canvasId) {
            this.input = new Input(canvasId);

            this.input.bind(Input.KEY.W, "up");
            this.input.bind(Input.KEY.A, "left");
            this.input.bind(Input.KEY.S, "down");
            this.input.bind(Input.KEY.D, "right");

            this.input.bind(Input.KEY.UP_ARROW, "up");
            this.input.bind(Input.KEY.LEFT_ARROW, "left");
            this.input.bind(Input.KEY.DOWN_ARROW, "down");
            this.input.bind(Input.KEY.RIGHT_ARROW, "right");

            this.input.bind(Input.KEY.MOUSE1, "leftclick");
            this.input.bind(Input.KEY.MOUSE2, "rightclick");
            this.input.bind(Input.KEY.MWHEEL_UP, "zoomIn");
            this.input.bind(Input.KEY.MWHEEL_DOWN, "zoomOut");

            this.input.bind(Input.KEY.P, "debug");
        },
        buildViewport: function() {
            var input = this.input,
                viewport = this.viewport = new Viewport(
                    new Vector2(30, 30* this.canvas.height/this.canvas.width),
                    new Vector2(60, 60 * this.canvas.height/this.canvas.width)
                );

            // constraint:
            // - keep input position in world and mouse on screen in sync
            // old, fast version
            bbb.always({
                solver: new DBPlanner(),
                ctx: {
                    input: input,
                    viewport: viewport
                },
                methods: function() {
                    input.position.formula([input.mouse, input.mouse.x, input.mouse.y], function(mouse, mouseX, mouseY) {
                        return viewport.screenToWorldCoordinates(mouse);
                    });
                }
            }, function() {
                return input.position.equals(viewport.screenToWorldCoordinates(input.mouse));
            });

/*
            // new clean but slow version using automatic inference of formulas
            always: {
                solver: new DBPlanner()
                input.position.equals(viewport.screenToWorldCoordinates(input.mouse))
            }
*/
        },
        constrainDebugLayer: function() {
            var input = this.input;

            // do not debugdraw velocities if debug button is pressed
            DebugLayer.activeOn({
                ctx: {
                    input: input
                }
            }, function() {
                return input.switchedOn("debug") == true;
            });
        },
        prepare: function() {
            this.resetLevel();
        },
        resetLevel: function() {
            this.createLevel(this.levels.get());
        },
        nextLevel: function() {
            this.createLevel(this.levels.next());
        },
        createLevel: function(level) {
            this.cleanUp();
            var builder = new WorldBuilder(this);
            this.world = builder.buildWorld(level);

            this.gui = new Gui(this.world, this.input, player, this.viewport);
        },
        cleanUp: function() {
            // TODO
        },
        update: function(dt) {
            this.updatePhysics(dt);
            this.gui.update(dt);
            this.draw();

            this.input.clearPressed();
        },
        updatePhysics: function(dt) {
            this.world.update(dt);
        },
        draw: function() {
            this.renderer.clear();
            this.renderer.withViewport(this.viewport, (function() {
                this.world.draw(this.renderer);
            }).bind(this));
            this.gui.draw(this.renderer);
        }
    });

    return Game;
});
