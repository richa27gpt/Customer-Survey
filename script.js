// script.js - Mario survey game with facial expressions and shock stars

// ---------- Configuration ----------
const SINGLE_SUBMIT = false;
const LOCAL_KEY = 'survey_completed_v1';
const LOCAL_RESPONSES_KEY = 'survey_responses';

// ---------- QUESTIONS ----------
const questions = [
  { section: "Leadership", text: "How would you rate the overall vision and strategic direction provided by XYZ’s leadership?", type: "scale", scale: 5 },
  { section: "Leadership", text: "To what extent do you feel XYZ’s leadership is aligned with your organization’s goals and priorities?", type: "scale", scale: 5 },
  { section: "Leadership", text: "Over the past year, what specific improvements or changes in XYZ’s leadership have you noticed?", type: "text" },
  { section: "Leadership", text: "Looking forward, what do XYZ’s leadership need to improve to support you better?", type: "text" },
  { section: "Account Management", text: "How satisfied are you with the responsiveness and engagement of your account manager?", type: "scale", scale: 5 },
  { section: "Account Management", text: "Has your account manager changed this year? If Yes, to what extent has this change affected your experience of XYZ (1 = Much Worse, 5 = Much Better)?", type: "scale", scale: 5 },
  { section: "Account Management", text: "To what extent do you feel your account manager is aligned with your organization’s goals and priorities?", type: "scale", scale: 5 },
  { section: "Account Management", text: "What additional steps could your account manager take to improve responsiveness, engagement, or alignment with your organization?", type: "text" },
  { section: "Service Delivery", text: "How would you rate the overall quality of service delivery provided by XYZ?", type: "scale", scale: 5 },
  { section: "Service Delivery", text: "How satisfied are you with XYZ’s response times to your requests or issues?", type: "scale", scale: 5 },
  { section: "Service Delivery", text: "How do you rate XYZ’s overall technical competency for the services provided to you?", type: "scale", scale: 5 },
  { section: "Service Delivery", text: "What improvements, if any, have you noticed in XYZ’s service delivery over the past year?", type: "text" },
  { section: "Service Delivery", text: "How can XYZ further improve future service delivery?", type: "text" },
  { section: "Credibility", text: "How would you rate XYZ’s credibility as a trusted partner?", type: "scale", scale: 5 },
  { section: "Credibility", text: "How engaged do you feel XYZ is in supporting your business goals and priorities?", type: "scale", scale: 5 },
  { section: "Credibility", text: "What additional steps could XYZ take to improve their credibility or engagement with your organization?", type: "text" },
  { section: "General", text: "What do you think XYZ is doing well?", type: "text" },
  { section: "General", text: "What areas do you think XYZ could improve?", type: "text" }
];

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

let answerBlocks = [];
const blockW = 48, blockH = 34, blockGap = 18, blockAbove = 108;
let coinPops = [], fireworks = [], balloons = [];
let currentQ = 0, answers = [], surveyDone = false, showingPrompt = false;
let lastSelectionTime = 0, endCelebrationRunning = false, endJumpTimer = 0, endSpawnInterval = null;

// ---------- Input ----------
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

// ---------- Helpers ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const now = () => new Date().getTime();
function rectsCollide(a, b) { return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }

// ---------- Player Drawing ----------
function drawPlayer(x,y,w,h){
  ctx.save();
  // Body
  ctx.fillStyle='#e84c3d';
  roundRect(ctx,x,y,w,h,6,true,false);
  ctx.fillStyle='#bd2e2e';
  ctx.fillRect(x,y,w,Math.round(h*0.18));
  ctx.fillStyle='#ffe6cf';
  ctx.fillRect(x+w*0.18,y+8,w*0.64,8);

  if(mario.shocked){
    // 😲 shocked face
    ctx.fillStyle="#fff";
    ctx.beginPath();
    ctx.ellipse(x+w*0.36,y+h*0.42,4,5,0,0,Math.PI*2);
    ctx.ellipse(x+w*0.64,y+h*0.42,4,5,0,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle="#222";
    ctx.beginPath();
    ctx.arc(x+w*0.36,y+h*0.42,1.2,0,Math.PI*2);
    ctx.arc(x+w*0.64,y+h*0.42,1.2,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle="#b33";
    ctx.beginPath();
    ctx.arc(x+w*0.5,y+h*0.68,5,0,Math.PI*2);
    ctx.fill();
  } else {
    // Normal eyes: follow motion
    let vx=0;if(keys['ArrowLeft']||keys['a'])vx=-1;if(keys['ArrowRight']||keys['d'])vx=1;
    const eyeBaseY=y+h*0.42;
    const eyeYOffset=clamp(-mario.vy*0.35,-6,6);
    const eyeXOffset=clamp(vx*4,-4,4);
    ctx.fillStyle='#222';
    ctx.beginPath();
    ctx.arc(x+w*0.36+eyeXOffset,eyeBaseY+eyeYOffset,2.5,0,Math.PI*2);
    ctx.arc(x+w*0.64+eyeXOffset,eyeBaseY+eyeYOffset,2.5,0,Math.PI*2);
    ctx.fill();

    // Mouth
    if(surveyDone){
      ctx.strokeStyle='#3b2a1a'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(x+w*0.5,y+h*0.65,10,0.1,Math.PI-0.1); ctx.stroke();
      ctx.fillStyle='#b33'; ctx.beginPath(); ctx.ellipse(x+w*0.5,y+h*0.70,8,5,0,0,Math.PI*2); ctx.fill();
    } else {
      ctx.strokeStyle='#3b2a1a'; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.arc(x+w*0.5,y+h*0.64,4,0.15,Math.PI-0.15); ctx.stroke();
    }
  }

  // Stars effect if shocked
  updateStars();
  drawStars();
  ctx.restore();
}

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

function roundRect(ctx,x,y,w,h,r,fill,stroke){
  if(typeof r==='undefined')r=5;
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
  if(fill)ctx.fill();
  if(stroke)ctx.stroke();
}
