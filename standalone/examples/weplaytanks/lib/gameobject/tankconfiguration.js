define(["./controls", "./tank", "./bullet"], function TankConfig(Controls, Tank, Bullet) {
    var TankConfig = Object.subclass("TankConfig", {});
    Object.extend(TankConfig, {
        Player: {
            speed: Tank.SPEED_NORMAL,
            bullets: 3,
            bulletRicochets: 1,
            intelligence: Controls.Player,
            bulletSpeed: Bullet.SPEED_NORMAL
        },
        BrownTurret: {
            speed: Tank.SPEED_IMMOBILE,
            bullets: 1,
            bulletRicochets: 1,
            intelligence: Controls.CPU.BrownTurret,
            bulletSpeed: Bullet.SPEED_NORMAL
        },
        GreySoldier: {
            speed: Tank.SPEED_SLOW,
            bullets: 2,
            bulletRicochets: 1,
            intelligence: Controls.CPU.GreySoldier,
            bulletSpeed: Bullet.SPEED_NORMAL
        },
        TealHunter: {
            speed: Tank.SPEED_SLOW,
            bullets: 1,
            bulletRicochets: 0,
            intelligence: Controls.CPU.TealHunter,
            bulletSpeed: Bullet.SPEED_FAST
        }
    });

    return TankConfig;
});
