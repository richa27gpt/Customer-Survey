// script.js - v8: Back button always appears when previous was box-based (except end screen), logic centralized

// ---------- Configuration ----------
const SINGLE_SUBMIT = false;
const LOCAL_KEY = 'survey_completed_v1';
const LOCAL_RESPONSES_KEY = 'survey_responses';

// ---------- GOOGLE FORM ENTRY MAPPING (Update this if your form changes) ----------
const entryMapping = [
  "entry.1724442667", // How would you rate the overall vision...
  "entry.146502797",  // To what extent do you feel DDIE’s leadership...
  "entry.1540181907", // Over the past year...
  "entry.219406629",  // Looking forward, what do DDIE’s leadership...
  "entry.4555481",    // How satisfied are you with the responsiveness...
  "entry.567046895",  // Has your account manager changed this year...
  "entry.498095553",  // To what extent do you feel your account manager...
  "entry.1238333287", // What additional steps could your account manager...
  "entry.1098735143", // How would you rate the overall quality...
  "entry.333588296",  // How satisfied are you with DDIE’s response times...
  "entry.122617014",  // How do you rate DDIE’s overall technical competency...
  "entry.1111852999", // What improvements, if any, have you noticed...
  "entry.795879044",  // How can DDIE further improve...
  "entry.702624036",  // How would you rate DDIE’s credibility...
  "entry.109116447",  // How engaged do you feel DDIE is...
  "entry.731035627",  // What additional steps could DDIE take...
  "entry.1222441451", // What do you think DDIE is doing well?
  "entry.2000623643", // What areas do you think DDIE could improve?
];
  
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
  canvas.focus();
  gameStarted = true;
});

const openPrompt = document.getElementById('openPrompt');
const promptTitle = document.getElementById('promptTitle');
const promptInput = document.getElementById('promptInput');
const promptSubmit = document.getElementById('promptSubmit');
const endScreen = document.getElementById('endScreen');
const backBtn = document.getElementById('backBtn'); // <-- get back button

// ---------- Game entities ----------
const gravity = 0.38;
const mario = {
  x: 160, y: H - 28 - 36, w: 34, h: 36, vy: 0, onGround: true, speed: 2.4, color: '#e84c3d',
  bob: 0,
  shocked: false,
  stars: []
};

// Wooden box for Mario to rest (fancy, Angry Birds style, center-left)
const box = {
  x: 160,
  y: H - 28 - 48,
  w: 62,
  h: 48
};

// Goombas (with random movement)
const goombas = [
  { x: 390, y: H - 28 - 20, w: 22, h: 20, dir: 1, spd: 1.06, bob: 0, lastChange: 0 },
  { x: 670, y: H - 28 - 20, w: 22, h: 20, dir: -1, spd: 0.96, bob: 0, lastChange: 0 }
];

// --- Trees setup (cartoon, left of screen and box) ---
const trees = [
  { x: 38, trunkW: 16, trunkH: 42, foliageR: 36, c: "#88b04b" },
  { x: 85, trunkW: 14, trunkH: 34, foliageR: 26, c: "#77a042" },
  { x: 120, trunkW: 12, trunkH: 27, foliageR: 19, c: "#a5cc6b" },
  { x: 62, trunkW: 12, trunkH: 21, foliageR: 14, c: "#b2e067" },
  { x: 110, trunkW: 9, trunkH: 16, foliageR: 8, c: "#d7f6b5" }
];

// --- Sounds ---
const jumpSound = new Audio('sounds/jump.mp3');
const coinSound = new Audio('sounds/coin.mp3');
const hitSound  = new Audio('sounds/hit.mp3');
const winSound = new Audio('sounds/win.mp3');
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

// --- Moving clouds (more quantity, faster speed) ---
let clouds = [];
function initClouds(){
  clouds = [];
  for(let i=0;i<16;i++){
    clouds.push({
      x: Math.random()*W,
      y: 20 + Math.random() * (H * 0.3),
      s: 0.5 + Math.random()*1.1,
      speed: 0.08 + Math.random()*0.16,
      t: Math.random()*Math.PI*2
    });
  }
}
initClouds();

// --- Pipes (right-side, always 3, random height) ---
let pipes = [];
function initPipes() {
  pipes = [];
  for (let i = 0; i < 3; i++) {
    pipes.push({
      x: W - 80 - i * 60,
      y: H - 28,
      h: 40 + Math.random() * 20,
      r: 22,
      side: "right"
    });
  }
}
initPipes();

let answerBlocks = [];
const blockW = 48, blockH = 34, blockGap = 18, blockAbove = 108;
let coinPops = [];
let fireworks = [];
let balloons = [];
let gameStarted = false;
let currentQ = 0;
let answers = [];
let surveyDone = false;
let showingPrompt = false;
let lastSelectionTime = 0;

// --- End-screen celebration variables ---
let endCelebrationRunning = false;
let endJumpTimer = 0;
let endSpawnInterval = null;

// ---------- Input ----------
const keys = Object.create(null);
const BLOCKED = new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ']);
function isTypingTarget(el) {
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}
window.addEventListener('keydown', (e) => {
  if (BLOCKED.has(e.key) && !isTypingTarget(e.target)) e.preventDefault();
  if (!isTypingTarget(e.target)) keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
  if (BLOCKED.has(e.key) && !isTypingTarget(e.target)) e.preventDefault();
  keys[e.key] = false;
});
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
canvas.setAttribute('tabindex', '0');
canvas.addEventListener('mousedown', () => canvas.focus());
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

// ---------- Layout answer blocks ----------
function layoutAnswerBlocks() {
  const q = questions[currentQ];
  if (!q || q.type !== 'scale') { answerBlocks = []; return; }
  const n = q.scale || 5;
  const totalW = n * blockW + (n - 1) * blockGap;
  const startX = Math.round(W / 2 - totalW / 2);
  const y = H - 28 - blockAbove - blockH;
  answerBlocks = [];
  for (let i = 0; i < n; i++) {
    const val = n - i;
    const smile = val >= Math.ceil(n * 0.8) ? '😄' : (val >= Math.ceil(n * 0.5) ? '🙂' : '😐');
    answerBlocks.push({ x: startX + i * (blockW + blockGap), y: y, w: blockW, h: blockH, val: val, struck: false, shake: 0, smile });
  }
}

// ---------- Centralized Back Button Logic ----------
function updateBackButton() {
  if (surveyDone || currentQ === 0 || currentQ > questions.length - 1) {
    backBtn.style.display = "none";
    return;
  }
  // Show if previous question exists and was box-based (scale)
  if (questions[currentQ - 1] && questions[currentQ - 1].type === "scale") {
    backBtn.style.display = "inline-block";
  } else {
    backBtn.style.display = "none";
  }
}

// ---------- Strike & selection ----------
function strikeBlock(index) {
  const b = answerBlocks[index];
  if (!b || b.struck) return;
  b.struck = true;
  if (soundEnabled) {
    coinSound.currentTime = 0;
    coinSound.play();
  }
  b.shake = 10;
  coinPops.push({ x: b.x + b.w / 2, y: b.y - 6, vy: -3.6, life: 0, alpha: 1 });
  if (now() - lastSelectionTime < 350) return;
  lastSelectionTime = now();
  setTimeout(() => { selectScale(b.val); }, 380);
}
function selectScale(val) {
  answers.push(val);
  advanceQuestion();
}
function goBackOneQuestion() {
  if (currentQ > 0) {
    answers.pop();
    // Go back to previous question
    currentQ -= 1;
    layoutAnswerBlocks();
    mario.x = W/2 - mario.w/2;
    mario.y = H - 28 - mario.h;

    // If prompt is open, close it
    if (!openPrompt.classList.contains('hidden')) {
      openPrompt.classList.add('hidden');
      showingPrompt = false;
    }
    updateBackButton();
  }
}
function advanceQuestion() {
  currentQ++;
  mario.x = clamp(mario.x, 48, W - 72);
  mario.vy = 0; mario.onGround = true;

  if (currentQ >= questions.length) {
    finishSurvey();
  } else {
    layoutAnswerBlocks();
    updateBackButton();
  }
}
function showTextPrompt(qText, callback) {
  showingPrompt = true;
  openPrompt.classList.remove('hidden');
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

  updateBackButton();
}

// ---------- GOOGLE FORM SUBMISSION ----------
function sendResponsesToGoogleForm(answers) {
  // const googleFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSfllOaHEoxhUpwB0MuqQuh7malLyl3bGuemvr5BflVq0JqL6Q/formResponse";
  const googleFormUrl = "https://docs.google.com/forms/u/0/d/e/1FAIpQLSfllOaHEoxhUpwB0MuqQuh7malLyl3bGuemvr5BflVq0JqL6Q/formResponse";
  const data = {};
  for (let i = 0; i < answers.length; i++) {
    if (entryMapping[i]) data[entryMapping[i]] = answers[i];
  }
  const formBody = Object.entries(data)
    .map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(v))
    .join("&");
  fetch(googleFormUrl, {
    method: "POST",
    mode: "no-cors", // Google Forms does not provide CORS headers
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody
  });
}

// ---------- Server submission ----------
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
  } catch (e) { }
}

// ---------- Finish: end screen + celebration ----------
function finishSurvey() {
  surveyDone = true;
  backBtn.style.display = "none"; // Hide backBtn on end screen
  if (SINGLE_SUBMIT) {
    try { localStorage.setItem(LOCAL_KEY, '1'); } catch (e) { }
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

  // --- Google Form Submission ---
  sendResponsesToGoogleForm(answers);

  mario.x = Math.round(W/2 - mario.w/2);
  mario.y = H - 28 - mario.h;
  mario.vy = 0;
  mario.onGround = true;
  if (soundEnabled) {
    winSound.currentTime = 0;
    winSound.play();
  }
  const soundBtn = document.getElementById('soundToggle');
  if (soundBtn) {
    soundBtn.disabled = true;
    soundBtn.style.opacity = "0.5";
    soundBtn.style.cursor = "not-allowed";
    soundBtn.title = "Sound disabled after survey";
  }
  // submitAnonymizedResults(payload).then(success => {
  //   openPrompt.classList.add('hidden');
  //   endScreen.classList.remove('hidden');
  //   startEndCelebration();
  // }).catch(() => {
  //   openPrompt.classList.add('hidden');
  //   endScreen.classList.remove('hidden');
  //   startEndCelebration();
  // });
  openPrompt.classList.add('hidden');
  endScreen.classList.remove('hidden');
  startEndCelebration();
  backBtn.style.display = "none"; // Hide backBtn on end screen
}
function startEndCelebration() {
  if (endCelebrationRunning) return;
  endCelebrationRunning = true;
  spawnCelebration();
  endSpawnInterval = setInterval(() => { spawnCelebration(2, 6); }, 1400);
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
  for (let i = 0; i < fireworksCount; i++)
    createFirework(80 + Math.random() * (W - 160), 80 + Math.random() * 140);
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
updateBackButton();

(function mainLoop() {
  if (SINGLE_SUBMIT && localStorage.getItem(LOCAL_KEY) === '1' && !surveyDone) {
    surveyDone = true;
    endScreen.classList.remove('hidden');
    document.querySelector('#endScreen .end-note').textContent = 'You have already completed this survey. Thank you.';
    startEndCelebration();
  }

  if (!surveyDone && !showingPrompt) {
    const prevY = mario.y;
    if (keys['ArrowLeft'] || keys['a']) mario.x -= mario.speed;
    if (keys['ArrowRight'] || keys['d']) mario.x += mario.speed;
    if ((keys['ArrowUp'] || keys['w']) && mario.onGround) {
      mario.vy = -7.6;
      mario.onGround = false;
      if (soundEnabled) { jumpSound.currentTime = 0; jumpSound.play(); }
    }
    mario.x = clamp(mario.x, 6, W - mario.w - 6);

    // Gravity, platforms (box & pipes), ground
    mario.vy += gravity;
    mario.y += mario.vy;
    const onBox = (
      mario.x + mario.w > box.x &&
      mario.x < box.x + box.w &&
      Math.abs(mario.y + mario.h - box.y) < 6 &&
      mario.vy >= 0
    );
    if (onBox) {
      mario.y = box.y - mario.h; mario.vy = 0; mario.onGround = true;
    } else {
      let onPipe = false;
      for (const p of pipes) {
        // --- sit on top of pipe cap, not pipe body ---
        const pipeTop = p.y - p.h - 14;
        const pipeLeft = p.x - 4;
        const pipeRight = p.x + p.r*2 + 4;
        if (
          mario.x + mario.w > pipeLeft &&
          mario.x < pipeRight &&
          Math.abs(mario.y + mario.h - pipeTop) < 8 &&
          mario.vy >= 0
        ) {
          mario.y = pipeTop - mario.h; mario.vy = 0; mario.onGround = true; onPipe = true;
          break;
        }
      }
      if (!onPipe && mario.y + mario.h >= H - 28) {
        mario.y = H - 28 - mario.h; mario.vy = 0; mario.onGround = true;
      } else if (!onPipe && !onBox) {
        mario.onGround = false;
      }
    }

    // Goomba collision (skip if Mario on box)
    let marioSafe = (
      mario.x + mario.w > box.x &&
      mario.x < box.x + box.w &&
      Math.abs(mario.y + mario.h - box.y) < 6
    );
    for (let g of goombas) {
      if (gameStarted) {
        if (!g.lastChange || (performance.now() - g.lastChange) > 2000 + Math.random() * 1000) {
          if (Math.random() < 0.4) g.dir *= -1;
          if (Math.random() < 0.7) g.spd = 0.7 + Math.random() * 1.2;
          g.lastChange = performance.now();
        }
        g.x += g.dir * g.spd;
        if (g.x <= 12 || g.x + g.w >= W - 12) {
          g.dir *= -1;
          g.spd = 0.7 + Math.random() * 1.2;
          g.x = Math.max(12, Math.min(g.x, W - 12 - g.w));
        }
        g.bob += 0.04;
      }
      if (!marioSafe && rectsCollide(mario, g) && !mario.shocked) {
        mario.shocked = true;
        if (soundEnabled) { hitSound.currentTime = 0; hitSound.play(); }
        mario.x += (mario.x < g.x) ? -20 : 20;
        mario.vy = -5.2;
        for (let i = 0; i < 6; i++) {
          mario.stars.push({ x: mario.x + mario.w/2, y: mario.y - 10, dx: (Math.random()-0.5)*2.2, dy: -2 - Math.random()*2.2, life: 36, angle: Math.random()*Math.PI*2 });
        }
        setTimeout(() => { mario.shocked = false; }, 500);
      }
    }

    // head-strike detection for blocks
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

    // text question auto-prompt
    const q = questions[currentQ];
    if (q && q.type === 'text') {
      const centerLeft = W * 0.32, centerRight = W * 0.68;
      if (mario.onGround && (mario.x + mario.w / 2) >= centerLeft && (mario.x + mario.w / 2) <= centerRight && !showingPrompt) {
        if (!showingPrompt && !surveyDone && questions[currentQ] && questions[currentQ].type === 'text') {
          showTextPrompt(questions[currentQ].text, (resp) => { answers.push(resp); advanceQuestion(); });
        }
      }
    }
  }

  // End-screen behavior: excited Mario jumps repeatedly
  if (surveyDone && endCelebrationRunning) {
    endJumpTimer++;
    if (endJumpTimer % 28 === 0 && mario.onGround) {
      mario.vy = -6.2;
      mario.onGround = false;
    }
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

  // ---------- DRAWING ----------
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#dff6ff'; ctx.fillRect(0, 0, W, H * 0.45);
  for(const c of clouds) drawCloud(c.x, c.y + Math.sin(c.t)*2, c.s);
  drawCloud(90, 64, 0.9); drawCloud(260, 48, 0.6); drawCloud(720, 84, 0.8);
  ctx.fillStyle = '#3fa34a'; ctx.fillRect(0, H - 28, W, 28);

  // Draw trees (left side, behind box)
  for (const tree of trees) drawTree(tree);

  // Draw fancier wooden box (Angry Birds style)
  drawWoodenBox(box);

  // Draw right-side pipes
  for (const p of pipes) {
    const px = p.x, py = p.y;
    // Pipe body
    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(px, py - p.h, p.r*2, p.h);
    // Cap
    ctx.fillStyle = "#27ae60";
    ctx.fillRect(px - 4, py - p.h - 14, p.r*2 + 8, 14);
    ctx.strokeStyle = "#145a32"; ctx.lineWidth = 2;
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

  // draw Goombas
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

  updateStars();
  drawStars();
  drawPlayer(mario.x, mario.y, mario.w, mario.h);

  if (!surveyDone) drawQuestionPanel();
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
function drawWoodenBox(box) {
  ctx.save();
  ctx.fillStyle = "#b97a56";
  ctx.strokeStyle = "#7c4f26";
  ctx.lineWidth = 4;
  ctx.shadowColor = "#65432155";
  ctx.shadowBlur = 8;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    let px = box.x + (box.w / 4) * i;
    ctx.beginPath();
    ctx.moveTo(px, box.y + 4);
    ctx.lineTo(px, box.y + box.h - 4);
    ctx.strokeStyle = "#e2b07a";
    ctx.stroke();
  }
  ctx.strokeStyle = "#e2b07a";
  ctx.beginPath();
  ctx.moveTo(box.x + 3, box.y + 8);
  ctx.lineTo(box.x + box.w - 3, box.y + 8);
  ctx.moveTo(box.x + 3, box.y + box.h - 8);
  ctx.lineTo(box.x + box.w - 3, box.y + box.h - 8);
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(box.x + (box.w / 4) * i + box.w / 8, box.y + 12, 2, 0, Math.PI*2);
    ctx.arc(box.x + (box.w / 4) * i + box.w / 8, box.y + box.h - 12, 2, 0, Math.PI*2);
    ctx.fillStyle = "#775c3b";
    ctx.fill();
  }
  ctx.restore();
}
function drawTree(tree) {
  ctx.save();
  ctx.fillStyle = "#8d5524";
  ctx.fillRect(tree.x, H - 28 - tree.trunkH, tree.trunkW, tree.trunkH);
  ctx.beginPath();
  ctx.arc(tree.x + tree.trunkW/2, H - 28 - tree.trunkH, tree.foliageR, Math.PI*1.05, Math.PI*2.05, false);
  ctx.fillStyle = tree.c;
  ctx.shadowColor = "#4b7429";
  ctx.shadowBlur = 18;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(tree.x + tree.trunkW/2 - tree.foliageR/3, H - 28 - tree.trunkH - tree.foliageR/3, tree.foliageR/2.8, 0, Math.PI*2);
  ctx.fillStyle = "#e3ffd7";
  ctx.globalAlpha = 0.18;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}
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
function drawPlayer(x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#e84c3d';
  roundRect(ctx, x, y, w, h, 6, true, false);
  ctx.fillStyle = '#bd2e2e';
  ctx.fillRect(x, y, w, Math.round(h * 0.18));
  ctx.fillStyle = '#ffe6cf';
  ctx.fillRect(x + w * 0.18, y + 8, w * 0.64, 8);
  if (mario.shocked) {
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
    ctx.fillStyle = '#b33';
    ctx.beginPath();
    ctx.arc(x + w*0.5, y + h*0.70, 5, 0, Math.PI*2);
    ctx.fill();
  } else {
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
    if (surveyDone) {
      ctx.strokeStyle = '#3b2a1a'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + w*0.5, y + h*0.66, 11, 0.15, Math.PI - 0.15);
      ctx.stroke();
      ctx.fillStyle = '#b33'; ctx.beginPath(); ctx.fill();
    } else {
      ctx.strokeStyle = '#3b2a1a'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x + w*0.5, y + h*0.64, 4, 0.15, Math.PI - 0.15);
      ctx.stroke();
    }
  }
  ctx.restore();
}
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
  const hint = q && q.type === 'scale'
    ? "Jump up and strike a numbered box from below (or click a box)."
    : "Move to the center to type your response when prompted. You can rest Mario on the wooden box to avoid Goombas while thinking!";
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

// Attach events
backBtn.addEventListener('click', goBackOneQuestion);
