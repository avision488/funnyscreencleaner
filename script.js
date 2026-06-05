const canvas = document.getElementById('dirtCanvas');
const ctx = canvas.getContext('2d');
const cleaner = document.getElementById('cleaner');
const cleanerSprite = document.getElementById('cleanerSprite');
const speechBubble = document.getElementById('speechBubble');
const dirtLevelEl = document.getElementById('dirtLevel');
const themeLabel = document.getElementById('themeLabel');
const moodLabel = document.getElementById('moodLabel');

const cleanAllBtn = document.getElementById('cleanAllBtn');
const addDirtBtn = document.getElementById('addDirtBtn');
const themeBtn = document.getElementById('themeBtn');

const funnyBtn = document.getElementById('funnyBtn');

const themes = ['cozy', 'cyberpunk', 'cartoon'];
let currentTheme = 0;
let funnyMode = true;
let dirtLevel = 72;
let cleanerX = 20;
let direction = 1;

let stageWidth = 0;
let cleanerState = 'idle';
let bubbleTimer = null;
let pointer = { x: 0, y: 0, active: false };
let dirtDots = [];
let smudges = [];
let drops = [];

let fogPasses = [];

const lines = [
  'Bro this screen is impossible 😭',
  'I just cleaned this...',
  'Why so much dirt?',

  'Okay okay, I got this 😎',
  'Please tell me this is chocolate...',
  'Tiny coffee break time ☕',
  'Mouse, help me clean faster!',

  'I slipped but I am still professional.'
];

const moods = {
  idle: 'Happy',
  walking: 'Working',
  cleaning: 'Focused',
  slipping: 'Oops',
  dancing: 'Party',

  sleeping: 'Sleepy',
  angry: 'Angry',
  coffee: 'Break Time'
};

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * devicePixelRatio;

  canvas.height = rect.height * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  stageWidth = rect.width;
  if (!dirtDots.length) seedDirt();
  drawScene();
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function seedDirt() {
  const rect = canvas.getBoundingClientRect();
  dirtDots = [];
  smudges = [];
  drops = [];
  fogPasses = [];

  for (let i = 0; i < 60; i++) {
    dirtDots.push({
         x: random(10, rect.width - 10),

         y: random(10, rect.height - 10), 
         r: random(5, 17), 
         a: random(0.2, 0.55) });
  }
  for (let i = 0; i < 12; i++) {
    smudges.push({ 
        x: random(40, rect.width - 40), 
        y: random(30, rect.height - 30), 

        w: random(40, 120), h: random(18, 48), 
        rot: random(-0.8, 0.8), 
        a: random(0.06, 0.13) });
  }
  for (let i = 0; i < 14; i++) {
    drops.push({ 
        x: random(20, rect.width - 20), 
        y: random(20, rect.height - 20), 
        r: random(8, 20), 
        trail: random(12, 50) });
  }
  for (let i = 0; i < 5; i++) {
    fogPasses.push({ 
        x: random(0, rect.width),

     y: random(0, rect.height), 
     r: random(120, 220), 

     a: random(0.12, 0.22) });
  }
}

function drawScene() {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  ctx.fillStyle = 'rgba(255,255,255,0.1)';

  ctx.fillRect(0, 0, rect.width, rect.height);

  fogPasses.forEach(fog => {
    const g = ctx.createRadialGradient(fog.x, fog.y, 10, fog.x, fog.y, fog.r);
    g.addColorStop(0, `rgba(255,255,255,${fog.a})`);

    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;

    ctx.beginPath();
    ctx.arc(fog.x, fog.y, fog.r, 0, Math.PI * 2);
    ctx.fill();
  });

  smudges.forEach(s => {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    ctx.fillStyle = `rgba(90, 70, 60, ${s.a})`;

    ctx.beginPath();
    ctx.ellipse(0, 0, s.w, s.h, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  dirtDots.forEach(dot => {
    ctx.fillStyle = `rgba(88, 74, 65, ${dot.a})`;
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
    ctx.fill();
  });

  drops.forEach(drop => {
    ctx.strokeStyle = 'rgba(210, 236, 255, 0.35)';

    ctx.fillStyle = 'rgba(220, 245, 255, 0.24)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    ctx.arc(drop.x, drop.y, drop.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(drop.x, drop.y + drop.r * 0.4);
    ctx.lineTo(drop.x, drop.y + drop.r + drop.trail);
    ctx.stroke();
  });

  drawFingerprints(rect.width, rect.height);
}

function drawFingerprints(width, height) {
  const prints = [
    { x: width * 0.17, y: height * 0.52, s: 1 },
    { x: width * 0.8, y: height * 0.35, s: 0.9 }
  ];

  ctx.strokeStyle = 'rgba(120,120,120,0.13)';
  ctx.lineWidth = 2;
  prints.forEach(print => {
    for (let i = 0; i < 4; i++) {

      ctx.beginPath();
      ctx.arc(print.x, print.y, (24 + i * 8) * print.s, Math.PI * 0.15, Math.PI * 1.85);
      ctx.stroke();
    }
  });
}

function eraseAt(x, y, radius = 32) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  const gradient = ctx.createRadialGradient

  (x, y, radius * 0.2, x, y, radius);
  gradient.addColorStop(0, 'rgba(0,0,0,0.9)');

  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);

  ctx.fill();
  ctx.restore();

  dirtLevel = Math.max(0, dirtLevel - 0.35);
  dirtLevelEl.textContent = Math.round(dirtLevel);
}

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  if (event.touches && event.touches[0]) {
    return {
         x: event.touches[0].clientX - rect.left,

         y: event.touches[0].clientY - rect.top };
  }
  return {
     x: event.clientX - rect.left, 
     y: event.clientY - rect.top };
}

function onMove(event) {
  const pos = pointerPosition(event);
  pointer = { 
    
    x: pos.x, 
    y: pos.y, active: true };
  eraseAt(pos.x,
     pos.y, 34);

  if (cleanerState !== 'cleaning' && cleanerState !== 'slipping') {
    setCleanerState('cleaning');
    showBubble('Good, keep wiping ✨');

    clearTimeout(window.cleanTimer);
    window.cleanTimer = setTimeout(() => 
        setCleanerState('walking'), 650);
  }
}

function setCleanerState(state) {
  cleaner.className = `cleaner ${state}`;

  cleanerState = state;
  moodLabel.textContent = moods[state] || 'Happy';

  const spriteMap = {
    idle: "images/idle.png",
    walking: "images/cleaner_walk.png",
    cleaning: "images/cleaner_clean.png",
    slipping: "images/cleaner_slip.png",
    dancing: "images/cleaner_dance.png",
    sleeping: "images/cleaner_sleep.png",

    angry: "images/cleaner_angry.png",
    coffee: "images/cleaner_coffee.png"
  };
  cleanerSprite.src = spriteMap[state] || spriteMap.idle;
}

function showBubble(text) {
  speechBubble.textContent = text;
  speechBubble.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => speechBubble.classList.remove('show'), 2200);
}

function moveCleaner() {
  const limit = Math.max(40, stageWidth - cleaner.offsetWidth - 12);
  cleanerX += 0.8 * direction;

  if (pointer.active) {
    if (pointer.x > cleanerX + 40) direction = 1;
    if (pointer.x < cleanerX - 40) direction = -1;
  }

  if (cleanerX < 0) direction = 1;
  if (cleanerX > limit) direction = -1;


  cleaner.style.left = `${cleanerX}px`;
  cleaner.style.transform = `scaleX(${direction === 1 ? 1 : -1})`;

  if (cleanerState === 'idle') setCleanerState('walking');
  requestAnimationFrame(moveCleaner);
}

function randomEvent() {
  if (!funnyMode) return;

  const chance = Math.random();

  if (chance < 0.18) {
    setCleanerState('slipping');
    showBubble('WHO PUT SOAP HERE 😵');
    setTimeout(() => setCleanerState('walking'), 1200);
  } else if (chance < 0.35) {
    setCleanerState('sleeping');

    showBubble('just 5 more seconds... zzz');
    setTimeout(() => setCleanerState('walking'), 1700);
  } else if (chance < 0.52) {

    setCleanerState('dancing');
    showBubble('cleaning dance mode 💃');
    setTimeout(() => setCleanerState('walking'), 1700);
  } else if (chance < 0.68) {
    setCleanerState('angry');

    showBubble(lines[Math.floor(Math.random() * lines.length)]);
    setTimeout(() => setCleanerState('walking'), 1300);
  } else if (chance < 0.82) {
    setCleanerState('coffee');
    moodLabel.textContent = moods.coffee;
    showBubble('tiny coffee break ☕');
    setTimeout(() => setCleanerState('walking'), 1400);
  } else {
    showBubble(lines[Math.floor(Math.random() * lines.length)]);
  }
}

function cleanAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dirtLevel = 0;
  dirtLevelEl.textContent = '0';

  setCleanerState('dancing');
  showBubble('Yay! shiny screen unlocked ✨');
  setTimeout(() => setCleanerState('idle'), 1600);
}

function addDirt() {
  dirtLevel = Math.min(100, dirtLevel + 26);

  dirtLevelEl.textContent = Math.round(dirtLevel);
  seedDirt();
  drawScene();

  setCleanerState('angry');
  showBubble('Bro... more dirt again?!');

  setTimeout(() => setCleanerState('walking'), 1300);
}

function changeTheme() {
  currentTheme = (currentTheme + 1) % themes.length;
  const theme = themes[currentTheme];

  document.documentElement.setAttribute('data-theme', theme);
  themeLabel.textContent = theme.charAt(0).toUpperCase() 
  + theme.slice(1);
  showBubble(`${themeLabel.textContent} theme activated 🎨`);
}

function toggleFunnyMode() {
  funnyMode = !funnyMode;
  funnyBtn.textContent = `Funny Mode: ${funnyMode ? 'On' : 'Off'}`;
  funnyBtn.setAttribute('aria-pressed', String(funnyMode));

  showBubble(funnyMode ? 'okay, jokes are back 😌' : 'serious cleaning mode 😐');
}

cleanAllBtn.addEventListener('click', cleanAll);
addDirtBtn.addEventListener('click', addDirt);
themeBtn.addEventListener('click', 
  changeTheme);
funnyBtn.addEventListener('click', toggleFunnyMode);

canvas.addEventListener('mousemove', onMove);
canvas.addEventListener('touchmove', onMove, { passive: true });
canvas.addEventListener('mouseenter',
   () => { pointer.active = true; });
canvas.addEventListener('mouseleave',
   () => { pointer.active = false; });
window.addEventListener('resize', resizeCanvas);

resizeCanvas();
setCleanerState('idle');
moveCleaner();
setInterval(randomEvent, 4200);

showBubble('Move your mouse and clean me please 🧼');