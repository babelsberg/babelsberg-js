// possible constraints:
// - your direction should be normalized
// - your speed is limited to maxSpeed (cannot adjust speed?)
// - your velocity is direction.mulFloat(dt*speed)
GameObject.subclass("Tank", {
	initialize: function($super, world, pos) {
	    $super(world, "tank", pos, new Vector2(2, 2), 1);

		this.speed = 16 / 6 * world.map.tileSize.x;

        this.turretDirection = new Vector2(1,0.5);
        this.turretAnimation = new Animation(new AnimationSheet("assets/turret.png", 18, 18), 0.4, [0,1,2,3]);

		this.initConstraints();
    },
    initConstraints: function() {
        var that = this,
            map = this.world.map;

        // constraint:
        // - do not be on a wall tile
        bbb.assert({
            // collision solving is already provided by the babelsberg.assert
            // method and its ability the revert to a valid state
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
            // collision detection against the current tile
            var pos = that.position.divVector(map.tileSize).floor();
            return map.tiles[pos.y][pos.x].canWalkThrough();
        });

        // assumption: tanks are inserted first into the world
        this.world.getGameObjects().each(function(tank) {
            // constraint:
            // - solve collisions
            that.onCollisionWith(tank, function(that, tank) {
                var desiredDistance = that.radius + tank.radius,
                    distVector = tank.position.sub(that.position),
                    realDistance = distVector.length(),
                    moveVector = distVector.mulFloat((desiredDistance - realDistance) / 1.9);
                tank.position.addSelf(moveVector);
                that.position.subSelf(moveVector);
                //console.log(realDistance, "post", that.position.distance(tank.position, that.radius + tank.radius));
            });
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
	},

	update: function($super, dt) {
	    this.controls && this.controls.update(dt);

	    $super(dt);
        this.turretAnimation.update(dt);
	},

	draw: function($super, renderer) {
	    $super(renderer);
		this.turretAnimation.draw(
		    renderer, this.getWorldAABB(true), this.turretDirection.getDirectedAngle(new Vector2(1,0))
		);
	},

    fireBullet: function(world, dt) {
        var direction = this.turretDirection.normalizedCopy();
        var bullet = new Bullet(world,
            this.position.add(direction.mulFloat(this.radius + 0.25 + this.speed * dt)),
            direction);
        world.getGameObjects().each(function(other) {
            bullet.onCollisionWith(other, function(bullet, other) {
                // 3 possibilities to avoid this to happen more than one time:
                // 1. in collision callback:
                //     if(bullet.alive && other.alive)
                //     but get not rid of the actual constraint -> slow with more and more bullets
                // 2. layer each game object
                //     layer.activeOn(bullet in world)
                //     but collision callback is linked to 2 game objects
                // 3. in collision callback
                //     bullet.unconstrainAND_DISABLE_ALL() to disable all linked constraints
                //     very general; we instead keep track of these manually and disable all constraints on destroy
                bullet.destroy();
                other.destroy();
            });
        });
        world.spawn(bullet);
    }
});

Tank.subclass("PlayerTank", {
	initialize: function($super, world, pos) {
	    $super(world, pos);

		this.animation = new Animation(new AnimationSheet("assets/tank.png", 18, 18), 0.4, [0,1,2,3]);
    }
});

Object.subclass("PlayerControls", {
    initialize: function(player, world, input, viewport) {
        this.player = player;
        this.world = world;
        this.input = input;
        this.viewport = viewport;

        // constraint:
        // - the player tanks turret follows the mouse
		var turretConstraint = bbb.always({
            solver: new DBPlanner(),
            ctx: {
                player: player,
                input: input
            },
            methods: function() {
                player.turretDirection.formula([input.position, input.position.x, input.position.y, player.position, player.position.x, player.position.y], function(mousePosition, mousePositionX, mousePositionY, playerPosition, playerPositionX, playerPositionY) {
                    return mousePosition.sub(playerPosition);
                });
            } }, function() {
                return player.turretDirection.equals((input.mouse).sub(player.position));
		});
		player.constraints.push(turretConstraint);
    },
    update: function(dt) {
        // move player tank
        player.velocity.set(Vector2.Zero);
        if(this.input.state("up")) this.player.velocity.addSelf(new Vector2(0, -1));
        if(this.input.state("left")) this.player.velocity.addSelf(new Vector2(-1, 0));
        if(this.input.state("down")) this.player.velocity.addSelf(new Vector2(0, 1));
        if(this.input.state("right")) this.player.velocity.addSelf(new Vector2(1, 0));

        // player fires a bullet
        if(this.input.pressed("leftclick")) {
            player.fireBullet(this.world, dt);
        }
    }
});

Tank.subclass("CPUTank", {
    initialize: function($super, world, pos, Controls) {
        $super(world, pos);

        this.controls = new (Controls)(this, world);
		this.animation = new Animation(new AnimationSheet("assets/tank.png", 18, 18), 0.4, [4,5,6,7]);

        this.velocity.set(new Vector2(-1,1));

        // constraint:
        // - keep velocity direction and turret direction in sync
        /*
        var that = this;
        var turretConstraint = bbb.always({
            solver: new DBPlanner(),
            ctx: {
                that: that
            },
            methods: function() {
                that.turretDirection.formula([that.velocity, that.velocity.x, that.velocity.y], function(velocity, velocityX, velocityY) {
                    return velocity;
                });
            }
        }, function() {
            return that.turretDirection.equals(that.velocity);
        });

        this.constraints.push(turretConstraint);
        */
	}
});

Object.subclass("CPUControls", {
    initialize: function(tank, world) {
        this.tank = tank;
        this.world = world;

        this.turretRotationSpeed = 45 * Math.PI / 180;
    },
    update: function(dt) {
        this.turretUpdate(dt);
        this.movementUpdate(dt);
        this.fireUpdate(dt);
    }
});

Object.subclass("Line", {
    initialize: function(a, b) {
        this.a = a;
        this.b = b;
    }
});

Object.extend(Line, {
    forRay: function(pos, dir) {
        var a = dir.y / dir.x;
        var b = pos.y - a * pos.x;
        return new Line(a, b);
    }
});

Object.subclass("Ray", {
    initialize: function(pos, dir, ricochet) {

    }
});

CPUControls.subclass("BrownTurret", {
    initialize: function($super, tank, world) {
        $super(tank, world);
        this.rotationDirection = 1;
    },
    turretUpdate: function(dt) {
        if(Math.random() < 0.02) {
            this.rotationDirection *= -1;
        }
        this.tank.turretDirection.rotateSelf(this.rotationDirection * this.turretRotationSpeed * dt);
    },
    movementUpdate: function(dt) {
	    this.tank.velocity.set(Vector2.Zero);
    },
    // fire on line of sight
    fireUpdate: function(dt) {
        var world = this.world;
        var map = world.map;
        var tank = this.tank;
        var pos = tank.position.copy();
        var dir = tank.turretDirection.normalizedCopy();

        var tile = tank.getTile(pos);
        while(tile.canFlyThrough()) {
            tile.marked = "yellow";
            pos.addSelf(dir);
            tile = tank.getTile(pos);
        }
        tile.marked = "red";

        if(tank.getTile(player.position).marked) {
            this.tank.fireBullet(this.world, dt);
        };


        // modified bresenham algorithm
        /* signum function */
        function sgn(x){
          return (x > 0) ? 1 : (x < 0) ? -1 : 0;
        }

        function gbham(xstart, ystart, xend, yend)
        /*--------------------------------------------------------------
         * Bresenham-Algorithmus: Linien auf Rastergeräten zeichnen
         *
         * Eingabeparameter:
         *    int xstart, ystart        = Koordinaten des Startpunkts
         *    int xend, yend            = Koordinaten des Endpunkts
         *
         * Ausgabe:
         *    void SetPixel(int x, int y) setze ein Pixel in der Grafik
         *         (wird in dieser oder aehnlicher Form vorausgesetzt)
         *---------------------------------------------------------------
         */
        {
            var x, y, t, dx, dy, incx, incy, pdx, pdy, ddx, ddy, es, el, err;

        /* Entfernung in beiden Dimensionen berechnen */
           dx = xend - xstart;
           dy = yend - ystart;

        /* Vorzeichen des Inkrements bestimmen */
           incx = sgn(dx);
           incy = sgn(dy);
           if(dx<0) dx = -dx;
           if(dy<0) dy = -dy;

        /* feststellen, welche Entfernung größer ist */
           if(dx > dy) {
              /* x ist schnelle Richtung */
              pdx=incx; pdy=0;    /* pd. ist Parallelschritt */
              ddx=incx; ddy=incy; /* dd. ist Diagonalschritt */
              es =dy;   el =dx;   /* Fehlerschritte schnell, langsam */
           } else {
              /* y ist schnelle Richtung */
              pdx=0;    pdy=incy; /* pd. ist Parallelschritt */
              ddx=incx; ddy=incy; /* dd. ist Diagonalschritt */
              es =dx;   el =dy;   /* Fehlerschritte schnell, langsam */
           }

        /* Initialisierungen vor Schleifenbeginn */
           x = xstart;
           y = ystart;
           err = el/2;
           SetPixel(x,y);

        /* Pixel berechnen */
           for(t=0; t<el; ++t) /* t zaehlt die Pixel, el ist auch Anzahl */
           {
              /* Aktualisierung Fehlerterm */
              err -= es;
              if(err<0)
              {
                  /* Fehlerterm wieder positiv (>=0) machen */
                  err += el;
                  /* Schritt in langsame Richtung, Diagonalschritt */
                  x += ddx;
                  y += ddy;
              } else
              {
                  /* Schritt in schnelle Richtung, Parallelschritt */
                  x += pdx;
                  y += pdy;
              }
              SetPixel(x,y);
           }
        } /* gbham() */

        function SetPixel(x,y) {
            var tile = map.get(new Vector2(x,y));
            tile.marked = "yellow";
        }

        var endOfLine = tank.position.add(tank.turretDirection.normalizedCopy().mulFloat(20));
        //gbham(tank.position.x, tank.position.y, endOfLine.x, endOfLine.y);

        // enemy fires a bullet
        if(input.pressed("enemyFire")) {
            this.tank.fireBullet(this.world, dt);
        }
    }
});

CPUControls.subclass("GraySoldier", {
    turretUpdate: function(dt) {
        // adjust turret direction randomly
        this.tank.turretDirection.rotateSelf(Math.PI / 180 * (Math.random() - 0.5) * 50);
    },
    movementUpdate: function(dt) {
	    // adjust direction randomly
	    this.tank.velocity.rotateSelf(Math.PI / 180 * (Math.random() - 0.5) * 50);
        //this.velocity.set(player.position.sub(this.position));
    },
    fireUpdate: function(dt) {
        var angle = this.tank.turretDirection.getDirectedAngle(player.position.sub(this.tank.position));
        var sight = angle < 2 && angle > -2;
        if(sight) {
            console.log("FIRE!", angle, this.tank.turretDirection.x, this.tank.turretDirection.y, player.position.sub(this.tank.position).x, player.position.sub(this.tank.position).y);
            this.tank.fireBullet(this.world, dt);
        }
    }
});

CPUControls.subclass("TealHunter", {
    turretUpdate: function(dt) {
        // turret strongly seek the player
        this.tank.turretDirection.set(player.position.sub(this.tank.position));
    },
    movementUpdate: function(dt) {
	    // adjust direction randomly
	    this.tank.velocity.rotateSelf(Math.PI / 180 * (Math.random() - 0.5) * 50);
    },
    fireUpdate: function(dt) {
        var world = this.world;
        var map = world.map;
        var tank = this.tank;
        var pos = tank.position.copy();
        var dir = tank.turretDirection.normalizedCopy();

        var tile = tank.getTile(pos);
        while(tile.canFlyThrough()) {
            tile.marked = "yellow";
            pos.addSelf(dir);
            tile = tank.getTile(pos);
        }
        tile.marked = "red";

        if(tank.getTile(player.position).marked) {
            this.tank.fireBullet(this.world, dt);
        };
    }
});
