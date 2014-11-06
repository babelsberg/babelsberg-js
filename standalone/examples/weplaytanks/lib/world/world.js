Levels = [];

Object.subclass("LevelPointer", {
    initialize: function() {
        this.reset();
    },
    reset: function() {
        this.currentLevel = 0;
    },
    get: function() {
        return Levels[this.currentLevel];
    },
    next: function() {
        this.currentLevel++;
        return this.get();
    }
});

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
            Tank.Player
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
                Tank[enemyDescription.type]
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
	},

	draw: function(renderer) {
		_.each(this.tiles, function(stripe, y) {
            _.each(stripe, function(tile, x) {
                tile.draw(renderer, x, y, this.tileSize);
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
        this.spriteSheet = new AnimationSheet("tileset.png", 32, 32);
	},
	canWalkThrough: function() {
	    return this.index == 0;
	},
	canFlyThrough: function() {
	    return this.index != 1;
	},
	draw: function(renderer, x, y, size) {
        var min = new Vector2(x, y).mulVector(size);
        this.spriteSheet.draw(
            renderer,
            new AABB(min, min.add(size)),
            this.index
        );
	}
});
