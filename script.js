// === Survey Questions ===
const questions = [
  { section: "Leadership", text: "How would you rate leadership’s vision?", type: "scale", scaleMin: 1, scaleMax: 5 },
  { section: "Leadership", text: "To what extent is leadership aligned with your goals?", type: "scale", scaleMin: 1, scaleMax: 5 },
  { section: "Leadership", text: "Over the past year, what improvements have you noticed?", type: "text" },
  { section: "Account Mgmt", text: "How satisfied are you with your account manager?", type: "scale", scaleMin: 1, scaleMax: 5 },
  { section: "Service Delivery", text: "How would you rate service delivery quality?", type: "scale", scaleMin: 1, scaleMax: 5 },
  { section: "General Feedback", text: "What do you think XYZ is doing well?", type: "text" }
];

// === Canvas ===
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// === Load Sprites ===
const bg = new Image(); bg.src = "bg.png";
const marioSheet = new Image(); marioSheet.src = "mario_spritesheet.png";
const goombaSheet = new Image(); goombaSheet.src = "goomba_spritesheet.png";
const coinSheet = new Image(); coinSheet.src = "coin_spritesheet.png";

// === Mario ===
const mario = {
  x: 60, y: canvas.height - 100,
  w: 48, h: 48,
  vy: 0, onGround: true, speed: 3,
  anim: "idle", frameX: 0, frameY: 0, frameCount: 0
};
const marioAnims = {
  idle: { row: 0, frames: 4 },
  walk: { row: 1, frames: 6 },
  jump: { row: 2, frames: 2 }
};

// === Goombas ===
let goombas = [
  { x: 400, y: canvas.height - 60, w: 40, h: 40, dir: 1, spd: 1.2, frameX: 0, frameCount: 0 }
];
const goombaAnim = { row: 0, frames: 2 };

// === Coins / Score ===
let coins = [];
let score = 0;
const coinAnim = { row: 0, frames: 4 };
let coinFrame = 0, coinFrameCount = 0;

// === Survey State ===
let currentQ = 0;
let surveyAnswers = [];
let surveyDone = false;
let showingPrompt = false;
let showingAnswers = false;

let keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// === Background ===
let bgOffset = 0;
function drawBackground() {
  bgOffset = -mario.x * 0.3;
  const scale = canvas.height / bg.height;
  const drawW = bg.width * scale;
  const drawH = canvas.height;

  // Tile across width
  let startX = bgOffset % drawW;
  if (startX > 0) startX -= drawW;
  for (let x = startX; x < canvas.width; x += drawW) {
    ctx.drawImage(bg, x, 0, drawW, drawH);
  }
}

// === Mario Animation ===
function updateMarioAnim() {
  if (!mario.onGround) mario.anim = "jump";
  else if (keys["ArrowLeft"] || keys["ArrowRight"] || keys["a"] || keys["d"])
    mario.anim = "walk";
  else mario.anim = "idle";

  let anim = marioAnims[mario.anim];
  mario.frameCount++;
  if (mario.frameCount > 8) {
    mario.frameCount = 0;
    mario.frameX = (mario.frameX + 1) % anim.frames;
  }
  mario.frameY = anim.row;
}
function drawMario() {
  ctx.drawImage(
    marioSheet,
    mario.frameX * mario.w, mario.frameY * mario.h,
    mario.w, mario.h,
    mario.x, mario.y, mario.w, mario.h
  );
}

// === Goomba Animation ===
function updateGoombas() {
  for (let g of goombas) {
    g.x += g.dir * g.spd;
    if (g.x <= 0 || g.x + g.w >= canvas.width) g.dir *= -1;

    g.frameCount++;
    if (g.frameCount > 20) {
      g.frameCount = 0;
      g.frameX = (g.frameX + 1) % goombaAnim.frames;
    }
  }
}
function drawGoombas() {
  for (let g of goombas) {
    ctx.drawImage(
      goombaSheet,
      g.frameX * g.w, 0,
      g.w, g.h,
      g.x, g.y, g.w, g.h
    );
  }
}

// === Coins ===
function spawnCoin(x, y) {
  coins.push({ x, y, w: 32, h: 32, collected: false });
}
function updateCoins() {
  coinFrameCount++;
  if (coinFrameCount > 10) {
    coinFrameCount = 0;
    coinFrame = (coinFrame + 1) % coinAnim.frames;
  }
}
function drawCoins() {
  for (let c of coins) {
    if (!c.collected) {
      ctx.drawImage(
        coinSheet,
        coinFrame * c.w, 0,
        c.w, c.h,
        c.x, c.y, c.w, c.h
      );
    }
  }
}

// === Game Loop ===
function gameLoop() {
  if (!surveyDone && !showingPrompt) {
    // Mario movement
    if (keys["ArrowLeft"] || keys["a"]) mario.x -= mario.speed;
    if (keys["ArrowRight"] || keys["d"]) mario.x += mario.speed;
    if ((keys["ArrowUp"] || keys["w"]) && mario.onGround) {
      mario.vy = -9;
      mario.onGround = false;
    }

    mario.x = Math.max(0, Math.min(canvas.width - mario.w, mario.x));
    mario.vy += 0.5;
    mario.y += mario.vy;
    if (mario.y + mario.h >= canvas.height - 40) {
      mario.y = canvas.height - 40 - mario.h;
      mario.vy = 0;
      mario.onGround = true;
    }
  }

  updateMarioAnim();
  updateGoombas();
  updateCoins();

  // Draw everything
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  ctx.fillStyle = "#6a4";
  ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

  drawMario();
  drawGoombas();
  drawCoins();

  // HUD
  ctx.fillStyle = "#fff";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 20, 30);

  // Show current question
  if (!surveyDone && !showingPrompt) {
    ctx.fillStyle = "#fff";
    ctx.font = "22px Arial";
    ctx.fillText(questions[currentQ].text, 60, 80);

    if (questions[currentQ].type === "scale") {
      let count = questions[currentQ].scaleMax - questions[currentQ].scaleMin + 1;
      for (let i = 0; i < count; i++) {
        let x = 100 + i * 80, y = 120;
        ctx.fillStyle = "#f5c542";
        ctx.fillRect(x, y, 60, 40);
        ctx.strokeRect(x, y, 60, 40);
        ctx.fillStyle = "#000";
        ctx.fillText(i + 1, x + 20, y + 25);

        if (mario.x < x + 60 && mario.x + mario.w > x && mario.y < y + 40 && mario.y + mario.h > y) {
          ctx.strokeStyle = "#f00";
          ctx.lineWidth = 3;
          ctx.strokeRect(x - 2, y - 2, 64, 44);
          if (keys[" "]) submitAnswer(i + 1, x, y - 40);
        }
      }
    } else if (questions[currentQ].type === "text") {
      showPrompt(questions[currentQ].text, (resp) => {
        surveyAnswers.push(resp);
        score += 10;
        currentQ++;
        if (currentQ >= questions.length) finishSurvey();
      });
    }
  }

  requestAnimationFrame(gameLoop);
}

// === Submit Answer ===
function submitAnswer(val, coinX, coinY) {
  surveyAnswers.push(val);
  score += 10;
  spawnCoin(coinX, coinY);
  currentQ++;
  if (currentQ >= questions.length) finishSurvey();
  else {
    mario.x = 60; 
    mario.y = canvas.height - 100;
  }
}

// === Prompt for Text ===
function showPrompt(text, cb) {
  showingPrompt = true;
  const gp = document.getElementById("gamePrompt");
  gp.classList.remove("hidden");
  document.getElementById("promptText").textContent = text;
  document.getElementById("promptInput").value = "";
  document.getElementById("promptInput").focus();
  document.getElementById("promptBtn").onclick = function() {
    let resp = document.getElementById("promptInput").value.trim();
    if (!resp) return;
    gp.classList.add("hidden");
    showingPrompt = false;
    cb(resp);
  };
}

// === Finish Survey ===
function finishSurvey() {
  surveyDone = true;
  document.getElementById("thankyou").classList.remove("hidden");
  document.getElementById("answers").textContent = questions.map((q,i)=>
    `${i+1}. [${q.section}] ${q.text}\nResponse: ${surveyAnswers[i]}\n`
  ).join("\n") + `\nFinal Score: ${score}`;
  showingAnswers = true;
}

// === Start only when background is loaded ===
bg.onload = () => {
  requestAnimationFrame(gameLoop);
};

function gameLoop() {
    // ...[physics & movement code as before]...

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Draw ground
    ctx.fillStyle = "#6ab04c";
    ctx.fillRect(0, HEIGHT-28, WIDTH, 28);

    // Draw Mario (small)
    ctx.save();
    ctx.translate(mario.x + mario.w/2, mario.y + mario.h/2);
    ctx.fillStyle = mario.color;
    ctx.fillRect(-mario.w/2, -mario.h/2, mario.w, mario.h);
    ctx.fillStyle = "#fff";
    ctx.fillRect(-mario.w/4, -mario.h/2+5, mario.w/2, mario.h/6);
    ctx.restore();

    // Draw Goombas (small)
    for(let g of goombas) {
        ctx.fillStyle = "#a52a2a";
        ctx.beginPath();
        ctx.ellipse(g.x+g.w/2, g.y+g.h-4, 9, 8, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(g.x+g.w/2-4, g.y+g.h-9, 2.6, 0, Math.PI*2);
        ctx.arc(g.x+g.w/2+4, g.y+g.h-9, 2.6, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(g.x+g.w/2-4, g.y+g.h-9, 1.1, 0, Math.PI*2);
        ctx.arc(g.x+g.w/2+4, g.y+g.h-9, 1.1, 0, Math.PI*2);
        ctx.fill();
    }

    // === Draw the survey panel above Mario ===
    if (!surveyDone && !showingPrompt && !showingAnswers) {
        // Panel position: center horizontally above Mario, clamp to canvas bounds
        let panelWidth = 360, panelHeight = 100;
        let panelX = Math.max(10, Math.min(mario.x + mario.w/2 - panelWidth/2, WIDTH - panelWidth - 10));
        let panelY = Math.max(20, mario.y - panelHeight - 18);

        // Draw panel
        ctx.save();
        ctx.shadowColor = "#64a9f3";
        ctx.shadowBlur = 12;
        ctx.globalAlpha = 0.97;
        ctx.fillStyle = "#fff";
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        ctx.restore();
        ctx.strokeStyle = "#64a9f3";
        ctx.lineWidth = 3;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        // Draw question text
        ctx.fillStyle = "#21507c";
        ctx.font = "19px 'Segoe UI', Arial, sans-serif";
        wrapText(ctx, questions[currentQ].text, panelX+18, panelY+32, panelWidth-36, 23);

        // Draw answer blocks for scale questions
        if (questions[currentQ].type === "scale") {
            let q = questions[currentQ];
            let count = q.scaleMax - q.scaleMin + 1;
            let totalW = count*40 + (count-1)*18;
            let startX = panelX + panelWidth/2 - totalW/2;
            let y = panelY + 58;
            for(let i=0; i<count; ++i) {
                let bx = startX + i*58, bw = 40, bh = 32;
                ctx.fillStyle = "#ffd35c";
                ctx.strokeStyle = "#b48c19";
                ctx.lineWidth = 2;
                ctx.fillRect(bx, y, bw, bh);
                ctx.strokeRect(bx, y, bw, bh);
                ctx.fillStyle = "#444";
                ctx.font = "18px Arial";
                ctx.fillText(""+(i+q.scaleMin), bx+14, y+22);

                // Label (optional)
                if (q.scaleLabels[i]) {
                    ctx.font = "11px Arial";
                    ctx.fillStyle = "#888";
                    ctx.fillText(q.scaleLabels[i], bx-8, y-7);
                }

                // Highlight if Mario is on this answer block
                if (
                    mario.y+mario.h > y && mario.y < y+bh &&
                    mario.x+mario.w > bx && mario.x < bx+bw
                ) {
                    ctx.strokeStyle = "#21507c";
                    ctx.lineWidth = 3;
                    ctx.strokeRect(bx-2, y-2, bw+4, bh+4);
                    if (mario.onGround && keys[" "]) {
                        submitScaleAnswer(i+q.scaleMin);
                    }
                }
            }
        }
    }

    requestAnimationFrame(gameLoop);
}
