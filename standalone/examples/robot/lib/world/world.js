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
        this.buildEnemies(world, level.enemyTanks);

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
	buildEnemies: function(world, enemyDescriptions) {
        var e1 = this.buildTank(
            world,
            CPUTank,
            enemyDescriptions[0].position,
            enemyDescriptions[0].velocity,
            enemyDescriptions[0].turretDirection,
            enemyDescriptions[0].type
        );
        var e2 = this.buildTank(
            world,
            CPUTank,
            enemyDescriptions[1].position,
            enemyDescriptions[1].velocity,
            enemyDescriptions[1].turretDirection,
            enemyDescriptions[1].type
        );
        var e3 = this.buildTank(
            world,
            CPUTank,
            enemyDescriptions[2].position,
            enemyDescriptions[2].velocity,
            enemyDescriptions[2].turretDirection,
            enemyDescriptions[2].type
        );
        var e4 = this.buildTank(
            world,
            CPUTank,
            enemyDescriptions[3].position,
            enemyDescriptions[3].velocity,
            enemyDescriptions[3].turretDirection,
            enemyDescriptions[3].type
        );

        var arr = [e1, e2, e3, e4];

        // constraint:
        // - you win, if all enemy tanks
        bbb.trigger({
            callback: function() {
                this.disable();
                console.log("WIN");
            },
            ctx: {
                arr: arr
            }
        }, function() {
            var won = true;
            for(var i = 0; i < arr.length; i++) {
                won = won && !arr[i].alive;
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
