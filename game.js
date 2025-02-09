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
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
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
            this.aarav.body.setVelocityY(-400);
        }

        // Player shoot
        if (this.spaceKey.isDown && this.time.now > this.lastShot + 500) {
            this.shoot();
            this.lastShot = this.time.now;
        }

        // Boss AI and attacks
        this.updateBoss();

        // Update health bars
        this.aaravHealthBar.setScale(this.aaravHealth / 100, 1);
        this.ruhhanHealthBar.setScale(this.ruhhanHealth / 400, 1);

        // Check for game over
        if (this.aaravHealth <= 0 || this.ruhhanHealth <= 0) {
            this.gameOver();
        }
    }

    shoot() {
        const bullet = this.add.rectangle(this.aarav.x, this.aarav.y, 10, 5, 0xffff00);
        this.bullets.add(bullet);
        bullet.body.setVelocityX(400);
    }

    updateBoss() {
        // Basic boss movement
        if (this.time.now > this.lastBossAttack + 2000) {
            // Choose random attack
            if (Math.random() < 0.5) {
                this.bossBallAttack();
            } else {
                this.bossJumpAttack();
            }
            this.lastBossAttack = this.time.now;
        }

        // Move towards player
        const direction = this.aarav.x - this.ruhaan.x;
        this.ruhaan.body.setVelocityX(direction < 0 ? -100 : 100);
    }

    bossBallAttack() {
        const ball = this.add.circle(this.ruhaan.x, this.ruhaan.y, 15, 0xff6600);
        this.bossBalls.add(ball);
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

    hitBoss(ruhaan, bullet) {
        bullet.destroy();
        this.ruhhanHealth -= 10;
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
