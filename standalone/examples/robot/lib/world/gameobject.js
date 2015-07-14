Object.subclass("GameObject", {
    initialize: function(world, name, pos, extent, radius) {
        this.world = world;
        this.name = name;

        this.position = pos;
        this.prevPosition = pos.copy();
        this.coordinates = Vector2.Zero.copy().sub(new Vector2(-1,-1));
        this.collisionTiles = {
            upperLeft:false,
            bottomLeft:true,
            upperRight:true,
            bottomRight:true
        };

        this.velocity = Vector2.Zero.copy();

        this.radius = 5;
        this.extent = extent;
        this.speed = 3;
    },

    update: function(dt) {
        this.prevPosition.set(this.position);

        var deltaPos = this.velocity.normalizedCopy().mulFloat(dt*this.speed);
        this.position.addSelf(deltaPos);

        if(typeof this.animation !== "undefined")
            this.animation.update(dt);
    },
    
    draw: function(renderer) {
        if(typeof this.animation !== "undefined") {
            var halfSize = this.extent.divFloat(2);
            var aabb = new AABB(
                this.position.sub(halfSize),
                this.position.add(halfSize)
            );
            this.animation.draw(renderer, aabb);
        }

        renderer.drawLine(this.position, this.position.add(this.velocity.mulFloat(5)), "red", 1, 3);
    },

    getTile: function(pos) {
        return this.world.map.get(this.world.map.positionToCoordinates(pos));
    }
});

// possible constraints:
// ---
// - your direction should be normalized
// - your speed is limited to maxSpeed (cannot adjust speed?)
// - your velocity is direction.mulFloat(dt*speed)
GameObject.subclass("Tank", {
    initialize: function($super, world, pos) {
        $super(world, "tank", pos, new Vector2(2, 2), 1);

        this.animation = new Animation(new AnimationSheet("assets/tank.png", 18, 18), 0.4, [0,1,2,3]);
        this.speed = 16 / 6 * world.map.tileSize.x;

        this.initConstraints(world);
    },
    initConstraints: function(world) {
        var that = this,
            map = world.map;

        // constraint:
        // - do not be on a wall tile
        bbb.assert({
            onError: function(error) {
                if(!error instanceof ContinuousAssertError) {
                    throw error;
                }
            },
            ctx: {
                that: that,
                map: map
            }
        }, function() {
            var pp = that.prevPosition.divVector(map.tileSize).floor();
            var pos = that.position.divVector(map.tileSize).floor();
            return map.tiles[pos.y][pos.x].canWalkThrough();
        });

        /*
        // pos -> coords
        bbb.always({
            solver: db,
            allowUnsolvableOperations: true,
            ctx: {
                world: world,
                that: this
            }, methods: function() {
                that.coordinates.formula([that.position, that.position.x, that.position.y], function(pos) {
                    return pos.divVector(world.map.tileSize).sub(new Vector2(0.5, 0.5)).floor();
                });
            }
        }, function() {
            return that.position.divVector(world.map.tileSize).sub(new Vector2(0.5, 0.5)).floor().equals(that.coordinates);
        });

        // coords -> collisionTiles
        bbb.always({
            solver: db,
            allowUnsolvableOperations: true,
            ctx: {
                map: world.map,
                that: this
            }, methods: function() {
                that.collisionTiles.formula([that.coordinates], function(coords) {
                    return {
                        upperLeft: map.get(coords),
                        bottomLeft: map.get(coords.add(new Vector2(0,1))),
                        upperRight: map.get(coords.add(new Vector2(1,0))),
                        bottomRight: map.get(coords.add(new Vector2(1,1)))
                    }
                });
            }
        }, function() {
            return that.collisionTiles.upperLeft === map.get(that.coordinates) &&
                   that.collisionTiles.bottomLeft === map.get(that.coordinates.add(new Vector2(0,1))) &&
                   that.collisionTiles.upperRight === map.get(that.coordinates.add(new Vector2(1,0))) &&
                   that.collisionTiles.bottomRight === map.get(that.coordinates.add(new Vector2(1,1)));
        });
        console.log(that.coordinates, map.get(that.coordinates),that.collisionTiles.upperLeft.index)

        var cassowary = new ClSimplexSolver();
        bbb.always({
            solver: cassowary,
            ctx: {
                that: that
            }
        }, function() {
            return ((that.collisionTiles).upperLeft).index  == 0 &&
                   ((that.collisionTiles).bottomLeft).index  == 0 &&
                   ((that.collisionTiles).upperRight).index  == 0 &&
                   ((that.collisionTiles).bottomRight).index  == 0;
        });
        */
    }
});

Tank.subclass("PlayerTank", {
    initialize: function($super, world, pos) {
        $super(world, pos);

        this.animation = new Animation(new AnimationSheet("assets/tank.png", 18, 18), 0.4, [0,1,2,3]);
    }
});

Tank.subclass("CPUTank", {
    initialize: function($super, world, pos) {
        $super(world, pos);

        this.animation = new Animation(new AnimationSheet("assets/tank.png", 18, 18), 0.4, [4,5,6,7]);

        // immobilize for now
        this.velocity.set(new Vector2(-1,1));
    },

    update: function($super, dt) {
        // adjust direction randomly
        this.velocity.rotateSelf(Math.PI / 180 * (Math.random() - 0.5) * 50);

        $super(dt);
    }
});

GameObject.subclass("Bullet", {
    initialize: function($super, world, pos, vel, maxReflections) {
        $super(world, "bullet", pos, new Vector2(0.5, 0.5), 0.25);

        this.velocity.set(vel);
        this.animation = new Animation(new AnimationSheet("assets/bullet.png", 7, 7), 0.2, [0,1,2,3,2,1]);

        this.maxReflections = maxReflections || 2;
        this.reflectionCount = 0;

           this.speed = 16 / 3.7 * world.map.tileSize.x;

        this.initConstraints(world);
    },

    initConstraints: function(world) {
        var that = this,
            map = this.world.map,
            db = new DBPlanner();

        // constraint idea:
        // separate this into 2 constraints
        // one constraint that triggers the vertical reflection
        // the other just listens on the y-coordinate for the horizontal reflection
        bbb.trigger({
            callback: function() {
                if(that.reflectionCount++ == that.maxReflections) {
                    this.disable();
                    that.world.gameObjects.remove(that);
                } else {
                    that.velocity.x *= -1;
                }
            },
            ctx: {
                that: that,
                map: map
            }
        }, function() {
            var pp = that.prevPosition.divVector(map.tileSize).floor();
            var x = that.position.divVector(map.tileSize).floor().x;
            return map.tiles[pp.y][pp.x].canFlyThrough() && !(map.tiles[pp.y][x].canFlyThrough());
        });
        bbb.trigger({
            callback: function() {
                if(that.reflectionCount++ == that.maxReflections) {
                    this.disable();
                    that.world.gameObjects.remove(that);
                } else {
                    that.velocity.y *= -1;
                }
            },
            ctx: {
                that: that,
                map: map
            }
        }, function() {
            var pp = that.prevPosition.divVector(map.tileSize).floor();
            var y = that.position.divVector(map.tileSize).floor().y;
            return map.tiles[pp.y][pp.x].canFlyThrough() && !(map.tiles[y][pp.x].canFlyThrough());
        });

        /*
        // pos -> coords
        bbb.always({
            solver: db,
            ctx: {
               world: world,
               that: this
            }, methods: function() {
               that.coordinates.formula([that.position, that.position.x, that.position.y], function(pos) {
                   return pos.divVector(world.map.tileSize).floor();
               });
            }
            }, function() {
            return that.position.divVector(world.map.tileSize).floor().equals(that.coordinates);
        });
        */
    }
});
