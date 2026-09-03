let board;
let context;
let animationFrame;
let lastFrameTime = 0;
let lastSpawnTime = 0;
let nextSpawnDelay = 500;
let gameOver = false;
let gameStarted = false;
let lanes = [];
let score = 0;
let playerProfile = null;
const rocketImage = new Image();
rocketImage.src = "rocket.png";

const rocket = {
    lane: 1,
    size: 0,
    y: 0,
};

const fallingObjects = [];
const stars = Array.from({ length: 70 }, function () {
    return {
        x: Math.random(),
        y: Math.random(),
        size: 1 + Math.random() * 1.5,
        opacity: 0.45 + Math.random() * 0.55,
    };
});

window.addEventListener("load", function () {
    board = document.getElementById("game-canvas");
    context = board.getContext("2d");
    setupStartMenu();

    resizeBoard();
    window.addEventListener("resize", resizeBoard);
    document.addEventListener("keydown", handleKeyDown);
    animationFrame = requestAnimationFrame(gameLoop);
});

function resizeBoard() {
    const pixelRatio = window.devicePixelRatio || 1;
    const width = board.clientWidth;
    const height = board.clientHeight;

    board.width = width * pixelRatio;
    board.height = height * pixelRatio;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    lanes = [width / 6, width / 2, width * 5 / 6];
    rocket.size = Math.min((width / 3) * 0.85, height / 4);
    rocket.y = height - rocket.size - 24;
}

function handleKeyDown(event) {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        rocket.lane = Math.max(0, rocket.lane - 1);
        event.preventDefault();
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        rocket.lane = Math.min(2, rocket.lane + 1);
        event.preventDefault();
    }

    if (gameOver && event.key === " ") {
        restartGame();
        event.preventDefault();
    }
}

function gameLoop(timestamp) {
    const elapsed = timestamp - lastFrameTime;
    lastFrameTime = timestamp;

    if (gameStarted && !gameOver) {
        updateGame(elapsed, timestamp);
    }

    drawGame();
    animationFrame = requestAnimationFrame(gameLoop);
}

function setupStartMenu() {
    const menu = document.getElementById("start-menu");
    const form = document.getElementById("player-form");
    const companyInput = document.getElementById("company-name");
    const departmentInput = document.getElementById("department");
    const anonymousInput = document.getElementById("anonymous");

    anonymousInput.addEventListener("change", function () {
        if (anonymousInput.checked) {
            companyInput.value = "Anonymous";
            companyInput.disabled = true;
            departmentInput.value = "";
            departmentInput.disabled = true;
            return;
        }

        companyInput.value = "";
        companyInput.disabled = false;
        departmentInput.disabled = false;
        companyInput.focus();
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        playerProfile = {
            company: anonymousInput.checked ? "Anonymous" : companyInput.value.trim(),
            department: anonymousInput.checked ? "" : departmentInput.value.trim(),
            anonymous: anonymousInput.checked,
        };

        menu.hidden = true;
        gameStarted = true;
        lastFrameTime = performance.now();
        lastSpawnTime = lastFrameTime;
    });
}

function updateGame(elapsed, timestamp) {
    gameSpeed = Math.min(maxGameSpeed, gameSpeed + acceleration * elapsed / 1000);

    if (timestamp - lastSpawnTime >= nextSpawnDelay) {
        spawnObject();
        lastSpawnTime = timestamp;
        nextSpawnDelay = getSpawnDelay();
    }

    for (const object of fallingObjects) {
        object.y += object.speed * elapsed / 1000;
    }

    const rocketX = lanes[rocket.lane] - rocket.size / 2;
    for (const object of fallingObjects) {
        const overlaps = object.lane === rocket.lane
            && object.y + object.size >= rocket.y
            && object.y <= rocket.y + rocket.size;

        if (overlaps && object.x < rocketX + rocket.size && object.x + object.size > rocketX) {
            gameOver = true;
        }
    }

    for (let index = fallingObjects.length - 1; index >= 0; index -= 1) {
        if (fallingObjects[index].y > board.clientHeight) {
            fallingObjects.splice(index, 1);
            score += 1;
        }
    }
}

let gameSpeed = 200;
const acceleration = 10;
const maxGameSpeed = 1000;
const startingSpawnDelay = 1200;
const minimumSpawnDelay = 50;

function spawnObject() {
    const size = rocket.size / 3;
    const lane = Math.floor(Math.random() * lanes.length);


    fallingObjects.push({
        lane,
        x: lanes[lane] - size / 2,
        y: -size,
        size,
        speed: gameSpeed,
    });
}

function getSpawnDelay() {
    const speedProgress = (gameSpeed - 200) / (maxGameSpeed - 200);
    const delay = startingSpawnDelay - speedProgress * (startingSpawnDelay - minimumSpawnDelay);

    return Math.max(minimumSpawnDelay, delay) + Math.random() * 100;
}

function drawGame() {
    const width = board.clientWidth;
    const height = board.clientHeight;

    context.clearRect(0, 0, width, height);
    context.fillStyle = "#000000";
    context.fillRect(0, 0, width, height);

    context.fillStyle = "#ffffff";
    for (const star of stars) {
        context.globalAlpha = star.opacity;
        context.fillRect(star.x * width, star.y * height, star.size, star.size);
    }
    context.globalAlpha = 1;

    
    context.lineWidth = 1;
    for (const lane of lanes) {
        context.beginPath();
        context.moveTo(lane, 0);
        context.lineTo(lane, height);
        context.stroke();
    }

    context.drawImage(
        rocketImage,
        lanes[rocket.lane] - rocket.size / 2,
        rocket.y,
        rocket.size,
        rocket.size
    );

    context.fillStyle = "#ff6b5f";
    for (const object of fallingObjects) {
        context.fillRect(object.x, object.y, object.size, object.size);
    }

    drawHud(width);

    if (gameOver) {
        context.fillStyle = "rgba(0, 0, 0, 0.7)";
        context.fillRect(0, 0, width, height);
        context.fillStyle = "#ffffff";
        context.textAlign = "center";
        context.font = "bold 28px sans-serif";
        context.fillText("Game over", width / 2, height / 2 - 10);
        context.font = "16px sans-serif";
        context.fillText("Press Space to restart", width / 2, height / 2 + 22);
    }
}

function drawHud(width) {
    const padding = 16;
    const fontSize = Math.max(16, Math.min(24, width / 20));

    context.fillStyle = "#ffffff";
    context.font = `bold ${fontSize}px sans-serif`;
    context.textBaseline = "top";
    context.textAlign = "left";
    context.fillText(`Score: ${score}`, padding, padding);

}

function restartGame() {
    fallingObjects.length = 0;
    rocket.lane = 1;
    score = 0;
    gameSpeed = 200;
    gameOver = false;
    lastSpawnTime = performance.now();
    nextSpawnDelay = 900;
}
