Object.subclass("Levels");
Levels = [
    {
        map: [[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
              [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
              [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
              [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
              [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
              [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]],
        player: {
            position: new Vector2(5, 14),
            velocity: Vector2.Zero.copy(),
            turretDirection: new Vector2(1, 0)
        },
        enemyTanks: [
            {
                type: Tank.BrownTurret,
                position: new Vector2(33, 14),
                velocity: Vector2.Zero.copy(),
                turretDirection: new Vector2(-1, 0)
            }
        ]
    },
    {
        map: [[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,2,2,2,1,1,1,1,1,1,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,1,1,1,1,1,1,2,2,2,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]],
        player: {
            position: new Vector2(5, 29),
            velocity: Vector2.Zero.copy(),
            turretDirection: new Vector2(1, 0)
        },
        enemyTanks: [
            {
                type: Tank.GreySoldier,
                position: new Vector2(31, 7),
                velocity: new Vector2(-1, 0),
                turretDirection: new Vector2(-1, 0)
            }
        ]
    },
    {
        map: [[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,1,1,2,2,2,2,1,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,1,2,2,2,2,1,1,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]],
        player: {
            position: new Vector2(5, 17),
            velocity: Vector2.Zero.copy(),
            turretDirection: new Vector2(1, 0)
        },
        enemyTanks: [
            {
                type: Tank.BrownTurret,
                position: new Vector2(31, 17),
                velocity: Vector2.Zero.copy(),
                turretDirection: new Vector2(-1, 0)
            },
            {
                type: Tank.GreySoldier,
                position: new Vector2(9, 4),
                velocity: new Vector2(0, 1),
                turretDirection: new Vector2(0, 1)
            },
            {
                type: Tank.GreySoldier,
                position: new Vector2(27, 30),
                velocity: new Vector2(0, -1),
                turretDirection: new Vector2(0, -1)
            }
        ]
    },
    {
        map: [[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
              [1,0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,0,1],
              [1,0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,0,1],
              [1,0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,0,1],
              [1,0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,0,1],
              [1,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,1],
              [1,2,2,2,2,0,2,0,2,2,2,2,2,2,2,2,2,1],
              [1,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,0,1],
              [1,0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,0,1],
              [1,0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,1],
              [1,2,2,2,2,2,2,2,2,2,0,2,0,2,2,2,2,1],
              [1,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,1],
              [1,0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,0,1],
              [1,0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,0,1],
              [1,0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,0,1],
              [1,0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,0,1],
              [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]],
        player: {
            position: new Vector2(7, 31),
            velocity: Vector2.Zero.copy(),
            turretDirection: new Vector2(1, 0)
        },
        enemyTanks: [
            {
                type: Tank.BrownTurret,
                position: new Vector2(19, 7),
                velocity: Vector2.Zero.copy(),
                turretDirection: new Vector2(0, 1)
            },
            {
                type: Tank.BrownTurret,
                position: new Vector2(29, 19),
                velocity: Vector2.Zero.copy(),
                turretDirection: new Vector2(-1, 0)
            },
            {
                type: Tank.GreySoldier,
                position: new Vector2(29, 7),
                velocity: new Vector2(0, 1),
                turretDirection: new Vector2(0, 1)
            },
            {
                type: Tank.GreySoldier,
                position: new Vector2(17, 19),
                velocity: new Vector2(1, 0),
                turretDirection: new Vector2(1, 0)
            }
        ]
    },
    {
        map: [[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]],
        player: {
            position: new Vector2(7, 29),
            velocity: Vector2.Zero.copy(),
            turretDirection: new Vector2(1, 0)
        },
        enemyTanks: [
            {
                type: Tank.TealHunter,
                position: new Vector2(25, 5),
                velocity: new Vector2(0, 1),
                turretDirection: new Vector2(0, 1)
            },
            {
                type: Tank.TealHunter,
                position: new Vector2(31, 19),
                velocity: new Vector2(-1, 0),
                turretDirection: new Vector2(-1, 0)
            }
        ]
    },
    {
        map: [[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,1,2,1,2,1,1,1,1,1,1,0,0,0,1],
              [1,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1],
              [1,0,0,0,1,1,1,1,1,1,2,1,2,1,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]],
        player: {
            position: new Vector2(5, 19),
            velocity: Vector2.Zero.copy(),
            turretDirection: new Vector2(1, 0)
        },
        enemyTanks: [
            {
                type: Tank.GreySoldier,
                position: new Vector2(27, 11),
                velocity: new Vector2(-1, 0),
                turretDirection: new Vector2(-1, 0)
            },
            {
                type: Tank.GreySoldier,
                position: new Vector2(25, 5),
                velocity: new Vector2(0, -1),
                turretDirection: new Vector2(0, -1)
            },
            {
                type: Tank.TealHunter,
                position: new Vector2(31, 19),
                velocity: new Vector2(-1, 0),
                turretDirection: new Vector2(-1, 0)
            },
            {
                type: Tank.TealHunter,
                position: new Vector2(31, 29),
                velocity: new Vector2(-1, 0),
                turretDirection: new Vector2(-1, 0)
            }
        ]
    },
    {
        map: [[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]],
        player: {
            position: new Vector2(7, 29),
            velocity: Vector2.Zero.copy(),
            turretDirection: new Vector2(1, 0)
        },
        enemyTanks: [
            {
                type: Tank.TealHunter,
                position: new Vector2(5, 5),
                velocity: new Vector2(0, 1),
                turretDirection: new Vector2(0, 1)
            },
            {
                type: Tank.TealHunter,
                position: new Vector2(31, 7),
                velocity: new Vector2(-1, 0),
                turretDirection: new Vector2(-1, 0)
            },
            {
                type: Tank.TealHunter,
                position: new Vector2(5, 19),
                velocity: new Vector2(1, 0),
                turretDirection: new Vector2(1, 0)
            },
            {
                type: Tank.TealHunter,
                position: new Vector2(31, 33),
                velocity: new Vector2(-1, 0),
                turretDirection: new Vector2(-1, 0)
            }
        ]
    },
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
            description.position.copy(),
            description.velocity.copy(),
            description.turretDirection.copy(),
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
                enemyDescription.position.copy(),
                enemyDescription.velocity.copy(),
                enemyDescription.turretDirection.copy(),
                enemyDescription.type
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
