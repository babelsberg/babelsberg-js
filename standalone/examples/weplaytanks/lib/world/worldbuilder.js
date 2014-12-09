// TODO: remove unused dependencies
define(["./world", "./../levels/levels", "./config", "./../rendering/animationsheet"], function WorldBuilder(World, Levels, TankConfig, AnimationSheet) {
    var WorldBuilder = Object.subclass("WorldBuilder", {
        initialize: function(game) {
            this.game = game;
        },
        buildWorld: function(level) {
            var world = new World();

            world.map = new Map(
                new Vector2(2,2), level.map
            );

            player = this.buildPlayer(world, level.player);
            this.buildEnemies(world, level.enemyTanks);

            return world;
        },
        buildPlayer: function(world, description) {
            var game = this.game;
            var player = this.buildTank(
                world,
                PlayerTank,
                Vector2.fromJson(description.position),
                Vector2.fromJson(description.velocity),
                Vector2.fromJson(description.turretDirection),
                TankConfig.Player
            );

            // constraint:
            // - retry level, if your tank was destroyed
            bbb.trigger({
                callback: function() {
                    this.disable();
                    console.log("TRY AGAIN");
                    game.resetLevel();
                },
                ctx: {
                    player: player
                }
            }, function() {
                return player.alive == false;
            });

            return player;
        },
        buildEnemies: function(world, enemyDescriptions) {
            var game = this.game;
            var enemyTanks = enemyDescriptions.map(function(enemyDescription) {
                return this.buildTank(
                    world,
                    CPUTank,
                    Vector2.fromJson(enemyDescription.position),
                    Vector2.fromJson(enemyDescription.velocity),
                    Vector2.fromJson(enemyDescription.turretDirection),
                    TankConfig[enemyDescription.type]
                );
            }, this);

            // constraint:
            // - you win, if all enemy tanks
            bbb.trigger({
                callback: function() {
                    this.disable();
                    console.log("WIN");
                    game.nextLevel();
                },
                ctx: {
                    enemyTanks: enemyTanks
                }
            }, function() {
                var won = true;
                for(var i = 0; i < enemyTanks.length; i++) {
                    won = won && !enemyTanks[i].alive;
                }
                return won == true;
            });
        },
        buildTank: function(world, TankClass, pos, vel, dir, config) {
            var cpu = new (TankClass)(world, pos, vel, dir, config);
            cpu.controls = new (config.intelligence)(cpu, world, this.game.input, this.game.viewport);
            world.spawn(cpu);
            return cpu;
        }
    });

    return WorldBuilder;
});
