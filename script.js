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

// Mario properties
const mario = {
    x: 60, y: HEIGHT - 80,
    w: 32, h: 44,
    vy: 0,
    onGround: true,
    speed: 3,
    color: '#ff5533'
};

// Obstacles (Goombas)
let goombas = [
    { x: 350, y: HEIGHT - 48, w: 30, h: 28, dir: 1, spd: 1.2 },
    { x: 600, y: HEIGHT - 48, w: 30, h: 28, dir: -1, spd: 1.6 }
];

// Survey Blocks per question
const questionBlocks = [];
const blockW = 60, blockH = 18, blockGap = 110;
let currentQ = 0;
let surveyAnswers = [];

// Generate blocks for questions (evenly spaced horizontally)
(function genBlocks() {
    let startX = 170;
    for(let i=0; i<questions.length; ++i) {
        let y = HEIGHT - 130;
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
            mario.vy = -8.5;
            mario.onGround = false;
        }

        mario.x = Math.max(0, Math.min(WIDTH-mario.w, mario.x));
        mario.vy += 0.45; // gravity
        mario.y += mario.vy;
        if (mario.y + mario.h >= HEIGHT - 36) { // ground
            mario.y = HEIGHT - 36 - mario.h;
            mario.vy = 0;
            mario.onGround = true;
        }

        // Check Mario with Goombas
        for (let g of goombas) {
            g.x += g.dir * g.spd;
            if (g.x <= 0 || g.x+g.w >= WIDTH) g.dir *= -1;
            if (rectsCollide(mario, g)) {
                // Reset Mario to start
                mario.x = 60; mario.y = HEIGHT - 80;
            }
        }

        // Check Mario with current question block
        let qb = questionBlocks[currentQ];
        if (rectsCollide(mario, qb)) {
            if (questions[currentQ].type === "scale") {
                // Show scale choices above block
                // User must jump and hit the answer block
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
    ctx.fillStyle = "#6a4";
    ctx.fillRect(0, HEIGHT-36, WIDTH, 36);

    // Draw question blocks
    for(let i=0; i<questionBlocks.length; ++i) {
        let b = questionBlocks[i];
        ctx.fillStyle = (i === currentQ) ? "#f5c542" : "#ffda7a";
        ctx.strokeStyle = "#c97e02";
        ctx.lineWidth = 3;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = "#222";
        ctx.font = "18px monospace";
        ctx.fillText("Q"+(i+1), b.x+10, b.y+blockH-4);

        if (i === currentQ) {
            // Draw question above
            ctx.font = "18px Arial";
            ctx.fillStyle = "#333";
            ctx.fillText(questions[i].text, Math.max(40,b.x-80), b.y-30, 400);

            if (questions[i].type === "scale") {
                // Draw answer blocks above
                let scaleRects = getScaleChoiceRects(b);
                for(let s=0; s<scaleRects.length; ++s) {
                    let r = scaleRects[s];
                    ctx.fillStyle = "#fff";
                    ctx.strokeStyle = "#999";
                    ctx.fillRect(r.x, r.y, r.w, r.h);
                    ctx.strokeRect(r.x, r.y, r.w, r.h);
                    ctx.fillStyle = "#222";
                    ctx.font = "16px Arial";
                    ctx.fillText(""+(s+questions[i].scaleMin), r.x+18, r.y+22);
                    if (questions[i].scaleLabels[s]) {
                        ctx.font = "12px Arial";
                        ctx.fillText(questions[i].scaleLabels[s], r.x-6, r.y-6);
                    }
                    // Show "selected" if Mario is on this answer block
                    if (mario.y+mario.h > r.y && mario.y < r.y+r.h && mario.x+mario.w > r.x && mario.x < r.x+r.w) {
                        ctx.strokeStyle = "#f00";
                        ctx.lineWidth = 3;
                        ctx.strokeRect(r.x-2, r.y-2, r.w+4, r.h+4);
                        if (mario.onGround && keys[" "]) {
                            submitScaleAnswer(s+questions[i].scaleMin);
                        }
                    }
                }
            }
        }
    }

    // Draw Goombas
    for(let g of goombas) {
        ctx.fillStyle = "#a52a2a";
        ctx.beginPath();
        ctx.ellipse(g.x+g.w/2, g.y+g.h-6, 15, 13, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(g.x+g.w/2-6, g.y+g.h-13, 4, 0, Math.PI*2); // eye left
        ctx.arc(g.x+g.w/2+6, g.y+g.h-13, 4, 0, Math.PI*2); // eye right
        ctx.fill();
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(g.x+g.w/2-6, g.y+g.h-13, 2, 0, Math.PI*2);
        ctx.arc(g.x+g.w/2+6, g.y+g.h-13, 2, 0, Math.PI*2);
        ctx.fill();
    }

    // Draw Mario
    ctx.save();
    ctx.translate(mario.x + mario.w/2, mario.y + mario.h/2);
    ctx.scale(1.1,1.1);
    ctx.fillStyle = mario.color;
    ctx.fillRect(-mario.w/2, -mario.h/2, mario.w, mario.h);
    ctx.fillStyle = "#fff";
    ctx.fillRect(-mario.w/4, -mario.h/2+6, mario.w/2, mario.h/6); // face
    ctx.restore();

    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// === Helper Functions ===
function getScaleChoiceRects(block) {
    // Place answer blocks in a row above the block
    let q = questions[currentQ];
    let count = q.scaleMax - q.scaleMin + 1;
    let totalW = count*44 + (count-1)*16;
    let startX = block.x + block.w/2 - totalW/2;
    let y = block.y-55;
    let rects = [];
    for(let i=0; i<count; ++i)
        rects.push({ x: startX + i*60, y: y, w: 44, h: 36 });
    return rects;
}

// For SPACEBAR selection on scale answers
function submitScaleAnswer(val) {
    surveyAnswers.push(val);
    currentQ++;
    if (currentQ >= questions.length) finishSurvey();
    else mario.x = questionBlocks[currentQ].x - 44;
}

// Prompt for text responses
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

// End of survey
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