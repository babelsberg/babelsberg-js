require([
    "./input",
    "./gui",
    "./view/viewport",
    "./world/world",
    "./world/tank",
    "./world/controls",
    "./world/gameobject",
    "./rendering/renderer",
    "./rendering/loadimage",
    "./base/timer",
    "./base/loop",
    "./game/loadlevel",
    "./game/game"
], function main(
    Input,
    Gui,
    Viewport,
    WorldBuilder,
    Tank,
    Controls,
    GameObject,
    Renderer,
    loadImage,
    Timer,
    Loop,
    loadLevel,
    Game
) {
    //window.onload = function() {
        var canvasId = "game",
            game = new Game(canvasId);

        // prepare stats
        var stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';
        document.body.appendChild( stats.domElement );

        // main loop
        var timer = new Timer();
        function animate() {
            stats.update();
            var dt = timer.update();
            game.update(dt);
        }
        var loop = new Loop(animate);

        // asset loading
        queue()
            /*
             * Demo Maps
             */
            .defer(loadLevel, 0, 'game/0_tutorial.json')
            .defer(loadLevel, 1, 'game/1_movingtank.json')
            .defer(loadLevel, 2, 'demo/2_twotanks.json')
            .defer(loadLevel, 3, 'demo/3_singlehunter.json')
            .defer(loadLevel, 4, 'game/5_borderline.json')
            .defer(loadLevel, 5, 'game/6_hunter2.json')
            .defer(loadLevel, 6, 'demo/7_demo.json')
            /*
             * Game Maps
            .defer(loadLevel, 0, 'game/0_tutorial.json')
            .defer(loadLevel, 1, 'game/1_movingtank.json')
            .defer(loadLevel, 2, 'game/2_multipletanks.json')
            .defer(loadLevel, 3, 'game/3_grid.json')
            .defer(loadLevel, 4, 'game/4_hunter.json')
            .defer(loadLevel, 5, 'game/5_borderline.json')
            .defer(loadLevel, 6, 'game/6_hunter2.json')
             */
            .defer(loadImage, "tileset.png")
            .defer(loadImage, "tank.png")
            .defer(loadImage, "turret.png")
            .defer(loadImage, "bullet.png")
            .defer(loadImage, "target.png")
            .await(function(error) {
                if(error) {
                    console.error("error while loading", error);
                } else {
                    console.log(arguments[1]);
                    game.prepare();
                    loop.start();
                }
            });
    //};
});
