/*
    도트(픽셀) 하늘+파도 배경을 body에 직접 삽입해서 뷰포트 전체에 고정 배경으로 깔아둠. HTML을 건드리지 않고
    모든 페이지에 이 스크립트 태그 한 줄만 추가하면 되게 함 (themeToggle.js/auth.js와 같은 패턴).
    position: fixed는 CSS(#wave-background)에서 처리하므로, 여기서는 뷰포트 크기에 맞춰 캔버스 해상도만 갱신함.
    색상은 style.css의 --color-* 변수를 그대로 읽어써서 라이트/다크 모드에 자동으로 맞춰짐
    (다크모드에서는 --color-sun이 노란 해 대신 은은한 달빛 톤이 되어 자연스럽게 "달"처럼 보임).
*/
var WAVE_BAND_HEIGHT = 120;
var WAVE_BLOCK = 8;
var WAVE_GAP = 2;
var WAVE_BAND_ROWS = Math.ceil(WAVE_BAND_HEIGHT / WAVE_BLOCK);
/*
    맨 뒤 파도 레이어는 phase(0.02/프레임) 대비 colStep(0.35)이 작아서, 옆으로 흘러가는 속도가
    대략 0.46px/프레임임. SURFER_SPEED를 그거랑 비슷하게 두면 서퍼가 파도랑 "같은 속도로 나란히"
    이동하는 셈이 되어 버려서 상대적으로는 거의 안 출렁이는 것처럼 보임(실제로 겪은 버그).
    그 속도와 확실히 차이 나게 잡아야 위아래 출렁임이 눈에 보임.
*/
var SURFER_SPEED = 1;
var surferX = null;

var PLANE_Y = 160;
var PLANE_SPEED = 0.6;
var PLANE_LOOP_RADIUS = 3.5;
var PLANE_LOOP_ANGULAR_SPEED = (Math.PI * 2) / 90;

var planeBaseX = null;
var planeLooping = false;
var planeLoopAngle = 0;
var planeLoopCooldown = 400;

var waveCanvas = document.createElement("canvas");
waveCanvas.id = "wave-background";
waveCanvas.setAttribute("aria-hidden", "true");
document.body.appendChild(waveCanvas);

var waveCtx = waveCanvas.getContext("2d");
var waveWidth = 0;
var waveHeight = 0;
var waveCols = 0;
var waveTopY = 0;
var wavePhase = 0;
var skyPhase = 0;
var bubbles = [];
var clouds = [];

var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function resizeWaveCanvas() {
    waveWidth = window.innerWidth;
    waveHeight = window.innerHeight;
    waveCanvas.width = waveWidth;
    waveCanvas.height = waveHeight;
    waveCols = Math.ceil(waveWidth / WAVE_BLOCK) + 1;
    waveTopY = waveHeight - WAVE_BAND_HEIGHT;

    /* 서퍼는 화면 오른쪽 바깥에서 시작해서 왼쪽으로 타고 감. null 체크로 리사이즈될 때마다 위치가 리셋되는 걸 막음 */
    if (surferX === null) {
        surferX = waveWidth + 60;
    }

    /* 비행기도 서퍼처럼 처음 한 번만 화면 왼쪽 밖에 배치함 */
    if (planeBaseX === null) {
        planeBaseX = -80;
    }

    if (clouds.length === 0) {
        clouds.push({ x: waveWidth * 0.2, y: 70, speed: 0.15, scale: 1 });
        clouds.push({ x: waveWidth * 0.6, y: 115, speed: 0.1, scale: 0.8 });
        clouds.push({ x: waveWidth * 0.85, y: 50, speed: 0.2, scale: 0.6 });
    }
}

function getWaveColors() {
    var styles = getComputedStyle(document.documentElement);

    return {
        back: styles.getPropertyValue("--color-accent-light").trim(),
        mid: styles.getPropertyValue("--color-secondary").trim(),
        front: styles.getPropertyValue("--color-primary").trim(),
        foam: styles.getPropertyValue("--color-primary-dark").trim(),
        sun: styles.getPropertyValue("--color-sun").trim(),
        cloud: styles.getPropertyValue("--color-cloud").trim(),
        suit: styles.getPropertyValue("--color-surfer-suit").trim(),
        board: styles.getPropertyValue("--color-surfer-board").trim(),
        white: styles.getPropertyValue("--color-white").trim()
    };
}

/* 중심(cx, cy)에서 radiusBlocks 칸 반경의 동그란 도트 뭉치를 그림. 해/달/구름 전부 이 도형을 조합해서 만듦 */
function drawBlockyCircle(cx, cy, radiusBlocks, color) {
    waveCtx.fillStyle = color;

    for (var row = -radiusBlocks; row <= radiusBlocks; row++) {
        for (var col = -radiusBlocks; col <= radiusBlocks; col++) {
            if (Math.sqrt(row * row + col * col) > radiusBlocks - 0.3) {
                continue;
            }

            var x = cx + col * WAVE_BLOCK - WAVE_BLOCK / 2 + WAVE_GAP / 2;
            var y = cy + row * WAVE_BLOCK - WAVE_BLOCK / 2 + WAVE_GAP / 2;
            waveCtx.fillRect(x, y, WAVE_BLOCK - WAVE_GAP, WAVE_BLOCK - WAVE_GAP);
        }
    }
}

/* sin 곡선으로 특정 칸(col)에서 파도 표면이 몇 번째 row에 있는지 계산함. 파도 레이어 채우기와 서퍼 위치 계산이 이 공식을 공유해서, 서퍼가 항상 파도 표면에 딱 맞게 올라타 있음 */
function waveSurfaceRow(baseRow, amplitude, phase, colStep, col) {
    return Math.round(baseRow - Math.sin(col * colStep + phase) * amplitude);
}

/*
    물결 한 겹을 작은 사각형(도트) 격자로 그림. 출렁이는 계단식 실루엣을 만들고,
    그 아래는 전부 도트로 채워서 물처럼 보이게 함.
    row 좌표는 화면 하단(waveTopY)을 기준으로 하므로, 캔버스가 뷰포트 전체 높이여도 파도는 항상 바닥에 붙음.
*/
function drawWaveLayer(color, baseRow, amplitude, phase, colStep) {
    waveCtx.fillStyle = color;

    for (var col = 0; col < waveCols; col++) {
        var topRow = waveSurfaceRow(baseRow, amplitude, phase, colStep, col);

        for (var row = topRow; row < WAVE_BAND_ROWS; row++) {
            if (row < 0) {
                continue;
            }

            var x = col * WAVE_BLOCK + WAVE_GAP / 2;
            var y = waveTopY + row * WAVE_BLOCK + WAVE_GAP / 2;
            waveCtx.fillRect(x, y, WAVE_BLOCK - WAVE_GAP, WAVE_BLOCK - WAVE_GAP);
        }
    }
}

/* 아주 가끔 물결 위로 떠오르는 작은 거품 도트 하나를 추가함 (너무 자주 안 생기게 낮은 확률로) */
function spawnBubble() {
    if (Math.random() > 0.02) {
        return;
    }

    bubbles.push({
        x: Math.random() * waveWidth,
        y: waveTopY + WAVE_BAND_HEIGHT - WAVE_BLOCK,
        size: 2 + Math.random() * 2,
        speed: 0.2 + Math.random() * 0.2,
        life: 1
    });
}

function drawBubbles(color) {
    waveCtx.fillStyle = color;

    for (var i = bubbles.length - 1; i >= 0; i--) {
        var bubble = bubbles[i];
        bubble.y -= bubble.speed;
        bubble.life -= 0.008;

        if (bubble.life <= 0 || bubble.y < waveTopY) {
            bubbles.splice(i, 1);
            continue;
        }

        waveCtx.globalAlpha = bubble.life;
        waveCtx.fillRect(bubble.x, bubble.y, bubble.size, bubble.size);
    }

    waveCtx.globalAlpha = 1;
}

/* 오른쪽 위에 고정된 해(라이트 모드)/달(다크 모드). 살짝 숨쉬듯 위아래로 움직이고, 빛줄기 8개가 은은하게 반짝임 */
function drawSun(color) {
    var cx = waveWidth - 90;
    var cy = 90 + Math.sin(skyPhase) * 3;

    drawBlockyCircle(cx, cy, 5, color);

    var rayDistance = 6 + Math.sin(skyPhase * 2) * 0.4;
    var angles = [0, 45, 90, 135, 180, 225, 270, 315];

    waveCtx.fillStyle = color;

    for (var i = 0; i < angles.length; i++) {
        var rad = (angles[i] * Math.PI) / 180;
        var rayX = cx + Math.cos(rad) * rayDistance * WAVE_BLOCK;
        var rayY = cy + Math.sin(rad) * rayDistance * WAVE_BLOCK;
        var size = WAVE_BLOCK - WAVE_GAP;
        waveCtx.fillRect(rayX - size / 2, rayY - size / 2, size, size);
    }
}

/* 서퍼를 오른쪽에서 왼쪽으로 천천히 이동시키고, 화면 왼쪽 밖으로 나가면 오른쪽 밖에서 다시 태워보냄 */
function updateSurfer() {
    surferX -= SURFER_SPEED;

    if (surferX < -60) {
        surferX = waveWidth + 60;
    }
}

/*
    맨 뒤쪽(back) 파도 레이어와 똑같은 공식(waveSurfaceRow)으로 그 지점의 파도 표면 높이를 구해서,
    서프보드를 그 표면 바로 위에 얹음. 그래서 파도가 출렁이는 대로 서퍼도 같이 위아래로 타고 흔들리면서,
    surferX가 매 프레임 왼쪽으로 이동하니 실제로 파도를 타고 미끄러져 가는 것처럼 보임.
    renderWave()에서 back 레이어 바로 다음, mid/front 레이어보다 먼저 그려서 앞쪽 파도에 다리 쪽이
    살짝 가려지게(원근감 있게) 함.
*/
function drawSurfer(colors) {
    var col = Math.round(surferX / WAVE_BLOCK);
    var topRow = waveSurfaceRow(WAVE_BAND_ROWS - 10, 2.2, wavePhase, 0.35, col);
    var surfaceY = waveTopY + topRow * WAVE_BLOCK;

    function dot(colOffset, rowOffset, color) {
        var x = surferX + colOffset * WAVE_BLOCK - WAVE_BLOCK / 2 + WAVE_GAP / 2;
        var y = surfaceY + rowOffset * WAVE_BLOCK - WAVE_BLOCK / 2 + WAVE_GAP / 2;
        waveCtx.fillStyle = color;
        waveCtx.fillRect(x, y, WAVE_BLOCK - WAVE_GAP, WAVE_BLOCK - WAVE_GAP);
    }

    /* 서프보드(빨간색): 파도 표면에 걸친 얇은 막대 */
    dot(-2, -1, colors.board);
    dot(-1, -1, colors.board);
    dot(0, -1, colors.board);
    dot(1, -1, colors.board);
    dot(2, -1, colors.board);

    /* 노란 옷 입은 서퍼: 다리(양발 벌린 자세) → 팔 벌린 몸통 → 머리 순서로 쌓아서 서핑 자세를 표현함 */
    dot(-1, -2, colors.suit);
    dot(1, -2, colors.suit);
    dot(-1, -3, colors.suit);
    dot(0, -3, colors.suit);
    dot(1, -3, colors.suit);
    drawBlockyCircle(surferX, surfaceY - 4 * WAVE_BLOCK, 1.2, colors.suit);
}

/*
    비행기를 오른쪽으로 계속 이동시키고, 화면 밖으로 나가면 왼쪽 밖에서 다시 등장시킴.
    평소엔 그냥 수평 비행이지만, 쿨다운이 다 되면 한 바퀴(360도) 세로로 도는 루프 동작을 시작함.
*/
function updatePlane() {
    planeBaseX += PLANE_SPEED;

    if (planeBaseX - 80 > waveWidth) {
        planeBaseX = -80;
    }

    if (planeLooping) {
        planeLoopAngle += PLANE_LOOP_ANGULAR_SPEED;

        if (planeLoopAngle >= Math.PI * 2) {
            planeLooping = false;
            planeLoopAngle = 0;
            planeLoopCooldown = 400 + Math.random() * 400;
        }
    } else {
        planeLoopCooldown -= 1;

        if (planeLoopCooldown <= 0) {
            planeLooping = true;
            planeLoopAngle = 0;
        }
    }
}

/*
    도트로 그린 작은 모터 비행기(몸통+꼬리날개+주날개+프로펠러). 평소엔 그대로 그리지만,
    루프 중일 때는 planeLoopAngle을 기준으로 원을 그리며 이동시키고, 스프라이트 전체도
    같은 각도만큼 회전시켜서(dot 안에서 좌표를 회전 변환) 진짜로 한 바퀴 도는 것처럼 보이게 함.
*/
function drawPlane(colors) {
    var renderX = planeBaseX;
    var renderY = PLANE_Y;
    var rotation = 0;

    if (planeLooping) {
        renderX = planeBaseX + PLANE_LOOP_RADIUS * Math.sin(planeLoopAngle) * WAVE_BLOCK;
        renderY = PLANE_Y + PLANE_LOOP_RADIUS * (Math.cos(planeLoopAngle) - 1) * WAVE_BLOCK;
        rotation = planeLoopAngle;
    }

    function dot(colOffset, rowOffset, color) {
        var cos = Math.cos(rotation);
        var sin = Math.sin(rotation);
        var rotatedCol = colOffset * cos - rowOffset * sin;
        var rotatedRow = colOffset * sin + rowOffset * cos;
        var x = renderX + rotatedCol * WAVE_BLOCK - WAVE_BLOCK / 2 + WAVE_GAP / 2;
        var y = renderY + rotatedRow * WAVE_BLOCK - WAVE_BLOCK / 2 + WAVE_GAP / 2;
        waveCtx.fillStyle = color;
        waveCtx.fillRect(x, y, WAVE_BLOCK - WAVE_GAP, WAVE_BLOCK - WAVE_GAP);
    }

    /* 몸통 + 꼬리날개 */
    dot(-2, 0, colors.white);
    dot(-1, 0, colors.white);
    dot(0, 0, colors.white);
    dot(1, 0, colors.white);
    dot(-2, -1, colors.white);

    /* 위아래 주날개 */
    dot(0, -1, colors.white);
    dot(0, 1, colors.white);

    /* 프로펠러: skyPhase에 맞춰 위치를 번갈아 그려서 빙글빙글 도는 것처럼 보이게 함 */
    var propSpinning = Math.floor(skyPhase * 20) % 2 === 0;
    dot(2, propSpinning ? -1 : 1, colors.foam);
}

/* 뭉게구름 하나를 동그라미 4개를 겹쳐서 표현함 */
function drawCloud(cloud, color) {
    var cx = cloud.x;
    var cy = cloud.y;
    var s = cloud.scale;

    waveCtx.globalAlpha = 0.85;
    drawBlockyCircle(cx - 3 * s * WAVE_BLOCK, cy, 2 * s, color);
    drawBlockyCircle(cx - 1 * s * WAVE_BLOCK, cy - 1 * s * WAVE_BLOCK, 2.5 * s, color);
    drawBlockyCircle(cx + 2 * s * WAVE_BLOCK, cy, 2 * s, color);
    drawBlockyCircle(cx, cy + 1 * s * WAVE_BLOCK, 2.2 * s, color);
    waveCtx.globalAlpha = 1;
}

/* 구름을 화면 오른쪽으로 천천히 흘려보내다가, 화면 밖으로 나가면 왼쪽 밖에서 다시 등장시킴 (끝없이 흘러가는 느낌) */
function updateClouds() {
    for (var i = 0; i < clouds.length; i++) {
        clouds[i].x += clouds[i].speed;

        if (clouds[i].x - 120 > waveWidth) {
            clouds[i].x = -120;
        }
    }
}

function renderWave() {
    var colors = getWaveColors();

    waveCtx.clearRect(0, 0, waveWidth, waveHeight);

    updateClouds();
    for (var i = 0; i < clouds.length; i++) {
        drawCloud(clouds[i], colors.cloud);
    }
    drawSun(colors.sun);

    updatePlane();
    drawPlane(colors);

    /* 뒤쪽(연한색, 넓게) → 서퍼(맨 뒤 파도를 탐) → 중간 → 앞쪽(진한색, 파도 끝자락) 순으로 겹쳐 그려서
       서퍼가 중간/앞쪽 파도보다 먼 곳에 있는 것처럼 원근감을 줌 */
    drawWaveLayer(colors.back, WAVE_BAND_ROWS - 10, 2.2, wavePhase, 0.35);

    updateSurfer();
    drawSurfer(colors);

    drawWaveLayer(colors.mid, WAVE_BAND_ROWS - 6, 2.5, wavePhase * 1.25 + 1, 0.28);
    drawWaveLayer(colors.front, WAVE_BAND_ROWS - 3, 2.8, wavePhase * 1.5 + 2, 0.22);

    spawnBubble();
    drawBubbles(colors.foam);
}

function waveTick() {
    wavePhase += 0.02;
    skyPhase += 0.015;
    renderWave();

    if (!prefersReducedMotion) {
        requestAnimationFrame(waveTick);
    }
}

window.addEventListener("resize", function () {
    resizeWaveCanvas();
    renderWave();
});

resizeWaveCanvas();
waveTick();
