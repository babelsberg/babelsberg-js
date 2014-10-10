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

/*
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
*/

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
    }
});

CPUControls.subclass("GreySoldier", {
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

