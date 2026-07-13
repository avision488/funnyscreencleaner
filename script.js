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

let stageWidth = 0;
let stageHeight = 0;

let cleanerX = 24;
let cleanerY = 24;
let cleanerTargetX = 24;
let cleanerTargetY = 24;
let lastStableTargetX = 24;
let lastStableTargetY = 24;
let direction = 1;

let cleanerState = 'idle';
let bubbleTimer = null;
let cleanTimer = null;
let actionLockUntil = 0;

let pointer = {
  x: 0,
  y: 0,
  active: false,
  inside: false,
  worldX: 0,
  worldY: 0
};

let dirtDots = [];
let smudges = [];
let drops = [];
let fogPasses = [];

let customCursor = null;
let animationId = null;
let randomEventInterval = null;

const TARGET_UPDATE_GAP = 16;
const TARGET_STOP_EPSILON = 18;
const ARRIVAL_EPSILON = 1.8;
const DIRECTION_EPSILON = 8;

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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * devicePixelRatio;
  canvas.height = rect.height * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

  stageWidth = rect.width;
  stageHeight = rect.height;

  const cleanerWidth = cleaner.offsetWidth || 120;
  const cleanerHeight = cleaner.offsetHeight || 120;

  cleanerX = clamp(cleanerX, 0, Math.max(0, stageWidth - cleanerWidth));
  cleanerY = clamp(cleanerY, 0, Math.max(0, stageHeight - cleanerHeight));
  cleanerTargetX = clamp(cleanerTargetX, 0, Math.max(0, stageWidth - cleanerWidth));
  cleanerTargetY = clamp(cleanerTargetY, 0, Math.max(0, stageHeight - cleanerHeight));
  lastStableTargetX = cleanerTargetX;
  lastStableTargetY = cleanerTargetY;

  if (!dirtDots.length) seedDirt();
  drawScene();
  renderCleaner();
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
      a: random(0.2, 0.55)
    });
  }

  for (let i = 0; i < 12; i++) {
    smudges.push({
      x: random(40, rect.width - 40),
      y: random(30, rect.height - 30),
      w: random(40, 120),
      h: random(18, 48),
      rot: random(-0.8, 0.8),
      a: random(0.06, 0.13)
    });
  }

  for (let i = 0; i < 14; i++) {
    drops.push({
      x: random(20, rect.width - 20),
      y: random(20, rect.height - 20),
      r: random(8, 20),
      trail: random(12, 50)
    });
  }

  for (let i = 0; i < 5; i++) {
    fogPasses.push({
      x: random(0, rect.width),
      y: random(0, rect.height),
      r: random(120, 220),
      a: random(0.12, 0.22)
    });
  }
}

function drawScene() {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  ctx.fillStyle = 'rgba(255,255,255,0.10)';
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
    ctx.strokeStyle = 'rgba(210, 236, 255, 0.38)';
    ctx.fillStyle = 'rgba(220, 245, 255, 0.26)';
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

  ctx.strokeStyle = 'rgba(120,120,120,0.14)';
  ctx.lineWidth = 2;

  prints.forEach(print => {
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(print.x, print.y, (24 + i * 8) * print.s, Math.PI * 0.15, Math.PI * 1.85);
      ctx.stroke();
    }
  });
}

function eraseAt(x, y, radius = 60) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';

  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(0.52, 'rgba(0,0,0,0.98)');
  g.addColorStop(0.84, 'rgba(0,0,0,0.42)');
  g.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  dirtLevel = Math.max(0, dirtLevel - 0.7);
  dirtLevelEl.textContent = Math.round(dirtLevel);
}

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();

  if (event.touches && event.touches[0]) {
    return {
      x: event.touches[0].clientX - rect.left,
      y: event.touches[0].clientY - rect.top,
      worldX: event.touches[0].clientX,
      worldY: event.touches[0].clientY
    };
  }

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    worldX: event.clientX,
    worldY: event.clientY
  };
}

function setCursorVisible(visible) {
  if (!customCursor) return;
  customCursor.style.opacity = visible ? '1' : '0';
}

function updateCursorPosition(worldX, worldY) {
  if (!customCursor) return;
  customCursor.style.left = `${worldX}px`;
  customCursor.style.top = `${worldY}px`;
}

function getCleanerAnchorOffsets() {
  const cleanerWidth = cleaner.offsetWidth || 120;
  const cleanerHeight = cleaner.offsetHeight || 120;

  return {
    width: cleanerWidth,
    height: cleanerHeight,
    offsetX: direction === 1 ? cleanerWidth * 0.74 : cleanerWidth * 0.26,
    offsetY: cleanerHeight * 0.66
  };
}

function updateCleanerTarget(x, y, force = false) {
  const { width, height, offsetX, offsetY } = getCleanerAnchorOffsets();

  const nextX = clamp(x - offsetX, 0, Math.max(0, stageWidth - width));
  const nextY = clamp(y - offsetY, 0, Math.max(0, stageHeight - height));

  const dx = nextX - lastStableTargetX;
  const dy = nextY - lastStableTargetY;
  const moved = Math.hypot(dx, dy);

  if (force || moved >= TARGET_UPDATE_GAP) {
    cleanerTargetX = nextX;
    cleanerTargetY = nextY;
    lastStableTargetX = nextX;
    lastStableTargetY = nextY;
  }
}

function onMove(event) {
  const pos = pointerPosition(event);

  pointer.x = pos.x;
  pointer.y = pos.y;
  pointer.worldX = pos.worldX;
  pointer.worldY = pos.worldY;
  pointer.active = true;
  pointer.inside = true;

  updateCursorPosition(pos.worldX, pos.worldY);
  setCursorVisible(true);
  updateCleanerTarget(pos.x, pos.y);
  eraseAt(pos.x, pos.y, 60);

  if (Date.now() > actionLockUntil && cleanerState !== 'cleaning') {
    setCleanerState('cleaning');
  }

  clearTimeout(cleanTimer);
  cleanTimer = setTimeout(() => {
    pointer.active = false;
    if (Date.now() > actionLockUntil) {
      setCleanerState('walking');
    }
  }, 120);
}

function setCleanerState(state) {
  if (cleanerState === state) return;

  cleaner.className = `cleaner ${state}`;
  cleanerState = state;
  moodLabel.textContent = moods[state] || 'Happy';

  const spriteMap = {
    idle: 'images/idle.png',
    walking: 'images/cleaner_walk.png',
    cleaning: 'images/cleaner_clean.png',
    slipping: 'images/cleaner_slip.png',
    dancing: 'images/cleaner_dance.png',
    sleeping: 'images/cleaner_sleep.png',
    angry: 'images/cleaner_angry.png',
    coffee: 'images/cleaner_coffee.png'
  };

  cleanerSprite.src = spriteMap[state] || spriteMap.idle;
}

function showBubble(text) {
  speechBubble.textContent = text;
  speechBubble.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => speechBubble.classList.remove('show'), 2400);
}

function renderCleaner() {
  cleaner.style.left = `${Math.round(cleanerX)}px`;
  cleaner.style.top = `${Math.round(cleanerY)}px`;
  cleaner.style.bottom = 'auto';
}

function moveCleaner() {
  const dx = cleanerTargetX - cleanerX;
  const dy = cleanerTargetY - cleanerY;
  const distance = Math.hypot(dx, dy);

  if (Math.abs(dx) > DIRECTION_EPSILON) {
    direction = dx > 0 ? 1 : -1;
  }

  let ease = 0.06;
  let maxStep = 6;

  if (pointer.active) {
    ease = 0.075;
    maxStep = 7;
  }

  if (cleanerState === 'cleaning') {
    ease = 0.085;
    maxStep = 7.5;
  }

  if (distance > ARRIVAL_EPSILON) {
    const stepX = dx * ease;
    const stepY = dy * ease;

    cleanerX += clamp(stepX, -maxStep, maxStep);
    cleanerY += clamp(stepY, -maxStep, maxStep);

    if (Date.now() > actionLockUntil && !pointer.active && cleanerState !== 'walking') {
      setCleanerState('walking');
    }
  } else {
    cleanerX = cleanerTargetX;
    cleanerY = cleanerTargetY;

    if (!pointer.active && Date.now() > actionLockUntil) {
      setCleanerState('idle');
    }
  }

  const remainingDx = cleanerTargetX - cleanerX;
  const remainingDy = cleanerTargetY - cleanerY;
  const remaining = Math.hypot(remainingDx, remainingDy);

  if (!pointer.active && remaining <= TARGET_STOP_EPSILON && Date.now() > actionLockUntil) {
    cleanerTargetX = lastStableTargetX;
    cleanerTargetY = lastStableTargetY;
  }

  cleaner.style.transform = `translate3d(0,0,0) scaleX(${direction === 1 ? 1 : -1})`;
  renderCleaner();
  animationId = requestAnimationFrame(moveCleaner);
}

function triggerTemporaryState(state, message, duration) {
  actionLockUntil = Date.now() + duration;
  setCleanerState(state);
  if (message) showBubble(message);

  window.setTimeout(() => {
    if (Date.now() >= actionLockUntil) {
      setCleanerState(pointer.active ? 'cleaning' : 'walking');
    }
  }, duration);
}

function randomEvent() {
  if (!funnyMode) return;
  if (pointer.active) return;
  if (Date.now() < actionLockUntil) return;

  const chance = Math.random();

  if (chance < 0.18) {
    triggerTemporaryState('slipping', 'WHO PUT SOAP HERE 😵', 1500);
  } else if (chance < 0.35) {
    triggerTemporaryState('sleeping', 'just 5 more seconds... zzz', 2200);
  } else if (chance < 0.52) {
    triggerTemporaryState('dancing', 'cleaning dance mode 💃', 1900);
  } else if (chance < 0.68) {
    triggerTemporaryState('angry', lines[Math.floor(Math.random() * lines.length)], 1600);
  } else if (chance < 0.82) {
    triggerTemporaryState('coffee', 'tiny coffee break ☕', 1700);
  } else {
    showBubble(lines[Math.floor(Math.random() * lines.length)]);
  }
}

function cleanAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dirtLevel = 0;
  dirtLevelEl.textContent = '0';
  triggerTemporaryState('dancing', 'Yay! shiny screen unlocked ✨', 1800);
}

function addDirt() {
  dirtLevel = Math.min(100, dirtLevel + 26);
  dirtLevelEl.textContent = Math.round(dirtLevel);
  seedDirt();
  drawScene();
  triggerTemporaryState('angry', 'Bro... more dirt again?!', 1500);
}

function changeTheme() {
  currentTheme = (currentTheme + 1) % themes.length;
  const theme = themes[currentTheme];
  document.documentElement.setAttribute('data-theme', theme);
  themeLabel.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
  showBubble(`${themeLabel.textContent} theme activated 🎨`);
}

function toggleFunnyMode() {
  funnyMode = !funnyMode;
  funnyBtn.textContent = `Funny Mode: ${funnyMode ? 'On' : 'Off'}`;
  funnyBtn.setAttribute('aria-pressed', String(funnyMode));
  showBubble(funnyMode ? 'okay, jokes are back 😌' : 'serious cleaning mode 😐');
}

function setupMobCursor() {
  customCursor = document.createElement('img');
  customCursor.src = 'images/mob.png';
  customCursor.alt = '';
  customCursor.setAttribute('aria-hidden', 'true');

  Object.assign(customCursor.style, {
    position: 'fixed',
    left: '0px',
    top: '0px',
    width: '58px',
    height: '58px',
    objectFit: 'contain',
    pointerEvents: 'none',
    userSelect: 'none',
    zIndex: '12',
    opacity: '0',
    transform: 'translate(-50%, -50%) translateZ(0)',
    transition: 'opacity 140ms ease'
  });

  document.body.appendChild(customCursor);
  canvas.style.cursor = 'none';
}

function handlePointerEnter(event) {
  const pos = pointerPosition(event);
  pointer.active = true;
  pointer.inside = true;
  pointer.x = pos.x;
  pointer.y = pos.y;
  pointer.worldX = pos.worldX;
  pointer.worldY = pos.worldY;

  updateCursorPosition(pos.worldX, pos.worldY);
  setCursorVisible(true);
  updateCleanerTarget(pos.x, pos.y, true);
}

function handlePointerLeave() {
  pointer.active = false;
  pointer.inside = false;
  clearTimeout(cleanTimer);
  setCursorVisible(false);

  if (Date.now() > actionLockUntil) {
    setCleanerState('walking');
  }
}

cleanAllBtn.addEventListener('click', cleanAll);
addDirtBtn.addEventListener('click', addDirt);
themeBtn.addEventListener('click', changeTheme);
funnyBtn.addEventListener('click', toggleFunnyMode);

canvas.addEventListener('mousemove', onMove);
canvas.addEventListener('mouseenter', handlePointerEnter);
canvas.addEventListener('mouseleave', handlePointerLeave);

canvas.addEventListener('touchstart', (event) => {
  handlePointerEnter(event);
  onMove(event);
}, { passive: true });

canvas.addEventListener('touchmove', onMove, { passive: true });

canvas.addEventListener('touchend', () => {
  handlePointerLeave();
}, { passive: true });

window.addEventListener('resize', resizeCanvas);

setupMobCursor();
resizeCanvas();

cleanerTargetX = cleanerX;
cleanerTargetY = cleanerY;
lastStableTargetX = cleanerX;
lastStableTargetY = cleanerY;

setCleanerState('idle');

if (animationId) cancelAnimationFrame(animationId);
moveCleaner();

if (randomEventInterval) clearInterval(randomEventInterval);
randomEventInterval = setInterval(randomEvent, 5800);

showBubble('Move your mouse and clean me please 🧼');