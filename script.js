// === Survey Questions ===
const questions = [
    {
        section: "Leadership",
        text: "How would you rate the overall vision and strategic direction provided by XYZ’s leadership?",
        type: "scale",
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: ["Very Poor", "", "", "", "Excellent"]
    },
    {
        section: "Leadership",
        text: "To what extent do you feel XYZ’s leadership is aligned with your organization’s goals and priorities?",
        type: "scale",
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: ["Not at all", "", "", "", "Completely"]
    },
    {
        section: "Leadership",
        text: "Over the past year, what specific improvements or changes in XYZ’s leadership have you noticed?",
        type: "text"
    },
    {
        section: "Account Management",
        text: "How satisfied are you with the responsiveness and engagement of your account manager?",
        type: "scale",
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: ["Very Dissatisfied", "", "", "", "Very Satisfied"]
    },
    {
        section: "Account Management",
        text: "What additional steps could your account manager take to improve responsiveness, engagement, or alignment with your organization?",
        type: "text"
    },
    {
        section: "Service Delivery",
        text: "How would you rate the overall quality of service delivery provided by XYZ?",
        type: "scale",
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: ["Very Poor", "", "", "", "Excellent"]
    },
    {
        section: "General Feedback",
        text: "What do you think XYZ is doing well?",
        type: "text"
    }
];

// === Mario Sprite/World ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width, HEIGHT = canvas.height;

// Mario properties (smaller)
const mario = {
    x: 60, y: HEIGHT - 70,
    w: 24, h: 32,
    vy: 0,
    onGround: true,
    speed: 2.2,
    color: '#ff5533'
};

// Obstacles (Goombas) smaller
let goombas = [
    { x: 350, y: HEIGHT - 36, w: 19, h: 18, dir: 1, spd: 1.12 },
    { x: 600, y: HEIGHT - 36, w: 19, h: 18, dir: -1, spd: 1.18 }
];

const blockW = 60, blockH = 18, blockGap = 110;
const questionBlocks = [];
let currentQ = 0;
let surveyAnswers = [];

(function genBlocks() {
    let startX = 170;
    for(let i=0; i<questions.length; ++i) {
        let y = HEIGHT - 110;
        questionBlocks.push({
            x: startX + i*blockGap,
            y: y,
            w: blockW,
            h: blockH,
            qIdx: i
        });
    }
})();

let keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// Mouse click for answer selection
canvas.addEventListener("mousedown", function(evt) {
    if (showingAnswers || surveyDone) return;
    if (questions[currentQ].type === "scale") {
        let scaleChoices = getScaleChoiceRects(questionBlocks[currentQ]);
        let mx = evt.offsetX, my = evt.offsetY;
        for(let i=0; i<scaleChoices.length; ++i) {
            let rc = scaleChoices[i];
            if(mx >= rc.x && mx <= rc.x+rc.w && my >= rc.y && my <= rc.y+rc.h) {
                submitScaleAnswer(i+questions[currentQ].scaleMin);
            }
        }
    }
});

function rectsCollide(a, b) {
    return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}

// === Main Game Loop ===
let surveyDone = false, showingPrompt = false, showingAnswers = false;
function gameLoop() {
    // Physics
    if (!surveyDone && !showingPrompt) {
        // Move Mario
        if (keys["ArrowLeft"] || keys["a"]) mario.x -= mario.speed;
        if (keys["ArrowRight"] || keys["d"]) mario.x += mario.speed;
        if ((keys["ArrowUp"] || keys["w"]) && mario.onGround) {
            mario.vy = -6.5;
            mario.onGround = false;
        }

        mario.x = Math.max(0, Math.min(WIDTH-mario.w, mario.x));
        mario.vy += 0.35; // gravity
        mario.y += mario.vy;
        if (mario.y + mario.h >= HEIGHT - 28) { // ground
            mario.y = HEIGHT - 28 - mario.h;
            mario.vy = 0;
            mario.onGround = true;
        }

        // Goombas
        for (let g of goombas) {
            g.x += g.dir * g.spd;
            if (g.x <= 0 || g.x+g.w >= WIDTH) g.dir *= -1;
            if (rectsCollide(mario, g)) {
                mario.x = 60; mario.y = HEIGHT - 70;
            }
        }

        // Mario with question block
        let qb = questionBlocks[currentQ];
        if (rectsCollide(mario, qb)) {
            if (questions[currentQ].type === "scale") {
                // handled in render for answer blocks
            } else if (questions[currentQ].type === "text") {
                showPrompt(questions[currentQ].text, (resp) => {
                    surveyAnswers.push(resp);
                    currentQ++;
                    if (currentQ >= questions.length) finishSurvey();
                });
            }
        }
    }

    // Draw
    ctx.clearRect(0,0,WIDTH,HEIGHT);

    // Draw ground
    ctx.fillStyle = "#6ab04c";
    ctx.fillRect(0, HEIGHT-28, WIDTH, 28);

    // Draw question blocks
    for(let i=0; i<questionBlocks.length; ++i) {
        let b = questionBlocks[i];
        ctx.fillStyle = (i === currentQ) ? "#ffe282" : "#f4e2b8";
        ctx.strokeStyle = "#c97e02";
        ctx.lineWidth = 2;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = "#3a3a3a";
        ctx.font = "15px monospace";
        ctx.fillText("Q"+(i+1), b.x+9, b.y+blockH-4);
    }

    // Draw question and answers above Mario, centered
    let qb = questionBlocks[currentQ];
    let qx = mario.x + mario.w/2 - 160;
    let qy = mario.y - 80;
    qx = Math.max(20, Math.min(qx, WIDTH-320));
    qy = Math.max(30, qy);

    // Draw panel for question
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "#fff";
    ctx.fillRect(qx, qy, 320, 74);
    ctx.restore();
    ctx.strokeStyle = "#64a9f3";
    ctx.lineWidth = 2;
    ctx.strokeRect(qx, qy, 320, 74);

    // Draw question text
    ctx.fillStyle = "#21507c";
    ctx.font = "18px 'Segoe UI', Arial, sans-serif";
    wrapText(ctx, questions[currentQ].text, qx+14, qy+26, 290, 22);

    // Draw answer blocks for scale
    if (questions[currentQ].type === "scale") {
        let scaleRects = getScaleChoiceRectsPanel(qx, qy+45);
        for(let s=0; s<scaleRects.length; ++s) {
            let r = scaleRects[s];
            ctx.fillStyle = "#ffd35c";
            ctx.strokeStyle = "#b48c19";
            ctx.lineWidth = 2;
            ctx.fillRect(r.x, r.y, r.w, r.h);
            ctx.strokeRect(r.x, r.y, r.w, r.h);
            ctx.fillStyle = "#444";
            ctx.font = "17px Arial";
            ctx.fillText(""+(s+questions[currentQ].scaleMin), r.x+14, r.y+24);

            if (questions[currentQ].scaleLabels[s]) {
                ctx.font = "11px Arial";
                ctx.fillStyle = "#888";
                ctx.fillText(questions[currentQ].scaleLabels[s], r.x-8, r.y-7);
            }

            // Highlight if Mario is on this answer block
            if (
                mario.y+mario.h > r.y && mario.y < r.y+r.h &&
                mario.x+mario.w > r.x && mario.x < r.x+r.w
            ) {
                ctx.strokeStyle = "#21507c";
                ctx.lineWidth = 3;
                ctx.strokeRect(r.x-2, r.y-2, r.w+4, r.h+4);
                if (mario.onGround && keys[" "]) {
                    submitScaleAnswer(s+questions[currentQ].scaleMin);
                }
            }
        }
    }

    // Draw Goombas (smaller)
    for(let g of goombas) {
        ctx.fillStyle = "#a52a2a";
        ctx.beginPath();
        ctx.ellipse(g.x+g.w/2, g.y+g.h-4, 9, 8, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(g.x+g.w/2-4, g.y+g.h-9, 2.6, 0, Math.PI*2); // eye left
        ctx.arc(g.x+g.w/2+4, g.y+g.h-9, 2.6, 0, Math.PI*2); // eye right
        ctx.fill();
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(g.x+g.w/2-4, g.y+g.h-9, 1.1, 0, Math.PI*2);
        ctx.arc(g.x+g.w/2+4, g.y+g.h-9, 1.1, 0, Math.PI*2);
        ctx.fill();
    }

    // Draw Mario (smaller)
    ctx.save();
    ctx.translate(mario.x + mario.w/2, mario.y + mario.h/2);
    ctx.scale(1,1);
    ctx.fillStyle = mario.color;
    ctx.fillRect(-mario.w/2, -mario.h/2, mario.w, mario.h);
    ctx.fillStyle = "#fff";
    ctx.fillRect(-mario.w/4, -mario.h/2+5, mario.w/2, mario.h/6); // face
    ctx.restore();

    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// === Helper Functions ===
function getScaleChoiceRects(block) {
    // NOT USED: kept for mouse click hit detection if needed
    let q = questions[currentQ];
    let count = q.scaleMax - q.scaleMin + 1;
    let totalW = count*38 + (count-1)*14;
    let startX = block.x + block.w/2 - totalW/2;
    let y = block.y-45;
    let rects = [];
    for(let i=0; i<count; ++i)
        rects.push({ x: startX + i*52, y: y, w: 38, h: 32 });
    return rects;
}
function getScaleChoiceRectsPanel(panelX, panelY) {
    let q = questions[currentQ];
    let count = q.scaleMax - q.scaleMin + 1;
    let totalW = count*38 + (count-1)*14;
    let startX = panelX + 160 - totalW/2;
    let rects = [];
    for(let i=0; i<count; ++i)
        rects.push({ x: startX + i*52, y: panelY, w: 38, h: 32 });
    return rects;
}
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    let words = text.split(' '), line = '';
    for(let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        if(metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        }
        else line = testLine;
    }
    ctx.fillText(line, x, y);
}
function submitScaleAnswer(val) {
    surveyAnswers.push(val);
    currentQ++;
    if (currentQ >= questions.length) finishSurvey();
    else mario.x = questionBlocks[currentQ].x - 44;
}
function showPrompt(text, cb) {
    showingPrompt = true;
    document.getElementById('gamePrompt').classList.remove('hidden');
    document.getElementById('promptText').textContent = text;
    document.getElementById('promptInput').value = "";
    document.getElementById('promptInput').focus();
    document.getElementById('promptBtn').onclick = function() {
        let resp = document.getElementById('promptInput').value.trim();
        if (!resp) return;
        document.getElementById('gamePrompt').classList.add('hidden');
        showingPrompt = false;
        cb(resp);
    };
}
function finishSurvey() {
    surveyDone = true;
    setTimeout(() => {
        document.getElementById('thankyou').classList.remove('hidden');
        document.getElementById('answers').textContent = questions.map((q,i)=>
            `${i+1}. [${q.section}] ${q.text}\nResponse: ${surveyAnswers[i]}\n`
        ).join('\n');
        showingAnswers = true;
    }, 900);
}
