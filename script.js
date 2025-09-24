// Mario-style Survey Game (from scratch)
// - Fixed question panel at top-center of the canvas (does not move with Mario).
// - Answer boxes (1-5) are positioned on the ground, centered horizontally; user jumps onto them to select.
// - Open-ended (text) questions use an HTML modal prompt.
// - Selection occurs when Mario lands on a box or when user clicks a box.

// ---------- QUESTIONS ----------
const questions = [
  { section: "Leadership", text: "How would you rate the overall vision and strategic direction provided by XYZ’s leadership?", type: "scale", scale: 5 },
  { section: "Leadership", text: "To what extent do you feel XYZ’s leadership is aligned with your organization’s goals and priorities?", type: "scale", scale: 5 },
  { section: "Leadership", text: "Over the past year, what specific improvements or changes in XYZ’s leadership have you noticed?", type: "text" },
  { section: "Account Management", text: "How satisfied are you with the responsiveness and engagement of your account manager?", type: "scale", scale: 5 },
  { section: "Account Management", text: "What additional steps could your account manager take to improve responsiveness, engagement, or alignment with your organization?", type: "text" },
  { section: "Service Delivery", text: "How would you rate the overall quality of service delivery provided by XYZ?", type: "scale", scale: 5 },
  { section: "General Feedback", text: "What do you think XYZ is doing well?", type: "text" }
];

// ---------- CANVAS SETUP ----------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

// ---------- GAME ENTITIES ----------
const mario = { x: 64, y: H - 28 - 35, w: 28, h: 35, vy: 0, onGround: true, speed: 2.4, color: "#e74c3c" };
const goombas = [
  { x: 360, y: H - 28 - 18, w: 18, h: 18, dir: 1, spd: 1.12 },
  { x: 620, y: H - 28 - 18, w: 18, h: 18, dir: -1, spd: 1.0 }
];

// Answer blocks (rendered on ground centered) - will be recalculated per question
let answerBlocks = [];
const blockW = 46, blockH = 34, blockGap = 18;

// State
let currentQ = 0;
let answers = [];
let surveyDone = false;
let showingPrompt = false;
let lastSelectionTime = 0; // debounce time for auto-select on landing

// ---------- DOM elements for text prompt & results ----------
const openPrompt = document.getElementById('openPrompt');
const promptTitle = document.getElementById('promptTitle');
const promptInput = document.getElementById('promptInput');
const promptSubmit = document.getElementById('promptSubmit');
const thankYou = document.getElementById('thankYou');
const resultsOut = document.getElementById('resultsOut');

// ---------- INPUT ----------
const keys = {};
window.addEventListener('keydown', (e)=>{ keys[e.key] = true; });
window.addEventListener('keyup', (e)=>{ keys[e.key] = false; });

// Mouse click selection for blocks
canvas.addEventListener('mousedown', (e)=>{
  if (surveyDone || showingPrompt) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  for (let i = 0; i < answerBlocks.length; i++) {
    const b = answerBlocks[i];
    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
      selectScale(i + 1);
      return;
    }
  }
});

// ---------- HELPERS ----------
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function rectsCollide(a, b){ return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }
function now(){ return (new Date()).getTime(); }

// ---------- CALCULATE ANSWER BLOCKS (centered on ground) ----------
function layoutAnswerBlocks() {
  const q = questions[currentQ];
  if (!q || q.type !== "scale") {
    answerBlocks = [];
    return;
  }
  const n = q.scale || 5;
  const totalW = n*blockW + (n-1)*blockGap;
  const startX = Math.round(W/2 - totalW/2);
  const y = H - 28 - blockH; // sitting on ground
  answerBlocks = [];
  for (let i=0;i<n;i++){
    answerBlocks.push({ x: startX + i*(blockW+blockGap), y: y, w: blockW, h: blockH, val: i+1 });
  }
}

// ---------- SUBMISSION ----------
function selectScale(val) {
  // Debounce short period to avoid rapid double selects
  if (now() - lastSelectionTime < 450) return;
  lastSelectionTime = now();
  answers.push(val);
  advanceQuestion();
}

function advanceQuestion() {
  currentQ++;
  // small reposition of Mario for next question
  mario.x = clamp(mario.x + 36, 48, W - 64);
  mario.vy = 0;
  mario.onGround = true;
  if (currentQ >= questions.length) finishSurvey();
  else layoutAnswerBlocks();
}

// ---------- TEXT PROMPT ----------
function showTextPrompt(qText, callback) {
  showingPrompt = true;
  openPrompt.classList.remove('hidden');
  promptTitle.textContent = qText;
  promptInput.value = "";
  promptInput.focus();
  const submitHandler = () => {
    const v = promptInput.value.trim();
    if (!v) return;
    openPrompt.classList.add('hidden');
    showingPrompt = false;
    promptSubmit.removeEventListener('click', submitHandler);
    window.removeEventListener('keypress', onEnter);
    callback(v);
  };
  function onEnter(e){ if (e.key === "Enter") submitHandler(); }
  promptSubmit.addEventListener('click', submitHandler);
  window.addEventListener('keypress', onEnter);
}

// ---------- FINISH ----------
function finishSurvey() {
  surveyDone = true;
  // Show results
  let out = [];
  for (let i=0;i<questions.length;i++){
    const q = questions[i];
    const a = answers[i] === undefined ? "(no answer)" : answers[i];
    out.push(`${i+1}. [${q.section || 'General'}] ${q.text}\nAnswer: ${a}`);
  }
  resultsOut.textContent = out.join('\n\n');
  thankYou.classList.remove('hidden');
}

// ---------- GAME LOOP ----------
layoutAnswerBlocks();
function gameLoop(){
  // physics & input
  if (!surveyDone && !showingPrompt) {
    if (keys["ArrowLeft"] || keys["a"]) mario.x -= mario.speed;
    if (keys["ArrowRight"] || keys["d"]) mario.x += mario.speed;
    if ((keys["ArrowUp"] || keys["w"]) && mario.onGround) {
      mario.vy = -7.2;
      mario.onGround = false;
    }
    mario.x = clamp(mario.x, 6, W - mario.w - 6);
    mario.vy += 0.38; // gravity
    mario.y += mario.vy;
    if (mario.y + mario.h >= H - 28) {
      mario.y = H - 28 - mario.h;
      mario.vy = 0;
      // detect landing on an answer block -> auto-select if fully on top
      if (!mario.onGround) {
        // only treat as "landing" if we were falling
        for (let i=0;i<answerBlocks.length;i++){
          const b = answerBlocks[i];
          // check if standing vertically on block (feet overlap with block top) and horizontally overlapping enough
          const feetY = mario.y + mario.h;
          const standingOnTop = feetY >= b.y && feetY <= b.y + 8;
          const horizOverlap = (mario.x + mario.w*0.2) < (b.x + b.w) && (mario.x + mario.w*0.8) > b.x;
          if (standingOnTop && horizOverlap) {
            // auto-select value unless very recently selected
            selectScale(b.val);
            break;
          }
        }
      }
      mario.onGround = true;
    } else {
      mario.onGround = false;
    }

    // Goombas movement
    for (let g of goombas) {
      g.x += g.dir * g.spd;
      if (g.x <= 12 || g.x + g.w >= W - 12) g.dir *= -1;
      // collision resets Mario
      if (rectsCollide(mario, g)) {
        mario.x = 64; mario.y = H - 28 - mario.h; mario.vy = 0; mario.onGround = true;
      }
    }

    // If current question is text type, and Mario reaches some "trigger area" near center, open prompt.
    // (We won't force auto prompt — instead when you step anywhere you can read the top panel and the prompt shows automatically here.)
    const q = questions[currentQ];
    if (q && q.type === "text") {
      // Show text prompt once (on first contact with center area) - avoid repeatedly popping
      // Show prompt when Mario stands within center 40% of canvas
      const centerLeft = W * 0.3, centerRight = W * 0.7;
      if (mario.onGround && mario.x + mario.w/2 >= centerLeft && mario.x + mario.w/2 <= centerRight && !showingPrompt) {
        // Slight delay to let player read and then prompt
        setTimeout(()=>{
          if (!showingPrompt && !surveyDone && questions[currentQ] && questions[currentQ].type === "text") {
            showTextPrompt(questions[currentQ].text, (resp)=>{
              answers.push(resp);
              advanceQuestion();
            });
          }
        }, 160);
      }
    }
  }

  // ----- DRAW -----
  ctx.clearRect(0,0,W,H);

  // background sky gradient already in CSS canvas background; draw subtle clouds
  // (small decorative clouds)
  drawCloud(80, 70, 0.9);
  drawCloud(260, 48, 0.6);
  drawCloud(720, 84, 0.8);

  // ground
  ctx.fillStyle = "#4caf50";
  ctx.fillRect(0, H - 28, W, 28);

  // answer blocks (draw on ground, centered) - not tied to Mario
  for (let b of answerBlocks) {
    ctx.fillStyle = "#ffd35c";
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = "#b48c19";
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = "#1f1f1f";
    ctx.font = "18px Arial";
    ctx.fillText(String(b.val), b.x + b.w/2 - 6, b.y + b.h/2 + 6);
  }

  // goombas
  for (let g of goombas) {
    ctx.fillStyle = "#8d5524";
    ctx.beginPath();
    ctx.ellipse(g.x + g.w/2, g.y + g.h/2, g.w/2, g.h/2, 0, 0, Math.PI*2);
    ctx.fill();
    // eyes
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(g.x + g.w/2 - 4, g.y + g.h/2 - 6, 2.5, 0, Math.PI*2);
    ctx.arc(g.x + g.w/2 + 4, g.y + g.h/2 - 6, 2.5, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(g.x + g.w/2 - 4, g.y + g.h/2 - 6, 1.1, 0, Math.PI*2);
    ctx.arc(g.x + g.w/2 + 4, g.y + g.h/2 - 6, 1.1, 0, Math.PI*2);
    ctx.fill();
  }

  // mario
  ctx.save();
  ctx.translate(mario.x + mario.w/2, mario.y + mario.h/2);
  ctx.fillStyle = mario.color;
  ctx.fillRect(-mario.w/2, -mario.h/2, mario.w, mario.h);
  // face patch
  ctx.fillStyle = "#ffe5c1";
  ctx.fillRect(-mario.w/4, -mario.h/2 + 6, mario.w/2, mario.h/6);
  ctx.restore();

  // fixed question panel at top-center (does not move with Mario)
  if (!surveyDone) {
    drawQuestionPanel();
  }

  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// ---------- DRAWING UTILITIES ----------
function drawCloud(cx, cy, scale=1) {
  ctx.save();
  ctx.globalAlpha = 0.9 * scale;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(cx, cy, 32*scale, 20*scale, 0, 0, Math.PI*2);
  ctx.ellipse(cx+26*scale, cy+6*scale, 22*scale, 14*scale, 0, 0, Math.PI*2);
  ctx.ellipse(cx-26*scale, cy+6*scale, 22*scale, 14*scale, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawQuestionPanel() {
  const panelW = clamp(760, 320, W - 48);
  const panelH = 92;
  const px = Math.round((W - panelW) / 2);
  const py = 18;

  // background
  ctx.save();
  ctx.shadowColor = "#90caf9";
  ctx.shadowBlur = 12;
  ctx.globalAlpha = 0.97;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(px, py, panelW, panelH);
  ctx.restore();

  // border
  ctx.strokeStyle = "#1e88e5";
  ctx.lineWidth = 2.4;
  ctx.strokeRect(px, py, panelW, panelH);

  // question text
  ctx.fillStyle = "#0e3a57";
  ctx.font = "18px 'Segoe UI', Arial, sans-serif";
  const q = questions[currentQ];
  const text = q ? q.text : "No question";
  wrapText(ctx, text, px + 18, py + 30, panelW - 36, 22);

  // helper hint
  ctx.fillStyle = "#4a6b82";
  ctx.font = "13px Arial";
  ctx.fillText("Jump onto a number to select it (or click). For text responses, move into the center to type.", px + 18, py + panelH - 12);
}

// ---------- HELPERS ----------
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const test = line + words[n] + ' ';
    const metrics = ctx.measureText(test);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y);
}

// ---------- INIT ----------
layoutAnswerBlocks();

// Ensure answer blocks recalc when question changes (text questions clear blocks)
const originalAdvance = advanceQuestion;
advanceQuestion = function(){
  originalAdvance();
  layoutAnswerBlocks();
};

// Make sure prompt for text question works immediately on first display (if question starts as text)
if (questions.length > 0 && questions[0].type === "text") {
  // player can walk into center to trigger prompt; initial layout already done
}

// End of script
