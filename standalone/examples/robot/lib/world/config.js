Object.extend(Tank, {
    Player: {
        speed: Tank.SPEED_NORMAL,
        bullets: 5,
        bulletRicochets: 1,
        intelligence: PlayerControls,
        bulletSpeed: Bullet.SPEED_NORMAL
    },
    BrownTurret: {
        speed: Tank.SPEED_IMMOBILE,
        bullets: 1,
        bulletRicochets: 1,
        intelligence: BrownTurret,
        bulletSpeed: Bullet.SPEED_NORMAL
    },
    GreySoldier: {
        speed: Tank.SPEED_SLOW,
        bullets: 2,
        bulletRicochets: 1,
        intelligence: GreySoldier,
        bulletSpeed: Bullet.SPEED_NORMAL
    },
    TealHunter: {
        speed: Tank.SPEED_SLOW,
        bullets: 1,
        bulletRicochets: 0,
        intelligence: TealHunter,
        bulletSpeed: Bullet.SPEED_FAST
    }
});
