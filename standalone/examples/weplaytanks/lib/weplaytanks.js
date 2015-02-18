require([
    // TODO: remove unused dependencies
    "./base/loop",
    "./rendering/loadimage",
    "./game/loadlevel",
    "./game/game",
    "./plugins/pluginloader"
], function main(
    Loop,
    loadImage,
    loadLevel,
    Game,
    PluginLoader
) {
    var canvasId = "game",
        game = new Game(canvasId);

    // prepare stats
    var stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    document.body.appendChild( stats.domElement );

    // main loop
    var loop = new Loop(function(dt) {
        stats.update();
        game.update(dt);
    });

    // asset loading
    queue()
        .defer(loadLevel, 0, 'game/0_tutorial.json')
        .defer(loadLevel, 1, 'game/1_movingtank.json')
        .defer(loadLevel, 2, 'demo/2_twotanks.json')
        .defer(loadLevel, 3, 'demo/3_singlehunter.json')
        .defer(loadLevel, 4, 'game/5_borderline.json')
        .defer(loadLevel, 5, 'game/6_hunter2.json')
        .defer(loadLevel, 6, 'demo/7_demo.json')
        .defer(loadLevel, 7, 'game/2_multipletanks.json')
        .defer(loadLevel, 8, 'game/3_grid.json')
        .defer(loadLevel, 9, 'game/4_hunter.json')

        .defer(loadImage, "tileset.png")
        .defer(loadImage, "tank.png")
        .defer(loadImage, "turret.png")
        .defer(loadImage, "bullet.png")
        .defer(loadImage, "target.png")
        .defer(loadImage, "powerups.png")

        .await(function(error) {
            if(error) {
                console.error("error while loading", error);
            } else {
                game.prepare();
                loop.start();
            }
        });
});
