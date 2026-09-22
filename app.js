/* ============================================================
   Kana Quest — app logic
   ============================================================ */
'use strict';

/* ---------------- Kana data ---------------- */
const HIRA = [];
function addKana(group, list) {
  list.forEach(([k, r]) => HIRA.push({ k, r: r.split(','), g: group }));
}

addKana('basic', [
  ['あ','a'], ['い','i'], ['う','u'], ['え','e'], ['お','o'],
  ['か','ka'], ['き','ki'], ['く','ku'], ['け','ke'], ['こ','ko'],
  ['さ','sa'], ['し','shi,si'], ['す','su'], ['せ','se'], ['そ','so'],
  ['た','ta'], ['ち','chi,ti'], ['つ','tsu,tu'], ['て','te'], ['と','to'],
  ['な','na'], ['に','ni'], ['ぬ','nu'], ['ね','ne'], ['の','no'],
  ['は','ha'], ['ひ','hi'], ['ふ','fu,hu'], ['へ','he'], ['ほ','ho'],
  ['ま','ma'], ['み','mi'], ['む','mu'], ['め','me'], ['も','mo'],
  ['や','ya'], ['ゆ','yu'], ['よ','yo'],
  ['ら','ra'], ['り','ri'], ['る','ru'], ['れ','re'], ['ろ','ro'],
  ['わ','wa'], ['を','wo,o'], ['ん','n,nn'],
]);

addKana('dakuten', [
  ['が','ga'], ['ぎ','gi'], ['ぐ','gu'], ['げ','ge'], ['ご','go'],
  ['ざ','za'], ['じ','ji,zi'], ['ず','zu'], ['ぜ','ze'], ['ぞ','zo'],
  ['だ','da'], ['ぢ','ji,di,zi'], ['づ','zu,du'], ['で','de'], ['ど','do'],
  ['ば','ba'], ['び','bi'], ['ぶ','bu'], ['べ','be'], ['ぼ','bo'],
  ['ぱ','pa'], ['ぴ','pi'], ['ぷ','pu'], ['ぺ','pe'], ['ぽ','po'],
]);

addKana('combo', [
  ['きゃ','kya'], ['きゅ','kyu'], ['きょ','kyo'],
  ['しゃ','sha,sya'], ['しゅ','shu,syu'], ['しょ','sho,syo'],
  ['ちゃ','cha,tya,cya'], ['ちゅ','chu,tyu,cyu'], ['ちょ','cho,tyo,cyo'],
  ['にゃ','nya'], ['にゅ','nyu'], ['にょ','nyo'],
  ['ひゃ','hya'], ['ひゅ','hyu'], ['ひょ','hyo'],
  ['みゃ','mya'], ['みゅ','myu'], ['みょ','myo'],
  ['りゃ','rya'], ['りゅ','ryu'], ['りょ','ryo'],
  ['ぎゃ','gya'], ['ぎゅ','gyu'], ['ぎょ','gyo'],
  ['じゃ','ja,jya,zya'], ['じゅ','ju,jyu,zyu'], ['じょ','jo,jyo,zyo'],
  ['びゃ','bya'], ['びゅ','byu'], ['びょ','byo'],
  ['ぴゃ','pya'], ['ぴゅ','pyu'], ['ぴょ','pyo'],
]);

/* Katakana = hiragana chars shifted by +0x60 in Unicode */
function toKata(s) {
  return Array.from(s).map(c => String.fromCharCode(c.charCodeAt(0) + 0x60)).join('');
}
const DATA = [];
HIRA.forEach(i => DATA.push({ ...i, script: 'hiragana' }));
HIRA.forEach(i => DATA.push({ k: toKata(i.k), r: i.r.slice(), g: i.g, script: 'katakana' }));

const SCRIPT_NAMES = { hiragana: 'Hiragana', katakana: 'Katakana' };

/* ---------------- State ---------------- */
const DEFAULT_SETTINGS = { script: 'hiragana', groups: ['basic', 'dakuten', 'combo'], mode: 'normal' };
const DEFAULT_STATS = { correct: 0, wrong: 0, skips: 0, streak: 0, best: 0 };

let settings = loadJSON('kanaQuest.settings', DEFAULT_SETTINGS);
let stats = loadJSON('kanaQuest.stats', DEFAULT_STATS);
let pool = [];
let current = null;
let lastKana = null;
let busy = false;

/* ---------------- Helpers ---------------- */
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return { ...fallback, ...v };
  } catch {
    return fallback;
  }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z]/g, '');
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------------- DOM ---------------- */
const $ = id => document.getElementById(id);
const kanaEl = $('kanaChar');
const feedbackEl = $('feedback');
const inputEl = $('answerInput');
const formEl = $('answerForm');
const scriptBadgeEl = $('scriptBadge');
const streakEl = $('streakValue');
const bestEl = $('bestStreakValue');
const scoreEl = $('scoreValue');
const accuracyEl = $('accuracyValue');
const confettiLayer = $('confettiLayer');

/* ---------------- Build pool ---------------- */
function buildPool() {
  pool = DATA.filter(item => {
    const scriptOk = settings.script === 'both' || item.script === settings.script;
    const groupOk = settings.groups.includes(item.g);
    return scriptOk && groupOk;
  });
}

function nextCard() {
  buildPool();
  if (pool.length === 0) {
    kanaEl.textContent = '？';
    scriptBadgeEl.textContent = 'No cards';
    feedbackEl.className = 'feedback';
    feedbackEl.textContent = 'Select some character sets in settings.';
    return;
  }
  // pick a random card, avoid immediate repeat when possible
  let pick = pool[Math.floor(Math.random() * pool.length)];
  if (pool.length > 1 && pick.k === lastKana) {
    const others = pool.filter(i => i.k !== lastKana);
    pick = others[Math.floor(Math.random() * others.length)];
  }
  current = pick;
  lastKana = pick.k;

  kanaEl.textContent = pick.k;
  kanaEl.classList.remove('enter', 'good', 'bad');
  void kanaEl.offsetWidth; // restart CSS animation
  kanaEl.classList.add('enter');
  scriptBadgeEl.textContent = SCRIPT_NAMES[pick.script];

  feedbackEl.className = 'feedback';
  feedbackEl.textContent = '';
  inputEl.value = '';
  inputEl.className = 'answer-input';
  inputEl.disabled = false;
  // Auto-focus on desktop; on touch the on-screen keyboard stays open on its own
  if (!window.matchMedia('(pointer: coarse)').matches) inputEl.focus({ preventScroll: true });
}

/* ---------------- Stats UI ---------------- */
function renderStats() {
  streakEl.textContent = stats.streak;
  bestEl.textContent = stats.best;
  scoreEl.textContent = stats.correct;
  const answered = stats.correct + stats.wrong;
  accuracyEl.textContent = answered > 0 ? Math.round((stats.correct / answered) * 100) + '%' : '—';
  saveJSON('kanaQuest.stats', stats);
}
function popStat(el) {
  const stat = el.closest('.stat');
  stat.classList.remove('pop');
  void stat.offsetWidth;
  stat.classList.add('pop');
}

/* ---------------- Feedback & animation ---------------- */
function setFeedback(text, cls) {
  feedbackEl.textContent = text;
  feedbackEl.className = 'feedback show ' + cls;
}

function confetti(count) {
  const colors = ['#6366f1', '#a855f7', '#22d3ee', '#f472b6', '#facc15', '#34d399'];
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const left = 8 + Math.random() * 84;
    const size = 6 + Math.random() * 8;
    piece.style.left = left + 'vw';
    piece.style.width = size + 'px';
    piece.style.height = size * 1.4 + 'px';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.setProperty('--fall', (1.2 + Math.random() * 0.9) + 's');
    piece.style.setProperty('--spin', (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540) + 'deg');
    confettiLayer.appendChild(piece);
    piece.addEventListener('animationend', () => piece.remove());
  }
}

/* ---------------- Answer checking ---------------- */
function checkAnswer() {
  if (busy || !current) return;
  const raw = inputEl.value;
  const answer = normalize(raw);
  if (!answer) {
    inputEl.focus();
    return;
  }

  const isCorrect = current.r.includes(answer);

  if (isCorrect) {
    stats.correct++;
    stats.streak++;
    if (stats.streak > stats.best) stats.best = stats.streak;
    renderStats();

    kanaEl.className = 'kana good';
    inputEl.className = 'answer-input good';
    setFeedback('Correct! ' + current.k + ' = ' + current.r[0], 'good');
    popStat(streakEl);

    if (stats.streak > 0 && stats.streak % 5 === 0) confetti(26);
    else confetti(8);

    busy = true;
    setTimeout(() => { busy = false; nextCard(); }, 650);
  } else {
    stats.wrong++;
    stats.streak = 0;
    renderStats();

    kanaEl.className = 'kana bad';
    inputEl.className = 'answer-input bad';
    setFeedback('Not quite — ' + current.k + ' = ' + current.r[0], 'bad');
    inputEl.value = '';
    inputEl.focus();

    if (settings.mode === 'hard') {
      busy = true;
      inputEl.disabled = true;
      setTimeout(() => { busy = false; nextCard(); }, 1600);
    }
    // normal mode: stay on card so the learner can retry
  }
}

function reveal() {
  if (busy || !current) return;
  stats.skips++;
  stats.streak = 0;
  renderStats();

  kanaEl.className = 'kana';
  inputEl.className = 'answer-input';
  setFeedback(current.k + ' = ' + current.r[0], '');
  inputEl.value = '';
  inputEl.disabled = true;
  busy = true;
  setTimeout(() => { busy = false; nextCard(); }, 900);
}

/* ---------------- Settings ---------------- */
function renderSettings() {
  document.querySelectorAll('#scriptChips .chip').forEach(c =>
    c.classList.toggle('active', c.dataset.script === settings.script));
  document.querySelectorAll('#groupChips .chip').forEach(c =>
    c.classList.toggle('active', settings.groups.includes(c.dataset.group)));
  document.querySelectorAll('#modeChips .chip').forEach(c =>
    c.classList.toggle('active', c.dataset.mode === settings.mode));
}

function bindChips() {
  document.querySelectorAll('#scriptChips .chip').forEach(c => {
    c.addEventListener('click', () => {
      settings.script = c.dataset.script;
      saveJSON('kanaQuest.settings', settings);
      renderSettings();
      lastKana = null;
      nextCard();
    });
  });
  document.querySelectorAll('#groupChips .chip').forEach(c => {
    c.addEventListener('click', () => {
      const g = c.dataset.group;
      if (settings.groups.includes(g)) {
        if (settings.groups.length === 1) return; // keep at least one
        settings.groups = settings.groups.filter(x => x !== g);
      } else {
        settings.groups.push(g);
      }
      saveJSON('kanaQuest.settings', settings);
      renderSettings();
      lastKana = null;
      nextCard();
    });
  });
  document.querySelectorAll('#modeChips .chip').forEach(c => {
    c.addEventListener('click', () => {
      settings.mode = c.dataset.mode;
      saveJSON('kanaQuest.settings', settings);
      renderSettings();
    });
  });
}

/* ---------------- Drawer ---------------- */
const drawer = $('drawer');
const overlay = $('overlay');
function openDrawer() {
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('open'));
}
function closeDrawer() {
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  overlay.classList.remove('open');
  setTimeout(() => { overlay.hidden = true; }, 250);
}

/* ---------------- Theme ---------------- */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  $('themeIconMoon').style.display = theme === 'dark' ? 'none' : '';
  $('themeIconSun').style.display = theme === 'dark' ? '' : 'none';
  saveJSON('kanaQuest.theme', { theme });
}

/* ---------------- Mobile viewport / keyboard ---------------- */
let maxViewH = 0;
function handleViewport() {
  const vv = window.visualViewport;
  const h = vv ? vv.height : window.innerHeight;
  if (!maxViewH) maxViewH = h;
  maxViewH = Math.max(maxViewH, h);
  document.documentElement.style.setProperty('--app-h', h + 'px');
  document.body.classList.toggle('keyboard-open', !!vv && h < maxViewH - 120);
}

/* ---------------- Init ---------------- */
function init() {
  // theme
  const savedTheme = loadJSON('kanaQuest.theme', { theme: 'light' }).theme;
  applyTheme(savedTheme);

  // settings + stats
  renderSettings();
  renderStats();
  nextCard();

  // keep layout pinned to the visible viewport (keyboard handling)
  handleViewport();
  window.addEventListener('resize', handleViewport);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', handleViewport);
  window.addEventListener('orientationchange', () => { maxViewH = 0; handleViewport(); });

  // events
  formEl.addEventListener('submit', e => { e.preventDefault(); checkAnswer(); });
  $('revealBtn').addEventListener('click', reveal);
  $('settingsBtn').addEventListener('click', openDrawer);
  $('closeDrawer').addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
  $('themeBtn').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(cur);
  });
  $('resetBtn').addEventListener('click', () => {
    if (confirm('Reset all progress and statistics?')) {
      stats = { ...DEFAULT_STATS };
      renderStats();
      lastKana = null;
      nextCard();
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (drawer.classList.contains('open')) closeDrawer();
      else reveal();
    }
  });
  bindChips();

  // PWA service worker
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
