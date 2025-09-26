// script.js - updates: improved end bouncing, balloons spread/colors, smiling Mario, eye movement on jump, admin link removed from end screen

// ---------- Configuration ----------
const SINGLE_SUBMIT = false; // set to true to re-enable "only once per browser" (uses localStorage)
const LOCAL_KEY = 'survey_completed_v1';
const LOCAL_RESPONSES_KEY = 'survey_responses';

// ---------- QUESTIONS ----------
const questions = [
  { section: "Leadership", text: "How would you rate the overall vision and strategic direction provided by DDIE’s leadership?", type: "scale", scale: 5 },
  { section: "Leadership", text: "To what extent do you feel DDIE’s leadership is aligned with your organization’s goals and priorities?", type: "scale", scale: 5 },
  { section: "Leadership", text: "Over the past year, what specific improvements or changes in DDIE’s leadership have you noticed?", type: "text" },
  { section: "Leadership", text: "Looking forward, what do DDIE’s leadership need to improve to support you better?", type: "text" },

  { section: "Account Management", text: "How satisfied are you with the responsiveness and engagement of your account manager?", type: "scale", scale: 5 },
  { section: "Account Management", text: "Has your account manager changed this year? If Yes, to what extent has this change affected your experience of DDIE (1 = Much Worse, 5 = Much Better)?", type: "scale", scale: 5 },
  { section: "Account Management", text: "To what extent do you feel your account manager is aligned with your organization’s goals and priorities?", type: "scale", scale: 5 },
  { section: "Account Management", text: "What additional steps could your account manager take to improve responsiveness, engagement, or alignment with your organization?", type: "text" },

  { section: "Service Delivery", text: "How would you rate the overall quality of service delivery provided by DDIE?", type: "scale", scale: 5 },
  { section: "Service Delivery", text: "How satisfied are you with DDIE’s response times to your requests or issues?", type: "scale", scale: 5 },
  { section: "Service Delivery", text: "How do you rate DDIE’s overall technical competency for the services provided to you?", type: "scale", scale: 5 },
  { section: "Service Delivery", text: "What improvements, if any, have you noticed in DDIE’s service delivery over the past year?", type: "text" },
  { section: "Service Delivery", text: "How can DDIE further improve future service delivery?", type: "text" },

  { section: "Credibility", text: "How would you rate DDIE’s credibility as a trusted partner?", type: "scale", scale: 5 },
  { section: "Credibility", text: "How engaged do you feel DDIE is in supporting your business goals and priorities?", type: "scale", scale: 5 },
  { section: "Credibility", text: "What additional steps could DDIE take to improve their credibility or engagement with your organization?", type: "text" },

  { section: "General", text: "What do you think DDIE is doing well?", type: "text" },
  { section: "General", text: "What areas do you think DDIE could improve?", type: "text" }
];

// ---------- Canvas & DOM ----------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

// Instructions overlay
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("startBtn");

startBtn.addEventListener("click", () => {
  overlay.style.display = "none";
  canvas.focus();  // immediately give control to game
  gameStarted = true;   // ✅ start game only now
});

const openPrompt = document.getElementById('openPrompt');
const promptTitle = document.getElementById('promptTitle');
const promptInput = document.getElementById('promptInput');
const promptSubmit = document.getElementById('promptSubmit');
const endScreen = document.getElementById('endScreen');

// ---------- Game entities ----------
const gravity = 0.38;
const mario = {
  x: 80, y: H - 28 - 36, w: 34, h: 36, vy: 0, onGround: true, speed: 2.4, color: '#e84c3d',
  bob: 0
,
  shocked: false,
  stars: []
};
// goombas
const goombas = [
  { x: 390, y: H - 28 - 20, w: 22, h: 20, dir: 1, spd: 1.06, bob: 0 },
  { x: 670, y: H - 28 - 20, w: 22, h: 20, dir: -1, spd: 0.96, bob: 0 }
];

// --- Sounds ---
const jumpSound = new Audio('sounds/jump.mp3');
const coinSound = new Audio('sounds/coin.mp3');
const hitSound  = new Audio('sounds/hit.mp3');
const winSound = new Audio('sounds/win.mp3');

// Default volume
jumpSound.volume = 0.5;
coinSound.volume = 0.5;
hitSound.volume  = 0.5;
winSound.volume = 0.5;

// --- Sound toggle ---
let soundEnabled = true;
const soundToggleBtn = document.getElementById("soundToggle");
soundToggleBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggleBtn.textContent = soundEnabled ? "🔊" : "🔇";
});
// --- Sounds ---

//// Function Declarations ////
// --- Moving clouds (slow drift) ---
let clouds = [];
function initClouds(){
  clouds = [];
  for(let i=0;i<8;i++){
    clouds.push({x: Math.random()*W, y: 30 + Math.random() * (H * 0.3), s: 0.6+Math.random()*0.9, speed: 0.03+Math.random()*0.08, t: Math.random()*Math.PI*2});
  }
}
initClouds();

// --- Pipes (random count each side) ---
let pipes = [];

function initPipes() {
  pipes = [];

  // left side pipes (1–3)
  const leftCount = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < leftCount; i++) {
    pipes.push({
      x: 40 + i * 60,            // stagger horizontally
      y: H - 28,
      h: 40 + Math.random() * 20, // reachable height
      r: 22,
      side: "left"
    });
  }
  
  // right side pipes (1–3)
  const rightCount = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < rightCount; i++) {
    pipes.push({
      x: W - 80 - i * 60,        // stagger inward
      y: H - 28,
      h: 40 + Math.random() * 20,
      r: 22,
      side: "right"
    });
  }
}

initPipes();

let answerBlocks = []; // suspended blocks
const blockW = 48, blockH = 34, blockGap = 18, blockAbove = 108;

let coinPops = [];
let fireworks = [];
let balloons = [];

// Fix Goombas until game is begun
let gameStarted = false;

let currentQ = 0;
let answers = [];
let surveyDone = false;
let showingPrompt = false;
let lastSelectionTime = 0;

// Back Button
let lastScaleQuestion = -1;

// end-screen celebration running flag & timers
let endCelebrationRunning = false;
let endJumpTimer = 0;
let endSpawnInterval = null;

// ---------- Input ----------
// const keys = {};
// window.addEventListener('keydown', (e) => { keys[e.key] = true; });
// window.addEventListener('keyup', (e) => { keys[e.key] = false; });

// ---------- Input (fixed) ----------
const keys = Object.create(null);
const BLOCKED = new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ']);

function isTypingTarget(el) {
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

window.addEventListener('keydown', (e) => {
  if (BLOCKED.has(e.key) && !isTypingTarget(e.target)) e.preventDefault(); // stop page scroll only when not typing
  if (!isTypingTarget(e.target)) keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
  if (BLOCKED.has(e.key) && !isTypingTarget(e.target)) e.preventDefault();
  keys[e.key] = false;
});

// clear any “stuck key” if focus is lost (alt-tab, click outside, overlay, etc.)
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

// make the canvas focusable and refocus on click (doesn’t interfere with your existing mousedown handler)
canvas.setAttribute('tabindex', '0');
canvas.addEventListener('mousedown', () => canvas.focus());

// Mouse click selection for blocks
canvas.addEventListener('mousedown', (e) => {
  if (surveyDone || showingPrompt) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  for (let i = 0; i < answerBlocks.length; i++) {
    const b = answerBlocks[i];
    const drawY = b.y + (b.shake ? Math.sin(b.shake) * 4 : 0);
    if (mx >= b.x && mx <= b.x + b.w && my >= drawY && my <= drawY + b.h) {
      strikeBlock(i);
      return;
    }
  }
});

// ---------- Helpers ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const now = () => new Date().getTime();
function rectsCollide(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

// ---------- Layout answer blocks (reversed numbering, adds smileys) ----------
function layoutAnswerBlocks() {
  const q = questions[currentQ];
  if (!q || q.type !== 'scale') { answerBlocks = []; return; }
  const n = q.scale || 5;
  const totalW = n * blockW + (n - 1) * blockGap;
  const startX = Math.round(W / 2 - totalW / 2);
  const y = H - 28 - blockAbove - blockH;
  answerBlocks = [];
  // reversed numbering left->right: highest -> lowest
  for (let i = 0; i < n; i++) {
    const val = n - i; // reversed
    const smile = val >= Math.ceil(n * 0.8) ? '😄' : (val >= Math.ceil(n * 0.5) ? '🙂' : '😐');
    answerBlocks.push({ x: startX + i * (blockW + blockGap), y: y, w: blockW, h: blockH, val: val, struck: false, shake: 0, smile });
  }
}

// ---------- Strike & selection ----------
function strikeBlock(index) {
  const b = answerBlocks[index];
  if (!b || b.struck) return;
  b.struck = true;
  // Play Sound
  if (soundEnabled) {
    coinSound.currentTime = 0;
    coinSound.play();
  }
  //
  b.shake = 10;
  coinPops.push({ x: b.x + b.w / 2, y: b.y - 6, vy: -3.6, life: 0, alpha: 1 });
  if (now() - lastSelectionTime < 350) return;
  lastSelectionTime = now();
  setTimeout(() => { selectScale(b.val); }, 380);
}
function selectScale(val) {
  answers.push(val);
  lastScaleQuestion = currentQ; // remember this question index for Back Button
  document.getElementById('backBtn').style.display = "inline-block"; //Show/Hide Back Button logic
  advanceQuestion();
}

// Back Button
function goBackOneQuestion() {
  if (lastScaleQuestion >= 0 && currentQ > 0) {
    // remove last answer
    answers.pop();
    currentQ = lastScaleQuestion;  // step back
    layoutAnswerBlocks();          // re-draw boxes

    // Reset Mario position
    mario.x = W/2 - mario.w/2;
    mario.y = H - 28 - mario.h;

    // hide back button until next answer
    document.getElementById('backBtn').style.display = "none";
    lastScaleQuestion = -1;
  }
}

function advanceQuestion() {
  currentQ++;
  // preserve mario.x (do not reset). keep inside bounds.
  mario.x = clamp(mario.x, 48, W - 72);
  mario.vy = 0; mario.onGround = true;
  if (currentQ >= questions.length) finishSurvey();
  else {
    layoutAnswerBlocks();
  }
}

// ---------- Text prompt ----------
function showTextPrompt(qText, callback) {
  showingPrompt = true;
  openPrompt.classList.remove('hidden');
  // place the prompt box below the question panel
  openPrompt.style.top = (document.querySelector("canvas").offsetTop + 140) + "px";

  promptTitle.textContent = qText;
  promptInput.value = "";
  promptInput.focus();
  const handler = () => {
    const v = promptInput.value.trim();
    if (!v) return;
    openPrompt.classList.add('hidden');
    showingPrompt = false;
    promptSubmit.removeEventListener('click', handler);
    window.removeEventListener('keypress', onEnter);
    callback(v);
  };
  function onEnter(e) { if (e.key === 'Enter') handler(); }
  promptSubmit.addEventListener('click', handler);
  window.addEventListener('keypress', onEnter);
  
  document.getElementById('backBtn').style.display = "none"; //Show/Hide logic for Back Button
}

// ---------- Server submission (anonymous) with local fallback ----------
async function submitAnonymizedResults(payload) {
  try {
    const resp = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) {
      console.warn('Submission failed', resp.status);
      storeLocalBackup(payload);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Submission error', e);
    storeLocalBackup(payload);
    return false;
  }
}

function storeLocalBackup(payload) {
  try {
    const raw = localStorage.getItem(LOCAL_RESPONSES_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push(payload);
    localStorage.setItem(LOCAL_RESPONSES_KEY, JSON.stringify(arr));
  } catch (e) { /* ignore */ }
}

// ---------- Finish: end screen + continuous celebration + mario excitement ----------
function finishSurvey() {
  surveyDone = true;
  if (SINGLE_SUBMIT) {
    try { localStorage.setItem(LOCAL_KEY, '1'); } catch (e) { /* ignore */ }
  }

  const payload = {
    timestamp: new Date().toISOString(),
    answers: answers.slice(),
    metadata: {
      ua: navigator.userAgent ? navigator.userAgent.split(')')[0] + ')' : '',
      screen: { w: window.screen.width, h: window.screen.height },
      clientTime: new Date().toISOString()
    }
  };

  // center Mario for celebration and ensure grounded
  mario.x = Math.round(W/2 - mario.w/2);
  mario.y = H - 28 - mario.h;
  mario.vy = 0;
  mario.onGround = true;

  // Play victory sound
  if (soundEnabled) {
    winSound.currentTime = 0;
    winSound.play();
  }

  // 👉 Disable sound toggle when survey ends
  const soundBtn = document.getElementById('soundToggle');
  if (soundBtn) {
    soundBtn.disabled = true;          // prevent clicks
    soundBtn.style.opacity = "0.5";    // fade visually
    soundBtn.style.cursor = "not-allowed";
    soundBtn.title = "Sound disabled after survey"; // update tooltip
  }
  
  submitAnonymizedResults(payload).then(success => {
    openPrompt.classList.add('hidden');
    endScreen.classList.remove('hidden');
    startEndCelebration();
  }).catch(() => {
    openPrompt.classList.add('hidden');
    endScreen.classList.remove('hidden');
    startEndCelebration();
  });
  document.getElementById('backBtn').style.display = "none"; //Show/Hide logic for Back Button
}

// ---------- Continuous Celebration (keeps spawning) ----------
function startEndCelebration() {
  if (endCelebrationRunning) return;
  endCelebrationRunning = true;
  spawnCelebration();
  endSpawnInterval = setInterval(() => {
    spawnCelebration(2, 6);
  }, 1400);
  endJumpTimer = 0;
}

function stopEndCelebration() {
  endCelebrationRunning = false;
  if (endSpawnInterval) { clearInterval(endSpawnInterval); endSpawnInterval = null; }
}

function spawnCelebration(balloonsCount = 8, fireworksCount = 10) {
  const colors = ['#ffd35c', '#64b5f6', '#ff8a65', '#aed581', '#e57373', '#ba68c8'];
  for (let i = 0; i < balloonsCount; i++) {
    balloons.push({
      x: Math.random() * W,
      y: H + 30 + Math.random() * 40,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -1 - Math.random() * 1.4,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0
    });
  }
  for (let i = 0; i < fireworksCount; i++) createFirework(80 + Math.random() * (W - 160), 80 + Math.random() * 140);
}

function createFirework(x, y) {
  const particles = [];
  const count = 16 + Math.round(Math.random() * 28);
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 1.6 + Math.random() * 2.4;
    particles.push({
      x, y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      life: 0,
      color: ['#ffd35c', '#64b5f6', '#ff8a65', '#b39ddb'][Math.floor(Math.random() * 4)]
    });
  }
  fireworks.push({ particles, age: 0 });
}

// ---------- Init & main loop ----------
layoutAnswerBlocks();

(function mainLoop() {
  if (SINGLE_SUBMIT && localStorage.getItem(LOCAL_KEY) === '1' && !surveyDone) {
    surveyDone = true;
    endScreen.classList.remove('hidden');
    document.querySelector('#endScreen .end-note').textContent = 'You have already completed this survey. Thank you.';
    startEndCelebration();
  }

  // update
  if (!surveyDone && !showingPrompt) {
    const prevY = mario.y;
    if (keys['ArrowLeft'] || keys['a']) mario.x -= mario.speed;
    if (keys['ArrowRight'] || keys['d']) mario.x += mario.speed;
    if ((keys['ArrowUp'] || keys['w']) && mario.onGround) {
      mario.vy = -7.6; 
      mario.onGround = false;
      // Play Sound
      if (soundEnabled) {
        jumpSound.currentTime = 0; // rewind if still playing
        jumpSound.play();
      }
      //
    }
    mario.x = clamp(mario.x, 6, W - mario.w - 6);
    mario.vy += gravity;
    mario.y += mario.vy;

    // head-strike detection
    if (mario.vy < 0) {
      for (let i = 0; i < answerBlocks.length; i++) {
        const b = answerBlocks[i];
        if (b.struck) continue;
        const blockBottom = b.y + b.h;
        if (prevY > blockBottom && mario.y <= blockBottom) {
          const leftOver = (mario.x + mario.w * 0.12) < (b.x + b.w);
          const rightOver = (mario.x + mario.w * 0.88) > b.x;
          if (leftOver && rightOver) {
            strikeBlock(i);
            break;
          }
        }
      }
    }

    if (mario.y + mario.h >= H - 28) {
      mario.y = H - 28 - mario.h; mario.vy = 0; mario.onGround = true;
    } else mario.onGround = false;

    // goombas motion & collision
    for (let g of goombas) {
      if (gameStarted) {
        g.x += g.dir * g.spd;
        if (g.x <= 12 || g.x + g.w >= W - 12) g.dir *= -1;
        g.bob += 0.04;
      }
        if (rectsCollide(mario, g) && !mario.shocked) {
          mario.shocked = true;
          // Play Sound
          if (soundEnabled) {
            hitSound.currentTime = 0;
            hitSound.play();
        }
        //
        // recoil
        mario.x += (mario.x < g.x) ? -20 : 20;
        mario.vy = -5.2;
        // spawn twinkling stars
        for (let i = 0; i < 6; i++) {
          mario.stars.push({ x: mario.x + mario.w/2, y: mario.y - 10, dx: (Math.random()-0.5)*2.2, dy: -2 - Math.random()*2.2, life: 36, angle: Math.random()*Math.PI*2 });
        }
        setTimeout(() => { mario.shocked = false; }, 500);
      }
    }

    // text question auto-prompt
    const q = questions[currentQ];
    if (q && q.type === 'text') {
      const centerLeft = W * 0.32, centerRight = W * 0.68;
      if (mario.onGround && (mario.x + mario.w / 2) >= centerLeft && (mario.x + mario.w / 2) <= centerRight && !showingPrompt) {
        // setTimeout(() => {
        //   if (!showingPrompt && !surveyDone && questions[currentQ] && questions[currentQ].type === 'text') {
        //     showTextPrompt(questions[currentQ].text, (resp) => { answers.push(resp); advanceQuestion(); });
        //   }
        // }, 220);
        if (!showingPrompt && !surveyDone && questions[currentQ] && questions[currentQ].type === 'text') {
          showTextPrompt(questions[currentQ].text, (resp) => { 
            answers.push(resp); 
            advanceQuestion(); 
          });
        }
      }
    }
  }

  // End-screen behavior: excited Mario jumps repeatedly while celebration running
  if (surveyDone && endCelebrationRunning) {
    endJumpTimer++;
    // stronger and more frequent impulse
    if (endJumpTimer % 28 === 0 && mario.onGround) {
      mario.vy = -6.2;
      mario.onGround = false;
    }
    // small horizontal bob while celebrating
    mario.x += Math.sin(endJumpTimer * 0.08) * 0.8;
    mario.x = clamp(mario.x, 10, W - mario.w - 10);
  }

  // update coin pops and shakes
  for (let i = coinPops.length - 1; i >= 0; i--) {
    const c = coinPops[i]; c.y += c.vy; c.vy += 0.12; c.life++; c.alpha = Math.max(0, 1 - c.life / 38);
    if (c.life > 42) coinPops.splice(i, 1);
  }
  for (const b of answerBlocks) if (b.shake > 0) b.shake--;

  // update clouds (slow drift)
  for(const c of clouds){ c.x += c.speed; c.t += 0.01; if(c.x-80>W){ c.x=-80; c.y=30+Math.random()*120; } }

  // update fireworks & balloons
  for (let i = fireworks.length - 1; i >= 0; i--) {
    const fw = fireworks[i];
    fw.age++;
    for (const p of fw.particles) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.life++;
    }
    if (fw.age > 140) fireworks.splice(i, 1);
  }
  for (let i = balloons.length - 1; i >= 0; i--) {
    const bl = balloons[i]; bl.x += bl.vx; bl.y += bl.vy; bl.vy -= 0.008; bl.life++;
    if (bl.y < -80) balloons.splice(i, 1);
  }

  // draw
  ctx.clearRect(0, 0, W, H);

  // sky background
  ctx.fillStyle = '#dff6ff'; ctx.fillRect(0, 0, W, H * 0.45);

  // dynamic clouds
  for(const c of clouds) drawCloud(c.x, c.y + Math.sin(c.t)*2, c.s);

  // decorative clouds
  drawCloud(90, 64, 0.9); drawCloud(260, 48, 0.6); drawCloud(720, 84, 0.8);

  // ground
  ctx.fillStyle = '#3fa34a'; ctx.fillRect(0, H - 28, W, 28);
  
  for (const p of pipes) {
    const px = p.x, py = p.y;
  
    ctx.fillStyle = "#2ecc71"; // body
    ctx.fillRect(px, py - p.h, p.r*2, p.h);
  
    ctx.fillStyle = "#27ae60"; // cap
    ctx.fillRect(px - 4, py - p.h - 14, p.r*2 + 8, 14);
  
    ctx.strokeStyle = "#145a32"; // outline
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py - p.h, p.r*2, p.h);
    ctx.strokeRect(px - 4, py - p.h - 14, p.r*2 + 8, 14);
  }
  
  // draw suspended answer blocks
  for (const b of answerBlocks) {
    const shakeOffset = b.shake > 0 ? Math.sin(b.shake * 0.8) * 4 : 0;
    const drawY = b.y + shakeOffset;
    ctx.fillStyle = b.struck ? '#ddd' : '#ffd35c';
    roundRect(ctx, b.x, drawY, b.w, b.h, 6, true, false);
    ctx.strokeStyle = '#b48c19'; ctx.lineWidth = 2; ctx.strokeRect(b.x, drawY, b.w, b.h);
    // number and smiley
    ctx.fillStyle = '#222';
    ctx.font = '16px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(String(b.val), b.x + b.w / 2 - 10, drawY + b.h / 2 + 6);
    ctx.font = '16px serif';
    ctx.fillText(b.smile, b.x + b.w / 2 + 12, drawY + b.h / 2 + 6);
    ctx.textAlign = 'start';
  }

  // draw coin pops
  for (const c of coinPops) {
    ctx.save(); ctx.globalAlpha = c.alpha;
    ctx.fillStyle = '#ffd24d'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 7.5, 7.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c28a00'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }

  // draw cute obstacles (v9 style)
  for (const g of goombas) {
    const bob = Math.sin(g.bob) * 2;
    const gx = g.x, gy = g.y + bob;
    ctx.fillStyle = "#8d5524";
    ctx.beginPath();
    ctx.ellipse(gx + g.w/2, gy + g.h/2, g.w/2, g.h/2, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(gx + g.w/2 - 4, gy + g.h/2 - 6, 2.5, 0, Math.PI*2);
    ctx.arc(gx + g.w/2 + 4, gy + g.h/2 - 6, 2.5, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(gx + g.w/2 - 4, gy + g.h/2 - 6, 1.1, 0, Math.PI*2);
    ctx.arc(gx + g.w/2 + 4, gy + g.h/2 - 6, 1.1, 0, Math.PI*2);
    ctx.fill();
  }

  // stars (if any)
  updateStars();
  drawStars();

  // mario (v9-style, shows smile when end, eyes move with jump)
  drawPlayer(mario.x, mario.y, mario.w, mario.h);

  // top fixed question panel
  if (!surveyDone) drawQuestionPanel();

  // fireworks & balloons draw
  for (const fw of fireworks) {
    for (const p of fw.particles) {
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - p.life / 80); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }
  for (const bl of balloons) {
    ctx.save();
    ctx.fillStyle = bl.color; ctx.beginPath(); ctx.ellipse(bl.x, bl.y, 14, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff22'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bl.x, bl.y + 18);
    ctx.lineTo(bl.x, bl.y + 34);
    ctx.strokeStyle = '#a7c9d8'; ctx.stroke();
    ctx.restore();
  }

  requestAnimationFrame(mainLoop);
})();

// ---------- Drawing helpers ----------
function drawCloud(cx, cy, s = 1) {
  ctx.save(); ctx.globalAlpha = 0.95 * s; ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(cx, cy, 32 * s, 20 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 26 * s, cy + 6 * s, 22 * s, 14 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(cx - 26 * s, cy + 6 * s, 22 * s, 14 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  if (typeof r === 'undefined') r = 5;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}


// --- Stars helpers (ouch effect) ---
function updateStars(){
  mario.stars.forEach(s=>{ s.x+=s.dx; s.y+=s.dy; s.dy+=0.1; s.life--; s.angle+=0.22; });
  mario.stars = mario.stars.filter(s=>s.life>0);
}
function drawStars(){
  mario.stars.forEach(s=>{
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle);
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    for(let i=0;i<5;i++){ const ang=i*(Math.PI*2/5); const r1=5, r2=2.2;
      ctx.lineTo(Math.cos(ang)*r1, Math.sin(ang)*r1);
      ctx.lineTo(Math.cos(ang+Math.PI/5)*r2, Math.sin(ang+Math.PI/5)*r2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
}
// mario drawing (v9 style): small smile throughout, bigger laugh at end; eyes track upward while jumping

function drawPlayer(x, y, w, h) {
  ctx.save();
  // body
  ctx.fillStyle = '#e84c3d';
  roundRect(ctx, x, y, w, h, 6, true, false);
  // hat/shoulder patch
  ctx.fillStyle = '#bd2e2e';
  ctx.fillRect(x, y, w, Math.round(h * 0.18));
  // face patch
  ctx.fillStyle = '#ffe6cf';
  ctx.fillRect(x + w * 0.18, y + 8, w * 0.64, 8);

  if (mario.shocked) {
    // 😲 Shocked eyes: big whites + tiny pupils
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(x + w*0.36, y + h*0.42, 4, 5, 0, 0, Math.PI*2);
    ctx.ellipse(x + w*0.64, y + h*0.42, 4, 5, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(x + w*0.36, y + h*0.42, 1.2, 0, Math.PI*2);
    ctx.arc(x + w*0.64, y + h*0.42, 1.2, 0, Math.PI*2);
    ctx.fill();
    // O mouth
    ctx.fillStyle = '#b33';
    ctx.beginPath();
    ctx.arc(x + w*0.5, y + h*0.70, 5, 0, Math.PI*2);
    ctx.fill();
  } else {
    // 👀 Eyes: follow movement horizontally + diagonal shift on jump/fall
    let vx = 0;
    if (keys['ArrowLeft'] || keys['a']) vx = -1;
    if (keys['ArrowRight'] || keys['d']) vx = 1;
    const eyeBaseY = y + h * 0.42;
    const eyeYOffset = clamp(-mario.vy * 0.35, -6, 6);
    const eyeXOffset = clamp(vx * 4, -4, 4);
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(x + w * 0.36 + eyeXOffset, eyeBaseY + eyeYOffset, 2.5, 0, Math.PI * 2);
    ctx.arc(x + w * 0.64 + eyeXOffset, eyeBaseY + eyeYOffset, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 😀 Mouth: small smile during survey, big laugh at end
    if (surveyDone) {
      ctx.strokeStyle = '#3b2a1a'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + w*0.5, y + h*0.66, 11, 0.15, Math.PI - 0.15);
      ctx.stroke();
      ctx.fillStyle = '#b33';
      ctx.beginPath();
      // ctx.ellipse(x + w*0.5, y + h*0.72, 9, 6, 0, 0, Math.PI*2);
      ctx.fill();
      
      // // 😊 Curved eyes
      // ctx.strokeStyle = "#222";
      // ctx.lineWidth = 2;
        
      // // left eye (curved arc)
      // ctx.beginPath();
      // ctx.arc(x + w * 0.36, y + h * 0.42, 4, 0.1 * Math.PI, 0.9 * Math.PI);
      // ctx.stroke();
        
      // // right eye (curved arc)
      // ctx.beginPath();
      // ctx.arc(x + w * 0.64, y + h * 0.42, 4, 0.1 * Math.PI, 0.9 * Math.PI);
      // ctx.stroke();
       
      // // 😀 Big smiling mouth
      // ctx.strokeStyle = "#3b2a1a";
      // ctx.lineWidth = 2.5;
      // ctx.beginPath();
      // ctx.arc(x + w * 0.5, y + h * 0.66, 12, 0.15 * Math.PI, 0.85 * Math.PI);
      // ctx.stroke();
      
    } else {
      ctx.strokeStyle = '#3b2a1a'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x + w*0.5, y + h*0.64, 4, 0.15, Math.PI - 0.15);
      ctx.stroke();
    }
  }

  ctx.restore();
}

// drawQuestionPanel (fixed top)
function drawQuestionPanel() {
  const panelW = clamp(820, 320, W - 48);
  const panelH = 92;
  const px = Math.round((W - panelW) / 2);
  const py = 14;
  ctx.save();
  ctx.shadowColor = '#90caf9'; ctx.shadowBlur = 10; ctx.globalAlpha = 0.98;
  ctx.fillStyle = '#fff'; ctx.fillRect(px, py, panelW, panelH);
  ctx.restore();
  ctx.strokeStyle = '#1e88e5'; ctx.lineWidth = 2.4; ctx.strokeRect(px, py, panelW, panelH);
  ctx.fillStyle = '#0e3a57'; ctx.font = "18px Inter, 'Segoe UI', Arial";
  const q = questions[currentQ];
  const text = q ? q.text : "No question";
  wrapText(ctx, text, px + 18, py + 34, panelW - 36, 22);
  ctx.fillStyle = '#4a6b82'; ctx.font = '13px Arial';
  const hint = q && q.type === 'scale' ? "Jump up and strike a numbered box from below (or click a box)." : "Move to the center to type your response when prompted.";
  ctx.fillText(hint, px + 18, py + panelH - 12);
}
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' '); let line = '';
  for (let n = 0; n < words.length; n++) {
    const test = line + words[n] + ' '; const m = ctx.measureText(test);
    if (m.width > maxWidth && n > 0) { ctx.fillText(line, x, y); line = words[n] + ' '; y += lineHeight; } else line = test;
  }
  ctx.fillText(line, x, y);
}

// Wiring Back Button
document.getElementById('backBtn').addEventListener('click', goBackOneQuestion);

// ---------- Ensure answerBlocks recalculated on question change ----------
const originalAdvance = advanceQuestion;
advanceQuestion = function () {
  originalAdvance();
  layoutAnswerBlocks();
};
