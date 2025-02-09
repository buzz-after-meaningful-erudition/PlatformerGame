// Create a canvas and add it to the notebook output
let canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = 800;
canvas.height = 500;
let ctx = canvas.getContext("2d");

// Load sprites
function loadImage(src) {
    let img = new Image();
    img.src = src;
    return img;
}

let heroSprites = {
    idle: loadImage("https://via.placeholder.com/50x50?text=A"), // Replace with actual sprite
    left: [loadImage("https://via.placeholder.com/50x50?text=L")], // Replace with actual frames
    right: [loadImage("https://via.placeholder.com/50x50?text=R")], // Replace with actual frames
};
let bossSprite = loadImage("https://via.placeholder.com/80x80?text=B"); // Replace with actual sprite
let bulletSprite = loadImage("https://via.placeholder.com/10x10?text=*"); // Replace with actual sprite

// Hero (Aarav) properties
let hero = {
    x: 100,
    y: 400,
    width: 50,
    height: 50,
    speed: 5,
    dy: 0,
    gravity: 0.5,
    jumpPower: -10,
    isJumping: false,
    health: 100,
    maxHealth: 100,
    direction: "idle",
    bullets: [],
};

// Boss (Ruhaan) properties
let boss = {
    x: 500,
    y: 300,
    width: 80,
    height: 80,
    health: 400,
    maxHealth: 400,
    bullets: [],
    speed: 2,
    dy: 0,
    gravity: 0.4,
    isJumping: false,
};

// Platforms
let platforms = [
    { x: 200, y: 350, width: 150, height: 10 },
    { x: 450, y: 300, width: 150, height: 10 },
];

// Handle keyboard input
let keys = {};
document.addEventListener("keydown", (event) => (keys[event.key] = true));
document.addEventListener("keyup", (event) => (keys[event.key] = false));

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Movement logic for Aarav
    if (keys["ArrowLeft"]) {
        hero.x -= hero.speed;
        hero.direction = "left";
    } else if (keys["ArrowRight"]) {
        hero.x += hero.speed;
        hero.direction = "right";
    } else {
        hero.direction = "idle";
    }

    // Jump logic for Aarav
    if (keys["ArrowUp"] && !hero.isJumping) {
        hero.dy = hero.jumpPower;
        hero.isJumping = true;
    }
    hero.dy += hero.gravity;
    hero.y += hero.dy;
    
    // Collision with platforms
    for (let p of platforms) {
        if (hero.y + hero.height >= p.y && hero.y + hero.height <= p.y + 10 && hero.x + hero.width > p.x && hero.x < p.x + p.width) {
            hero.y = p.y - hero.height;
            hero.dy = 0;
            hero.isJumping = false;
        }
    }

    // Shooting bullets
    if (keys[" "] && hero.bullets.length < 5) { 
        hero.bullets.push({ x: hero.x + hero.width, y: hero.y + hero.height / 2, speed: 7 });
    }

    // Move and draw bullets
    hero.bullets = hero.bullets.filter(b => b.x < canvas.width);
    hero.bullets.forEach(b => b.x += b.speed);

    // Boss AI movement and attack
    boss.x += boss.speed;
    if (boss.x + boss.width > canvas.width || boss.x < 0) boss.speed *= -1;

    if (Math.random() < 0.02 && boss.bullets.length < 3) { // Boss shoots sometimes
        boss.bullets.push({ x: boss.x, y: boss.y + boss.height / 2, speed: -5 });
    }
    boss.bullets.forEach(b => b.x += b.speed);
    
    // Bullet collision detection
    hero.bullets.forEach((b, i) => {
        if (b.x > boss.x && b.x < boss.x + boss.width && b.y > boss.y && b.y < boss.y + boss.height) {
            boss.health -= 10;
            hero.bullets.splice(i, 1);
        }
    });

    boss.bullets.forEach((b, i) => {
        if (b.x > hero.x && b.x < hero.x + hero.width && b.y > hero.y && b.y < hero.y + hero.height) {
            hero.health -= 20;
            boss.bullets.splice(i, 1);
        }
    });

    // Draw elements
    ctx.fillStyle = "black";
    ctx.fillRect(hero.x, hero.y, hero.width, hero.height); // Placeholder for hero sprite
    ctx.fillRect(boss.x, boss.y, boss.width, boss.height); // Placeholder for boss sprite
    hero.bullets.forEach(b => ctx.fillRect(b.x, b.y, 10, 5));
    boss.bullets.forEach(b => ctx.fillRect(b.x, b.y, 10, 5));
    platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));

    // Health bars
    ctx.fillStyle = "red";
    ctx.fillRect(10, 10, (hero.health / hero.maxHealth) * 200, 10);
    ctx.fillRect(590, 10, (boss.health / boss.maxHealth) * 200, 10);

    // Game over
    if (hero.health <= 0) {
        alert("Aarav has been defeated!");
        return;
    }
    if (boss.health <= 0) {
        alert("Ruhaan has been defeated!");
        return;
    }

    requestAnimationFrame(gameLoop);
}

// Start game loop
gameLoop();
