class BossGame extends Phaser.Scene {
    constructor() {
        super();
        // Initialize game variables
        this.aarav = null;
        this.jumpCount = 0;
        this.ruhaan = null;
        this.platforms = null;
        this.bullets = null;
        this.bossBalls = null;
        this.aaravHealth = 100;
        this.ruhhanHealth = 400; // 4x Aarav's health
        this.lastShot = 0;
        this.lastBossAttack = 0;
        this.specialAttackCharge = 0; // Counter for special attack
    }
    preload() {
        // Create a temporary platform texture
        let graphics = this.add.graphics();
        graphics.fillStyle(0x666666);
        graphics.fillRect(0, 0, 200, 32);
        graphics.generateTexture('platform', 200, 32);
        graphics.destroy();
    }
    create() {
        // Set background color
        this.cameras.main.setBackgroundColor('#4488AA');

        // Create static group for platforms
        this.platforms = this.physics.add.staticGroup();

        // Create main platform/ground
        this.platforms.create(600, 780, 'platform')
            .setScale(6, 0.5) // Wider ground platform
            .refreshBody();
        // Create multiple platforms at different heights
        this.platforms.create(200, 600, 'platform')
            .setScale(0.8, 0.2)
            .refreshBody();
        this.platforms.create(600, 500, 'platform')
            .setScale(1, 0.2)
            .refreshBody();
        this.platforms.create(1000, 600, 'platform')
            .setScale(0.8, 0.2)
            .refreshBody();
        this.platforms.create(400, 350, 'platform')
            .setScale(0.8, 0.2)
            .refreshBody();
        this.platforms.create(800, 300, 'platform')
            .setScale(0.8, 0.2)
            .refreshBody();

        // Create Aarav (hero)
        this.aarav = this.add.rectangle(100, 450, 50, 80, 0x00ff00);
        this.physics.add.existing(this.aarav);
        this.aarav.body.setBounce(0);
        this.aarav.body.setCollideWorldBounds(true);
        this.aarav.body.setGravityY(600);

        // Create Ruhaan (boss)
        this.ruhaan = this.add.rectangle(700, 450, 80, 120, 0xff0000);
        this.physics.add.existing(this.ruhaan);
        this.ruhaan.body.setBounce(0.2);
        this.ruhaan.body.setCollideWorldBounds(true);
        this.ruhaan.body.setGravityY(300);

        // Create groups for projectiles
        this.bullets = this.physics.add.group();
        this.bossBalls = this.physics.add.group();

        // Add colliders
        this.physics.add.collider(this.aarav, this.platforms);
        this.physics.add.collider(this.ruhaan, this.platforms);
        this.physics.add.collider(this.bullets, this.platforms, this.destroyBullet, null, this);
        this.physics.add.collider(this.bossBalls, this.platforms, this.destroyBullet, null, this);

        // Add overlap detection for damage
        this.physics.add.overlap(this.ruhaan, this.bullets, this.hitBoss, null, this);
        this.physics.add.overlap(this.aarav, this.bossBalls, this.hitPlayer, null, this);

        // Create health bars
        this.aaravHealthBar = this.add.rectangle(100, 50, 200, 20, 0x00ff00);
        this.aaravHealthBar.setOrigin(0, 0);
        this.ruhhanHealthBar = this.add.rectangle(500, 50, 200, 20, 0xff0000);
        this.ruhhanHealthBar.setOrigin(0, 0);

        // Setup keyboard controls
        // Add special attack charge bar
        this.chargeBar = this.add.rectangle(100, 80, 200, 10, 0x333333);
        this.chargeBar.setOrigin(0, 0);
        this.chargeBarFill = this.add.rectangle(100, 80, 0, 10, 0xffff00);
        this.chargeBarFill.setOrigin(0, 0);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.qKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    }

    update() {
        // Player movement and jump
        const moveSpeed = this.aarav.body.touching.down ? 160 : 120;

        if (this.cursors.left.isDown) {
            this.aarav.body.setVelocityX(-moveSpeed);
        } else if (this.cursors.right.isDown) {
            this.aarav.body.setVelocityX(moveSpeed);
        } else {
            this.aarav.body.setVelocityX(0);
        }
        // Player jump with better ground detection
        // Player jump with better ground detection
        // Reset jump count when touching ground
        if (this.aarav.body.blocked.down) {
            this.jumpCount = 0;
        }
        // Jump mechanics (double jump)
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) && this.jumpCount < 2) {
            this.aarav.body.setVelocityY(-750);
            this.jumpCount++;

            // Add jump effect
            for (let i = 0; i < 5; i++) {
                const particle = this.add.circle(
                    this.aarav.x + Phaser.Math.Between(-10, 10),
                    this.aarav.y + 40,
                    5,
                    0x88ff88
                );
                this.tweens.add({
                    targets: particle,
                    alpha: 0,
                    y: particle.y + Phaser.Math.Between(20, 40),
                    duration: 200,
                    onComplete: () => particle.destroy()
                });
            }
        }

        // Player shoot
        if (this.spaceKey.isDown && this.time.now > this.lastShot + 500) {
            this.shoot();
            this.lastShot = this.time.now;
        }
        // Special Attacks
        if (this.specialAttackCharge >= 10) {
            if (this.qKey.isDown) {
                this.specialAttack();
                this.specialAttackCharge = 0;
            } else if (this.eKey.isDown) {
                this.healingSuper();
                this.specialAttackCharge = 0;
            }
        }
        // Boss AI and attacks
        this.updateBoss();

        // Update health bars and charge bar
        this.aaravHealthBar.setScale(this.aaravHealth / 100, 1);
        this.ruhhanHealthBar.setScale(this.ruhhanHealth / 400, 1);
        this.chargeBarFill.width = (this.specialAttackCharge / 10) * 200;

        // Check for game over
        if (this.aaravHealth <= 0 || this.ruhhanHealth <= 0) {
            this.gameOver();
        }
    }

    shoot() {
        const bullet = this.add.rectangle(this.aarav.x, this.aarav.y, 10, 5, 0xffff00);
        this.bullets.add(bullet);
        bullet.body.setVelocityX(400);
        bullet.body.setAllowGravity(false);
    }

    updateBoss() {
        const distanceToPlayer = Phaser.Math.Distance.Between(
            this.ruhaan.x, this.ruhaan.y,
            this.aarav.x, this.aarav.y
        );
        // Smart movement
        const direction = this.aarav.x - this.ruhaan.x;
        // Strategic movement with platform utilization
        if (this.ruhaan.body.touching.down) {
            if (distanceToPlayer > 500) {
                // Move to closest platform above player
                this.ruhaan.body.setVelocityX(direction < 0 ? -250 : 250);
                if (Math.random() < 0.03) this.ruhaan.body.setVelocityY(-700);
            } else if (distanceToPlayer < 200) {
                // Back away and possibly prepare for ground pound
                this.ruhaan.body.setVelocityX(direction < 0 ? 300 : -300);
                if (this.aarav.y > this.ruhaan.y && Math.random() < 0.1) {
                    this.bossGroundPound();
                }
            } else {
                // Strategic positioning
                this.ruhaan.body.setVelocityX(direction < 0 ? -200 : 200);
            }
        }
        // Occasionally jump to reposition
        if (Math.random() < 0.01 && this.ruhaan.body.touching.down) {
            this.ruhaan.body.setVelocityY(-600);
        }
        // Attack pattern selection
        if (this.time.now > this.lastBossAttack + 2000) {
            const attackChoice = Math.random();

            if (distanceToPlayer < 200) {
                // Close range: prefer jump attack or spin attack
                if (attackChoice < 0.4) {
                    this.bossJumpAttack();
                } else if (attackChoice < 0.8) {
                    this.bossSpinAttack();
                } else {
                    this.bossBallAttack();
                }
            } else {
                // Long range: prefer ball attack or multi-ball
                if (attackChoice < 0.4) {
                    this.bossBallAttack();
                } else if (attackChoice < 0.8) {
                    this.bossMultiBallAttack();
                } else {
                    this.bossJumpAttack();
                }
            }
            this.lastBossAttack = this.time.now;
        }
    }

    bossBallAttack() {
        const ball = this.add.circle(this.ruhaan.x, this.ruhaan.y, 15, 0xff6600);
        this.bossBalls.add(ball);
        ball.body.setAllowGravity(false);
        const angle = Phaser.Math.Angle.Between(
            this.ruhaan.x, this.ruhaan.y,
            this.aarav.x, this.aarav.y
        );
        this.physics.moveTo(ball, this.aarav.x, this.aarav.y, 300);
    }

    bossJumpAttack() {
        if (this.ruhaan.body.touching.down) {
            this.ruhaan.body.setVelocityY(-500);
        }
    }
    bossSpinAttack() {
        // Create a circle of projectiles around the boss
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const ball = this.add.circle(this.ruhaan.x, this.ruhaan.y, 10, 0xff6600);
            this.bossBalls.add(ball);
            ball.body.setVelocity(
                Math.cos(angle) * 300,
                Math.sin(angle) * 300
            );
            ball.body.setAllowGravity(false);
        }
    }
    bossMultiBallAttack() {
        // Fire three balls in a spread pattern
        for (let i = -1; i <= 1; i++) {
            const ball = this.add.circle(this.ruhaan.x, this.ruhaan.y, 15, 0xff6600);
            this.bossBalls.add(ball);
            const angle = Phaser.Math.Angle.Between(
                this.ruhaan.x, this.ruhaan.y,
                this.aarav.x, this.aarav.y
            ) + (i * Math.PI / 8);
            ball.body.setVelocity(
                Math.cos(angle) * 300,
                Math.sin(angle) * 300
            );
            ball.body.setAllowGravity(false);
        }
    }
    bossGroundPound() {
        // Initial jump for ground pound
        this.ruhaan.body.setVelocityY(-800);

        // After reaching apex, slam down
        this.time.delayedCall(700, () => {
            this.ruhaan.body.setVelocityY(1200);

            // When hitting ground, create shockwave
            this.physics.add.collider(this.ruhaan, this.platforms, () => {
                if (this.ruhaan.body.velocity.y > 0) {
                    // Create shockwave effect
                    for (let i = -2; i <= 2; i++) {
                        const shockwave = this.add.circle(
                            this.ruhaan.x + (i * 100),
                            this.ruhaan.y + 40,
                            20,
                            0xff0000
                        );
                        this.bossBalls.add(shockwave);
                        shockwave.body.setVelocityY(-300);
                        shockwave.body.setVelocityX(i * 200);
                        shockwave.body.setAllowGravity(false);

                        // Fade out and destroy
                        this.tweens.add({
                            targets: shockwave,
                            alpha: 0,
                            duration: 1000,
                            onComplete: () => shockwave.destroy()
                        });
                    }
                }
            }, null, this);
        });
    }
    hitBoss(ruhaan, bullet) {
        bullet.destroy();
        this.ruhhanHealth -= 10;
        this.specialAttackCharge = Math.min(10, this.specialAttackCharge + 1);
        if (this.ruhhanHealth <= 0) {
            this.gameOver();
        }
    }

    hitPlayer(aarav, ball) {
        ball.destroy();
        this.aaravHealth -= 15; // Reduced damage from 35 to 15
        if (this.aaravHealth <= 0) {
            this.gameOver();
        }
    }

    destroyBullet(bullet) {
        bullet.destroy();
    }
    specialAttack() {
        // Charging effect
        const chargeTime = 1000; // 1 second charge
        const beamLength = 500;
        const beamWidth = 40;

        // Create charging effect
        const chargeCircle = this.add.circle(this.aarav.x, this.aarav.y, 30, 0x00ffff, 0.5);
        this.tweens.add({
            targets: chargeCircle,
            scale: 2,
            alpha: 0.8,
            duration: chargeTime,
            yoyo: true,
            repeat: 0,
            onComplete: () => chargeCircle.destroy()
        });
        // After charge time, fire the beam
        this.time.delayedCall(chargeTime, () => {

            // Create main beam
            const beam = this.add.rectangle(this.aarav.x, this.aarav.y, beamLength, beamWidth, 0x00ffff);
            this.bullets.add(beam);
            beam.body.setAllowGravity(false);
            beam.body.setVelocityX(1000);
            // Add particle effects
            for (let i = 0; i < 20; i++) {
                const particle = this.add.circle(
                    this.aarav.x + Phaser.Math.Between(0, beamLength / 2),
                    this.aarav.y + Phaser.Math.Between(-beamWidth / 2, beamWidth / 2),
                    Phaser.Math.Between(5, 10),
                    0x00ffff
                );

                this.tweens.add({
                    targets: particle,
                    x: particle.x + Phaser.Math.Between(100, 200),
                    alpha: 0,
                    scale: 0.5,
                    duration: 500,
                    onComplete: () => particle.destroy()
                });
            }
            // Add energy gathering effect before beam
            for (let i = 0; i < 10; i++) {
                const chargeParticle = this.add.circle(
                    this.aarav.x + Phaser.Math.Between(-50, 50),
                    this.aarav.y + Phaser.Math.Between(-50, 50),
                    8,
                    0x00ffff
                );

                this.tweens.add({
                    targets: chargeParticle,
                    x: this.aarav.x,
                    y: this.aarav.y,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => chargeParticle.destroy()
                });
            }

            // Special attack does more damage
            this.physics.add.overlap(this.ruhaan, beam, (ruhaan, beam) => {
                beam.destroy();
                this.ruhhanHealth -= 50; // Regular bullets do 10, this does 50 (5x damage)
                if (this.ruhhanHealth <= 0) {
                    this.gameOver();
                }
            }, null, this);
            // Destroy beam after 1 second
            this.time.delayedCall(1000, () => {
                if (beam.active) {
                    beam.destroy();
                }
            });
        });
    }
    healingSuper() {
        // Heal for 50 HP, not exceeding max health
        this.aaravHealth = Math.min(100, this.aaravHealth + 50);
        // Create healing animation (plus signs)
        for (let i = 0; i < 5; i++) {
            const plusSign = this.add.text(
                this.aarav.x + Phaser.Math.Between(-20, 20),
                this.aarav.y + Phaser.Math.Between(-30, 30),
                '+', {
                    fontSize: '32px',
                    fill: '#00ff00'
                }
            );
            this.tweens.add({
                targets: plusSign,
                y: plusSign.y - 100,
                alpha: 0,
                duration: 1000,
                ease: 'Power1',
                onComplete: () => plusSign.destroy()
            });
        }
    }
    gameOver() {
        this.scene.pause();
        const winner = this.aaravHealth <= 0 ? 'Ruhaan' : 'Aarav';
        this.add.text(400, 300, `Game Over! ${winner} wins!`, {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);
    }
}

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 800,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 1000
            },
            debug: false
        }
    },
    scene: BossGame
};

// Create the game instance
const game = new Phaser.Game(config);
