const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const ROWS = 20;
const COLUMNS = 10;
const BLOCK_SIZE = 30;

let score = 0;
let grid = createEmptyGrid();
let currentPiece = getRandomPiece();
let gameOver = false;

function createEmptyGrid() {
    return Array.from({ length: ROWS }, () => Array(COLUMNS).fill(0));
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLUMNS; c++) {
            if (grid[r][c]) {
                ctx.fillStyle = 'cyan';
                ctx.fillRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = 'black';
                ctx.strokeRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }
}

function drawPiece(piece) {
    ctx.fillStyle = 'blue';
    piece.shape.forEach((row, r) => {
        row.forEach((cell, c) => {
            if (cell) {
                ctx.fillRect((piece.x + c) * BLOCK_SIZE, (piece.y + r) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = 'black';
                ctx.strokeRect((piece.x + c) * BLOCK_SIZE, (piece.y + r) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
}

function getRandomPiece() {
    const pieces = [
        [[1, 1, 1, 1]],
        [[1, 1], [1, 1]],
        [[0, 1, 0], [1, 1, 1]],
        [[1, 0, 0], [1, 1, 1]],
        [[0, 0, 1], [1, 1, 1]],
        [[0, 1, 1], [1, 1, 0]],
        [[1, 1, 0], [0, 1, 1]],
    ];
    const shape = pieces[Math.floor(Math.random() * pieces.length)];
    return {
        shape,
        x: Math.floor(COLUMNS / 2) - Math.floor(shape[0].length / 2),
        y: 0
    };
}

function dropPiece() {
    currentPiece.y++;
    if (collision()) {
        currentPiece.y--;
        placePiece();
        currentPiece = getRandomPiece();
        if (collision()) {
            gameOver = true;
            document.getElementById('gameOver').classList.remove('hidden');
        }
    }
}

function collision() {
    const { shape, x, y } = currentPiece;
    return shape.some((row, r) =>
        row.some((cell, c) => {
            if (cell) {
                const newX = x + c;
                const newY = y + r;
                return newX < 0 || newX >= COLUMNS || newY >= ROWS || grid[newY][newX];
            }
            return false;
        })
    );
}

function placePiece() {
    currentPiece.shape.forEach((row, r) => {
        row.forEach((cell, c) => {
            if (cell) {
                grid[currentPiece.y + r][currentPiece.x + c] = cell;
            }
        });
    });
    clearLines();
}

function clearLines() {
    grid = grid.filter(row => row.some(cell => !cell));
    while (grid.length < ROWS) {
        grid.unshift(Array(COLUMNS).fill(0));
    }
    score += 10;
    document.getElementById('score').textContent = `スコア: ${score}`;
}

function gameLoop() {
    if (!gameOver) {
        dropPiece();
        drawGrid();
        drawPiece(currentPiece);
        setTimeout(gameLoop, 500);
    }
}

gameLoop();
