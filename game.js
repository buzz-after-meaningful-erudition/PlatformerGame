class BossGame extends Phaser.Scene {
    constructor() {
        super();
        // Initialize game variables
        this.aarav = null;
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
        this.platforms.create(400, 580, 'platform')
            .setScale(2, 0.5)
            .refreshBody();

        // Create additional platforms
        this.platforms.create(600, 400, 'platform')
            .setScale(0.5, 0.2)
            .refreshBody();
        this.platforms.create(200, 300, 'platform')
            .setScale(0.5, 0.2)
            .refreshBody();

        // Create Aarav (hero)
        this.aarav = this.add.rectangle(100, 450, 50, 80, 0x00ff00);
        this.physics.add.existing(this.aarav);
        this.aarav.body.setBounce(0.2);
        this.aarav.body.setCollideWorldBounds(true);
        this.aarav.body.setGravityY(300);

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
    }

    update() {
        // Player movement
        if (this.cursors.left.isDown) {
            this.aarav.body.setVelocityX(-160);
        } else if (this.cursors.right.isDown) {
            this.aarav.body.setVelocityX(160);
        } else {
            this.aarav.body.setVelocityX(0);
        }

        // Player jump
        if (this.cursors.up.isDown && this.aarav.body.touching.down) {
            this.aarav.body.setVelocityY(-500);
        }
        // Add air control (slightly reduced movement speed in air)
        const moveSpeed = this.aarav.body.touching.down ? 160 : 120;

        if (this.cursors.left.isDown) {
            this.aarav.body.setVelocityX(-moveSpeed);
        } else if (this.cursors.right.isDown) {
            this.aarav.body.setVelocityX(moveSpeed);
        } else {
            this.aarav.body.setVelocityX(0);
        }

        // Player shoot
        if (this.spaceKey.isDown && this.time.now > this.lastShot + 500) {
            this.shoot();
            this.lastShot = this.time.now;
        }
        // Special Attack
        if (this.qKey.isDown && this.specialAttackCharge >= 10) {
            this.specialAttack();
            this.specialAttackCharge = 0;
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
        if (distanceToPlayer > 300) {
            this.ruhaan.body.setVelocityX(direction < 0 ? -150 : 150);
        } else if (distanceToPlayer < 200) {
            this.ruhaan.body.setVelocityX(direction < 0 ? 150 : -150);
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
        this.aaravHealth -= 25;
        if (this.aaravHealth <= 0) {
            this.gameOver();
        }
    }

    destroyBullet(bullet) {
        bullet.destroy();
    }
    specialAttack() {
        // Create a powerful beam attack
        const beam = this.add.rectangle(this.aarav.x, this.aarav.y, 400, 20, 0x00ffff);
        this.bullets.add(beam);
        beam.body.setAllowGravity(false);
        beam.body.setVelocityX(800);

        // Special attack does more damage
        this.physics.add.overlap(this.ruhaan, beam, (ruhaan, beam) => {
            beam.destroy();
            this.ruhhanHealth -= 50;
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
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 300
            },
            debug: false
        }
    },
    scene: BossGame
};

// Create the game instance
const game = new Phaser.Game(config);
