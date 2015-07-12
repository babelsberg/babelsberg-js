Object.subclass("World", {
    initialize: function(boundary) {
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
    },
    
    update: function(dt) {
        var objectCount = this.gameObjects.length;
        for(var i = 0; i < objectCount; i++) {
            this.gameObjects[i].update(dt);
        }
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
    spawn: function(gameObject) { gameObject.addToWorld(this); },
    addGameObject: function(entity) { this.gameObjects.push(entity); },
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
    }
});

Object.subclass("Tile", {
    initialize: function(index) {
        this.index = index;
    }
});

