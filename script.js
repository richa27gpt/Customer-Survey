// === Survey Questions (edit as needed) ===
const questions = [
    {
        text: "How would you rate the overall vision and strategic direction provided by XYZ’s leadership?",
        type: "scale", labels: ["Very Poor", "", "", "", "Excellent"]
    },
    {
        text: "To what extent do you feel XYZ’s leadership is aligned with your organization’s goals and priorities?",
        type: "scale", labels: ["Not at all", "", "", "", "Completely"]
    },
    {
        text: "What specific improvements or changes in XYZ’s leadership have you noticed?",
        type: "text"
    },
    {
        text: "How satisfied are you with the responsiveness and engagement of your account manager?",
        type: "scale", labels: ["Very Dissatisfied", "", "", "", "Very Satisfied"]
    },
    {
        text: "What can your account manager do to improve responsiveness or engagement?",
        type: "text"
    },
    {
        text: "How would you rate the overall quality of service delivery provided by XYZ?",
        type: "scale", labels: ["Very Poor", "", "", "", "Excellent"]
    },
    {
        text: "What do you think XYZ is doing well?",
        type: "text"
    }
];

// === Mario Game Variables ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

// Mario
const mario = {
    x: 60, y: H-70, w: 28, h: 35,
    vy: 0, onGround: true, speed: 2.2, color: '#e74c3c'
};
// Goombas
let goombas = [
    { x: 350, y: H-35, w: 18, h: 17, dir: 1, spd: 1.18 },
    { x: 600, y: H-35, w: 18, h: 17, dir: -1, spd: 1.13 }
];
// Question state
let currentQ = 0;
let answers = [];
let surveyDone = false, showingPrompt = false;

// Keyboard
let keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// Mouse
canvas.addEventListener("mousedown", function(evt) {
    if (surveyDone || showingPrompt) return;
    if (questions[currentQ].type === "scale") {
        let choices = getScaleChoiceRects();
        let mx = evt.offsetX, my = evt.offsetY;
        for(let i=0; i<choices.length; ++i) {
            let rc = choices[i];
            if(mx >= rc.x && mx <= rc.x+rc.w && my >= rc.y && my <= rc.y+rc.h) {
                submitScaleAnswer(i+1);
            }
        }
    }
});

function rectsCollide(a, b) {
    return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}

// === Main Game Loop ===
function gameLoop() {
    if (!surveyDone && !showingPrompt) {
        // Mario movement
        if (keys["ArrowLeft"] || keys["a"]) mario.x -= mario.speed;
        if (keys["ArrowRight"] || keys["d"]) mario.x += mario.speed;
        if ((keys["ArrowUp"] || keys["w"]) && mario.onGround) {
            mario.vy = -7.1;
            mario.onGround = false;
        }
        mario.x = Math.max(0, Math.min(W-mario.w, mario.x));
        mario.vy += 0.39; // gravity
        mario.y += mario.vy;
        if (mario.y + mario.h >= H - 28) {
            mario.y = H - 28 - mario.h;
            mario.vy = 0;
            mario.onGround = true;
        }
        // Goombas
        for (let g of goombas) {
            g.x += g.dir * g.spd;
            if (g.x <= 0 || g.x+g.w >= W) g.dir *= -1;
            if (rectsCollide(mario, g)) {
                mario.x = 60; mario.y = H - 70;
            }
        }
        // Mario with answer blocks
        if (questions[currentQ].type === "scale") {
            let scales = getScaleChoiceRects();
            for(let i=0; i<scales.length; ++i) {
                let r = scales[i];
                if (rectsCollide(mario, r) && mario.onGround && keys[" "]) {
                    submitScaleAnswer(i+1);
                }
            }
        } else if (questions[currentQ].type === "text") {
            showPrompt(questions[currentQ].text, ans=>{
                answers.push(ans);
                currentQ++;
                if (currentQ >= questions.length) finishSurvey();
            });
        }
    }

    // === Drawing ===
    ctx.clearRect(0,0,W,H);
    // Ground
    ctx.fillStyle = "#43a047";
    ctx.fillRect(0, H-28, W, 28);

    // Goombas
    for(let g of goombas) {
        ctx.fillStyle = "#8d5524";
        ctx.beginPath();
        ctx.ellipse(g.x+g.w/2, g.y+g.h-3, 8, 7, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(g.x+g.w/2-4, g.y+g.h-9, 2.1, 0, Math.PI*2);
        ctx.arc(g.x+g.w/2+4, g.y+g.h-9, 2.1, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = "#222";
        ctx.beginPath();
        ctx.arc(g.x+g.w/2-4, g.y+g.h-9, 1, 0, Math.PI*2);
        ctx.arc(g.x+g.w/2+4, g.y+g.h-9, 1, 0, Math.PI*2);
        ctx.fill();
    }
    // Mario
    ctx.save();
    ctx.translate(mario.x + mario.w/2, mario.y + mario.h/2);
    ctx.fillStyle = mario.color;
    ctx.fillRect(-mario.w/2, -mario.h/2, mario.w, mario.h);
    ctx.fillStyle = "#ffe5c1";
    ctx.fillRect(-mario.w/4, -mario.h/2+6, mario.w/2, mario.h/5); // face
    ctx.restore();

    // === Survey Panel ===
    if (!surveyDone && !showingPrompt) {
        // Panel above Mario, clamped to canvas
        let pw = 410, ph = 100;
        let px = Math.max(12, Math.min(mario.x + mario.w/2 - pw/2, W - pw - 12));
        let py = Math.max(18, mario.y - ph - 18);
        // Panel
        ctx.save();
        ctx.shadowColor = "#90caf9";
        ctx.shadowBlur = 15;
        ctx.globalAlpha = 0.97;
        ctx.fillStyle = "#fff";
        ctx.fillRect(px, py, pw, ph);
        ctx.restore();
        ctx.strokeStyle = "#1e88e5";
        ctx.lineWidth = 2.6;
        ctx.strokeRect(px, py, pw, ph);
        // Question
        ctx.fillStyle = "#1565c0";
        ctx.font = "18.5px 'Segoe UI', Arial, sans-serif";
        wrapText(ctx, questions[currentQ].text, px+18, py+30, pw-36, 23);

        // Answers (scale)
        if (questions[currentQ].type === "scale") {
            let rects = getScaleChoiceRects(px, py+54, pw);
            for(let i=0; i<rects.length; ++i) {
                let r = rects[i];
                ctx.fillStyle = "#ffd35c";
                ctx.strokeStyle = "#b48c19";
                ctx.lineWidth = 2;
                ctx.fillRect(r.x, r.y, r.w, r.h);
                ctx.strokeRect(r.x, r.y, r.w, r.h);
                ctx.fillStyle = "#232323";
                ctx.font = "19px Arial";
                ctx.fillText(""+(i+1), r.x+13, r.y+23);
                if (questions[currentQ].labels[i]) {
                    ctx.font = "11px Arial";
                    ctx.fillStyle = "#666";
                    ctx.fillText(questions[currentQ].labels[i], r.x-4, r.y-8);
                }
                // Mario highlight
                if (rectsCollide(mario, r)) {
                    ctx.strokeStyle = "#1976d2";
                    ctx.lineWidth = 3.5;
                    ctx.strokeRect(r.x-2, r.y-2, r.w+4, r.h+4);
                }
            }
        }
    }

    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// Helpers
function getScaleChoiceRects(px, py, pw) {
    // Returns answer block rects for current question panel
    let q = questions[currentQ];
    let n = 5;
    let totalW = n*42 + (n-1)*16;
    let startX = (px !== undefined) ? px + pw/2 - totalW/2 : 180;
    let y = py !== undefined ? py : H-120;
    let rects = [];
    for(let i=0;i<n;++i) rects.push({x:startX+i*58,y:y,w:42,h:32});
    return rects;
}
function wrapText(ctx, text, x, y, maxWidth, lh) {
    let words = text.split(' '), line = '';
    for(let n=0; n<words.length; n++) {
        let testLine = line + words[n] + ' ';
        let m = ctx.measureText(testLine);
        if (m.width > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lh;
        } else line = testLine;
    }
    ctx.fillText(line, x, y);
}
function submitScaleAnswer(val) {
    answers.push(val);
    currentQ++;
    if (currentQ >= questions.length) finishSurvey();
    else mario.x = Math.max(60, Math.min(W-60, mario.x+60));
}
function showPrompt(text, cb) {
    showingPrompt = true;
    let box = document.getElementById('openEndedPrompt');
    box.classList.remove('hidden');
    document.getElementById('promptQuestion').textContent = text;
    let input = document.getElementById('promptInput');
    input.value = "";
    input.focus();
    document.getElementById('promptSubmit').onclick = function() {
        let v = input.value.trim();
        if (!v) return;
        box.classList.add('hidden');
        showingPrompt = false;
        cb(v);
    };
    input.onkeypress = function(e) {
        if (e.key === "Enter") document.getElementById('promptSubmit').click();
    };
}
function finishSurvey() {
    surveyDone = true;
    setTimeout(() => {
        let box = document.getElementById('thankYou');
        box.classList.remove('hidden');
        let out = questions.map((q,i)=>
            `Q: ${q.text}\nA: ${answers[i]}`
        ).join('\n\n');
        document.getElementById('surveyResult').textContent = out;
    }, 500);
}
