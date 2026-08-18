// --- CONFIGURATION ---
const CORRECT_PASSWORD = "dream"; 
const PASSWORD_HINT = "psst... the password is 'dream'";
const SECRET_CAM_LINK = "https://share.myfreecams.com/Puppyc0w/blogs"; 

// Liminal Error Messages
const liminalMessages = [
    "You have been here before.",
    "There is nothing left to click.",
    "Are you sure you are awake?",
    "The walls are breathing.",
    "It is looking at you.",
    "Please stop tapping the glass."
];

// --- SOUND EFFECT LOGIC ---
const clickAudio = document.getElementById('ui-click-sound');

function playClickSound() {
    if (clickAudio) {
        clickAudio.currentTime = 0; 
        clickAudio.play().catch(e => { });
    }
}

document.addEventListener('click', (e) => {
    const isClickable = e.target.closest('.icon, button, a, #start-btn, #clock, #user-avatar');
    if (isClickable) {
        playClickSound();
    }
});

// --- LOGIN LOGIC ---
const avatarBtn = document.getElementById('user-avatar');
const passInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');

avatarBtn.addEventListener('click', () => alert(PASSWORD_HINT));

loginBtn.addEventListener('click', () => {
    if(passInput.value.toLowerCase() === CORRECT_PASSWORD) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('desktop').classList.remove('hidden');
        resetScreensaver(); 
    } else {
        document.getElementById('login-error').style.opacity = 1;
        passInput.value = "";
    }
});

// --- WINDOW MANAGEMENT & RAPID CLICKS ---
let clickCount = 0;
let clickTimer = null;

function openWindow(id) {
    const win = document.getElementById(id);
    win.classList.remove('hidden');
    
    const allWindows = document.querySelectorAll('.window');
    allWindows.forEach(w => w.style.zIndex = 100);
    win.style.zIndex = 101;
    
    if (id === 'window-game' && !gameActive) {
        initGame();
        resetScreensaver(); 
    }
    
    trackClicks();
}

function closeWindow(id) {
    document.getElementById(id).classList.add('hidden');
    if (id === 'window-game') {
        gameActive = false;
        cancelAnimationFrame(gameLoop);
        resetScreensaver(); 
    }
}

function trackClicks() {
    clickCount++;
    clearTimeout(clickTimer);
    
    if(clickCount >= 5) {
        triggerLiminalError();
        clickCount = 0;
    }
    
    clickTimer = setTimeout(() => { clickCount = 0; }, 2000);
}

function triggerLiminalError() {
    const errorWin = document.getElementById('error-message');
    const errorTxt = document.getElementById('error-text');
    const randomMsg = liminalMessages[Math.floor(Math.random() * liminalMessages.length)];
    
    errorTxt.innerText = randomMsg;
    errorWin.classList.remove('hidden');
    errorWin.style.zIndex = 999; 
}

// --- DRAGGABLE WINDOWS ---
const windows = document.querySelectorAll('.window');

windows.forEach(win => {
    const titleBar = win.querySelector('.drag-handle');
    if (!titleBar) return;

    let isDragging = false;
    let startX, startY, initialX, initialY;

    titleBar.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('mouseup', dragEnd);

    titleBar.addEventListener('touchstart', (e) => dragStart(e.touches[0]), { passive: false });
    document.addEventListener('touchmove', (e) => {
        if (isDragging) e.preventDefault(); 
        dragMove(e.touches[0]);
    }, { passive: false });
    document.addEventListener('touchend', dragEnd);

    function dragStart(e) {
        if (e.target.classList.contains('close-btn')) return;
        
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialX = win.offsetLeft;
        initialY = win.offsetTop;
        
        document.querySelectorAll('.window').forEach(w => w.style.zIndex = 100);
        win.style.zIndex = 101;
    }

    function dragMove(e) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        win.style.left = `${initialX + dx}px`;
        win.style.top = `${initialY + dy}px`;
    }

    function dragEnd() {
        isDragging = false;
    }
});

// --- START MENU ---
document.getElementById('start-btn').addEventListener('click', () => {
    const menu = document.getElementById('start-menu');
    menu.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('#start-btn') && !e.target.closest('#start-menu')) {
        document.getElementById('start-menu').classList.add('hidden');
    }
});

// --- GLITCHING CLOCK & SECRET CAM LINK LOGIC ---
const clock = document.getElementById('clock');
const glitchTimes = ["00:00 AM", "3:33 AM", "10:21 AM"];
let isGlitching = false; 

clock.addEventListener('click', () => {
    if (isGlitching) {
        openWindow('window-secret');
    }
});

function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return hours + ':' + minutes + ' ' + ampm;
}

setInterval(() => {
    if(Math.random() < 0.1) {
        isGlitching = true; 
        const randomGlitch = glitchTimes[Math.floor(Math.random() * glitchTimes.length)];
        clock.innerText = randomGlitch;
        clock.style.color = "#ff66cc"; 
        
        setTimeout(() => {
            isGlitching = false; 
            clock.innerText = updateClock();
            clock.style.color = "white";
        }, 1000);
    } else {
        if (!isGlitching) {
            clock.innerText = updateClock();
        }
    }
}, 1000);

// --- VERTICAL PLATFORMER MINI GAME ---
let gameLoop;
let player = { x: 70, y: 160, width: 180, height: 220, vy: 0 };
let platforms = [];
let gravity = 0.25; 
let jumpPower = -6.5; 
let score = 0;
let lives = 3;
let gameActive = false;
let gameStarted = false; // New state to pause until clicked!
let mouseX = 160;

const gameContainer = document.getElementById('game-container');

// Tap to start listener
gameContainer.addEventListener('mousedown', startGameHandler);
gameContainer.addEventListener('touchstart', startGameHandler, {passive: true});

function startGameHandler(e) {
    if (gameActive && !gameStarted) {
        gameStarted = true;
        player.vy = jumpPower; // Triggers the very first jump!
        document.getElementById('start-overlay').classList.add('hidden');
    }
}

// Control tracking
gameContainer.addEventListener('mousemove', (e) => {
    let rect = gameContainer.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
});
gameContainer.addEventListener('touchmove', (e) => {
    let rect = gameContainer.getBoundingClientRect();
    mouseX = e.touches[0].clientX - rect.left;
});

function initGame() {
    platforms.forEach(p => { if(p.element) p.element.remove(); });
    platforms = [];
    score = 0;
    lives = 3;
    
    // Position her so her feet (160 + 220 = 380) perfectly touch the bottom cloud (y = 380)
    player.y = 160; 
    player.x = 70;
    player.vy = 0;
    
    updateHearts();
    document.getElementById('score-display').innerText = `Score: ${score}`;
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('start-overlay').classList.remove('hidden');

    // Create starting platform right under her feet
    platforms.push({ x: 60, y: 380, element: null }); 
    
    // Create initial safe vertical gaps (Max gap is 60px so she never misses)
    for(let i = 1; i <= 5; i++) {
        platforms.push({ x: Math.random() * 120, y: 380 - (i * 60), element: null });
    }
    renderPlatforms();
    
    gameActive = true;
    gameStarted = false; 
    cancelAnimationFrame(gameLoop);
    updateGame();
}

function updateGame() {
    if(!gameActive) return;

    if (gameStarted) {
        player.vy += gravity;
        player.y += player.vy;

        let targetX = mouseX - (player.width / 2);
        player.x += (targetX - player.x) * 0.08;

        // Center-based Screen Wrap
        let playerCenter = player.x + (player.width / 2);
        if (playerCenter < 0) {
            player.x = 320 - (player.width / 2);
        } else if (playerCenter > 320) {
            player.x = 0 - (player.width / 2);
        }

        // Platform Collision 
        if (player.vy > 0) {
            platforms.forEach(plat => {
                if(player.x + player.width - 60 > plat.x && player.x + 60 < plat.x + 200 &&
                   player.y + player.height > plat.y && player.y + player.height < plat.y + 50 + player.vy) {
                    player.vy = jumpPower; 
                    
                    plat.element.classList.add('platform-bounce');
                    setTimeout(() => plat.element.classList.remove('platform-bounce'), 150);
                }
            });
        }

        // Camera scrolling
        if (player.y < 150) {
            let diff = 150 - player.y;
            player.y = 150;
            score += Math.floor(diff);
            document.getElementById('score-display').innerText = `Score: ${score}`;
            
            platforms.forEach(plat => {
                plat.y += diff;
            });

            platforms = platforms.filter(plat => {
                if(plat.y > 420) {
                    plat.element.remove();
                    return false;
                }
                return true;
            });

            // FIXED GAP: Ensures new clouds spawn close enough to reach (gap between 40px and 70px)
            while(platforms.length < 6) {
                let lastY = platforms[platforms.length-1]?.y || 0;
                platforms.push({
                    x: Math.random() * 120, 
                    y: lastY - (Math.random() * 30 + 40), 
                    element: null
                });
            }
            renderPlatforms();
        }

        // Fall logic
        if (player.y > 420) {
            lives--;
            updateHearts();
            
            if(lives > 0) {
                gameStarted = false; // Pause again so you have to click to respawn jump
                document.getElementById('start-overlay').classList.remove('hidden');
                
                player.y = 160;
                player.vy = 0;
                platforms.push({ x: player.x - 10, y: 380, element: null });
                renderPlatforms();
            } else {
                gameActive = false;
                
                // High Score Logic
                const gameOverScreen = document.getElementById('game-over-screen');
                const msgDisplay = document.getElementById('game-over-msg');
                const highScoreDisplay = document.getElementById('high-score-display');
                
                let savedHighScore = localStorage.getItem('jumpHighScore') || 0;
                
                if (score > savedHighScore) {
                    localStorage.setItem('jumpHighScore', score);
                    msgDisplay.innerText = "New High Score! 💖";
                    highScoreDisplay.innerText = `You scored: ${score}`;
                } else {
                    msgDisplay.innerText = "Good try!";
                    highScoreDisplay.innerText = `Score: ${score} | High Score: ${savedHighScore}`;
                }
                
                gameOverScreen.classList.remove('hidden');
            }
        }
    }

    // Render DOM positions (Happens whether started or not so she is visible standing still!)
    const playerEl = document.getElementById('game-player-el');
    playerEl.style.left = player.x + 'px';
    playerEl.style.top = player.y + 'px';

    platforms.forEach(plat => {
        if(plat.element) {
            plat.element.style.top = plat.y + 'px';
            plat.element.style.left = plat.x + 'px';
        }
    });

    gameLoop = requestAnimationFrame(updateGame);
}

function renderPlatforms() {
    const platContainer = document.getElementById('platforms-container');
    platforms.forEach(plat => {
        if(!plat.element) {
            let el = document.createElement('div');
            el.className = 'game-platform';
            platContainer.appendChild(el);
            plat.element = el;
        }
    });
}

function updateHearts() {
    const heartsContainer = document.getElementById('health-bar');
    heartsContainer.innerHTML = '';
    for(let i = 0; i < lives; i++) {
        let img = document.createElement('img');
        img.src = 'hrt.png';
        img.className = 'heart-icon';
        heartsContainer.appendChild(img);
    }
}

window.restartGame = initGame;

// --- SCREENSAVER LOGIC ---
let screensaverTimeout;
const screensaver = document.getElementById('screensaver');
const logo = document.getElementById('bounce-logo');

let x = 0, y = 0, dx = 2, dy = 2;
let animationFrame;

function resetScreensaver() {
    clearTimeout(screensaverTimeout);
    screensaver.classList.add('hidden');
    cancelAnimationFrame(animationFrame);
    
    if (gameActive) return; 
    
    screensaverTimeout = setTimeout(showScreensaver, 10000); 
}

function showScreensaver() {
    screensaver.classList.remove('hidden');
    x = Math.random() * (window.innerWidth - 80);
    y = Math.random() * (window.innerHeight - 80);
    animateLogo();
}

function animateLogo() {
    if(x + 80 >= window.innerWidth || x <= 0) dx = -dx;
    if(y + 80 >= window.innerHeight || y <= 0) dy = -dy;
    x += dx; y += dy;
    logo.style.left = x + 'px';
    logo.style.top = y + 'px';
    animationFrame = requestAnimationFrame(animateLogo);
}

['mousemove', 'touchstart', 'click', 'scroll'].forEach(evt => {
    document.addEventListener(evt, resetScreensaver);
});

