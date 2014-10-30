Object.subclass("Levels");
Levels = [
    {
        map: [[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
              [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,1,1,1,2,2,0,0,0,0,2,2,1,1,1,1,1,1,1,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,1,1,1,1,1,1,1,2,2,0,0,0,0,2,2,1,1,1,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
              [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]],
        player: {
            position: new Vector2(5, 12),
            velocity: Vector2.Zero.copy(),
            turretDirection: new Vector2(1,0.5)
        },
        enemyTanks: [
            {
                type: Tank.BrownTurret,
                position: new Vector2(41, 13),
                velocity: Vector2.Zero.copy(),
                turretDirection: new Vector2(1, 0.5)
            },
            {
                type: Tank.BrownTurret,
                position: new Vector2(31, 5),
                velocity: Vector2.Zero.copy(),
                turretDirection: new Vector2(1, 0.5)
            },
            {
                type: Tank.GreySoldier,
                position: new Vector2(10, 27),
                velocity: new Vector2(1,1),
                turretDirection: new Vector2(1, 0.5)
            },
            {
                type: Tank.TealHunter,
                position: new Vector2(40, 27),
                velocity: new Vector2(0,1),
                turretDirection: new Vector2(1, 0.5)
            }
        ]
    }
];
Object.subclass("WorldBuilder", {
    initialize: function(game) {
        this.game = game;
    },
    buildWorld: function(level) {
        var world = new World();

		world.map = new Map(
		    new Vector2(2,2), level.map
		);

        player = this.buildPlayer(world, level.player);

        var e1 = this.buildTank(
            world,
            CPUTank,
            level.enemyTanks[0].position,
            level.enemyTanks[0].velocity,
            level.enemyTanks[0].turretDirection,
            level.enemyTanks[0].type
        );
        var e2 = this.buildTank(
            world,
            CPUTank,
            level.enemyTanks[1].position,
            level.enemyTanks[1].velocity,
            level.enemyTanks[1].turretDirection,
            level.enemyTanks[1].type
        );
        var e3 = this.buildTank(
            world,
            CPUTank,
            level.enemyTanks[2].position,
            level.enemyTanks[2].velocity,
            level.enemyTanks[2].turretDirection,
            level.enemyTanks[2].type
        );
        /*
        var e4 = this.buildTank(
            world,
            CPUTank,
            level.enemyTanks[3].position,
            level.enemyTanks[3].velocity,
            level.enemyTanks[3].turretDirection,
            level.enemyTanks[3].type
        );
        */

        // trigger new level
        bbb.trigger({
            callback: function() {
                this.disable();
                console.log("TRY AGAIN");
            },
            ctx: {
                player: player
            }
        }, function() {
            return player.alive == false;
        });

        var arr = [e1, e2, e3],
            arrLength = arr.length;

        bbb.trigger({
            callback: function() {
                this.disable();
                console.log("WIN");
            },
            ctx: {
                arr: arr,
                arrLength: arrLength
            }
        }, function() {
            var won = true;
            for(var i = 0; i < arr.length; i++) {
                won = won && !arr[i].alive;
            }
            return won == true;
        });

        /*
        bbb.trigger({
            callback: function() {
                this.disable();
                console.log("WIN");
            },
            ctx: {
                e1: e1,
                e2: e2,
                e3: e3,
                e4: e4
            }
        }, function() {
            return !e1.alive && !e2.alive && !e3.alive && !e4.alive;
        });
        */

        return world;
	},
	buildPlayer: function(world, description) {
        var player = this.buildTank(
            world,
            PlayerTank,
            description.position,
            description.velocity,
            description.turretDirection,
            Tank.Player
        );
	    return player;
	},
	buildTank: function(world, TankClass, pos, vel, dir, config) {
        var cpu = new (TankClass)(world, pos, vel, dir, config);
        cpu.controls = new (config.intelligence)(cpu, world, this.game.input, this.game.viewport);
        world.spawn(cpu);
        return cpu;
    }
});

Object.subclass("World", {
	initialize: function() {
		this.gameObjects = [];
	},

	update: function(dt) {
		this.gameObjects.forEach(function(gameObject) {
		    gameObject.update(dt);
		});
	},
	
	draw: function(renderer) {
		this.map.draw(renderer);

		this.gameObjects.forEach(function(gameObject) {
		    gameObject.draw(renderer);
		});
	},

	spawn: function(gameObject) { this.gameObjects.push(gameObject); },
	getGameObjects: function() { return this.gameObjects; },
	remove: function(gameObject) { this.gameObjects.remove(gameObject); }
});

Object.subclass("Map", {
	initialize: function(tileSize, tiles) {
	    this.tileSize = tileSize;
		this.tiles = _.map(tiles, function(stripe) {
            return _.map(stripe, function(tileIndex) {
                return new Tile(tileIndex);
            });
        });
		this.size = new Vector2(this.tiles[0].length, this.tiles.length);
        this.spriteSheet = new AnimationSheet("assets/tileset.png", 32, 32);
	},

	draw: function(renderer) {
		_.each(this.tiles, function(stripe, y) {
            _.each(stripe, function(tile, x) {
                // TODO: move this to Tile.draw
                var min = new Vector2(x, y).mulVector(this.tileSize);
                this.spriteSheet.draw(
                    renderer,
                    new AABB(min, min.add(this.tileSize)),
                    tile.index
                );
                // TODO: extract to DebugLayer
                if(tile.marked) {
                    renderer.drawRectangle(
                        min.add(this.tileSize.mulFloat(0.5)),
                        25,
                        tile.marked,
                        1
                    );
                }
                tile.marked = false;
            }, this);
		}, this);
	},

	get: function(coords) {
	    return this.tiles[coords.y][coords.x];
	},

	positionToCoordinates: function(pos) {
        return pos
            .divVector(this.tileSize)
            .floor();
	},

	coordinatesToPosition: function(coords) {
	    return this.tiles[coords.y][coords.x];
	}
});

Object.subclass("Tile", {
	initialize: function(index) {
		this.index = index;
	},
	canWalkThrough: function() {
	    return this.index == 0;
	},
	canFlyThrough: function() {
	    return this.index != 1;
	}
});
