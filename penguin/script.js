document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const distanceEl = document.getElementById('distance');
    const peakCountEl = document.getElementById('peak-count');
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const highScoreEl = document.getElementById('high-score');
    const finalDistanceEl = document.getElementById('final-distance');
    const peaksReachedEl = document.getElementById('peaks-reached');

    // Game state
    let gameState = 'start'; // 'start', 'playing', 'gameover'
    let distance = 0;
    let peakCount = 1;
    let mountainProgress = 0;
    const MOUNTAIN_DISTANCE = 5000; // Distance to reach a peak

    // Penguin state
    const penguin = {
        x: 0,
        y: 0,
        z: 50,
        targetX: 0,
        vx: 0,
        vy: 0,
        isJumping: false,
        isSliding: false,
        slideTimer: 0,
        wobble: 0,
        speed: 5
    };

    // Camera/perspective
    const camera = {
        height: 80,
        distance: 120,
        fov: 300
    };

    // Ground segments for perspective effect
    const groundSegments = [];
    const SEGMENT_LENGTH = 50;
    const ROAD_WIDTH = 400;
    const VISIBLE_SEGMENTS = 100;

    // Obstacles
    let obstacles = [];
    const OBSTACLE_SPAWN_RATE = 0.02;

    // Particles (snow, slide particles)
    let particles = [];

    // Stars for background
    const stars = [];
    for (let i = 0; i < 150; i++) {
        stars.push({
            x: Math.random(),
            y: Math.random() * 0.5,
            size: Math.random() * 2 + 0.5,
            twinkle: Math.random() * Math.PI * 2
        });
    }

    // Input state
    const keys = {
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false
    };

    // Resize canvas
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Initialize ground segments
    function initGround() {
        groundSegments.length = 0;
        for (let i = 0; i < VISIBLE_SEGMENTS; i++) {
            groundSegments.push({
                z: i * SEGMENT_LENGTH,
                color: i % 8 < 4 ? '#e8f4fc' : '#d4eaf5'
            });
        }
    }

    // Project 3D to 2D
    function project(x, y, z) {
        const scale = camera.fov / (z + camera.distance);
        return {
            x: canvas.width / 2 + x * scale,
            y: canvas.height * 0.75 - (y + camera.height) * scale,
            scale: scale
        };
    }

    // Draw mountain
    function drawMountain() {
        const progress = mountainProgress / MOUNTAIN_DISTANCE;
        const baseScale = 0.3 + progress * 0.7;
        const baseY = canvas.height * (0.4 - progress * 0.15);

        // Distant mountain (always visible, represents "the next one")
        ctx.fillStyle = '#2a3a5c';
        ctx.beginPath();
        const farW = canvas.width * 0.4;
        const farH = canvas.height * 0.25;
        const farY = canvas.height * 0.35;
        ctx.moveTo(canvas.width * 0.2, farY + farH);
        ctx.lineTo(canvas.width * 0.4, farY);
        ctx.lineTo(canvas.width * 0.6, farY + farH);
        ctx.fill();

        // Main mountain
        ctx.fillStyle = '#4a6491';
        ctx.beginPath();
        const w = canvas.width * baseScale * 0.8;
        const h = canvas.height * baseScale * 0.6;
        const cx = canvas.width / 2;
        ctx.moveTo(cx - w / 2, baseY + h);
        ctx.lineTo(cx - w * 0.1, baseY + h * 0.3);
        ctx.lineTo(cx, baseY);
        ctx.lineTo(cx + w * 0.15, baseY + h * 0.35);
        ctx.lineTo(cx + w / 2, baseY + h);
        ctx.fill();

        // Snow cap
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        const snowH = h * 0.25;
        ctx.moveTo(cx - w * 0.12, baseY + snowH);
        ctx.lineTo(cx, baseY);
        ctx.lineTo(cx + w * 0.15, baseY + snowH * 1.2);
        ctx.lineTo(cx + w * 0.05, baseY + snowH * 0.8);
        ctx.lineTo(cx - w * 0.05, baseY + snowH * 1.1);
        ctx.fill();

        // Peak glow when close
        if (progress > 0.8) {
            const glowIntensity = (progress - 0.8) / 0.2;
            const gradient = ctx.createRadialGradient(cx, baseY, 0, cx, baseY, 100);
            gradient.addColorStop(0, `rgba(255, 220, 150, ${glowIntensity * 0.5})`);
            gradient.addColorStop(1, 'rgba(255, 220, 150, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(cx, baseY, 100, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw sky gradient
    function drawSky() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.75);
        gradient.addColorStop(0, '#0a0a2e');
        gradient.addColorStop(0.5, '#1a2a4e');
        gradient.addColorStop(1, '#3a5a8e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Stars
        const time = Date.now() / 1000;
        ctx.fillStyle = '#fff';
        stars.forEach(star => {
            const twinkle = Math.sin(time * 2 + star.twinkle) * 0.5 + 0.5;
            ctx.globalAlpha = 0.3 + twinkle * 0.7;
            ctx.beginPath();
            ctx.arc(
                star.x * canvas.width,
                star.y * canvas.height,
                star.size * twinkle,
                0, Math.PI * 2
            );
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Aurora borealis effect
        const auroraGradient = ctx.createLinearGradient(0, canvas.height * 0.1, 0, canvas.height * 0.4);
        auroraGradient.addColorStop(0, 'rgba(100, 255, 200, 0)');
        auroraGradient.addColorStop(0.3, `rgba(100, 255, 200, ${0.05 + Math.sin(time * 0.5) * 0.03})`);
        auroraGradient.addColorStop(0.6, `rgba(150, 100, 255, ${0.03 + Math.sin(time * 0.7) * 0.02})`);
        auroraGradient.addColorStop(1, 'rgba(150, 100, 255, 0)');
        ctx.fillStyle = auroraGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height * 0.5);
    }

    // Draw ground with perspective
    function drawGround() {
        const horizonY = canvas.height * 0.45;

        // Draw ground plane
        for (let i = groundSegments.length - 1; i >= 0; i--) {
            const seg = groundSegments[i];
            const relZ = seg.z - penguin.z;

            if (relZ < 0 || relZ > SEGMENT_LENGTH * VISIBLE_SEGMENTS) continue;

            const p1 = project(-ROAD_WIDTH, 0, relZ);
            const p2 = project(ROAD_WIDTH, 0, relZ);
            const p3 = project(ROAD_WIDTH, 0, relZ + SEGMENT_LENGTH);
            const p4 = project(-ROAD_WIDTH, 0, relZ + SEGMENT_LENGTH);

            if (p1.y < horizonY) continue;

            ctx.fillStyle = seg.color;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.lineTo(p4.x, p4.y);
            ctx.fill();

            // Side edges (snow banks)
            ctx.fillStyle = '#c4dae5';
            ctx.beginPath();
            ctx.moveTo(p1.x - 50 * p1.scale, p1.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.lineTo(p4.x, p4.y);
            ctx.lineTo(p4.x - 50 * p4.scale, p4.y);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(p2.x, p2.y);
            ctx.lineTo(p2.x + 50 * p2.scale, p2.y);
            ctx.lineTo(p3.x + 50 * p3.scale, p3.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.fill();
        }
    }

    // Draw penguin
    function drawPenguin() {
        const p = project(penguin.x, penguin.y, 0);
        const scale = p.scale * 2;
        const wobble = penguin.isSliding ? 0 : Math.sin(penguin.wobble) * 3;

        ctx.save();
        ctx.translate(p.x, p.y);

        if (penguin.isSliding) {
            // Sliding on belly
            ctx.rotate(-0.3);

            // Body (horizontal)
            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath();
            ctx.ellipse(0, 0, 40 * scale, 20 * scale, 0, 0, Math.PI * 2);
            ctx.fill();

            // Belly
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(0, 8 * scale, 30 * scale, 12 * scale, 0, 0, Math.PI * 2);
            ctx.fill();

            // Head
            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath();
            ctx.arc(30 * scale, -5 * scale, 15 * scale, 0, Math.PI * 2);
            ctx.fill();

            // Eye
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(35 * scale, -8 * scale, 4 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(36 * scale, -8 * scale, 2 * scale, 0, Math.PI * 2);
            ctx.fill();

            // Beak
            ctx.fillStyle = '#f90';
            ctx.beginPath();
            ctx.moveTo(42 * scale, -5 * scale);
            ctx.lineTo(52 * scale, -3 * scale);
            ctx.lineTo(42 * scale, 0);
            ctx.fill();

            // Speed lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(-50 * scale - i * 15, -5 * scale + i * 8);
                ctx.lineTo(-70 * scale - i * 15, -5 * scale + i * 8);
                ctx.stroke();
            }
        } else {
            // Standing/running
            ctx.translate(wobble, 0);

            // Body
            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath();
            ctx.ellipse(0, 0, 25 * scale, 35 * scale, 0, 0, Math.PI * 2);
            ctx.fill();

            // Belly
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(0, 5 * scale, 18 * scale, 25 * scale, 0, 0, Math.PI * 2);
            ctx.fill();

            // Head
            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath();
            ctx.arc(0, -40 * scale, 18 * scale, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(-6 * scale, -42 * scale, 5 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(6 * scale, -42 * scale, 5 * scale, 0, Math.PI * 2);
            ctx.fill();

            // Pupils
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(-5 * scale, -42 * scale, 2.5 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(7 * scale, -42 * scale, 2.5 * scale, 0, Math.PI * 2);
            ctx.fill();

            // Beak
            ctx.fillStyle = '#f90';
            ctx.beginPath();
            ctx.moveTo(-5 * scale, -38 * scale);
            ctx.lineTo(0, -30 * scale);
            ctx.lineTo(5 * scale, -38 * scale);
            ctx.fill();

            // Flippers (animated)
            const flipperAngle = Math.sin(penguin.wobble * 2) * 0.3;
            ctx.fillStyle = '#1a1a2e';

            ctx.save();
            ctx.translate(-22 * scale, -5 * scale);
            ctx.rotate(-0.5 + flipperAngle);
            ctx.beginPath();
            ctx.ellipse(0, 15 * scale, 8 * scale, 20 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.translate(22 * scale, -5 * scale);
            ctx.rotate(0.5 - flipperAngle);
            ctx.beginPath();
            ctx.ellipse(0, 15 * scale, 8 * scale, 20 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Feet
            ctx.fillStyle = '#f90';
            const footOffset = Math.sin(penguin.wobble) * 5 * scale;
            ctx.beginPath();
            ctx.ellipse(-10 * scale, 35 * scale + footOffset, 10 * scale, 5 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(10 * scale, 35 * scale - footOffset, 10 * scale, 5 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        const shadowY = project(penguin.x, 0, 0).y;
        const shadowScale = scale * (1 - penguin.y / 200);
        ctx.ellipse(p.x, shadowY + 5, 30 * shadowScale, 10 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw obstacles
    function drawObstacles() {
        obstacles.sort((a, b) => b.z - a.z);

        obstacles.forEach(obs => {
            const relZ = obs.z - penguin.z;
            if (relZ < -50 || relZ > SEGMENT_LENGTH * VISIBLE_SEGMENTS) return;

            const p = project(obs.x, 0, relZ);
            const scale = p.scale * 2;

            if (obs.type === 'ice') {
                // Ice block
                ctx.fillStyle = '#8af';
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.moveTo(p.x - 30 * scale, p.y);
                ctx.lineTo(p.x - 20 * scale, p.y - 50 * scale);
                ctx.lineTo(p.x + 20 * scale, p.y - 40 * scale);
                ctx.lineTo(p.x + 30 * scale, p.y);
                ctx.fill();
                ctx.globalAlpha = 1;

                // Highlight
                ctx.fillStyle = '#cef';
                ctx.beginPath();
                ctx.moveTo(p.x - 15 * scale, p.y - 10 * scale);
                ctx.lineTo(p.x - 10 * scale, p.y - 35 * scale);
                ctx.lineTo(p.x, p.y - 30 * scale);
                ctx.lineTo(p.x - 5 * scale, p.y - 10 * scale);
                ctx.fill();
            } else if (obs.type === 'crevasse') {
                // Dark crevasse
                ctx.fillStyle = '#1a2a4e';
                ctx.beginPath();
                ctx.ellipse(p.x, p.y, 40 * scale, 15 * scale, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#0a1a2e';
                ctx.beginPath();
                ctx.ellipse(p.x, p.y, 30 * scale, 10 * scale, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (obs.type === 'snowman') {
                // Friendly snowman (bonus?)
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(p.x, p.y - 15 * scale, 20 * scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(p.x, p.y - 45 * scale, 15 * scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(p.x, p.y - 70 * scale, 10 * scale, 0, Math.PI * 2);
                ctx.fill();

                // Eyes
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(p.x - 4 * scale, p.y - 73 * scale, 2 * scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(p.x + 4 * scale, p.y - 73 * scale, 2 * scale, 0, Math.PI * 2);
                ctx.fill();

                // Carrot nose
                ctx.fillStyle = '#f90';
                ctx.beginPath();
                ctx.moveTo(p.x, p.y - 70 * scale);
                ctx.lineTo(p.x + 15 * scale, p.y - 68 * scale);
                ctx.lineTo(p.x, p.y - 66 * scale);
                ctx.fill();
            }
        });
    }

    // Draw particles
    function drawParticles() {
        particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    // Spawn snow particles
    function spawnSnow() {
        if (Math.random() < 0.3) {
            particles.push({
                x: Math.random() * canvas.width,
                y: -10,
                vx: (Math.random() - 0.5) * 2 - penguin.speed * 0.1,
                vy: Math.random() * 2 + 1,
                size: Math.random() * 3 + 1,
                life: 1,
                color: '#fff'
            });
        }
    }

    // Spawn slide particles
    function spawnSlideParticles() {
        if (penguin.isSliding) {
            const p = project(penguin.x, 0, 0);
            for (let i = 0; i < 3; i++) {
                particles.push({
                    x: p.x - 30 + Math.random() * 20,
                    y: p.y + Math.random() * 10,
                    vx: -3 - Math.random() * 3,
                    vy: -Math.random() * 2,
                    size: Math.random() * 4 + 2,
                    life: 1,
                    color: '#def'
                });
            }
        }
    }

    // Update particles
    function updateParticles() {
        particles = particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05;
            p.life -= 0.02;
            return p.life > 0 && p.y < canvas.height;
        });
    }

    // Spawn obstacle
    function spawnObstacle() {
        if (Math.random() < OBSTACLE_SPAWN_RATE) {
            const types = ['ice', 'ice', 'crevasse', 'snowman'];
            obstacles.push({
                type: types[Math.floor(Math.random() * types.length)],
                x: (Math.random() - 0.5) * ROAD_WIDTH * 1.5,
                z: penguin.z + SEGMENT_LENGTH * VISIBLE_SEGMENTS
            });
        }
    }

    // Check collisions
    function checkCollisions() {
        const penguinHitbox = {
            x: penguin.x,
            z: penguin.z,
            width: 40,
            height: penguin.isJumping ? 20 : 60 // Smaller when jumping
        };

        obstacles.forEach(obs => {
            const relZ = obs.z - penguin.z;
            if (relZ > -30 && relZ < 30) {
                const dx = Math.abs(penguin.x - obs.x);

                if (obs.type === 'ice' || obs.type === 'snowman') {
                    if (dx < 50 && !penguin.isJumping && penguin.y < 30) {
                        // Hit!
                        gameOver();
                    }
                } else if (obs.type === 'crevasse') {
                    if (dx < 40 && !penguin.isJumping && penguin.y < 20) {
                        gameOver();
                    }
                }
            }
        });
    }

    // Update penguin
    function updatePenguin() {
        // Horizontal movement
        const moveSpeed = 8;
        if (keys.left) penguin.targetX -= moveSpeed;
        if (keys.right) penguin.targetX += moveSpeed;

        // Clamp to road
        penguin.targetX = Math.max(-ROAD_WIDTH * 0.7, Math.min(ROAD_WIDTH * 0.7, penguin.targetX));

        // Smooth movement
        penguin.x += (penguin.targetX - penguin.x) * 0.15;

        // Jump
        if (keys.jump && !penguin.isJumping) {
            penguin.isJumping = true;
            penguin.vy = 15;
        }

        // Gravity
        if (penguin.isJumping) {
            penguin.y += penguin.vy;
            penguin.vy -= 0.6;

            if (penguin.y <= 0) {
                penguin.y = 0;
                penguin.isJumping = false;
                // Start sliding after landing from jump
                penguin.isSliding = true;
                penguin.slideTimer = 60;
            }
        }

        // Sliding
        if (penguin.isSliding) {
            penguin.slideTimer--;
            penguin.speed = 8; // Faster when sliding
            if (penguin.slideTimer <= 0) {
                penguin.isSliding = false;
                penguin.speed = 5;
            }
        }

        // Forward movement and wobble
        penguin.z += penguin.speed;
        penguin.wobble += penguin.isSliding ? 0 : 0.3;

        // Update distance
        distance = Math.floor(penguin.z / 10);
        mountainProgress = penguin.z % MOUNTAIN_DISTANCE;

        // Check for peak
        if (penguin.z > peakCount * MOUNTAIN_DISTANCE) {
            peakCount++;
            // Flash effect or celebration could go here
        }

        // Update ground segments
        groundSegments.forEach(seg => {
            if (seg.z < penguin.z - SEGMENT_LENGTH) {
                seg.z += SEGMENT_LENGTH * VISIBLE_SEGMENTS;
                seg.color = (seg.z / SEGMENT_LENGTH) % 8 < 4 ? '#e8f4fc' : '#d4eaf5';
            }
        });

        // Update obstacles
        obstacles = obstacles.filter(obs => obs.z > penguin.z - 100);
    }

    // Game over
    function gameOver() {
        gameState = 'gameover';

        // Save high score
        let saved = {};
        try {
            saved = JSON.parse(localStorage.getItem('penguinPeak') || '{}');
        } catch (e) {
            console.error('Failed to parse saved data:', e);
        }
        if (!saved.highScore || distance > saved.highScore) {
            saved.highScore = distance;
            saved.highPeaks = peakCount;
            localStorage.setItem('penguinPeak', JSON.stringify(saved));
        }

        finalDistanceEl.textContent = `Distance: ${distance}m`;
        peaksReachedEl.textContent = `Peaks Reached: ${peakCount}`;
        gameOverScreen.classList.remove('hidden');
    }

    // Reset game
    function resetGame() {
        penguin.x = 0;
        penguin.y = 0;
        penguin.z = 0;
        penguin.targetX = 0;
        penguin.vx = 0;
        penguin.vy = 0;
        penguin.isJumping = false;
        penguin.isSliding = false;
        penguin.slideTimer = 0;
        penguin.wobble = 0;
        penguin.speed = 5;

        distance = 0;
        peakCount = 1;
        mountainProgress = 0;
        obstacles = [];
        particles = [];

        initGround();
    }

    // Start game
    function startGame() {
        resetGame();
        gameState = 'playing';
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
    }

    // Main game loop
    function gameLoop() {
        // Clear
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw scene
        drawSky();
        drawMountain();
        drawGround();
        drawObstacles();
        drawPenguin();
        drawParticles();

        if (gameState === 'playing') {
            updatePenguin();
            updateParticles();
            spawnSnow();
            spawnSlideParticles();
            spawnObstacle();
            checkCollisions();

            // Update HUD
            distanceEl.textContent = `${distance}m`;
            peakCountEl.textContent = `Peak ${peakCount}`;
        }

        requestAnimationFrame(gameLoop);
    }

    // Input handling
    document.addEventListener('keydown', e => {
        // Prevent default for game keys
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
             'w', 'a', 's', 'd', 'h', 'j', 'k', 'l', ' ', 'f'].includes(e.key)) {
            e.preventDefault();
        }

        // Start/restart game
        if (gameState === 'start' || gameState === 'gameover') {
            startGame();
            return;
        }

        // Movement keys
        // Arrow keys
        if (e.key === 'ArrowLeft') keys.left = true;
        if (e.key === 'ArrowRight') keys.right = true;
        if (e.key === 'ArrowUp') keys.up = true;
        if (e.key === 'ArrowDown') keys.down = true;

        // WASD
        if (e.key === 'a' || e.key === 'A') keys.left = true;
        if (e.key === 'd' || e.key === 'D') keys.right = true;
        if (e.key === 'w' || e.key === 'W') keys.up = true;
        if (e.key === 's' || e.key === 'S') keys.down = true;

        // Vim keys (hjkl)
        if (e.key === 'h' || e.key === 'H') keys.left = true;
        if (e.key === 'l' || e.key === 'L') keys.right = true;
        if (e.key === 'k' || e.key === 'K') keys.up = true;
        if (e.key === 'j' || e.key === 'J') keys.down = true;

        // Jump: Space, F
        if (e.key === ' ' || e.key === 'f' || e.key === 'F') keys.jump = true;
    });

    document.addEventListener('keyup', e => {
        // Arrow keys
        if (e.key === 'ArrowLeft') keys.left = false;
        if (e.key === 'ArrowRight') keys.right = false;
        if (e.key === 'ArrowUp') keys.up = false;
        if (e.key === 'ArrowDown') keys.down = false;

        // WASD
        if (e.key === 'a' || e.key === 'A') keys.left = false;
        if (e.key === 'd' || e.key === 'D') keys.right = false;
        if (e.key === 'w' || e.key === 'W') keys.up = false;
        if (e.key === 's' || e.key === 'S') keys.down = false;

        // Vim keys
        if (e.key === 'h' || e.key === 'H') keys.left = false;
        if (e.key === 'l' || e.key === 'L') keys.right = false;
        if (e.key === 'k' || e.key === 'K') keys.up = false;
        if (e.key === 'j' || e.key === 'J') keys.down = false;

        // Jump
        if (e.key === ' ' || e.key === 'f' || e.key === 'F') keys.jump = false;
    });

    // Show high score on start screen
    function showHighScore() {
        let saved = {};
        try {
            saved = JSON.parse(localStorage.getItem('penguinPeak') || '{}');
        } catch (e) {
            console.error('Failed to parse saved data:', e);
        }
        if (saved.highScore) {
            highScoreEl.textContent = `Best: ${saved.highScore}m | Peak ${saved.highPeaks}`;
        }
    }

    // Initialize
    initGround();
    showHighScore();
    gameLoop();
});
