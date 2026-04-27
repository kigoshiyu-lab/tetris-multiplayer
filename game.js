// ===== Game Configuration =====
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = {
    I: '#b5f5fd', // Cyan
    O: '#f8b800', // Yellow
    T: '#f878f8', // Purple/Pink
    S: '#00a800', // Green
    Z: '#e41212', // Red
    J: '#0058f8', // Blue
    L: '#f85800'  // Orange
};

// ===== Tetromino Shapes =====
const SHAPES = {
    I: [[1, 1, 1, 1]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]],
    J: [[1, 0, 0], [1, 1, 1]],
    L: [[0, 0, 1], [1, 1, 1]]
};

// ===== Game State =====
let canvas, ctx, nextCanvas, nextCtx;
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let lines = 0;
let level = 1;
let gameOver = false;
let isPaused = false;
let waitingForOpponent = false;
let hasActiveRound = false;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

// Touch controls
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
const minSwipeDistance = 30;

// ===== Initialize Game =====
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    nextCanvas = document.getElementById('nextCanvas');
    nextCtx = nextCanvas.getContext('2d');

    // Create empty board
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

    // Event listeners
    document.addEventListener('keydown', handleKeyPress);
    document.getElementById('restartBtn').addEventListener('click', () => multiplayer.readyForStart());
    document.getElementById('muteBtn').addEventListener('click', toggleMute);

    // Mobile touch controls
    setupMobileControls();
    multiplayer.initUI();

    // Resume audio context on first user interaction
    document.addEventListener('click', () => {
        gameAudio.resume();
        if (!gameAudio.isPlaying) {
            gameAudio.startBGM();
        }
    }, { once: true });

    resetToLobby();
    setLobbyState('ルーム参加して対戦を開始してください');
    update();
}

function addGarbageLines(amount) {
    if (gameOver || amount <= 0) return;

    for (let i = 0; i < amount; i++) {
        board.shift();
        const garbageRow = Array(COLS).fill('#5a5a5a');
        const holeIndex = Math.floor(Math.random() * COLS);
        garbageRow[holeIndex] = 0;
        board.push(garbageRow);
    }

    if (currentPiece) {
        currentPiece.y = Math.max(0, currentPiece.y - amount);
    }
}

window.onReceiveGarbage = (amount) => {
    addGarbageLines(amount);
};

function setPauseMessage(text) {
    const messageEl = document.getElementById('pauseMessage');
    if (messageEl) {
        messageEl.textContent = text;
    }
}

window.onRoomJoined = (players) => {
    if (players < 2) {
        setLobbyState('接続完了。対戦相手を待っています...');
    }
};

window.onMatchStart = () => {
    startRound();
};

window.onRoomLeft = () => {
    resetToLobby();
    setLobbyState('ルーム参加して対戦を開始してください');
};

window.onOpponentLeft = () => {
    resetToLobby();
    setLobbyState('相手が退出しました。ルームで待機中...');
};

window.onLobbyWaiting = (message) => {
    setLobbyState(message);
};

// ===== Create Random Piece =====
function createPiece() {
    const pieces = Object.keys(SHAPES);
    const type = pieces[Math.floor(Math.random() * pieces.length)];
    return {
        type: type,
        shape: SHAPES[type],
        color: COLORS[type],
        x: Math.floor(COLS / 2) - Math.floor(SHAPES[type][0].length / 2),
        y: 0
    };
}

// ===== Spawn New Piece =====
function spawnPiece() {
    currentPiece = nextPiece;
    nextPiece = createPiece();

    if (checkCollision(currentPiece.x, currentPiece.y, currentPiece.shape)) {
        gameOver = true;
        showGameOver();
    }

    drawNextPiece();
}

// ===== Check Collision =====
function checkCollision(x, y, shape) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const newX = x + col;
                const newY = y + row;

                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return true;
                }

                if (newY >= 0 && board[newY][newX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// ===== Move Piece =====
function movePiece(dx, dy) {
    if (gameOver || isPaused || !hasActiveRound) return;

    const newX = currentPiece.x + dx;
    const newY = currentPiece.y + dy;

    if (!checkCollision(newX, newY, currentPiece.shape)) {
        currentPiece.x = newX;
        currentPiece.y = newY;
        if (dx !== 0) gameAudio.playMove(); // Play sound only for horizontal movement
        return true;
    }
    return false;
}

// ===== Rotate Piece =====
function rotatePiece() {
    if (gameOver || isPaused || !hasActiveRound) return;

    const rotated = currentPiece.shape[0].map((_, i) =>
        currentPiece.shape.map(row => row[i]).reverse()
    );

    if (!checkCollision(currentPiece.x, currentPiece.y, rotated)) {
        currentPiece.shape = rotated;
        gameAudio.playRotate();
    }
}

// ===== Hard Drop =====
function hardDrop() {
    if (gameOver || isPaused || !hasActiveRound) return;

    while (movePiece(0, 1)) {
        score += 2;
    }
    gameAudio.playDrop();
    lockPiece();
}

// ===== Lock Piece to Board =====
function lockPiece() {
    for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
            if (currentPiece.shape[row][col]) {
                const y = currentPiece.y + row;
                const x = currentPiece.x + col;
                if (y >= 0) {
                    board[y][x] = currentPiece.color;
                }
            }
        }
    }

    clearLines();
    spawnPiece();
}

// ===== Clear Completed Lines =====
function clearLines() {
    let linesCleared = 0;

    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            board.splice(row, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            row++; // Check same row again
        }
    }

    if (linesCleared > 0) {
        const oldLevel = level;
        lines += linesCleared;
        score += [0, 100, 300, 500, 800][linesCleared] * level;
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        updateScore();

        gameAudio.playClearLine();

        // Play level up sound if level increased
        if (level > oldLevel) {
            setTimeout(() => gameAudio.playLevelUp(), 300);
        }

        // First multiplayer rule: send the same number of cleared lines.
        multiplayer.sendGarbage(linesCleared);
    }
}

// ===== Keyboard Controls =====
function handleKeyPress(e) {
    if (gameOver) return;

    switch (e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
            e.preventDefault();
            movePiece(1, 0);
            break;
        case 'ArrowDown':
            e.preventDefault();
            if (movePiece(0, 1)) {
                score += 1;
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            rotatePiece();
            break;
        case ' ':
            e.preventDefault();
            hardDrop();
            break;
        case 'p':
        case 'P':
            e.preventDefault();
            togglePause();
            break;
    }
}

// ===== Toggle Pause =====
function togglePause() {
    if (gameOver || waitingForOpponent || !hasActiveRound) return;
    isPaused = !isPaused;
    document.getElementById('pauseScreen').classList.toggle('hidden', !isPaused);

    // Pause/Resume BGM
    if (isPaused) {
        gameAudio.stopBGM();
    } else {
        gameAudio.startBGM();
    }
}

// ===== Update Game State =====
function update(time = 0) {
    if (!gameOver) {
        requestAnimationFrame(update);
    }

    draw();

    if (isPaused) {
        return;
    }

    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;

    if (dropCounter > dropInterval) {
        if (!movePiece(0, 1)) {
            lockPiece();
        }
        dropCounter = 0;
    }
}

// ===== Draw Game Board =====
function draw() {
    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            ctx.strokeRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
    }

    // Draw locked pieces
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                drawBlock(ctx, col * BLOCK_SIZE, row * BLOCK_SIZE, board[row][col]);
            }
        }
    }

    // Draw current piece
    if (currentPiece) {
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col]) {
                    const x = (currentPiece.x + col) * BLOCK_SIZE;
                    const y = (currentPiece.y + row) * BLOCK_SIZE;
                    drawBlock(ctx, x, y, currentPiece.color);
                }
            }
        }
    }
}

// ===== Draw Single Block =====
function drawBlock(context, x, y, color) {
    // Sharp pixel rendering
    const s = 4; // Shadow/Border size

    // Main block
    context.fillStyle = color;
    context.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);

    // Highlight (Top and Left)
    context.fillStyle = 'rgba(255, 255, 255, 0.5)';
    context.fillRect(x, y, BLOCK_SIZE, s);
    context.fillRect(x, y, s, BLOCK_SIZE);

    // Shadow (Bottom and Right)
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(x, y + BLOCK_SIZE - s, BLOCK_SIZE, s);
    context.fillRect(x + BLOCK_SIZE - s, y, s, BLOCK_SIZE);

    // Black Border
    context.strokeStyle = '#000';
    context.lineWidth = 2;
    context.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
}

// ===== Draw Next Piece =====
function drawNextPiece() {
    nextCtx.setTransform(1, 0, 0, 1, 0, 0);
    nextCtx.globalAlpha = 1;
    nextCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (nextPiece) {
        const offsetX = (nextCanvas.width - nextPiece.shape[0].length * BLOCK_SIZE) / 2;
        const offsetY = (nextCanvas.height - nextPiece.shape.length * BLOCK_SIZE) / 2;

        for (let row = 0; row < nextPiece.shape.length; row++) {
            for (let col = 0; col < nextPiece.shape[row].length; col++) {
                if (nextPiece.shape[row][col]) {
                    const x = offsetX + col * BLOCK_SIZE;
                    const y = offsetY + row * BLOCK_SIZE;
                    drawBlock(nextCtx, x, y, nextPiece.color);
                }
            }
        }
    }
}

// ===== Update Score Display =====
function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('lines').textContent = lines;
    document.getElementById('level').textContent = level;
}

// ===== Show Game Over =====
function showGameOver() {
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverScreen').classList.remove('hidden');
    gameAudio.stopBGM();
    gameAudio.playGameOver();
    hasActiveRound = false;
    multiplayer.notifyLost();
}

function resetToLobby() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    currentPiece = null;
    nextPiece = null;
    score = 0;
    lines = 0;
    level = 1;
    gameOver = false;
    isPaused = true;
    waitingForOpponent = true;
    hasActiveRound = false;
    dropCounter = 0;
    dropInterval = 1000;
    updateScore();
    drawNextPiece();
    document.getElementById('gameOverScreen').classList.add('hidden');
}

function setLobbyState(message) {
    waitingForOpponent = true;
    isPaused = true;
    hasActiveRound = false;
    setPauseMessage(message);
    document.getElementById('pauseScreen').classList.remove('hidden');
}

// ===== Start Round =====
function startRound() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    score = 0;
    lines = 0;
    level = 1;
    gameOver = false;
    isPaused = false;
    waitingForOpponent = false;
    hasActiveRound = true;
    dropCounter = 0;
    dropInterval = 1000;
    setPauseMessage('Pキーで再開');

    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('pauseScreen').classList.add('hidden');

    updateScore();
    nextPiece = createPiece();
    spawnPiece();
    gameAudio.startBGM();
}

// ===== Toggle Mute =====
function toggleMute() {
    const isMuted = gameAudio.toggleMute();
    const muteBtn = document.getElementById('muteBtn');
    muteBtn.textContent = isMuted ? '🔇' : '🔊';
}

// ===== Mobile Touch Controls =====
function setupMobileControls() {
    const canvas = document.getElementById('gameCanvas');

    // Touch events for swipe gestures
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Virtual button controls
    document.getElementById('leftBtn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        movePiece(-1, 0);
    });

    document.getElementById('rightBtn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        movePiece(1, 0);
    });

    document.getElementById('downBtn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (movePiece(0, 1)) {
            score += 1;
        }
    });

    document.getElementById('upBtn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        hardDrop();
    });

    document.getElementById('rotateBtn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        rotatePiece();
    });

    document.getElementById('hardDropBtn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        hardDrop();
    });
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}

function handleTouchMove(e) {
    e.preventDefault();
}

function handleTouchEnd(e) {
    e.preventDefault();
    const touch = e.changedTouches[0];
    touchEndX = touch.clientX;
    touchEndY = touch.clientY;

    handleSwipe();
}

function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Check if swipe distance is significant enough
    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
        // Tap - hard drop
        hardDrop();
        return;
    }

    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
            // Swipe right
            movePiece(1, 0);
        } else {
            // Swipe left
            movePiece(-1, 0);
        }
    } else {
        // Vertical swipe
        if (deltaY > 0) {
            // Swipe down
            if (movePiece(0, 1)) {
                score += 1;
            }
        } else {
            // Swipe up
            rotatePiece();
        }
    }
}

// ===== Start Game on Load =====
window.addEventListener('load', init);
