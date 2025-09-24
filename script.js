// script.js - updates: mario facial expressions, shock animation, stars effect

// ---------- Configuration ----------
const SINGLE_SUBMIT = false;
const LOCAL_KEY = 'survey_completed_v1';
const LOCAL_RESPONSES_KEY = 'survey_responses';

// ---------- QUESTIONS ----------
const questions = [ /* ... your questions array unchanged ... */ ];

// ---------- Canvas & DOM ----------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

const openPrompt = document.getElementById('openPrompt');
const promptTitle = document.getElementById('promptTitle');
const promptInput = document.getElementById('promptInput');
const promptSubmit = document.getElementById('promptSubmit');
const endScreen = document.getElementById('endScreen');

// ---------- Game entities ----------
const gravity = 0.38;
const mario = {
  x: 80, y: H - 28 - 36, w: 34, h: 36,
  vy: 0, onGround: true, speed: 2.4,
  shocked: false, stars: []
};
const goombas = [
  { x: 390, y: H - 28 - 20, w: 22, h: 20, dir: 1, spd: 1.06, bob: 0 },
  { x: 670, y: H - 28 - 20, w: 22, h: 20, dir: -1, spd: 0.96, bob: 0 }
];

// Answer blocks, fx
let answerBlocks = [];
const blockW = 48, blockH = 34, blockGap = 18, blockAbove = 108;
let coinPops = [], fireworks = [], balloons = [];

// State
let currentQ = 0, answers = [], surveyDone = false, showingPrompt = false;
let lastSelectionTime = 0, endCelebrationRunning = false, endJumpTimer = 0, endSpawnInterval = null;

// ---------- Input ----------
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

// Mouse click selection
canvas.addEventListener('mousedown', e => {
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
function rectsCollide(a, b) { return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }

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
    answerBlocks.push({ x: startX + i*(blockW+blockGap), y, w:blockW,h:blockH,val, struck:false, shake:0, smile });
  }
}

// ---------- Strike & select ----------
function strikeBlock(i) {
  const b = answerBlocks[i];
  if (!b || b.struck) return;
  b.struck = true; b.shake = 10;
  coinPops.push({ x:b.x+b.w/2, y:b.y-6, vy:-3.6, life:0, alpha:1 });
  if (now()-lastSelectionTime < 350) return;
  lastSelectionTime = now();
  setTimeout(()=>{ selectScale(b.val); },380);
}
function selectScale(val){ answers.push(val); advanceQuestion(); }
function advanceQuestion(){
  currentQ++;
  mario.x = clamp(mario.x,48,W-72); mario.vy=0; mario.onGround=true;
  if(currentQ>=questions.length) finishSurvey(); else layoutAnswerBlocks();
}

// ---------- Text Prompt ----------
function showTextPrompt(qText, cb){ /* unchanged */ }

// ---------- Submit ----------
async function submitAnonymizedResults(payload){ /* unchanged */ }
function storeLocalBackup(payload){ /* unchanged */ }

// ---------- Finish & Celebration ----------
function finishSurvey(){ /* unchanged except calls startEndCelebration() */ }
function startEndCelebration(){ /* unchanged */ }
function stopEndCelebration(){ /* unchanged */ }
function spawnCelebration(balloonsCount=8, fireworksCount=10){ /* unchanged */ }
function createFirework(x,y){ /* unchanged */ }

// ---------- Main Loop ----------
layoutAnswerBlocks();

(function mainLoop(){
  if(!surveyDone && !showingPrompt){
    const prevY=mario.y;
    if(keys['ArrowLeft']||keys['a']) mario.x-=mario.speed;
    if(keys['ArrowRight']||keys['d']) mario.x+=mario.speed;
    if((keys['ArrowUp']||keys['w'])&&mario.onGround){ mario.vy=-7.6;mario.onGround=false;}
    mario.x=clamp(mario.x,6,W-mario.w-6); mario.vy+=gravity; mario.y+=mario.vy;
    if(mario.y+mario.h>=H-28){ mario.y=H-28-mario.h; mario.vy=0;mario.onGround=true; }
    else mario.onGround=false;

    // head-strike detection (unchanged)...

    // goombas move & collision
    for(let g of goombas){
      g.x+=g.dir*g.spd; if(g.x<=12||g.x+g.w>=W-12) g.dir*=-1; g.bob+=0.04;
      if(rectsCollide(mario,g)){
        // Shock reaction
        mario.shocked=true;
        mario.vy=-6; // bounce
        if(mario.x<g.x) mario.x-=20; else mario.x+=20;
        // spawn stars
        for(let i=0;i<5;i++){
          mario.stars.push({x:mario.x+mario.w/2,y:mario.y-8,dx:(Math.random()-0.5)*2,dy:-2-Math.random()*2,life:50,ang:Math.random()*Math.PI*2,spin:(Math.random()-0.5)*0.3});
        }
        setTimeout(()=>mario.shocked=false,500);
      }
    }

    // text prompts unchanged...
  }

  if(surveyDone && endCelebrationRunning){ /* unchanged jumping code */ }

  // update coinPops, fireworks, balloons (unchanged)...

  // draw
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#dff6ff';ctx.fillRect(0,0,W,H*0.45);
  drawCloud(90,64,0.9); drawCloud(260,48,0.6); drawCloud(720,84,0.8);
  ctx.fillStyle='#3fa34a'; ctx.fillRect(0,H-28,W,28);

  // blocks, coin pops, goombas (unchanged)...

  // Mario
  drawPlayer(mario.x,mario.y,mario.w,mario.h);

  if(!surveyDone) drawQuestionPanel();

  // fireworks, balloons (unchanged)...
  requestAnimationFrame(mainLoop);
})();

// ---------- Helpers ----------
function drawCloud(cx,cy,s=1){ /* unchanged */ }
function roundRect(ctx,x,y,w,h,r,fill,stroke){ /* unchanged */ }

// ---------- Player Drawing ----------
function drawPlayer(x,y,w,h){
  ctx.save();
  ctx.fillStyle='#e84c3d'; roundRect(ctx,x,y,w,h,6,true,false);
  ctx.fillStyle='#bd2e2e'; ctx.fillRect(x,y,w,Math.round(h*0.18));
  ctx.fillStyle='#ffe6cf'; ctx.fillRect(x+w*0.18,y+8,w*0.64,8);

  if(mario.shocked){
    // 😲 shocked face
    ctx.fillStyle="#fff";
    ctx.beginPath(); ctx.ellipse(x+w*0.36,y+h*0.42,4,5,0,0,Math.PI*2);
    ctx.ellipse(x+w*0.64,y+h*0.42,4,5,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#222";
    ctx.beginPath(); ctx.arc(x+w*0.36,y+h*0.42,1.2,0,Math.PI*2);
    ctx.arc(x+w*0.64,y+h*0.42,1.2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#b33"; ctx.beginPath(); ctx.arc(x+w*0.5,y+h*0.68,5,0,Math.PI*2); ctx.fill();
  } else {
    // 👀 Normal eyes: follow movement
    let vx=0;if(keys['ArrowLeft']||keys['a'])vx=-1;if(keys['ArrowRight']||keys['d'])vx=1;
    const eyeBaseY=y+h*0.42;
    const eyeYOffset=clamp(-mario.vy*0.35,-6,6);
    const eyeXOffset=clamp(vx*4,-4,4);
    ctx.fillStyle='#222';
    ctx.beginPath();
    ctx.arc(x+w*0.36+eyeXOffset,eyeBaseY+eyeYOffset,2.5,0,Math.PI*2);
    ctx.arc(x+w*0.64+eyeXOffset,eyeBaseY+eyeYOffset,2.5,0,Math.PI*2); ctx.fill();

    // 😀 Mouth
    if(surveyDone){
      ctx.strokeStyle='#3b2a1a'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(x+w*0.5,y+h*0.65,10,0.1,Math.PI-0.1); ctx.stroke();
      ctx.fillStyle='#b33'; ctx.beginPath(); ctx.ellipse(x+w*0.5,y+h*0.70,8,5,0,0,Math.PI*2); ctx.fill();
    } else {
      ctx.strokeStyle='#3b2a1a'; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.arc(x+w*0.5,y+h*0.64,4,0.15,Math.PI-0.15); ctx.stroke();
    }
  }

  // ⭐ Stars when shocked
  updateStars(); drawStars();

  ctx.restore();
}

// ---------- Stars ----------
function updateStars(){
  mario.stars.forEach(s=>{
    s.x+=s.dx; s.y+=s.dy; s.dy+=0.08; s.life--; s.ang+=s.spin;
  });
  mario.stars=mario.stars.filter(s=>s.life>0);
}
function drawStars(){
  mario.stars.forEach(s=>{
    const alpha=Math.max(0,s.life/50);
    const size=4+(s.life/10);
    ctx.fillStyle=`rgba(255,215,0,${alpha})`;
    drawStar(ctx,s.x,s.y,5,size,size/2,s.ang);
  });
}
function drawStar(ctx,cx,cy,spikes,outerR,innerR,rot){
  let step=Math.PI/spikes, angle=rot;
  ctx.beginPath();
  for(let i=0;i<spikes;i++){
    ctx.lineTo(cx+Math.cos(angle)*outerR,cy+Math.sin(angle)*outerR);
    angle+=step;
    ctx.lineTo(cx+Math.cos(angle)*innerR,cy+Math.sin(angle)*innerR);
    angle+=step;
  }
  ctx.closePath(); ctx.fill();
}

// ---------- Question Panel ----------
function drawQuestionPanel(){ /* unchanged */ }
function wrapText(ctx,text,x,y,maxWidth,lineHeight){ /* unchanged */ }

// ---------- Ensure blocks recalc ----------
const origAdvance=advanceQuestion;
advanceQuestion=function(){ origAdvance(); layoutAnswerBlocks(); };
