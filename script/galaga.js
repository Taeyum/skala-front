/*
    캔버스는 script 태그가 body 맨 아래에 있어서 이 시점엔 이미 DOM에 존재함 (다른 script들과 동일한 전제).
    canvas가 없는 페이지에서 이 파일이 실수로 로드돼도 에러 없이 조용히 아무 것도 안 하도록 null 체크를 해둠.
*/
var canvas = document.getElementById("galaga-canvas");
var ctx = canvas ? canvas.getContext("2d") : null;

var CANVAS_WIDTH = canvas ? canvas.width : 320;
var CANVAS_HEIGHT = canvas ? canvas.height : 420;

var PLAYER_WIDTH = 30;
var PLAYER_HEIGHT = 16;
var PLAYER_SPEED = 4;
var PLAYER_Y = CANVAS_HEIGHT - 40;

var BULLET_WIDTH = 3;
var BULLET_HEIGHT = 10;
var BULLET_SPEED = 6;

var ENEMY_ROWS = 4;
var ENEMY_COLS = 6;
var ENEMY_WIDTH = 24;
var ENEMY_HEIGHT = 16;
var ENEMY_GAP_X = 10;
var ENEMY_GAP_Y = 14;
var ENEMY_START_X = 20;
var ENEMY_START_Y = 30;
var ENEMY_SPEED = 0.8;
var ENEMY_STEP_DOWN = 14;

/* 게임이 새로 시작될 때마다 resetGame()에서 다시 채워지는 상태값들 */
var player;
var bullet;
var enemies;
var enemyDirection;
var score;
var running;
var gameResult; // null | "win" | "lose"
var keys = { left: false, right: false }; // 모달을 열기 전에 방향키를 눌러도 에러 안 나게 미리 초기값을 넣어둠

/* 중복 루프 방지용: startGalaga()가 여러 번 눌려도 이전에 예약된 프레임을 취소하고 새로 시작함 */
var animationId = null;

/* 두 사각형(x, y, w, h)이 겹치는지 확인하는 단순 AABB 충돌 판정 */
function rectsOverlap(a, b) {
    return a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y;
}

function createEnemies() {
    var list = [];

    for (var row = 0; row < ENEMY_ROWS; row++) {
        for (var col = 0; col < ENEMY_COLS; col++) {
            list.push({
                x: ENEMY_START_X + col * (ENEMY_WIDTH + ENEMY_GAP_X),
                y: ENEMY_START_Y + row * (ENEMY_HEIGHT + ENEMY_GAP_Y),
                w: ENEMY_WIDTH,
                h: ENEMY_HEIGHT,
                alive: true
            });
        }
    }

    return list;
}

function resetGame() {
    player = {
        x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
        y: PLAYER_Y,
        w: PLAYER_WIDTH,
        h: PLAYER_HEIGHT
    };
    bullet = null;
    enemies = createEnemies();
    enemyDirection = 1;
    score = 0;
    gameResult = null;
    keys = { left: false, right: false };
}

function fireBullet() {
    /* 총알이 화면에 이미 하나 떠 있으면 새로 쏘지 못하게 막아서 총알 난사를 방지함 */
    if (!running || bullet !== null) {
        return;
    }

    bullet = {
        x: player.x + player.w / 2 - BULLET_WIDTH / 2,
        y: player.y - BULLET_HEIGHT,
        w: BULLET_WIDTH,
        h: BULLET_HEIGHT
    };
}

/*
    적 편대를 한 덩어리로 움직임 (전형적인 스페이스 인베이더 방식):
    다음 칸으로 이동했을 때 좌우 벽에 닿는지 먼저 검사하고,
    닿으면 이동 방향을 뒤집고 한 줄 아래로 내려가며, 안 닿으면 그대로 옆으로 이동함.
*/
function moveEnemies() {
    var minX = Infinity;
    var maxX = -Infinity;
    var anyAlive = false;

    for (var i = 0; i < enemies.length; i++) {
        if (!enemies[i].alive) {
            continue;
        }
        anyAlive = true;
        if (enemies[i].x < minX) {
            minX = enemies[i].x;
        }
        if (enemies[i].x + enemies[i].w > maxX) {
            maxX = enemies[i].x + enemies[i].w;
        }
    }

    if (!anyAlive) {
        return;
    }

    var hitEdge = false;
    if (enemyDirection > 0 && maxX + ENEMY_SPEED > CANVAS_WIDTH) {
        hitEdge = true;
    } else if (enemyDirection < 0 && minX - ENEMY_SPEED < 0) {
        hitEdge = true;
    }

    if (hitEdge) {
        enemyDirection *= -1;
        for (var j = 0; j < enemies.length; j++) {
            if (enemies[j].alive) {
                enemies[j].y += ENEMY_STEP_DOWN;
            }
        }
    } else {
        for (var k = 0; k < enemies.length; k++) {
            if (enemies[k].alive) {
                enemies[k].x += enemyDirection * ENEMY_SPEED;
            }
        }
    }
}

function update() {
    if (!running) {
        return;
    }

    if (keys.left) {
        player.x -= PLAYER_SPEED;
    }
    if (keys.right) {
        player.x += PLAYER_SPEED;
    }
    if (player.x < 0) {
        player.x = 0;
    }
    if (player.x + player.w > CANVAS_WIDTH) {
        player.x = CANVAS_WIDTH - player.w;
    }

    if (bullet) {
        bullet.y -= BULLET_SPEED;
        if (bullet.y + bullet.h < 0) {
            bullet = null; // 화면 밖으로 나간 총알은 즉시 지워서 배열/객체가 계속 쌓이지 않게 함
        }
    }

    moveEnemies();

    if (bullet) {
        for (var i = 0; i < enemies.length; i++) {
            if (!enemies[i].alive) {
                continue;
            }
            if (rectsOverlap(bullet, enemies[i])) {
                enemies[i].alive = false;
                bullet = null;
                score += 10;
                break;
            }
        }
    }

    var anyAlive = false;
    for (var j = 0; j < enemies.length; j++) {
        if (enemies[j].alive) {
            anyAlive = true;
            break;
        }
    }

    if (!anyAlive) {
        running = false;
        gameResult = "win";
        return;
    }

    for (var k = 0; k < enemies.length; k++) {
        if (!enemies[k].alive) {
            continue;
        }
        if (enemies[k].y + enemies[k].h >= player.y || rectsOverlap(enemies[k], player)) {
            running = false;
            gameResult = "lose";
            return;
        }
    }
}

function drawCenterMessage(title, subtitle) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";

    ctx.font = "bold 22px sans-serif";
    ctx.fillText(title, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);

    ctx.font = "16px sans-serif";
    ctx.fillText(subtitle, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

    ctx.font = "13px sans-serif";
    ctx.fillText("버튼을 눌러 다시 시작하세요", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 46);

    ctx.textAlign = "left"; // 다음 프레임의 점수 텍스트(왼쪽 정렬)에 영향 안 주게 원복
}

function render() {
    if (!ctx) {
        return;
    }

    ctx.fillStyle = "#0a0a12";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    /* 플레이어: 삼각형 우주선 */
    ctx.fillStyle = "#4fc3f7";
    ctx.beginPath();
    ctx.moveTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();

    if (bullet) {
        ctx.fillStyle = "#fff176";
        ctx.fillRect(bullet.x, bullet.y, bullet.w, bullet.h);
    }

    ctx.fillStyle = "#ff5c7a";
    for (var i = 0; i < enemies.length; i++) {
        if (enemies[i].alive) {
            ctx.fillRect(enemies[i].x, enemies[i].y, enemies[i].w, enemies[i].h);
        }
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "14px sans-serif";
    ctx.fillText("점수: " + score, 10, 20);

    if (gameResult === "win") {
        drawCenterMessage("🎉 승리!", "최종 점수: " + score);
    } else if (gameResult === "lose") {
        drawCenterMessage("💥 게임 오버", "최종 점수: " + score);
    }
}

function gameLoop() {
    update();
    render();

    if (running) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

var galagaModal = document.getElementById("galaga-modal");

function startGalaga() {
    if (!canvas || !ctx) {
        return;
    }

    if (galagaModal) {
        galagaModal.hidden = false;
    }

    /* 이전 게임의 루프가 아직 예약되어 있을 수 있으니 취소하고 상태를 완전히 초기화함 */
    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    resetGame();
    running = true;
    gameLoop();
}

/* 팝업을 닫을 때는 진행 중이던 게임 루프도 같이 멈춰야, 팝업이 안 보이는 동안에도 뒤에서 계속 도는 걸 막을 수 있음 */
function closeGalaga() {
    running = false;

    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    if (galagaModal) {
        galagaModal.hidden = true;
    }
}

/*
    키보드 리스너는 파일이 처음 로드될 때 딱 한 번만 등록함.
    startGalaga() 안에서 등록하면 "시작" 버튼을 여러 번 누를 때마다 리스너가 계속 쌓이는 버그가 생기므로,
    여기서는 running 플래그로 게임 중일 때만 동작하도록 막는 방식으로 처리함.
    ArrowLeft/ArrowRight/Space는 브라우저 기본 동작으로 페이지가 스크롤되므로,
    게임이 진행 중일 때는 preventDefault()로 그 기본 동작을 막음.
*/
document.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        keys.left = true;
        if (running) {
            event.preventDefault();
        }
    } else if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
        keys.right = true;
        if (running) {
            event.preventDefault();
        }
    } else if (event.key === " " || event.code === "Space") {
        if (running) {
            event.preventDefault();
            fireBullet();
        }
    } else if (event.key === "Escape" && running) {
        closeGalaga();
    }
});

document.addEventListener("keyup", function (event) {
    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        keys.left = false;
    } else if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
        keys.right = false;
    }
});

/*
    팝업 배경(어두운 반투명 부분)을 클릭하면 닫히게 함. event.target === galagaModal일 때만 닫아야
    카드 내부(.game-modal-content)를 클릭했을 때는 안 닫힘 - 클릭이 배경까지 버블링돼도
    target은 실제로 클릭된 가장 안쪽 요소를 가리키므로 이 비교로 정확히 구분됨.
*/
if (galagaModal) {
    galagaModal.addEventListener("click", function (event) {
        if (event.target === galagaModal) {
            closeGalaga();
        }
    });
}
