// script.js - Gameified survey with sprites, LLM hook, strike-to-answer, fireworks end-screen

// ---------- Full survey questions (from your provided script) ----------
const questions = [
  // Section 1: Leadership
  { section: "Leadership", text: "How would you rate the overall vision and strategic direction provided by XYZ’s leadership?", type: "scale", scale: 5 },
  { section: "Leadership", text: "To what extent do you feel XYZ’s leadership is aligned with your organization’s goals and priorities?", type: "scale", scale: 5 },
  { section: "Leadership", text: "Over the past year, what specific improvements or changes in XYZ’s leadership have you noticed?", type: "text" },
  { section: "Leadership", text: "Looking forward, what do XYZ’s leadership need to improve to support you better?", type: "text" },

  // Section 2: Account Management
  { section: "Account Management", text: "How satisfied are you with the responsiveness and engagement of your account manager?", type: "scale", scale: 5 },
  { section: "Account Management", text: "Has your account manager changed this year? If Yes, to what extent has this change affected your experience of XYZ (1 = Much Worse, 5 = Much Better)?", type: "scale", scale: 5 },
  { section: "Account Management", text: "To what extent do you feel your account manager is aligned with your organization’s goals and priorities?", type: "scale", scale: 5 },
  { section: "Account Management", text: "What additional steps could your account manager take to improve responsiveness, engagement, or alignment with your organization?", type: "text" },

  // Section 3: Service Delivery and Responsiveness
  { section: "Service Delivery", text: "How would you rate the overall quality of service delivery provided by XYZ?", type: "scale", scale: 5 },
  { section: "Service Delivery", text: "How satisfied are you with XYZ’s response times to your requests or issues?", type: "scale", scale: 5 },
  { section: "Service Delivery", text: "How do you rate XYZ’s overall technical competency for the services provided to you?", type: "scale", scale: 5 },
  { section: "Service Delivery", text: "What improvements, if any, have you noticed in XYZ’s service delivery over the past year?", type: "text" },
  { section: "Service Delivery", text: "How can XYZ further improve future service delivery?", type: "text" },

  // Section 4: Credibility and Engagement
  { section: "Credibility", text: "How would you rate XYZ’s credibility as a trusted partner?", type: "scale", scale: 5 },
  { section: "Credibility", text: "How engaged do you feel XYZ is in supporting your business goals and priorities?", type: "scale", scale: 5 },
  { section: "Credibility", text: "What additional steps could XYZ take to improve their credibility or engagement with your organization?", type: "text" },

  // Section 5: General Feedback
  { section: "General", text: "What do you think XYZ is doing well?", type: "text" },
  { section: "General", text: "What areas do you think XYZ could improve?", type: "text" }
];

// ---------- Canvas setup ----------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

// ---------- Asset filenames (place your sprites in assets/ with these names) ----------
const ASSETS = {
  characters: "assets/characters.png", // player sprite sheet
  tiles: "assets/tiles.png",          // blocks / tiles
  elements: "assets/elements.png",    // clouds, icons
  icons: "assets/icons.png"           // coins etc (optional)
};

// ---------- Load images ----------
const images = {};
function loadImage(key, src){ return new Promise((resolve,reject)=>{ const img = new Image(); img.onload = ()=>{images[key]=img;resolve(img)}; img.onerror = reject; img.src = src; });}
async function loadAssets(){
  // Try to load assets, but allow fallback if missing
  const promises = [
    loadImage('characters', ASSETS.characters).catch(()=>null),
    loadImage('tiles', ASSETS.tiles).catch(()=>null),
    loadImage('elements', ASSETS.elements).catch(()=>null),
    loadImage('icons', ASSETS.icons).catch(()=>null)
  ];
  await Promise.all(promises);
}

// ---------- Game entities and state ----------
const gravity = 0.38;
const mario = {
  x: 80, y: H - 28 - 36, w: 30, h: 36, vy: 0, onGround: true,
  speed: 2.4, facing: 1, frame:0, frameTimer:0
};
const goombas = [
  { x: 380, y: H - 28 - 18, w: 18, h: 18, dir: 1, spd: 1.12, frame:0 },
  { x: 660, y: H - 28 - 18, w: 18, h: 18, dir: -1, spd: 1.0, frame:0 }
];

let answerBlocks = []; // suspended blocks to strike
const blockW = 50, blockH = 36, blockGap = 18, blockHeightAboveGround = 108;
let coinPops = [];
let fireworks = [];
let balloons = [];

let currentQ = 0;
let answers = [];
let surveyDone = false;
let showingPrompt = false;
let lastSelectionTime = 0;

// DOM
const openPrompt = document.getElementById('openPrompt');
const promptTitle = document.getElementById('promptTitle');
const promptInput = document.getElementById('promptInput');
const promptSubmit = document.getElementById('promptSubmit');
const endScreen = document.getElementById('endScreen');
const summaryList = document.getElementById('summaryList');
const endVisual = document.getElementById('endVisual');
const downloadJson = document.getElementById('downloadJson');
const restartBtn = document.getElementById('restartBtn');

// ---------- Input ----------
const keys = {};
window.addEventListener('keydown', e=>{ keys[e.key]=true; });
window.addEventListener('keyup', e=>{ keys[e.key]=false; });

// ---------- Helpers ----------
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const now = ()=> new Date().getTime();
function rectsCollide(a,b){return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;}

// ---------- Layout answer blocks centered ----------
function layoutAnswerBlocks(){
  const q = questions[currentQ];
  if (!q || q.type !== "scale"){ answerBlocks = []; return; }
  const n = q.scale || 5;
  const totalW = n*blockW + (n-1)*blockGap;
  const startX = Math.round(W/2 - totalW/2);
  const y = H - 28 - blockHeightAboveGround - blockH;
  answerBlocks = [];
  for(let i=0;i<n;i++) answerBlocks.push({ x: startX + i*(blockW+blockGap), y: y, w: blockW, h: blockH, val:i+1, struck:false, shake:0 });
}

// ---------- Strike visual + selection ----------
function strikeBlock(i){
  const b = answerBlocks[i];
  if(!b || b.struck) return;
  b.struck = true;
  b.shake = 10;
  coinPops.push({x:b.x + b.w/2, y:b.y - 6, vy:-3.6, life:0, alpha:1});
  if(now() - lastSelectionTime < 350) return;
  lastSelectionTime = now();
  setTimeout(()=>{ selectScale(b.val); }, 380);
}
function selectScale(val){
  answers.push(val);
  advanceQuestion();
}
function advanceQuestion(){
  currentQ++;
  mario.x = clamp(mario.x + 44, 48, W - 72);
  mario.vy = 0; mario.onGround = true;
  if(currentQ >= questions.length) finishSurvey();
  else {
    layoutAnswerBlocks();
    // Optional: if next question is LLM-driven, request it
    maybeRequestLLMFollowUp();
  }
}

// ---------- LLM Hook (backend required) ----------
async function requestLLMFollowUp(context){
  // context: { questionIndex, previousAnswers } - backend should return { followUpQuestion }
  // Example backend contract: POST /api/llm { questionIndex, answers } -> { followUp: { text, type, scale? } }
  try{
    const resp = await fetch('/api/llm', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(context)
    });
    if(!resp.ok) throw new Error('LLM error');
    const j = await resp.json();
    return j;
  }catch(e){
    return null;
  }
}

// Decide whether to ask LLM for the next question (demo + fallback)
async function maybeRequestLLMFollowUp(){
  // For demo, call LLM only when question type text or every 3 answers
  if(typeof window.fetch !== 'function') return;
  if(currentQ >= questions.length) return;
  // Example policy: call LLM when we reach a text question to produce a clarifying follow-up
  const q = questions[currentQ];
  if(!q) return;
  // Call LLM with small probability or when q.type === 'text'
  if (q.type === 'text') {
    // send context
    const context = { questionIndex: currentQ, answers };
    const result = await requestLLMFollowUp(context);
    if(result && result.followUp){
      // Insert follow-up at currentQ position (so it will be asked now)
      questions.splice(currentQ,0,result.followUp);
      layoutAnswerBlocks();
    } else {
      // fallback: no server or no follow-up — nothing to do
    }
  }
}

// ---------- Text prompt UI ----------
function showTextPrompt(qText, callback){
  showingPrompt = true;
  openPrompt.classList.remove('hidden');
  promptTitle.textContent = qText;
  promptInput.value = "";
  promptInput.focus();
  const handler = ()=>{
    const v = promptInput.value.trim();
    if(!v) return;
    openPrompt.classList.add('hidden');
    showingPrompt = false;
    promptSubmit.removeEventListener('click', handler);
    window.removeEventListener('keypress', onEnter);
    callback(v);
  };
  function onEnter(e){ if(e.key === 'Enter') handler(); }
  promptSubmit.addEventListener('click', handler);
  window.addEventListener('keypress', onEnter);
}

// ---------- Finish: fireworks + summary ----------
function finishSurvey(){
  surveyDone = true;
  populateSummary();
  spawnCelebration();
  endScreen.classList.remove('hidden');
}
function populateSummary(){
  summaryList.innerHTML = "";
  for(let i=0;i<questions.length;i++){
    const q = questions[i];
    const a = answers[i] === undefined ? "(no answer)" : answers[i];
    const div = document.createElement('div');
    div.className = 'summaryItem';
    div.innerHTML = `<strong>${i+1}. [${q.section}]</strong><div style="margin-top:6px">${q.text}</div><div style="margin-top:6px;color:#0e3a57">Answer: <strong>${String(a)}</strong></div>`;
    summaryList.appendChild(div);
  }
}
function spawnCelebration(){
  // balloons
  for(let i=0;i<8;i++){
    balloons.push({
      x: 60 + i*90 + Math.random()*40, y: 420 + Math.random()*40,
      vx: (Math.random()-0.5)*0.4, vy: -1.2 - Math.random()*0.8,
      color: ['#ffd35c','#64b5f6','#ff8a65','#aed581'][i%4], life:0
    });
  }
  // fireworks (particles)
  for(let i=0;i<12;i++) {
    createFirework(W*0.3 + Math.random()*W*0.4, 120 + Math.random()*80);
  }
}
function createFirework(x,y){
  const particles = [];
  const count = 28 + Math.round(Math.random()*12);
  for(let i=0;i<count;i++){
    const ang = Math.random()*Math.PI*2;
    const spd = 1.6 + Math.random()*2.6;
    particles.push({
      x,y,
      vx: Math.cos(ang)*spd, vy: Math.sin(ang)*spd,
      life: 0, color: ['#ffd35c','#64b5f6','#ff8a65','#b39ddb'][Math.floor(Math.random()*4)]
    });
  }
  fireworks.push({ particles, age:0 });
}

// ---------- Download JSON / restart ----------
downloadJson.addEventListener('click', ()=>{
  const out = { questions, answers, timestamp:new Date().toISOString() };
  const blob = new Blob([JSON.stringify(out, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'survey_results.json'; a.click();
  URL.revokeObjectURL(url);
});
restartBtn.addEventListener('click', ()=>{
  // Reset state for replay
  currentQ = 0; answers = []; surveyDone = false; endScreen.classList.add('hidden');
  layoutAnswerBlocks();
});

// ---------- Mouse click: strike blocks or click tutorial (also triggers LLM) ----------
canvas.addEventListener('mousedown', (e)=>{
  if(surveyDone || showingPrompt) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  for(let i=0;i<answerBlocks.length;i++){
    const b = answerBlocks[i];
    if(mx >= b.x && mx <= b.x+b.w && my >= b.y && my <= b.y+b.h){
      strikeBlock(i);
      return;
    }
  }
});

// ---------- Asset-driven drawing helpers ----------
function drawSprite(img, sx, sy, sw, sh, dx, dy, dw, dh){
  if(!img) {
    // fallback rectangle
    ctx.fillStyle = '#c62828'; ctx.fillRect(dx,dy,dw,dh);
    return;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

// ---------- Main loop ----------
async function start(){
  await loadAssets();
  layoutAnswerBlocks();
  maybeRequestLLMFollowUp();
  requestAnimationFrame(loop);
}
function loop(){
  // update
  if(!surveyDone && !showingPrompt){
    // input & physics
    const prevY = mario.y;
    if(keys["ArrowLeft"] || keys["a"]){ mario.x -= mario.speed; mario.facing = -1; }
    if(keys["ArrowRight"] || keys["d"]){ mario.x += mario.speed; mario.facing = 1; }
    if((keys["ArrowUp"]||keys["w"]) && mario.onGround){ mario.vy = -7.6; mario.onGround = false; }
    mario.x = clamp(mario.x, 6, W - mario.w - 6);
    mario.vy += gravity;
    mario.y += mario.vy;

    // head-strike detection for blocks: if moving upward and crosses block bottom
    if(mario.vy < 0){
      for(let i=0;i<answerBlocks.length;i++){
        const b = answerBlocks[i];
        if(b.struck) continue;
        const blockBottom = b.y + b.h;
        if(prevY > blockBottom && mario.y <= blockBottom){
          const leftOver = (mario.x + mario.w*0.12) < (b.x + b.w);
          const rightOver = (mario.x + mario.w*0.88) > b.x;
          if(leftOver && rightOver){
            strikeBlock(i);
            break;
          }
        }
      }
    }

    if(mario.y + mario.h >= H - 28){
      mario.y = H - 28 - mario.h; mario.vy = 0; mario.onGround = true;
    } else mario.onGround = false;

    // goombas move & simple collision
    for(const g of goombas){
      g.x += g.dir * g.spd;
      if(g.x <= 12 || g.x + g.w >= W-12) g.dir *= -1;
      if(rectsCollide(mario, g)){ mario.x = 80; mario.y = H - 28 - mario.h; mario.vy = 0; mario.onGround = true; }
    }

    // auto open text prompt when player stands in center region for a text question
    const q = questions[currentQ];
    if(q && q.type === 'text'){
      const centerLeft = W*0.32, centerRight = W*0.68;
      if(mario.onGround && (mario.x + mario.w/2) >= centerLeft && (mario.x + mario.w/2) <= centerRight && !showingPrompt){
        setTimeout(()=>{
          if(!showingPrompt && !surveyDone && questions[currentQ] && questions[currentQ].type === 'text'){
            showTextPrompt(questions[currentQ].text, (resp)=>{ answers.push(resp); advanceQuestion(); });
          }
        }, 250);
      }
    }
  }

  // update coin pops and shakes
  for(let i=coinPops.length-1;i>=0;i--){
    const c = coinPops[i]; c.y += c.vy; c.vy += 0.12; c.life++; c.alpha = Math.max(0, 1 - c.life / 38);
    if(c.life > 42) coinPops.splice(i,1);
  }
  for(const b of answerBlocks) if(b.shake>0) b.shake--;

  // update fireworks & balloons
  for(let i=fireworks.length-1;i>=0;i--){
    const fw = fireworks[i];
    fw.age++;
    for(const p of fw.particles){
      p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.life++;
    }
    if(fw.age > 120) fireworks.splice(i,1);
  }
  for(let i=balloons.length-1;i>=0;i--){
    const bl = balloons[i]; bl.x += bl.vx; bl.y += bl.vy; bl.vy -= 0.008; bl.life++;
    if(bl.y < -80) balloons.splice(i,1);
  }

  // draw
  ctx.clearRect(0,0,W,H);
  // optional background tiles if loaded
  if(images.elements){
    // draw subtle clouds from elements sheet (if present)
    ctx.globalAlpha = 0.95;
    ctx.drawImage(images.elements, 0, 0, images.elements.width, images.elements.height, 0, 0, W, H*0.38);
    ctx.globalAlpha = 1;
  } else {
    // fallback subtle sky shape
    ctx.fillStyle = "#cfefff";
    ctx.fillRect(0,0,W,H*0.4);
  }

  // ground
  ctx.fillStyle = "#3fa34a";
  ctx.fillRect(0,H-28,W,28);

  // draw suspended answer blocks
  for(const b of answerBlocks){
    const shakeOff = b.shake>0 ? Math.sin(b.shake*0.8)*4 : 0;
    const dY = b.y + shakeOff;
    if(images.tiles){
      // assume tile 'block' is near left of tiles sheet; draw a rectangle if our mapping is unknown
      ctx.drawImage(images.tiles, 0,0,64,64, b.x, dY, b.w, b.h);
    } else {
      ctx.fillStyle = b.struck ? "#e2e2e2" : "#ffd35c";
      ctx.fillRect(b.x, dY, b.w, b.h);
      ctx.strokeStyle = "#b48c19"; ctx.lineWidth = 2; ctx.strokeRect(b.x, dY, b.w, b.h);
    }
    ctx.fillStyle = "#222"; ctx.font = "18px Inter, Arial"; ctx.fillText(String(b.val), b.x + b.w/2 - 6, dY + b.h/2 + 6);
  }

  // draw coin pops
  for(const c of coinPops){
    ctx.save(); ctx.globalAlpha = c.alpha;
    ctx.fillStyle = "#ffd24d"; ctx.beginPath(); ctx.ellipse(c.x, c.y, 8, 8, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = "#c28a00"; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }

  // draw goombas (simple)
  for(const g of goombas){
    if(images.characters){
      // small sprite example: draw a 24x24 sprite slice - adapt as needed
      drawSprite(images.characters, 0, 0, 32, 32, g.x, g.y, g.w, g.h);
    } else {
      ctx.fillStyle = "#8d5524"; ctx.beginPath(); ctx.ellipse(g.x + g.w/2, g.y + g.h/2, g.w/2, g.h/2, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(g.x + g.w/2 - 4, g.y + g.h/2 - 6, 2.5,0,Math.PI*2); ctx.arc(g.x + g.w/2 + 4, g.y + g.h/2 - 6, 2.5,0,Math.PI*2); ctx.fill();
    }
  }

  // draw player (sprite if available)
  if(images.characters){
    // simple animation: cycle 2 frames horizontally every 120ms when moving
    mario.frameTimer++; if(mario.frameTimer > 12){ mario.frame++; mario.frameTimer = 0; }
    const frameIndex = mario.onGround ? (keys["ArrowLeft"]||keys["ArrowRight"] ? (Math.floor(mario.frame/2)%4) : 0) : 5;
    // map frameIndex -> sx in spritesheet (assumes 32x32 frames)
    const sx = (frameIndex % 8) * 32, sy = 0;
    drawSprite(images.characters, sx, sy, 32, 32, mario.x, mario.y, mario.w, mario.h);
  } else {
    // fallback rectangle
    ctx.save();
    ctx.fillStyle = "#e74c3c"; ctx.fillRect(mario.x, mario.y, mario.w, mario.h);
    ctx.fillStyle = "#ffe5c1"; ctx.fillRect(mario.x + mario.w*0.18, mario.y + 8, mario.w*0.64, 8);
    ctx.restore();
  }

  // top fixed question panel
  if(!surveyDone){
    drawQuestionPanel();
  }

  // draw fireworks
  for(const fw of fireworks){
    for(const p of fw.particles){
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - p.life/80);
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 3.2, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }
  // draw balloons
  for(const bl of balloons){
    ctx.save();
    ctx.fillStyle = bl.color; ctx.beginPath(); ctx.ellipse(bl.x, bl.y, 14, 18, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#fff4'; ctx.lineWidth = 1; ctx.stroke();
    // string
    ctx.beginPath(); ctx.moveTo(bl.x, bl.y+18); ctx.lineTo(bl.x, bl.y+34); ctx.strokeStyle='#a7c9d8'; ctx.stroke();
    ctx.restore();
  }

  requestAnimationFrame(loop);
}

// ---------- Draw top fixed question panel ----------
function drawQuestionPanel(){
  const panelW = clamp(820, 320, W - 48);
  const panelH = 106;
  const px = Math.round((W - panelW) / 2);
  const py = 18;
  // panel background
  ctx.save(); ctx.shadowColor = '#90caf9'; ctx.shadowBlur = 12; ctx.globalAlpha = 0.98;
  ctx.fillStyle = '#fff'; ctx.fillRect(px, py, panelW, panelH);
  ctx.restore();
  ctx.strokeStyle = '#1e88e5'; ctx.lineWidth = 2.6; ctx.strokeRect(px, py, panelW, panelH);
  // question text
  ctx.fillStyle = '#0e3a57'; ctx.font = "18px Inter, 'Segoe UI', Arial";
  const q = questions[currentQ];
  const text = q ? q.text : "No question";
  wrapText(ctx, text, px + 18, py + 34, panelW - 36, 22);
  // helper line
  ctx.fillStyle = '#4a6b82'; ctx.font = "13px Arial";
  const hint = q && q.type === 'scale' ? "Jump up and strike a numbered box from below (or click a box)." : "Move to the center and type your response when prompted.";
  ctx.fillText(hint, px + 18, py + panelH - 14);
}

// ---------- Utilities ----------
function wrapText(ctx, text, x, y, maxWidth, lineHeight){
  const words = text.split(' ');
  let line = '';
  for(let n=0;n<words.length;n++){
    const test = line + words[n] + ' ';
    const m = ctx.measureText(test);
    if(m.width > maxWidth && n > 0){
      ctx.fillText(line, x, y); line = words[n] + ' '; y += lineHeight;
    } else line = test;
  }
  ctx.fillText(line, x, y);
}

// ---------- Init & bindings ----------
layoutAnswerBlocks();
loadAssets().then(()=>{ /* assets loaded if provided */ });
maybeRequestLLMFollowUp(); // first call if applicable
start();

// Helper: start the animation loop
function start(){ requestAnimationFrame(loop); }

// Ensure layout recalculates when question list changes (LLM insert)
const originalAdvance = advanceQuestion;
advanceQuestion = function(){
  originalAdvance();
  layoutAnswerBlocks();
};

// Accessibility: focus management for prompt
promptSubmit.addEventListener('click', ()=>{}); // handlers attached per prompt open

// End of script
