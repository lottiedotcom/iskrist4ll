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
let items = []; // Array to hold collectible items!
let gravity = 0.25; 
let jumpPower = -6.5; 
let score = 0;
let lives = 3;
let gameActive = false;
let gameStarted = false; 
let mouseX = 160;

const gameContainer = document.getElementById('game-container');

// Tap to start listener
gameContainer.addEventListener('mousedown', startGameHandler);
gameContainer.addEventListener('touchstart', startGameHandler, {passive: true});

function startGameHandler(e) {
    if (gameActive && !gameStarted) {
        gameStarted = true;
        player.vy = jumpPower; 
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
    items.forEach(i => { if(i.element) i.element.remove(); });
    platforms = [];
    items = [];
    score = 0;
    lives = 3;
    
    player.y = 160; 
    player.x = 70;
    player.vy = 0;
    
    updateHearts();
    document.getElementById('score-display').innerText = `Score: ${score}`;
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('start-overlay').classList.remove('hidden');

    // Create starting platform right under her feet
    platforms.push({ x: 60, y: 380, element: null }); 
    
    // Spread clouds further apart! (Reduced max clouds from 6 to 4, forced larger gap)
    for(let i = 1; i <= 3; i++) {
        platforms.push({ x: Math.random() * 120, y: 380 - (i * 75), element: null });
    }
    renderGameObjects();
    
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

        // NEW MATHEMATICAL FIX FOR THE "ZOOMING" WRAP! 
        // This makes her move smoothly through the border instead of shooting across the screen.
        let playerCenter = player.x + (player.width / 2);
        let dx = mouseX - playerCenter;
        
        if (dx > 160) dx -= 320;
        if (dx < -160) dx += 320;
        
        player.x += dx * 0.08;

        // Actual invisible screen boundary wrap
        let currentCenter = player.x + (player.width / 2);
        if (currentCenter < 0) {
            player.x += 320;
        } else if (currentCenter > 320) {
            player.x -= 320;
        }

        // --- PLATFORM COLLISION ---
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
        
        // --- ITEM COLLISION (LEVEL UP!) ---
        items.forEach(item => {
            if (item.element && 
                player.x + player.width - 50 > item.x && player.x + 50 < item.x + 40 &&
                player.y + player.height > item.y && player.y < item.y + 40) {
                
                // SUPER JUMP!
                player.vy = -12; 
                score += 500; // Big score bonus
                
                item.element.remove();
                item.element = null; // Mark for cleanup
            }
        });

        // --- CAMERA SCROLLING & SPAWNING ---
        if (player.y < 150) {
            let diff = 150 - player.y;
            player.y = 150;
            score += Math.floor(diff);
            document.getElementById('score-display').innerText = `Score: ${score}`;
            
            platforms.forEach(plat => plat.y += diff);
            items.forEach(item => item.y += diff);

            // Clean up off-screen platforms
            platforms = platforms.filter(plat => {
                if(plat.y > 420) {
                    plat.element.remove();
                    return false;
                }
                return true;
            });
            
            // Clean up collected or off-screen items
            items = items.filter(item => {
                if (!item.element) return false;
                if(item.y > 420) {
                    item.element.remove();
                    return false;
                }
                return true;
            });

            // STRICTER CLOUD SPAWNING (Only 4 maximum to keep them thinned out!)
            while(platforms.length < 4) {
                let lastY = platforms[platforms.length-1]?.y || 0;
                
                let newPlatX = Math.random() * 120;
                let newPlatY = lastY - (Math.random() * 15 + 70); // Bigger mandatory gap!
                
                platforms.push({ x: newPlatX, y: newPlatY, element: null });
                
                // 15% Chance to spawn a Level Up item on the new platform!
                if (Math.random() < 0.15) {
                    items.push({ x: newPlatX + 80, y: newPlatY - 40, element: null });
                }
            }
            renderGameObjects();
        }

        // --- FALL LOGIC ---
        if (player.y > 420) {
            lives--;
            updateHearts();
            
            if(lives > 0) {
                gameStarted = false; 
                document.getElementById('start-overlay').classList.remove('hidden');
                
                player.y = 160;
                player.vy = 0;
                platforms.push({ x: player.x - 10, y: 380, element: null });
                renderGameObjects();
            } else {
                gameActive = false;
                
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

    // Render DOM positions
    const playerEl = document.getElementById('game-player-el');
    playerEl.style.left = player.x + 'px';
    playerEl.style.top = player.y + 'px';

    platforms.forEach(plat => {
        if(plat.element) {
            plat.element.style.top = plat.y + 'px';
            plat.element.style.left = plat.x + 'px';
        }
    });
    
    items.forEach(item => {
        if(item.element) {
            item.element.style.top = item.y + 'px';
            item.element.style.left = item.x + 'px';
        }
    });

    gameLoop = requestAnimationFrame(updateGame);
}

function renderGameObjects() {
    const platContainer = document.getElementById('platforms-container');
    platforms.forEach(plat => {
        if(!plat.element) {
            let el = document.createElement('div');
            el.className = 'game-platform';
            platContainer.appendChild(el);
            plat.element = el;
        }
    });
    
    const itemContainer = document.getElementById('items-container');
    items.forEach(item => {
        if(!item.element) {
            let el = document.createElement('div');
            el.className = 'game-item';
            itemContainer.appendChild(el);
            item.element = el;
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

