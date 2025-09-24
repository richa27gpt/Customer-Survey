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

// === Sprites ===
const bg = new Image(); bg.src = "bg.png";       // background
const marioImg = new Image(); marioImg.src = "mario.png";
const goombaImg = new Image(); goombaImg.src = "goomba.png";

// === Mario ===
const mario = { x: 60, y: canvas.height - 100, w: 40, h: 50, vy: 0, onGround: true, speed: 3 };

// === Goombas ===
let goombas = [{ x: 400, y: canvas.height - 60, w: 40, h: 40, dir: 1, spd: 1.2 }];

// === Survey ===
let currentQ = 0;
let surveyAnswers = [];
let surveyDone = false;
let showingPrompt = false;
let showingAnswers = false;

let keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// === Background Scroll ===
let bgOffset = 0;
function drawBackground() {
  bgOffset = -mario.x * 0.3;
  const bgW = canvas.width, bgH = canvas.height;
  ctx.drawImage(bg, bgOffset % bgW, 0, bgW, bgH);
  ctx.drawImage(bg, (bgOffset % bgW) + bgW, 0, bgW, bgH);
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

  // === Draw ===
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  // Ground
  ctx.fillStyle = "#6a4";
  ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

  // Mario
  ctx.drawImage(marioImg, mario.x, mario.y, mario.w, mario.h);

  // Goombas
  for (let g of goombas) ctx.drawImage(goombaImg, g.x, g.y, g.w, g.h);

  // Current Question
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
          if (keys[" "]) submitAnswer(i + 1);
        }
      }
    } else if (questions[currentQ].type === "text") {
      showPrompt(questions[currentQ].text, (resp) => {
        surveyAnswers.push(resp);
        currentQ++;
        if (currentQ >= questions.length) finishSurvey();
      });
    }
  }

  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// === Submit Answer ===
function submitAnswer(val) {
  surveyAnswers.push(val);
  currentQ++;
  if (currentQ >= questions.length) finishSurvey();
  else {
    mario.x = 60; 
    mario.y = canvas.height - 100;
  }
}

// === Prompt for text ===
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
  ).join("\n");
  showingAnswers = true;
}
