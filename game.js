class StartScreen extends Phaser.Scene {
    constructor() {
        super({
            key: 'StartScreen'
        });
    }
    create() {
        // Title
        this.add.text(800, 400, 'AARAV VS RUHAAN', {
            fontSize: '84px',
            fill: '#fff'
        }).setOrigin(0.5);
        // Start button
        const startButton = this.add.text(800, 500, 'Click to Start', {
                fontSize: '32px',
                fill: '#fff'
            }).setOrigin(0.5)
            .setInteractive()
            .setPadding(10)
            .setStyle({
                backgroundColor: '#111'
            });
        startButton.on('pointerdown', () => {
            this.scene.start('BossGame');
        });
    }
}
class BossGame extends Phaser.Scene {
    constructor() {
        super({
            key: 'BossGame'
        });
        // Initialize game variables
        this.aarav = null;
        this.jumpCount = 0;
        this.facingRight = true; // Track which direction Aarav is facing
        this.hyperChargeAmount = 0;
        this.isHyperCharged = false;
        this.hyperChargeActive = false;
        this.hyperChargeDuration = 5000; // 5 seconds in milliseconds
        this.ruhaan = null;
        this.platforms = null;
        this.bullets = null;
        this.bossBalls = null;
        this.aaravHealth = 100;
        this.ruhhanHealth = 500; // 5x Aarav's health
        this.lastShot = 0;
        this.lastBossAttack = 0;
        this.specialAttackCharge = 0; // Counter for special attack
        this.firstStart = true; // Track if it's the first time starting
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
        // Set background color and camera bounds
        this.cameras.main.setBackgroundColor('#4488AA');
        this.cameras.main.setBounds(0, 0, 1600, 1000);
        this.add.rectangle(800, 500, 1600, 1000, 0x4488AA); // Add visible background
        this.physics.world.setBounds(0, 0, 1600, 1000);

        // Create static group for platforms
        this.platforms = this.physics.add.staticGroup();

        // Create main platform/ground
        this.platforms.create(800, 980, 'platform')
            .setScale(8, 0.5) // Wider ground platform
            .refreshBody();
        // Create multiple platforms at different heights
        this.platforms.create(300, 800, 'platform')
            .setScale(1.2, 0.3)
            .refreshBody();
        this.platforms.create(800, 700, 'platform')
            .setScale(1.5, 0.3)
            .refreshBody();
        this.platforms.create(1300, 800, 'platform')
            .setScale(1.2, 0.3)
            .refreshBody();
        this.platforms.create(500, 550, 'platform')
            .setScale(1.2, 0.3)
            .refreshBody();
        this.platforms.create(1100, 500, 'platform')
            .setScale(1.2, 0.3)
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

        // Create health bars with backgrounds
        // Aarav's health bar background
        this.add.rectangle(150, 70, 300, 30, 0x333333).setOrigin(0, 0);
        this.aaravHealthBar = this.add.rectangle(150, 70, 300, 30, 0x00ff00);
        this.aaravHealthBar.setOrigin(0, 0);
        // Ruhaan's health bar background
        this.add.rectangle(750, 70, 300, 30, 0x333333).setOrigin(0, 0);
        this.ruhhanHealthBar = this.add.rectangle(750, 70, 300, 30, 0xff0000);
        this.ruhhanHealthBar.setOrigin(0, 0);

        // Setup keyboard controls
        if (this.firstStart) {
            this.showControls();
            this.firstStart = false;
        }
        // Add special attack charge bar
        this.chargeBar = this.add.rectangle(150, 110, 300, 15, 0x333333);
        this.chargeBar.setOrigin(0, 0);
        this.chargeBarFill = this.add.rectangle(150, 110, 0, 15, 0xffff00);
        this.chargeBarFill.setOrigin(0, 0);
        // Add hypercharge bar
        this.hyperChargeBar = this.add.rectangle(150, 135, 300, 15, 0x333333);
        this.hyperChargeBar.setOrigin(0, 0);
        this.hyperChargeFill = this.add.rectangle(150, 135, 0, 15, 0x800080);
        this.hyperChargeFill.setOrigin(0, 0);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.qKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    }

    update() {
        // Player movement and jump
        const baseSpeed = this.aarav.body.touching.down ? 300 : 250;
        const moveSpeed = this.hyperChargeActive ? baseSpeed * 1.5 : baseSpeed;

        if (this.cursors.left.isDown) {
            this.aarav.body.setVelocityX(-moveSpeed);
            this.facingRight = false;
            this.aarav.setScale(-1, 1); // Flip sprite horizontally
        } else if (this.cursors.right.isDown) {
            this.aarav.body.setVelocityX(moveSpeed);
            this.facingRight = true;
            this.aarav.setScale(1, 1); // Reset sprite orientation
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
        const shootDelay = this.hyperChargeActive ? 250 : 500;
        if (this.spaceKey.isDown && this.time.now > this.lastShot + shootDelay) {
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

        // Update health bars and charge bars
        this.aaravHealthBar.setScale(this.aaravHealth / 100, 1);
        this.ruhhanHealthBar.setScale(this.ruhhanHealth / 500, 1);
        this.chargeBarFill.width = (this.specialAttackCharge / 10) * 300;
        this.hyperChargeFill.width = (this.hyperChargeAmount / 10) * 300;
        // Handle hypercharge activation
        if (this.hyperChargeAmount >= 10 && !this.hyperChargeActive && this.input.keyboard.addKey('R').isDown) {
            this.activateHyperCharge();
        }

        // Check for game over
        if (this.aaravHealth <= 0 || this.ruhhanHealth <= 0) {
            this.gameOver();
        }
    }

    shoot() {
        const bulletSpeed = 400;
        const bulletOffset = this.facingRight ? 25 : -25;
        const bullet = this.add.rectangle(this.aarav.x + bulletOffset, this.aarav.y, 10, 5, 0xffff00);
        this.bullets.add(bullet);
        bullet.body.setVelocityX(this.facingRight ? bulletSpeed : -bulletSpeed);
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
        this.hyperChargeAmount = Math.min(10, this.hyperChargeAmount + 0.5);
        if (this.ruhhanHealth <= 0) {
            this.gameOver();
        }
    }

    hitPlayer(aarav, ball) {
        ball.destroy();
        const damage = this.hyperChargeActive ? 10 : 15; // 35% less damage when hypercharged
        this.aaravHealth -= damage;
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
                const damage = this.hyperChargeActive ? 150 : 100; // 50% more damage when hypercharged
                this.ruhhanHealth -= damage;
                // Visual feedback for big damage
                const damageText = this.add.text(this.ruhaan.x, this.ruhaan.y - 50, `-${damage}!`, {
                    fontSize: '32px',
                    fill: '#ff0000'
                }).setOrigin(0.5);

                this.tweens.add({
                    targets: damageText,
                    y: damageText.y - 80,
                    alpha: 0,
                    duration: 800,
                    onComplete: () => damageText.destroy()
                });

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
        // Heal for 30% (or 60% when hypercharged) of max health
        const healAmount = this.hyperChargeActive ? 60 : 30;
        this.aaravHealth = Math.min(100, this.aaravHealth + healAmount);
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
    activateHyperCharge() {
        this.hyperChargeActive = true;
        this.hyperChargeAmount = 0;
        this.hyperChargeFill.width = 0;
        // Visual effect for activation
        const flash = this.add.rectangle(0, 0, 1600, 1000, 0x800080, 0.3);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 500,
            onComplete: () => flash.destroy()
        });
        // Purple aura around player
        const aura = this.add.circle(this.aarav.x, this.aarav.y, 40, 0x800080, 0.3);
        this.tweens.add({
            targets: aura,
            alpha: 0.6,
            scale: 1.2,
            duration: 500,
            yoyo: true,
            repeat: 9,
            onComplete: () => aura.destroy()
        });
        // Deactivate after 5 seconds
        this.time.delayedCall(5000, () => {
            this.hyperChargeActive = false;
        });
    }
    showControls() {
        const controls = [
            'Controls:',
            'Arrow Keys: Move and Jump (Double Jump available)',
            'SPACE: Shoot',
            'Q: Special Attack (when charged)',
            'E: Healing (when charged)',
            'R: Activate Hypercharge (when purple bar is full)'
        ];
        const controlsBox = this.add.container(600, 200);
        // Add semi-transparent background
        const bg = this.add.rectangle(0, 0, 500, 200, 0x000000, 0.7);
        controlsBox.add(bg);
        // Add control text
        controls.forEach((text, i) => {
            const controlText = this.add.text(0, -80 + (i * 30), text, {
                fontSize: '20px',
                fill: '#fff'
            }).setOrigin(0.5);
            controlsBox.add(controlText);
        });
        // Fade out after 5 seconds
        this.tweens.add({
            targets: controlsBox,
            alpha: 0,
            duration: 1000,
            delay: 5000,
            onComplete: () => controlsBox.destroy()
        });
    }
    gameOver() {
        const winner = this.aaravHealth <= 0 ? 'Ruhaan' : 'Aarav';
        // Create semi-transparent background
        const bg = this.add.rectangle(800, 500, 1600, 1000, 0x000000, 0.7);
        // Game over text
        this.add.text(800, 400, `Game Over! ${winner} wins!`, {
            fontSize: '64px',
            fill: '#fff'
        }).setOrigin(0.5);
        // Restart button
        const restartButton = this.add.text(800, 500, 'Play Again', {
                fontSize: '32px',
                fill: '#fff'
            }).setOrigin(0.5)
            .setInteractive()
            .setPadding(10)
            .setStyle({
                backgroundColor: '#111'
            });
        // Main menu button
        const menuButton = this.add.text(800, 570, 'Main Menu', {
                fontSize: '32px',
                fill: '#fff'
            }).setOrigin(0.5)
            .setInteractive()
            .setPadding(10)
            .setStyle({
                backgroundColor: '#111'
            });
        restartButton.on('pointerdown', () => {
            this.scene.stop();
            this.scene.start('BossGame');
        });
        menuButton.on('pointerdown', () => {
            this.scene.stop();
            this.scene.start('StartScreen');
        });
    }
}

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 1600,
    height: 1000,
    backgroundColor: '#4488AA',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 1000
            },
            debug: false
        }
    },
    scene: [StartScreen, BossGame]
};

// Create the game instance
const game = new Phaser.Game(config);
