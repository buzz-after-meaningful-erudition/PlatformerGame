// Game Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let gameWidth = 800;
let gameHeight = 600;
canvas.width = gameWidth;
canvas.height = gameHeight;

let aarav = {
    x: 100,
    y: 500,
    width: 50,
    height: 50,
    speed: 5,
    velocityX: 0,
    velocityY: 0,
    health: 100,  // Aarav's health
    isJumping: false,
    facingRight: true, // To track Aarav's movement direction
    spriteSheet: {
        left: [], // Sprites for left movement
        right: [], // Sprites for right movement
        jump: [] // Sprites for jumping
    },
    // Load sprites
    loadSprites: function() {
        // You can replace these paths with the actual paths to your sprite images
        for (let i = 0; i < 6; i++) {
            this.spriteSheet.left.push(new Image());
            this.spriteSheet.left[i].src = `aarav_left_${i}.png`; // Add the correct sprite file paths
            this.spriteSheet.right.push(new Image());
            this.spriteSheet.right[i].src = `aarav_right_${i}.png`; // Add the correct sprite file paths
        }
    }
};

let ruhaan = {
    x: 600,
    y: 500,
    width: 80,
    height: 80,
    health: 400,  // Ruhaan's health (4x more than Aarav)
    speed: 3,
    isJumping: false,
    velocityX: 0,
    velocityY: 0,
    attackCooldown: 0, // Tracks cooldown for attack
    sprite: new Image(),
    // Load Ruhaan's sprite
    loadSprite: function() {
        this.sprite.src = 'ruhaan_sprite.png'; // Replace with Ruhaan's sprite image path
    }
};

// Platform setup
let platforms = [
    { x: 100, y: 550, width: 200, height: 20 }, // Example platform
    { x: 400, y: 400, width: 200, height: 20 }
];

// Bullet setup for Aarav
let bullets = [];
let bulletSpeed = 10;

let gravity = 0.8;
let jumpPower = 12;

// Load all sprites and resources
aarav.loadSprites();
ruhaan.loadSprite();

// Handle user input for movement and shooting
let keys = {
    left: false,
    right: false,
    up: false,
    shoot: false
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
    if (e.key === 'ArrowUp') keys.up = true;
    if (e.key === ' ') keys.shoot = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
    if (e.key === 'ArrowUp') keys.up = false;
    if (e.key === ' ') keys.shoot = false;
});

// Physics and movement for Aarav and Ruhaan
function update() {
    // Aarav's movement and jumping
    if (keys.left) {
        aarav.velocityX = -aarav.speed;
        aarav.facingRight = false;
    } else if (keys.right) {
        aarav.velocityX = aarav.speed;
        aarav.facingRight = true;
    } else {
        aarav.velocityX = 0;
    }

    if (keys.up && !aarav.isJumping) {
        aarav.velocityY = -jumpPower;
        aarav.isJumping = true;
    }

    // Apply gravity to Aarav
    if (aarav.y + aarav.height < gameHeight) {
        aarav.velocityY += gravity;
    } else {
        aarav.velocityY = 0;
        aarav.isJumping = false;
        aarav.y = gameHeight - aarav.height;
    }

    // Move Aarav
    aarav.x += aarav.velocityX;
    aarav.y += aarav.velocityY;

    // Collision with platforms
    platforms.forEach(platform => {
        if (aarav.x < platform.x + platform.width &&
            aarav.x + aarav.width > platform.x &&
            aarav.y + aarav.height > platform.y &&
            aarav.y + aarav.height < platform.y + 10) {
          
