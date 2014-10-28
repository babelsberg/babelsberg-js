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

Object.subclass("CPUControls", {
    initialize: function(tank, world, input, viewport) {
        this.tank = tank;
        this.world = world;

        this.turretRotationSpeed = 45 * Math.PI / 180;
    },
    update: function(dt) {
        this.turretUpdate(dt);
        this.movementUpdate(dt);
        this.fireUpdate(dt);
    },
    raycast: function(dir, ricochets) {
        var tiles = [],
            pos = this.tank.position.copy();

        function linecast(tank, pos, dir) {
            var tile = tank.getTile(pos);
            while(tile.canFlyThrough()) {
                pos.addSelf(dir);
                tile = tank.getTile(pos);
                tiles.push(tile)
            }
        };
        function reflect(world, pos, dir) {
            var reflectCoords = world.map.positionToCoordinates(pos);
            pos.subSelf(dir);
            var prevCoords = world.map.positionToCoordinates(pos);
            if(reflectCoords.x == prevCoords.x) {
                dir.y *= -1;
            }
            if(reflectCoords.y == prevCoords.y) {
                dir.x *= -1;
            }
        };

        linecast(this.tank, pos, dir);

        while(ricochets > 0) {
            ricochets--;
            reflect(this.world, pos, dir);
            linecast(this.tank, pos, dir);
        }

        return tiles;
    },
    getTargetTiles: function() {
        return this.raycast(
            this.tank.turretDirection.normalizedCopy(),
            this.tank.bulletRicochets
        );
    },
    // fire on line of sight
    fireUpdate: function(dt) {
        var tiles = this.getTargetTiles();

        if(tiles.indexOf(this.tank.getTile(player.position)) >= 0) {
            this.tank.fireBullet(this.world, dt);
        };
    }
});

CPUControls.subclass("BrownTurret", { // Bobby
    initialize: function($super, tank, world, input, viewport) {
        $super(tank, world, input, viewport);
        this.rotationDirection = 1;
        this.color = "brown";
    },
    turretUpdate: function(dt) {
        if(Math.random() < 0.02) {
            this.rotationDirection *= -1;
        }
        this.tank.turretDirection.rotateSelf(this.rotationDirection * this.turretRotationSpeed * dt);
    },
    movementUpdate: function(dt) {
	    this.tank.velocity.set(Vector2.Zero);
    }
});

CPUControls.subclass("MovingCPUControls", {
    initialize: function($super, tank, world, input, viewport) {
        $super(tank, world, input, viewport);
        var that = this;

        this.angularVelocity = 0;
        this.tankRotationDirection = 0;

        this.tankRotationSpeed = 300 * Math.PI / 180;

        // do not drive too small curves
        bbb.assert({
            onError: function(error) {
                if(!error instanceof ContinuousAssertError) {
                    throw error;
                }
            },
            ctx: {
                that: that
            }
        }, function() {
            return that.angularVelocity < 2 && that.angularVelocity > -2;
        });
    },
    // free movement
    movementUpdate: function(dt) {
	    // adjust direction randomly
        this.tankRotationDirection = Math.random() > 0.75 ? 0 : Math.random() > 0.5 ? 1 : -1;
        this.angularVelocity += this.tankRotationDirection * this.tankRotationSpeed * dt;
	    this.tank.velocity.rotateSelf(Math.PI / 180 * this.angularVelocity);
    }
});

MovingCPUControls.subclass("GreySoldier", { // Fred
    initialize: function($super, tank, world, input, viewport) {
        $super(tank, world, input, viewport);
        this.color = "grey";

        var tank = this.tank,
            that = this;

        this.rotationDirection = 1;

        // turret mildly seeks the player
        bbb.trigger({
            callback: function() {
                that.rotationDirection *= -1;
            },
            ctx: {
                tank: tank,
                player: player
            }
        }, function() {
            var angle = player.position.sub(tank.position).getDirectedAngle(tank.turretDirection);
            return angle < -90 || angle > 90;
        });
    },
    turretUpdate: function(dt) {
        // TODO: remove duplication with BrownTurret/Bobby.turretUpdate
        if(Math.random() < 0.02) {
            this.rotationDirection *= -1;
        }
        this.tank.turretDirection.rotateSelf(this.rotationDirection * this.turretRotationSpeed * dt);
    }
});

MovingCPUControls.subclass("TealHunter", { // Luzy
    initialize: function($super, tank, world, input, viewport) {
        $super(tank, world, input, viewport);
        this.color = "teal";
    },
    turretUpdate: function(dt) {
        // turret strongly seek the player
        this.tank.turretDirection.set(player.position.sub(this.tank.position));
    },
    movementUpdate: function($super, dt) {
	    // defensive movement (if necessary)
	    var tank = this.tank;
	    var evadeVelocity = this.world.getGameObjects()
            .filter(function(object) {
                // take only bullets
                return object.name === "bullet";
            })
            .filter(function(bullet) {
                // take only near bullets into account
                return bullet.position.distance(tank.position) < 7 * 2; // tileSize
            })
            .filter(function(bullet) {
                // take only bullets that fly towards my tank into account
                var angle = tank.position.sub(bullet.position).getDirectedAngle(bullet.velocity);
                return angle >= -90 && angle <= 90;
            })
            .map(function(bullet) {
                // use cross product of bullet direction and position difference
                var a = bullet.velocity.copy();
                var b = tank.position.sub(bullet.position);
                var cross = [a.y - b.y, b.x - a.x, a.x * b.y - a.y * b.x];
                var dir = new Vector2(cross[0], cross[1]);
                dir.divFloatSelf(cross[2]);
                return dir;
            })
            .reduce(function(prev, velocity) {
                // accumulate all directions
                return prev.add(velocity);
            }, Vector2.Zero.copy())

        if(evadeVelocity.notEquals(Vector2.Zero)) {
            tank.velocity.set(evadeVelocity);
        } else {
            $super(dt);
        }
    }
});
