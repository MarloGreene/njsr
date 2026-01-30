const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game constants
const GRAVITY = 0.6;
const FRICTION = 0.85;
const JUMP_FORCE = -14;
const MOVE_SPEED = 0.8;
const MAX_SPEED = 6;
const TILE_SIZE = 40;

// Speed tiers (multipliers)
const SPEED_TIERS = [
    { name: 'run', mult: 1.0, threshold: 0 },
    { name: 'fast', mult: 1.6, threshold: 1000 },    // 1 second
    { name: 'turbo', mult: 2.5, threshold: 2000 }    // 2 seconds
];

// Game state
let gameRunning = false;
let autoRun = false;
let turboMode = false;
let score = 0;
let cameraX = 0;
let particles = [];
let platforms = [];
let debris = [];

// Player
const player = {
    x: 100,
    y: 200,
    width: 24,
    height: 32,
    vx: 0,
    vy: 0,
    onGround: false,
    canJump: true,
    facing: 1,
    animFrame: 0,
    animTimer: 0
};

// Input state
const keys = {
    left: false,
    right: false,
    jump: false
};

// Triple-tap turbo detection
const tapTracker = {
    left: { times: [], turboLocked: false },
    right: { times: [], turboLocked: false }
};
const TAP_WINDOW = 400; // ms window for triple-tap

// Hold-to-accelerate tracking
let directionHoldStart = 0;
let currentSpeedTier = 0;
let instantTurbo = false; // For shift key or triple-tap

// Level generation - chill version, no hazards
function generateChunk(startX) {
    const chunkWidth = 800;
    const endX = startX + chunkWidth;

    // Ground - fewer gaps, more forgiving
    let groundX = startX;
    while (groundX < endX) {
        const width = 150 + Math.random() * 250;
        platforms.push({
            x: groundX,
            y: canvas.height - 40,
            width: width,
            height: 40,
            type: 'ground',
            destructible: false
        });
        groundX += width + 20; // Small gaps only
    }

    // Floating platforms
    for (let i = 0; i < 4; i++) {
        const x = startX + Math.random() * chunkWidth;
        const y = 150 + Math.random() * (canvas.height - 250);
        platforms.push({
            x: x,
            y: y,
            width: 80 + Math.random() * 100,
            height: 20,
            type: 'platform',
            destructible: false
        });
    }

    // Breakable walls - these can be smashed through!
    for (let i = 0; i < 3; i++) {
        const x = startX + 150 + Math.random() * (chunkWidth - 300);
        const height = 80 + Math.random() * 120;
        platforms.push({
            x: x,
            y: canvas.height - 40 - height,
            width: 25,
            height: height,
            type: 'wall',
            destructible: true
        });
    }
}

function init() {
    canvas.width = Math.min(1200, window.innerWidth);
    canvas.height = Math.min(600, window.innerHeight - 40);

    player.x = 100;
    player.y = canvas.height - 150;
    player.vx = 0;
    player.vy = 0;

    platforms = [];
    particles = [];
    debris = [];
    cameraX = 0;
    score = 0;

    // Generate initial chunks
    for (let i = -200; i < 2000; i += 800) {
        generateChunk(i);
    }
}

function spawnParticles(x, y, color, count = 5) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6 - 2,
            life: 30 + Math.random() * 20,
            color: color,
            size: 2 + Math.random() * 3
        });
    }
}

function spawnDebris(x, y, width, height) {
    // Create debris chunks when wall is destroyed
    const chunks = 8 + Math.floor(Math.random() * 6);
    for (let i = 0; i < chunks; i++) {
        debris.push({
            x: x + Math.random() * width,
            y: y + Math.random() * height,
            vx: (Math.random() - 0.5) * 12,
            vy: -Math.random() * 8 - 2,
            width: 8 + Math.random() * 12,
            height: 8 + Math.random() * 12,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.3,
            life: 60 + Math.random() * 40
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function updateDebris() {
    for (let i = debris.length - 1; i >= 0; i--) {
        const d = debris[i];
        d.x += d.vx;
        d.y += d.vy;
        d.vy += 0.4;
        d.vx *= 0.99;
        d.rotation += d.rotationSpeed;
        d.life--;
        if (d.life <= 0 || d.y > canvas.height + 100) {
            debris.splice(i, 1);
        }
    }
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function getSpeedMultiplier() {
    // Instant turbo (shift or triple-tap) overrides hold-based tiers
    if (instantTurbo) return SPEED_TIERS[2].mult;

    if (directionHoldStart === 0) return 1;

    const holdTime = Date.now() - directionHoldStart;

    // Find the highest tier we've reached
    let tier = 0;
    for (let i = SPEED_TIERS.length - 1; i >= 0; i--) {
        if (holdTime >= SPEED_TIERS[i].threshold) {
            tier = i;
            break;
        }
    }

    // Update UI if tier changed
    if (tier !== currentSpeedTier) {
        currentSpeedTier = tier;
        updateSpeedIndicator();
    }

    return SPEED_TIERS[tier].mult;
}

function updateSpeedIndicator() {
    const indicator = document.getElementById('speed-indicator');
    const tierName = SPEED_TIERS[currentSpeedTier].name;
    indicator.textContent = tierName.toUpperCase();
    indicator.className = 'speed-tier tier-' + tierName;

    // Also update turbo button state for visual consistency
    const turboBtn = document.getElementById('turbo-btn');
    turboBtn.classList.toggle('active', currentSpeedTier === 2 || instantTurbo);
}

function update() {
    if (!gameRunning) return;

    const speedMult = getSpeedMultiplier();
    const currentMaxSpeed = MAX_SPEED * speedMult;
    turboMode = speedMult >= SPEED_TIERS[2].mult; // For particle effects etc

    // Input handling
    let moveDir = 0;
    if (keys.left) moveDir -= 1;
    if (keys.right) moveDir += 1;
    if (autoRun) moveDir = 1;

    // Horizontal movement
    if (moveDir !== 0) {
        player.vx += moveDir * MOVE_SPEED * speedMult;
        player.facing = moveDir;
    }
    player.vx *= FRICTION;
    player.vx = Math.max(-currentMaxSpeed, Math.min(currentMaxSpeed, player.vx));

    // Gravity
    player.vy += GRAVITY;

    // Jump - very forgiving, can always jump
    if (keys.jump && player.canJump) {
        if (player.onGround || player.vy > 0) { // Can jump if on ground OR falling
            player.vy = JUMP_FORCE * (turboMode ? 1.2 : 1);
            player.canJump = false;
            spawnParticles(player.x + player.width / 2, player.y + player.height, '#e94560', 8);
        }
    }
    if (!keys.jump) player.canJump = true;

    // Apply velocity
    player.x += player.vx;
    player.y += player.vy;

    // Screen wrap - fall through bottom, appear at top
    if (player.y > canvas.height + 50) {
        player.y = -player.height - 20;
        player.vy = Math.min(player.vy, 2); // Gentle re-entry
        spawnParticles(player.x + player.width / 2, 10, '#4a90d9', 10);
    }

    // Collision detection
    player.onGround = false;

    const playerRect = {
        x: player.x,
        y: player.y,
        width: player.width,
        height: player.height
    };

    // Check if player is moving fast enough to break walls
    const isSmashing = !player.onGround && (Math.abs(player.vx) > 3 || player.vy < -2);

    for (let i = platforms.length - 1; i >= 0; i--) {
        const plat = platforms[i];
        if (!checkCollision(playerRect, plat)) continue;

        // Destructible walls can be smashed through!
        if (plat.destructible && isSmashing) {
            spawnDebris(plat.x, plat.y, plat.width, plat.height);
            spawnParticles(plat.x + plat.width / 2, plat.y + plat.height / 2, '#e94560', 15);
            platforms.splice(i, 1);
            // Boost player slightly on breakthrough
            player.vx *= 1.1;
            continue;
        }

        // Calculate overlap
        const overlapLeft = (player.x + player.width) - plat.x;
        const overlapRight = (plat.x + plat.width) - player.x;
        const overlapTop = (player.y + player.height) - plat.y;
        const overlapBottom = (plat.y + plat.height) - player.y;

        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);

        if (minOverlapY < minOverlapX) {
            if (overlapTop < overlapBottom && player.vy > 0) {
                player.y = plat.y - player.height;
                player.vy = 0;
                player.onGround = true;
            } else if (overlapBottom < overlapTop && player.vy < 0) {
                player.y = plat.y + plat.height;
                player.vy = 0;
            }
        } else {
            if (overlapLeft < overlapRight) {
                player.x = plat.x - player.width;
            } else {
                player.x = plat.x + plat.width;
            }
            player.vx = 0;
        }
    }

    // Update camera
    const targetCameraX = player.x - canvas.width / 3;
    cameraX += (targetCameraX - cameraX) * 0.1;

    // Update score
    score = Math.max(score, Math.floor(player.x / 10));
    document.getElementById('score').textContent = score;

    // Generate new chunks
    const furthestPlatform = Math.max(...platforms.map(p => p.x + p.width));
    if (player.x + canvas.width > furthestPlatform - 800) {
        generateChunk(furthestPlatform);
    }

    // Clean up off-screen objects
    platforms = platforms.filter(p => p.x + p.width > cameraX - 200);

    // Animation
    player.animTimer++;
    if (Math.abs(player.vx) > 0.5 && player.onGround) {
        if (player.animTimer % 6 === 0) {
            player.animFrame = (player.animFrame + 1) % 4;
        }
    } else {
        player.animFrame = 0;
    }

    // Turbo particles
    if (turboMode && Math.abs(player.vx) > 2) {
        if (player.animTimer % 3 === 0) {
            spawnParticles(
                player.x + (player.facing < 0 ? player.width : 0),
                player.y + player.height / 2,
                '#ffcc00',
                2
            );
        }
    }

    updateParticles();
    updateDebris();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background layers (parallax)
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    ctx.fillStyle = '#4a4a6a';
    for (let i = 0; i < 50; i++) {
        const x = ((i * 73 + 100) % (canvas.width + 200)) - (cameraX * 0.1 % (canvas.width + 200));
        const y = (i * 47) % (canvas.height - 100);
        ctx.fillRect(x, y, 2, 2);
    }

    // Background mountains
    ctx.fillStyle = '#16213e';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let x = 0; x < canvas.width + 100; x += 100) {
        const worldX = x + (cameraX * 0.3);
        const y = canvas.height - 100 - Math.sin(worldX * 0.005) * 80 - Math.cos(worldX * 0.003) * 50;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.fill();

    ctx.save();
    ctx.translate(-cameraX, 0);

    // Draw platforms
    for (const plat of platforms) {
        if (plat.x + plat.width < cameraX - 50 || plat.x > cameraX + canvas.width + 50) continue;

        if (plat.type === 'ground') {
            ctx.fillStyle = '#2d2d44';
            ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
            ctx.fillStyle = '#3d3d5c';
            ctx.fillRect(plat.x, plat.y, plat.width, 8);
        } else if (plat.type === 'wall') {
            // Breakable walls have a different look
            ctx.fillStyle = plat.destructible ? '#4a3d5c' : '#2d2d44';
            ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
            // Crack pattern for destructible walls
            if (plat.destructible) {
                ctx.strokeStyle = '#6a5a7c';
                ctx.lineWidth = 1;
                for (let y = plat.y + 15; y < plat.y + plat.height; y += 20) {
                    ctx.beginPath();
                    ctx.moveTo(plat.x + 5, y);
                    ctx.lineTo(plat.x + plat.width - 5, y + 5);
                    ctx.stroke();
                }
            } else {
                ctx.fillStyle = '#3d3d5c';
                for (let y = plat.y; y < plat.y + plat.height; y += 25) {
                    ctx.fillRect(plat.x, y, plat.width, 3);
                }
            }
        } else {
            ctx.fillStyle = '#3d3d5c';
            ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
            ctx.fillStyle = '#4d4d6c';
            ctx.fillRect(plat.x, plat.y, plat.width, 5);
        }
    }

    // Draw debris
    ctx.fillStyle = '#4a3d5c';
    for (const d of debris) {
        ctx.save();
        ctx.translate(d.x + d.width / 2, d.y + d.height / 2);
        ctx.rotate(d.rotation);
        ctx.globalAlpha = d.life / 100;
        ctx.fillRect(-d.width / 2, -d.height / 2, d.width, d.height);
        ctx.restore();
    }
    ctx.globalAlpha = 1;

    // Draw particles
    for (const p of particles) {
        ctx.globalAlpha = p.life / 50;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // Draw player
    const px = player.x;
    const py = player.y;

    // Turbo glow
    if (turboMode) {
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 20;
    }

    // Body
    ctx.fillStyle = turboMode ? '#ffcc00' : '#e94560';
    ctx.fillRect(px + 4, py + 8, 16, 20);

    // Head
    ctx.fillStyle = '#fff';
    ctx.fillRect(px + 6, py, 12, 12);

    // Eyes
    ctx.fillStyle = '#1a1a2e';
    const eyeOffset = player.facing > 0 ? 4 : 0;
    ctx.fillRect(px + 8 + eyeOffset, py + 4, 3, 3);

    // Legs (animated)
    ctx.fillStyle = turboMode ? '#cc9900' : '#b8344e';
    const legOffset = Math.sin(player.animFrame * Math.PI / 2) * 4;
    if (player.onGround && Math.abs(player.vx) > 0.5) {
        ctx.fillRect(px + 6, py + 26, 4, 8 + legOffset);
        ctx.fillRect(px + 14, py + 26, 4, 8 - legOffset);
    } else {
        ctx.fillRect(px + 6, py + 26, 4, 8);
        ctx.fillRect(px + 14, py + 26, 4, 8);
    }

    ctx.shadowBlur = 0;

    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    init();
    directionHoldStart = 0;
    currentSpeedTier = 0;
    instantTurbo = false;
    updateSpeedIndicator();
    gameRunning = true;
}

// Triple-tap detection helper
function checkTripleTap(direction) {
    const tracker = tapTracker[direction];
    const now = Date.now();

    // Add this tap
    tracker.times.push(now);

    // Keep only taps within the window
    tracker.times = tracker.times.filter(t => now - t < TAP_WINDOW);

    // If we have 3 taps in the window, lock turbo
    if (tracker.times.length >= 3) {
        tracker.turboLocked = true;
        tracker.times = []; // Reset for next detection
        setTurbo(true, true); // true = locked mode
    }
}

function releaseTurboLock(direction) {
    const tracker = tapTracker[direction];
    if (tracker.turboLocked) {
        tracker.turboLocked = false;
        // Only release turbo if the other direction isn't also locked
        const otherDir = direction === 'left' ? 'right' : 'left';
        if (!tapTracker[otherDir].turboLocked) {
            setTurbo(false);
        }
    }
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.repeat) return; // Ignore key repeat for tap detection

    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keys.left = true;
        checkTripleTap('left');
        if (directionHoldStart === 0) directionHoldStart = Date.now();
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keys.right = true;
        checkTripleTap('right');
        if (directionHoldStart === 0) directionHoldStart = Date.now();
    }
    if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        keys.jump = true;
        e.preventDefault();
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        instantTurbo = true;
        updateSpeedIndicator();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keys.left = false;
        releaseTurboLock('left');
        if (!keys.right) {
            directionHoldStart = 0;
            currentSpeedTier = 0;
            updateSpeedIndicator();
        }
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keys.right = false;
        releaseTurboLock('right');
        if (!keys.left) {
            directionHoldStart = 0;
            currentSpeedTier = 0;
            updateSpeedIndicator();
        }
    }
    if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') keys.jump = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        // Only release if not locked by triple-tap
        if (!tapTracker.left.turboLocked && !tapTracker.right.turboLocked) {
            instantTurbo = false;
            updateSpeedIndicator();
        }
    }
});

// Touch controls
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnJump = document.getElementById('btn-jump');

btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); keys.left = true; });
btnLeft.addEventListener('touchend', (e) => { e.preventDefault(); keys.left = false; });
btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); keys.right = true; });
btnRight.addEventListener('touchend', (e) => { e.preventDefault(); keys.right = false; });
btnJump.addEventListener('touchstart', (e) => { e.preventDefault(); keys.jump = true; });
btnJump.addEventListener('touchend', (e) => { e.preventDefault(); keys.jump = false; });

// Auto-run button
function toggleAutoRun() {
    autoRun = !autoRun;
    document.getElementById('auto-run-btn').classList.toggle('active', autoRun);
}

function setTurbo(active, locked = false) {
    instantTurbo = active;
    const btn = document.getElementById('turbo-btn');
    btn.classList.toggle('active', active);
    btn.classList.toggle('locked', active && locked);
    updateSpeedIndicator();
}

document.getElementById('auto-run-btn').addEventListener('click', toggleAutoRun);

// Turbo button (touch hold)
const turboBtn = document.getElementById('turbo-btn');
turboBtn.addEventListener('mousedown', () => setTurbo(true));
turboBtn.addEventListener('mouseup', () => setTurbo(false));
turboBtn.addEventListener('mouseleave', () => setTurbo(false));
turboBtn.addEventListener('touchstart', (e) => { e.preventDefault(); setTurbo(true); });
turboBtn.addEventListener('touchend', (e) => { e.preventDefault(); setTurbo(false); });

// Start/restart buttons
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);

// Window resize
window.addEventListener('resize', () => {
    if (!gameRunning) {
        canvas.width = Math.min(1200, window.innerWidth);
        canvas.height = Math.min(600, window.innerHeight - 40);
    }
});

// Initialize
init();
gameLoop();
