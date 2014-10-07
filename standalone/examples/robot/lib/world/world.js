Object.subclass("World", {
	initialize: function(boundary) {
	    this.updateCount = 0;
		this.boundary = boundary;
		this.gameObjects = [];
		this.map = new Map(new Vector2(2,2),
		[[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
		 [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
		 [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
		 [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
		 [1,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
		 [1,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
		 [1,0,0,0,0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,0,0,0,0,1],
		 [1,0,0,0,0,1,1,1,2,2,0,0,0,0,2,2,1,1,1,1,1,1,1,1],
		 [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
		 [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
		 [1,1,1,1,1,1,1,1,2,2,0,0,0,0,2,2,1,1,1,0,0,0,0,1],
		 [1,0,0,0,0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,0,0,0,0,1],
		 [1,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
		 [1,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
		 [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
		 [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
		 [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
		 [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]]
		);

        player = new PlayerTank(this, new Vector2(15, 12));
        this.spawn(player);

        [new Vector2(40, 12), new Vector2(10, 26), new Vector2(40, 26)].each(function(enemyPosition) {
            var cpu = new CPUTank(this, enemyPosition);
            this.spawn(cpu);
        }, this)
	},
	
	update: function(dt) {
	    this.updateCount++;
		this.gameObjects.forEach(function(gameObject) {
		    gameObject.update(dt)
		});
	},
	
	draw: function(renderer) {
		this.map.draw(renderer);

		var objectCount = this.gameObjects.length;
		for(var i = 0; i < objectCount; i++) {
			this.gameObjects[i].draw(renderer);
		}
	},

	/*
	 * Manage GameObjects
	 */
	spawn: function(gameObject) { this.gameObjects.push(gameObject); },
	getGameObjects: function() { return this.gameObjects; }
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
                var min = new Vector2(x, y).mulVector(this.tileSize);
                this.spriteSheet.draw(
                    renderer,
                    new AABB(min, min.add(this.tileSize)),
                    tile.index
                );
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

