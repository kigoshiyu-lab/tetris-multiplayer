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
let countdownTimer = null;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

// Touch controls
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
const minSwipeDistance = 30;

// ===== Items (versus) =====
const itemInventory = {
    fog_top: 0,
    fog_bottom: 0,
    control_swap: 0,
    hide_stack: 0,
    shuffle_stack: 0,
    clear_bottom: 0
};

let effectControlSwapUntil = 0;
let effectHideStackUntil = 0;
let fogTopTimer = null;
let fogBottomTimer = null;

const lobbyPanelEl = () => document.getElementById('lobbyPanel');
const lobbyHintEl = () => document.getElementById('lobbyHint');
const gameContainerEl = () => document.getElementById('gameContainer');
const countdownScreenEl = () => document.getElementById('countdownScreen');
const countdownTextEl = () => document.getElementById('countdownText');
const fogTopEl = () => document.getElementById('fogTop');
const fogBottomEl = () => document.getElementById('fogBottom');

function isControlSwapActive() {
    return Date.now() < effectControlSwapUntil;
}

function isHideStackActive() {
    return Date.now() < effectHideStackUntil;
}

function rotateMatrixCCW(matrix) {
    const h = matrix.length;
    const w = matrix[0].length;
    return Array.from({ length: w }, (_, c) =>
        Array.from({ length: h }, (_, r) => matrix[r][w - 1 - c])
    );
}

function resetItemInventory() {
    itemInventory.fog_top = 0;
    itemInventory.fog_bottom = 0;
    itemInventory.control_swap = 0;
    itemInventory.hide_stack = 0;
    itemInventory.shuffle_stack = 0;
    itemInventory.clear_bottom = 0;
    updateItemUI();
}

function clearItemEffectVisuals() {
    effectControlSwapUntil = 0;
    effectHideStackUntil = 0;
    if (fogTopTimer) {
        clearTimeout(fogTopTimer);
        fogTopTimer = null;
    }
    if (fogBottomTimer) {
        clearTimeout(fogBottomTimer);
        fogBottomTimer = null;
    }
    const top = fogTopEl();
    const bottom = fogBottomEl();
    if (top) top.classList.add('hidden');
    if (bottom) bottom.classList.add('hidden');
}

function grantItemsFromLineClear(linesCleared) {
    if (linesCleared === 2) {
        itemInventory.fog_top += 1;
        itemInventory.fog_bottom += 1;
    } else if (linesCleared === 3) {
        itemInventory.control_swap += 1;
        itemInventory.hide_stack += 1;
        itemInventory.clear_bottom += 1;
    } else if (linesCleared === 4) {
        itemInventory.shuffle_stack += 1;
    }
    updateItemUI();
}

function updateItemUI() {
    document.querySelectorAll('.item-count').forEach((el) => {
        const key = el.getAttribute('data-count');
        if (!key || itemInventory[key] === undefined) return;
        const n = itemInventory[key];
        el.textContent = String(n);
        const btn = el.closest('.item-btn');
        if (btn) {
            btn.disabled = n <= 0;
            btn.classList.toggle('item-disabled', n <= 0);
        }
    });
}

function showFogTop() {
    const el = fogTopEl();
    if (!el) return;
    el.classList.remove('hidden');
    if (fogTopTimer) clearTimeout(fogTopTimer);
    fogTopTimer = setTimeout(() => {
        el.classList.add('hidden');
        fogTopTimer = null;
    }, 5000);
}

function showFogBottom() {
    const el = fogBottomEl();
    if (!el) return;
    el.classList.remove('hidden');
    if (fogBottomTimer) clearTimeout(fogBottomTimer);
    fogBottomTimer = setTimeout(() => {
        el.classList.add('hidden');
        fogBottomTimer = null;
    }, 5000);
}

function applyControlSwapDebuff() {
    effectControlSwapUntil = Date.now() + 10000;
}

function applyHideStackDebuff() {
    effectHideStackUntil = Date.now() + 10000;
}

function shuffleOpponentStack() {
    const cells = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c]) {
                cells.push(board[r][c]);
            }
        }
    }
    for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    let k = 0;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c]) {
                board[r][c] = cells[k];
                k += 1;
            }
        }
    }
    if (currentPiece && checkCollision(currentPiece.x, currentPiece.y, currentPiece.shape)) {
        gameOver = true;
        showGameOver();
    }
}

function clearBottomRowHelp() {
    board[ROWS - 1] = Array(COLS).fill(0);
}

function useItem(itemType) {
    if (!hasActiveRound || gameOver || isPaused) return;
    if (!itemInventory[itemType] || itemInventory[itemType] <= 0) return;
    if (itemType !== 'clear_bottom' && !multiplayer.isInRoom()) {
        return;
    }

    gameAudio.resume();
    gameAudio.playItemUse();

    itemInventory[itemType] -= 1;
    updateItemUI();

    if (itemType === 'clear_bottom') {
        clearBottomRowHelp();
        return;
    }

    multiplayer.sendItem(itemType);
}

window.onItemEffect = (itemType) => {
    if (!hasActiveRound) return;
    gameAudio.playItemUse();
    switch (itemType) {
        case 'fog_top':
            showFogTop();
            break;
        case 'fog_bottom':
            showFogBottom();
            break;
        case 'control_swap':
            applyControlSwapDebuff();
            break;
        case 'hide_stack':
            applyHideStackDebuff();
            break;
        case 'shuffle_stack':
            shuffleOpponentStack();
            break;
        default:
            break;
    }
};

function setupHelpModal() {
    const modal = document.getElementById('helpModal');
    const openBtn = document.getElementById('openHelpBtn');
    const closeBtn = document.getElementById('closeHelpBtn');
    const backdrop = modal && modal.querySelector('.help-modal-backdrop');
    if (!modal || !openBtn || !closeBtn) return;

    function openModal() {
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
    }

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    if (backdrop) {
        backdrop.addEventListener('click', closeModal);
    }
}

function setupItemControls() {
    const grid = document.getElementById('itemGrid');
    if (!grid) return;
    grid.addEventListener('click', (e) => {
        const btn = e.target.closest('.item-btn');
        if (!btn || btn.disabled) return;
        const item = btn.getAttribute('data-item');
        if (item) useItem(item);
    });
}

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
    setupHelpModal();
    setupItemControls();
    multiplayer.initUI();
    updateItemUI();

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

function setLobbyHint(text) {
    const hintEl = lobbyHintEl();
    if (hintEl) {
        hintEl.textContent = text;
    }
}

window.onRoomJoined = (players) => {
    if (players < 2) {
        setLobbyState('接続完了。対戦相手を待っています...');
    }
};

window.onMatchStart = () => {
    showGameScreen();
    startCountdownAndRound();
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

function showLobbyScreen() {
    lobbyPanelEl().classList.remove('hidden');
    gameContainerEl().classList.add('hidden');
}

function showGameScreen() {
    lobbyPanelEl().classList.add('hidden');
    gameContainerEl().classList.remove('hidden');
}

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

    if (dx !== 0 && isControlSwapActive()) {
        dx = -dx;
    }

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

    const rotated = isControlSwapActive()
        ? rotateMatrixCCW(currentPiece.shape)
        : currentPiece.shape[0].map((_, i) =>
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

        grantItemsFromLineClear(linesCleared);
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
    const dimStack = isHideStackActive();
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                if (dimStack) {
                    drawHiddenStackBlock(
                        col * BLOCK_SIZE,
                        row * BLOCK_SIZE
                    );
                } else {
                    drawBlock(ctx, col * BLOCK_SIZE, row * BLOCK_SIZE, board[row][col]);
                }
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

function drawHiddenStackBlock(x, y) {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
}

// ===== Draw Next Piece =====
function drawNextPiece() {
    nextCtx.setTransform(1, 0, 0, 1, 0, 0);
    nextCtx.globalAlpha = 1;
    nextCtx.globalCompositeOperation = 'source-over';
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    nextCtx.fillStyle = '#000';
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
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }
    clearItemEffectVisuals();
    resetItemInventory();
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
    showLobbyScreen();
    countdownScreenEl().classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('pauseScreen').classList.add('hidden');
}

function setLobbyState(message) {
    waitingForOpponent = true;
    isPaused = true;
    hasActiveRound = false;
    setLobbyHint(message);
}

// ===== Start Round =====
function startRound() {
    clearItemEffectVisuals();
    resetItemInventory();
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
    gameAudio.startBGMNewRound();
}

function startCountdownAndRound() {
    if (countdownTimer) {
        clearInterval(countdownTimer);
    }

    gameAudio.resume();

    const sequence = ['3', '2', '1', 'START'];
    let index = 0;
    const overlay = countdownScreenEl();
    const textEl = countdownTextEl();

    function playCountdownSoundForStep(i) {
        if (i < 3) {
            gameAudio.playCountdownTick(i);
        } else {
            gameAudio.playCountdownStart();
        }
    }

    overlay.classList.remove('hidden');
    textEl.textContent = sequence[index];
    playCountdownSoundForStep(0);

    countdownTimer = setInterval(() => {
        index += 1;
        if (index >= sequence.length) {
            clearInterval(countdownTimer);
            countdownTimer = null;
            overlay.classList.add('hidden');
            startRound();
            return;
        }
        textEl.textContent = sequence[index];
        playCountdownSoundForStep(index);
    }, 700);
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
