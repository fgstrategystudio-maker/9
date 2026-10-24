(() => {
'use strict';

// ---------- Storage ----------
const APP_VERSION = '26';
const KEY = 'dieta.v1';
const MEALS = [
  { id: 'colazione', label: 'Colazione', icon: '☀️' },
  { id: 'pranzo', label: 'Pranzo', icon: '🍽️' },
  { id: 'cena', label: 'Cena', icon: '🌙' },
  { id: 'spuntini', label: 'Spuntini', icon: '🍪' },
];
const MODELS = [
  { id: 'claude-opus-5', label: 'Claude Opus 5 — più preciso' },
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5 — più veloce ed economico' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 — il più economico' },
];
// [id, nome, anteprima chiaro, anteprima scuro]
const PALETTES = [
  ['salvia', 'Salvia', { bg: '#f4f6f5', card: '#ffffff', accent: '#0f766e', on: '#ffffff', prot: '#d0563b', carb: '#2f6fd6', fat: '#c98a12' }, { bg: '#0e1412', card: '#17201d', accent: '#2bb3a3', on: '#0b0c0b', prot: '#ec7a5f', carb: '#6d9cf0', fat: '#e2ac3d' }],
  ['oceano', 'Oceano', { bg: '#eff5f9', card: '#ffffff', accent: '#0e7490', on: '#ffffff', prot: '#e11d48', carb: '#4f46e5', fat: '#d97706' }, { bg: '#07111d', card: '#0f1c2c', accent: '#38bdf8', on: '#0b0c0b', prot: '#fb7185', carb: '#a5b4fc', fat: '#fbbf24' }],
  ['artico', 'Artico', { bg: '#f2f5f8', card: '#ffffff', accent: '#334155', on: '#ffffff', prot: '#e0525b', carb: '#2f6fe0', fat: '#d99212' }, { bg: '#0a0e13', card: '#121820', accent: '#a5c8f0', on: '#0b0c0b', prot: '#ff8a8f', carb: '#8fb6ff', fat: '#f5c350' }],
  ['oliva', 'Oliva e terracotta', { bg: '#f5f3ea', card: '#fffdf7', accent: '#56661c', on: '#ffffff', prot: '#b84a28', carb: '#35689e', fat: '#c8901f' }, { bg: '#12130d', card: '#1c1d15', accent: '#b3c75a', on: '#0b0c0b', prot: '#e8825e', carb: '#79a7dd', fat: '#e6b755' }],
  ['grafite', 'Grafite e lime', { bg: '#f3f4f2', card: '#ffffff', accent: '#1f2a1c', on: '#ffffff', prot: '#dc2626', carb: '#2563eb', fat: '#d97706' }, { bg: '#0b0c0b', card: '#161816', accent: '#a3e635', on: '#0b0c0b', prot: '#f87171', carb: '#60a5fa', fat: '#fbbf24' }],
];
const GEMINI_DEFAULT_MODEL = 'gemini-3.5-flash';  // modalità "Preciso"
const GEMINI_FAST_MODEL = 'gemini-3.5-flash-lite'; // modalità "Veloce" (circa 1 secondo)
// Attività sportive con MET medio (Compendium of Physical Activities)
const ACTIVITIES = [
  ['Camminata', 3.5], ['Camminata veloce', 4.3], ['Corsa lenta (8 km/h)', 8.3], ['Corsa (10 km/h)', 9.8], ['Corsa veloce (12 km/h)', 11.5],
  ['Bicicletta tranquilla', 5.8], ['Bicicletta sostenuta', 8.0], ['Cyclette / spinning', 7.0], ['Palestra – pesi', 5.0], ['Circuito / HIIT / crossfit', 8.0],
  ['Nuoto', 7.0], ['Calcio / calcetto', 7.0], ['Padel', 6.0], ['Tennis', 7.3], ['Basket', 6.5], ['Pallavolo', 4.0],
  ['Yoga', 2.5], ['Pilates', 3.0], ['Ballo', 5.0], ['Escursionismo', 6.0], ['Sci', 7.0], ['Arrampicata', 7.5],
  ['Ellittica', 5.0], ['Vogatore', 7.0], ['Boxe / arti marziali', 7.8], ['Salto della corda', 11.0], ['Lavori pesanti casa/giardino', 4.0],
];
const INTENSITY = [['Leggera', 0.8], ['Media', 1], ['Intensa', 1.2]];
const LIFESTYLE = [
  [1.2, 'Seduto quasi tutto il giorno (ufficio, studio, auto)'],
  [1.3, 'Seduto ma mi muovo un po\' (casa, commissioni)'],
  [1.45, 'Spesso in piedi o in movimento (negozio, insegnante)'],
  [1.6, 'Lavoro fisico (cantiere, magazzino, cameriere)'],
];
const BODY_FIELDS = [
  { k: 'weight', label: 'Peso', unit: 'kg', step: 0.1 },
  { k: 'bodyFat', label: 'Massa grassa', unit: '%', step: 0.1 },
  { k: 'muscle', label: 'Massa muscolare', unit: 'kg', step: 0.1 },
  { k: 'water', label: 'Acqua corporea', unit: '%', step: 0.1 },
  { k: 'visceral', label: 'Grasso viscerale', unit: '', step: 1 },
  { k: 'neck', label: 'Collo', unit: 'cm', step: 0.5, circ: true, hint: "Appena sotto il pomo d'Adamo, metro leggermente inclinato in avanti." },
  { k: 'chest', label: 'Petto', unit: 'cm', step: 0.5, circ: true, hint: 'Sulla linea dei capezzoli, sotto le ascelle, a fine espirazione, braccia lungo i fianchi.' },
  { k: 'waist', label: 'Vita', unit: 'cm', step: 0.5, circ: true, hint: "All'altezza dell'ombelico, pancia rilassata, a fine espirazione." },
  { k: 'hips', label: 'Fianchi', unit: 'cm', step: 0.5, circ: true, hint: 'Nel punto più largo dei glutei, in piedi a piedi uniti, glutei rilassati.' },
  { k: 'thigh', label: 'Coscia', unit: 'cm', step: 0.5, circ: true, hint: "A metà tra inguine e ginocchio, gamba rilassata, peso su entrambi i piedi." },
];

const DEFAULT_DB = {
  version: 1,
  profile: { sex: 'm', age: 35, height: 175, lifestyle: 1.2, baseActivity: 0, goalType: 'lose' },
  goals: {
    kcal: 2000, protein: 130, carbs: 220, fat: 65, fiber: 28, water: 2000,
    weightTarget: null, weightTargetDate: '', bodyFatTarget: null,
    monthWeight: null, monthDaysInTarget: 20,
    auto: true,         // ricalcola gli obiettivi quando cambia il peso
    exerciseAddBack: 1, // quota delle kcal degli allenamenti aggiunta al budget del giorno
  },
  entries: {},   // { 'YYYY-MM-DD': [entry] }
  deficitStart: {}, // { 'YYYY-MM': { kcal, until } } bilancio inserito a mano per i giorni prima di 'until'
  exercise: {},  // { 'YYYY-MM-DD': [{ id, name, minutes, kcal }] }
  water: {},     // { 'YYYY-MM-DD': ml }
  body: [],      // [{ date, weight, bodyFat, ... }]
  recent: [],
  savedMeals: [], // [{ id, name, meal, items: [{ name, grams, per100 }] }]
  foodInfo: {},   // { nome normalizzato: { veg, sug, sat, salt, ca, fe, kk, vc } } micronutrienti per 100 g completati dall'AI
  achievements: {}, // traguardi già festeggiati
  settings: {
    provider: 'gemini',
    geminiKey: '', geminiModel: GEMINI_DEFAULT_MODEL, geminiModels: [],
    apiKey: '', model: 'claude-opus-5',
    lastActivity: 'Camminata veloce',
    aiMode: 'fast', // fast | precise
    palette: 'salvia',
    scheme: 'auto', // auto | light | dark
  },
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_DB);
    const d = JSON.parse(raw);
    const out = {
      ...structuredClone(DEFAULT_DB), ...d,
      profile: { ...DEFAULT_DB.profile, ...d.profile },
      goals: { ...DEFAULT_DB.goals, ...d.goals },
      settings: { ...DEFAULT_DB.settings, ...d.settings },
    };
    // Dati della prima versione: chi aveva già la chiave Claude continua a usarla.
    if (!d.settings?.provider) out.settings.provider = d.settings?.apiKey ? 'claude' : 'gemini';
    if (d.goals && d.goals.auto === undefined) out.goals.auto = false;
    if (!['salvia', 'oceano', 'artico', 'oliva', 'grafite'].includes(out.settings.palette)) out.settings.palette = 'salvia';
    if (/^gemini-2\.5/.test(out.settings.geminiModel || '') || out.settings.geminiModel === 'gemini-3.8-flash') out.settings.geminiModel = GEMINI_DEFAULT_MODEL;
    return out;
  } catch {
    return structuredClone(DEFAULT_DB);
  }
}
let db = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch { toast('Memoria piena: esporta un backup e libera spazio'); }
}

// ---------- Helpers ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const r0 = n => Math.round(n || 0);
const r1 = n => Math.round((n || 0) * 10) / 10;
const num = v => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const ymd = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
const today = () => ymd(new Date());
const fmtDate = (s, opts = { weekday: 'short', day: 'numeric', month: 'short' }) => parseYmd(s).toLocaleDateString('it-IT', opts);
const fmtNum = (n, d = 1) => n == null ? '–' : Number(n).toLocaleString('it-IT', { maximumFractionDigits: d });

function nutrients(e) {
  const f = (e.grams || 0) / 100;
  return { kcal: e.per100.kcal * f, p: e.per100.p * f, c: e.per100.c * f, f: e.per100.f * f, fib: (e.per100.fib || 0) * f };
}
function sumNutr(list) {
  return list.reduce((a, e) => { const n = nutrients(e); a.kcal += n.kcal; a.p += n.p; a.c += n.c; a.f += n.f; a.fib += n.fib; return a; },
    { kcal: 0, p: 0, c: 0, f: 0, fib: 0 });
}
const dayEntries = d => db.entries[d] || [];
const dayTotals = d => sumNutr(dayEntries(d));
const dayExercise = d => db.exercise[d] || [];
const dayExerciseKcal = d => dayExercise(d).reduce((a, x) => a + (x.kcal || 0), 0);
// Budget calorico del giorno: obiettivo + (parte delle) kcal bruciate negli allenamenti
const dayBudget = d => db.goals.kcal + dayExerciseKcal(d) * (db.goals.exerciseAddBack ?? 1);
// kcal nette (oltre al metabolismo a riposo, già contato nel fabbisogno)
const exerciseKcal = (met, minutes, weight, intensity = 1) => Math.max(0, met * intensity - 1) * weight * (minutes / 60);
// Esito di un giorno: 'ok' nel target, 'over' oltre il 110% del budget, 'low' sotto il 75%, 'none' niente registrato
function dayStatus(d) {
  if (!dayEntries(d).length) return 'none';
  const k = dayTotals(d).kcal, b = dayBudget(d);
  return k > b * 1.1 ? 'over' : k < b * 0.75 ? 'low' : 'ok';
}
const hasAiKey = () => db.settings.provider === 'claude' ? !!db.settings.apiKey : !!db.settings.geminiKey;

function defaultMeal() {
  const h = new Date().getHours();
  if (h < 11) return 'colazione';
  if (h < 15) return 'pranzo';
  if (h < 18) return 'spuntini';
  return 'cena';
}
function latestBody(field) {
  const list = [...db.body].filter(b => b[field] != null).sort((a, b) => a.date.localeCompare(b.date));
  return list.length ? list[list.length - 1] : null;
}
// ---------- Bilancio calorico ----------
const KCAL_PER_KG_FAT = 7700;
function weightOn(d) {
  const list = db.body.filter(b => b.weight != null).sort((a, b) => a.date.localeCompare(b.date));
  if (!list.length) return null;
  const before = list.filter(b => b.date <= d);
  return (before.length ? before[before.length - 1] : list[0]).weight;
}
// Calorie consumate in un giorno: metabolismo basale (+ giornata tipo, attività fissa e allenamenti se si usa il fabbisogno totale)
function dayBurn(d) {
  const p = db.profile, w = weightOn(d);
  if (!w) return null;
  const bmr = 10 * w + 6.25 * p.height - 5 * p.age + (p.sex === 'm' ? 5 : -161);
  if (db.goals.deficitRef === 'goal') return dayBudget(d); // obiettivo del giorno (+ sport)
  if (db.goals.deficitRef === 'bmr') return bmr;
  return bmr * (p.lifestyle || 1.2) + (p.baseActivity || 0) + dayExerciseKcal(d);
}
// Bilancio del mese: negativo = deficit. Oggi è a parte perché la giornata non è finita.
function monthBalance(month) {
  const t = today();
  const start = db.deficitStart?.[month];
  const first = `${month}-01`;
  const last = ymd(new Date(+month.slice(0, 4), +month.slice(5, 7), 0));
  let from = start?.until && start.until > first ? start.until : first;
  let total = start ? -start.kcal : 0, days = 0, missing = false;
  for (let d = from; d <= last && d < t; d = addDays(d, 1)) {
    if (!dayEntries(d).length) continue;
    const burn = dayBurn(d);
    if (burn == null) { missing = true; continue; }
    total += dayTotals(d).kcal - burn; days++;
  }
  let todayVal = null;
  if (t.startsWith(month) && t >= from && dayEntries(t).length && dayBurn(t) != null) todayVal = dayTotals(t).kcal - dayBurn(t);
  const daysLeft = t.startsWith(month) ? (+last.slice(8) - +t.slice(8) + 1) : 0;
  const avg = days ? (total - (start ? -start.kcal : 0)) / days : null;
  return { total, days, todayVal, start, from, avg, daysLeft, missing };
}
// Mesi dall'inizio delle misurazioni (primo mese con pasti registrati o con un valore iniziale) a oggi
function trackedMonths() {
  const months = [...Object.keys(db.entries).filter(d => db.entries[d]?.length).map(d => d.slice(0, 7)), ...Object.keys(db.deficitStart || {})];
  if (!months.length) return [];
  const cur = today().slice(0, 7);
  let m = months.sort()[0];
  const out = [];
  while (m <= cur) { out.push(m); const [y, mm] = m.split('-').map(Number); m = ymd(new Date(y, mm, 1)).slice(0, 7); }
  return out;
}
const monthName = (m, withYear = false) => parseYmd(m + '-01').toLocaleDateString('it-IT', withYear ? { month: 'long', year: 'numeric' } : { month: 'long' });
const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
function balanceHistory() {
  const months = trackedMonths();
  const rows = months.map(m => ({ m, ...monthBalance(m), closed: m < today().slice(0, 7) }));
  return { rows, total: rows.reduce((a, r) => a + r.total, 0), since: months[0] ? (db.deficitStart?.[months[0]] ? months[0] + '-01' : rows[0] && Object.keys(db.entries).filter(d => d.startsWith(months[0]) && db.entries[d].length).sort()[0]) : null };
}

const fmtBalance = k => `${k > 0 ? '+' : k < 0 ? '−' : ''}${Math.abs(r0(k)).toLocaleString('it-IT')} kcal`;
const fatKg = k => fmtNum(Math.abs(k) / KCAL_PER_KG_FAT, 2);

function rememberRecent(item) {
  const key = item.name.trim().toLowerCase();
  db.recent = [{ name: item.name, grams: item.grams, per100: item.per100 }, ...db.recent.filter(r => r.name.trim().toLowerCase() !== key)].slice(0, 40);
}

let toastTimer;
function toast(msg, action) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  if (action) {
    const b = document.createElement('button');
    b.className = 'toast-act'; b.textContent = action.label;
    b.onclick = () => { t.hidden = true; action.fn(); };
    t.appendChild(b);
  }
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, action ? 5000 : 2600);
}
// Pulsanti ½ · 1 · 1½ · 2 porzioni
const PORTIONS = [[0.5, '½'], [1, '1'], [1.5, '1½'], [2, '2']];
const porChips = (attr, cur = 1) => `<div class="por">${PORTIONS.map(([k, l]) => `<button class="${k === cur ? 'on' : ''}" ${attr} data-k="${k}">${l}</button>`).join('')}<span class="small muted">porzioni</span></div>`;

// ---------- Sheet ----------
let sheetCleanup = null;
function openSheet(html, onMount) {
  runSheetCleanup();
  const s = $('#sheet');
  s.innerHTML = '<div class="sheet-handle" aria-hidden="true"></div>' + html;
  s.style.transform = ''; s.style.transition = '';
  s.hidden = false; $('#sheetBackdrop').hidden = false;
  s.scrollTop = 0;
  document.body.style.overflow = 'hidden';
  onMount && onMount(s);
}
function runSheetCleanup() {
  const fn = sheetCleanup; sheetCleanup = null;
  fn && fn();
}
function closeSheet() {
  runSheetCleanup();
  $('#sheet').hidden = true; $('#sheetBackdrop').hidden = true;
  $('#sheet').innerHTML = '';
  document.body.style.overflow = '';
}
$('#sheetBackdrop').addEventListener('click', closeSheet);
// Trascina la maniglia (o la parte alta del pannello) verso il basso per chiudere
(() => {
  const s = $('#sheet');
  let y0 = null, dy = 0;
  s.addEventListener('pointerdown', e => {
    if (!e.target.closest('.sheet-handle') && !(e.target.closest('h3') && s.scrollTop <= 0)) return;
    y0 = e.clientY; dy = 0;
    s.setPointerCapture?.(e.pointerId);
    s.style.transition = 'none';
  });
  s.addEventListener('pointermove', e => {
    if (y0 == null) return;
    dy = Math.max(0, e.clientY - y0);
    s.style.transform = `translateY(${dy}px)`;
    $('#sheetBackdrop').style.opacity = String(Math.max(0.2, 1 - dy / 400));
  });
  const end = () => {
    if (y0 == null) return;
    y0 = null;
    s.style.transition = 'transform .2s ease';
    $('#sheetBackdrop').style.opacity = '';
    if (dy > 110) { s.style.transform = 'translateY(100%)'; setTimeout(closeSheet, 180); }
    else s.style.transform = '';
  };
  s.addEventListener('pointerup', end);
  s.addEventListener('pointercancel', end);
})();

// ---------- Navigation ----------
let tab = 'today';
let curDate = today();
let addMeal = defaultMeal();
let progressRange = 30;
let bodyMetric = 'weight';
let showAllBody = false;

const TITLES = { today: 'Diario', add: 'Aggiungi', progress: 'Progressi', body: 'Corpo', goals: 'Obiettivi' };
const navStack = []; // schermate precedenti, per il tasto indietro del telefono
function go(t, push = true) {
  if (push && t !== tab) { navStack.push({ tab, curDate }); if (navStack.length > 30) navStack.shift(); }
  tab = t;
  $$('.tabbar button').forEach(b => b.classList.toggle('active', b.dataset.tab === t));
  render();
  window.scrollTo(0, 0);
}
$$('.tabbar button').forEach(b => b.addEventListener('click', () => {
  if (b.dataset.tab === 'add') { openAddSheet(); return; }
  go(b.dataset.tab);
}));
// "Aggiungi" come pannello sopra il Diario: si resta nel contesto
function openAddSheet(meal) {
  addMeal = meal || (curDate === today() ? defaultMeal() : addMeal);
  if (tab !== 'today') go('today');
  const day = curDate === today() ? 'oggi' : fmtDate(curDate, { weekday: 'long', day: 'numeric', month: 'long' });
  openSheet(`<h3>Aggiungi <small class="muted" style="font-weight:600;font-size:14px">· ${day}</small></h3><div id="addView" class="add-sheet"></div>`, s => renderAdd($('#addView', s)));
}
$('#prevDay').addEventListener('click', () => { curDate = addDays(curDate, -1); render(); });
$('#nextDay').addEventListener('click', () => { if (curDate < today()) { curDate = addDays(curDate, 1); render(); } });
$('#dateLabel').addEventListener('click', () => openCalendar());
$('#calBtn').addEventListener('click', () => openCalendar());

function render() {
  $('#title').textContent = TITLES[tab];
  if (tab !== 'today') { $('#miniSum').hidden = true; miniObs?.disconnect(); }
  const showDay = tab === 'today' || tab === 'add';
  $('#daynav').hidden = !showDay;
  if (showDay) {
    const t = today();
    $('#dateLabel').textContent = curDate === t ? 'Oggi' : curDate === addDays(t, -1) ? 'Ieri' : fmtDate(curDate);
    $('#nextDay').disabled = curDate >= t;
    $('#nextDay').style.opacity = curDate >= t ? .35 : 1;
  }
  const v = $('#view');
  ({ today: renderToday, add: renderAdd, progress: renderProgress, body: renderBody, goals: renderGoals })[tab](v);
  animateView(v);
}

// ---------- Calendario ----------
let calMonth = null; // 'YYYY-MM'
function loggedStreak() {
  // Giorni registrati di fila, fino a oggi (o fino a ieri se oggi è ancora vuoto)
  let d = today(), n = 0;
  if (!dayEntries(d).length) d = addDays(d, -1);
  while (dayEntries(d).length) { n++; d = addDays(d, -1); }
  return n;
}
function openCalendar() {
  calMonth = curDate.slice(0, 7);
  openSheet('<div id="calBox"></div>', drawCalendar);
}
function drawCalendar(s) {
  const box = $('#calBox', s);
  const t = today();
  const [y, m] = calMonth.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const daysIn = new Date(y, m, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // lunedì = 0
  const isCurMonth = calMonth === t.slice(0, 7);
  const days = Array.from({ length: daysIn }, (_, i) => `${calMonth}-${String(i + 1).padStart(2, '0')}`);
  const past = days.filter(d => d <= t);
  const green = past.filter(d => dayStatus(d) === 'ok').length;
  const logged = past.filter(d => dayEntries(d).length);
  const avg = logged.length ? logged.reduce((a, d) => a + dayTotals(d).kcal, 0) / logged.length : 0;
  const wIn = db.body.filter(b => b.weight != null && b.date.startsWith(calMonth)).sort((a, b) => a.date.localeCompare(b.date));
  const dW = wIn.length >= 2 ? wIn[wIn.length - 1].weight - wIn[0].weight : null;
  const icon = { ok: '✓', over: '✕', low: '!', none: '' };
  const cells = days.map(d => {
    const future = d > t;
    const st = future ? 'future' : dayStatus(d);
    const k = dayTotals(d).kcal;
    return `<button class="cal-day ${d === t ? 'today' : ''} ${d === curDate ? 'sel' : ''}" data-day="${d}" ${future ? 'disabled' : ''}>
      <span class="n">${+d.slice(8)}</span><span class="dot ${st}">${icon[st] || ''}</span><span class="k">${k ? r0(k) : ''}</span></button>`;
  }).join('');
  box.innerHTML = `
    <div class="cal-head">
      <button class="icon-btn" id="calPrev" aria-label="Mese precedente">‹</button>
      <h3>${first.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</h3>
      <button class="icon-btn" id="calNext" aria-label="Mese successivo" ${isCurMonth ? 'disabled style="opacity:.35"' : ''}>›</button>
    </div>
    <div class="cal-grid">${['L', 'M', 'M', 'G', 'V', 'S', 'D'].map(x => `<span class="wd">${x}</span>`).join('')}${'<span></span>'.repeat(lead)}${cells}</div>
    <div class="legend" style="justify-content:center"><span><i style="background:var(--ok)"></i>nel target</span><span><i style="background:var(--danger)"></i>oltre</span><span><i style="background:var(--warn)"></i>sotto il 75%</span><span><i style="background:var(--line)"></i>vuoto</span></div>
    <div class="stats" style="margin-top:14px">
      <div class="stat"><div class="v">${loggedStreak()}</div><div class="k">giorni di fila registrati</div></div>
      <div class="stat"><div class="v">${green}<span class="muted" style="font-size:15px">/${past.length}</span></div><div class="k">giorni verdi nel mese</div></div>
      <div class="stat"><div class="v">${signed(dW, 'kg')}</div><div class="k">peso nel mese</div></div>
      <div class="stat"><div class="v">${r0(avg)}</div><div class="k">kcal medie (${logged.length} giorni registrati)</div></div>
      ${(() => { const mb = monthBalance(calMonth); return mb.days || mb.start ? `<div class="stat" style="grid-column:1/-1"><div class="v">${fmtBalance(mb.total)}</div><div class="k">${db.goals.deficitRef === 'goal' ? `rispetto all'obiettivo nel mese` : `bilancio del mese ≈ ${fatKg(mb.total)} kg di grasso ${mb.total <= 0 ? 'persi' : 'in più'}`}</div></div>` : ''; })()}
    </div>
    <div class="btn-row" style="margin-top:12px"><button class="btn secondary" id="calClose">Chiudi</button><button class="btn" id="calToday">Vai a oggi</button></div>`;
  $('#calPrev', box).addEventListener('click', () => { calMonth = ymd(new Date(y, m - 2, 1)).slice(0, 7); drawCalendar(s); });
  $('#calNext', box).addEventListener('click', () => { if (!isCurMonth) { calMonth = ymd(new Date(y, m, 1)).slice(0, 7); drawCalendar(s); } });
  $('#calClose', box).addEventListener('click', closeSheet);
  $('#calToday', box).addEventListener('click', () => { curDate = t; closeSheet(); go('today'); });
  $$('[data-day]', box).forEach(b => b.addEventListener('click', () => { curDate = b.dataset.day; closeSheet(); go('today'); }));
}

// ---------- Today ----------
const ringPrev = {};
function ringSvg(value, goal, color, size = 132, stroke = 12, key = 'kcal') {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  const over = goal > 0 && value > goal;
  const from = ringPrev[key] ?? 0;
  ringPrev[key] = pct;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="${stroke}"/>
    <circle class="ring-prog" data-to="${c * (1 - pct)}" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${over ? 'var(--danger)' : color}" stroke-width="${stroke}"
      stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - from)}"/>
  </svg>`;
}
function macroBar(label, val, goal, color, unit = 'g') {
  const pct = goal > 0 ? Math.min(100, (val / goal) * 100) : 0;
  const over = goal > 0 && val > goal * 1.1;
  return `<div class="macro">
    <div class="top"><span>${label}</span><span class="${over ? 'over' : ''}"><b>${r0(val)}</b> / ${r0(goal)} ${unit}</span></div>
    <div class="bar"><i style="width:${pct}%;background:${color}"></i></div>
  </div>`;
}

function renderToday(v) {
  const g = db.goals;
  const tot = dayTotals(curDate);
  const exKcal = dayExerciseKcal(curDate);
  const budget = dayBudget(curDate);
  const bonus = budget - g.kcal;
  const left = budget - tot.kcal;
  const water = db.water[curDate] || 0;
  const glasses = Math.max(1, Math.round(g.water / 250));
  const filled = Math.round(water / 250);
  const weighed = db.body.some(b => b.date === curDate && b.weight != null);
  const yesterday = addDays(curDate, -1);

  let html = '';
  // Nei primi giorni del mese: riepilogo del mese appena chiuso
  const prevMonth = ymd(new Date(parseYmd(today()).getFullYear(), parseYmd(today()).getMonth() - 1, 1)).slice(0, 7);
  if (curDate === today() && +today().slice(8) <= 5 && db.settings.closedSeen !== prevMonth && trackedMonths().includes(prevMonth)) {
    const pm = monthBalance(prevMonth), h = balanceHistory(), vsGoal = db.goals.deficitRef === 'goal';
    html += `<div class="card month-closed">
      <h2>🏁 ${cap(monthName(prevMonth))} chiuso</h2>
      <div class="balance-big ${pm.total <= 0 ? 'good' : 'bad'}">${fmtBalance(pm.total)}</div>
      ${vsGoal ? `<p class="center">${pm.total <= 0 ? 'sotto' : 'sopra'} l'obiettivo nel mese</p>` : `<p class="center">≈ <b>${fatKg(pm.total)} kg di grasso</b> ${pm.total <= 0 ? 'persi' : 'in più'}</p>`}
      ${h.rows.length > 2 ? `<p class="center small muted">Totale dall'inizio: <b>${fmtBalance(h.total - (h.rows.at(-1)?.total || 0))}</b>${vsGoal ? '' : ` ≈ ${fatKg(h.total - (h.rows.at(-1)?.total || 0))} kg`}</p>` : ''}
      <div class="btn-row"><button class="btn secondary" id="closedDetail">Storico</button><button class="btn" id="closedOk">Ok</button></div>
    </div>`;
  }
  if (curDate === today()) {
    const h = new Date().getHours();
    const greet = h < 5 ? 'Buonanotte' : h < 13 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera';
    const streak = greenStreak();
    html += `<div class="hello"><div><b>${greet}${db.profile.name ? `, ${esc(db.profile.name)}` : ''}</b><span>${cap(fmtDate(curDate, { weekday: 'long', day: 'numeric', month: 'long' }))}</span></div>${streak >= 2 ? `<span class="streak" title="Giorni verdi di fila">🔥 ${streak}</span>` : ''}</div>`;
  }
  if (curDate !== today()) {
    html += `<div class="banner row between"><span>Stai vedendo <b>${fmtDate(curDate, { weekday: 'long', day: 'numeric', month: 'long' })}</b>: puoi aggiungere e modificare.</span><button class="add-mini" id="backToday">Oggi</button></div>`;
  }
  if (!hasAiKey()) {
    html += `<div class="banner">Per riconoscere i cibi da <b>foto</b> e <b>testo</b> inserisci una chiave AI in <b>Obiettivi → Impostazioni</b> (con Google Gemini è <b>gratis</b>). Intanto puoi cercare alimenti e prodotti di marca o leggere il codice a barre.</div>`;
  }
  html += `<div class="card">
    <div class="summary">
      <div class="ring">${ringSvg(tot.kcal, budget, 'var(--ok)')}
        <div class="ring-label"><span class="big ${left >= 0 ? 'good' : 'bad'}" data-count="${r0(Math.abs(left))}" data-key="left-${curDate}">${r0(Math.abs(left))}</span><span class="lbl">${left >= 0 ? 'kcal rimaste' : 'kcal in più'}</span></div>
      </div>
      <div class="macros">
        ${macroBar('Calorie', tot.kcal, budget, 'var(--kcal)', 'kcal')}
        ${macroBar('Proteine', tot.p, g.protein, 'var(--prot)')}
        ${macroBar('Carboidrati', tot.c, g.carbs, 'var(--carb)')}
        ${macroBar('Grassi', tot.f, g.fat, 'var(--fat)')}
      </div>
    </div>
    <div class="row between small muted" style="margin-top:12px">
      <span>Fibre ${r0(tot.fib)} / ${r0(g.fiber)} g</span>
      <span>${bonus > 0 ? `Obiettivo ${r0(g.kcal)} + ${r0(bonus)} sport` : `Mangiate ${r0(tot.kcal)} di ${r0(g.kcal)} kcal`}</span>
    </div>
    ${(() => {
      const mb = monthBalance(today().slice(0, 7));
      if (!mb.days && !mb.start) return '';
      const vsGoal = db.goals.deficitRef === 'goal';
      return `<button class="balance-line" id="balanceLine"><span>${vsGoal ? 'Rispetto all\'obiettivo, nel mese' : 'Bilancio del mese'}</span><b class="${mb.total <= 0 ? 'good' : 'bad'}">${fmtBalance(mb.total)}</b><span>${vsGoal ? (mb.total <= 0 ? 'sotto l\'obiettivo' : 'sopra l\'obiettivo') : `≈ ${fatKg(mb.total)} kg di grasso ${mb.total <= 0 ? 'persi' : 'in più'}`}</span></button>`;
    })()}
  </div>`;

  html += habitCard();
  html += quickBar();

  const exList = dayExercise(curDate);
  html += `<div class="card">
    <div class="meal-head">
      <h2>Attività fisica ${exKcal ? `<small>−${r0(exKcal)} kcal</small>` : ''}</h2>
      <button class="add-mini" id="addExercise">+ Allenamento</button>
    </div>
    ${exList.length ? `<ul class="items">${exList.map(x => `<li data-ex="${x.id}">
      <div class="grow"><div class="name">${esc(x.name)}</div><div class="sub">${x.minutes ? r0(x.minutes) + ' min' : ''}${x.intensity ? ' · ' + esc(x.intensity) : ''}</div></div>
      <div class="kc">−${r0(x.kcal)}</div></li>`).join('')}</ul>` : `<div class="empty">Nessun allenamento registrato.</div>`}
    ${db.profile.baseActivity ? `<div class="small muted" style="margin-top:6px">Attività di tutti i giorni (${r0(db.profile.baseActivity)} kcal) già inclusa nell'obiettivo.</div>` : ''}
  </div>`;

  for (const m of MEALS) {
    const list = dayEntries(curDate).filter(e => e.meal === m.id);
    const mt = sumNutr(list);
    const yList = dayEntries(yesterday).filter(e => e.meal === m.id);
    const share = tot.kcal ? mt.kcal / Math.max(tot.kcal, budget) : 0;
    html += `<div class="card meal-card" id="meal-${m.id}">
      <div class="meal-head">
        <h2><span class="meal-ico">${m.icon}</span>${m.label} ${list.length ? `<small><span data-count="${r0(mt.kcal)}" data-key="meal-${curDate}-${m.id}">${r0(mt.kcal)}</span> kcal</small>` : ''}</h2>
        <span class="meal-actions">${list.length ? `<button class="icon-act" data-save="${m.id}" aria-label="Salva pasto">⭐</button>` : ''}<button class="icon-act" data-cam="${m.id}" aria-label="Foto del pasto">📷</button><button class="icon-act add" data-add="${m.id}" aria-label="Aggiungi a ${m.label}">+</button></span>
      </div>
      ${list.length ? `<div class="meal-share"><i style="width:${Math.min(100, share * 100)}%"></i></div>` : ''}`;
    if (list.length) {
      html += `<ul class="items">${list.map(e => {
        const n = nutrients(e);
        return `<li data-entry="${e.id}" class="${justAdded.has(e.id) ? 'just-added' : ''}">
          <span class="food-ico">${foodIcon(e.name)}</span>
          <div class="grow"><div class="name">${esc(e.name)}</div>
          <div class="sub">${r0(e.grams)} g · P ${r0(n.p)} · C ${r0(n.c)} · G ${r0(n.f)}</div></div>
          <div class="kc">${r0(n.kcal)}</div>
        </li>`;
      }).join('')}</ul>
      <div class="small muted" style="margin-top:4px">P ${r0(mt.p)} g · C ${r0(mt.c)} g · G ${r0(mt.f)} g</div>`;
    } else {
      const saved = db.savedMeals.map((sm, i) => ({ sm, i })).filter(x => x.sm.meal === m.id).slice(0, 2);
      html += `<div class="quick-chips">
        ${saved.map(x => `<button class="qchip" data-qsm="${x.i}" data-meal="${m.id}">⭐ ${esc(x.sm.name)} · ${r0(sumNutr(x.sm.items).kcal)}</button>`).join('')}
        ${yList.length ? `<button class="qchip" data-copy="${m.id}">↺ Come ieri · ${r0(sumNutr(yList).kcal)} kcal</button>` : ''}
        ${!saved.length && !yList.length ? '<span class="empty" style="padding:0">Niente ancora.</span>' : ''}
      </div>`;
    }
    html += `</div>`;
  }

  html += `<div class="card">
    <h2>Acqua <small>${fmtNum(water / 1000, 2)} / ${fmtNum(g.water / 1000, 1)} L</small></h2>
    <div class="water">
      <div class="drops">${Array.from({ length: Math.max(glasses, filled) }, (_, i) => `<button class="drop ${i < filled ? 'on' : ''}" data-drop="${i}" aria-label="Bicchiere ${i + 1}"></button>`).join('')}</div>
    </div>
    <div class="small muted" style="margin-top:6px">Ogni goccia = 250 ml</div>
  </div>`;

  if (!weighed) {
    html += `<button class="btn secondary" id="quickWeigh">⚖ Registra peso e misure di ${curDate === today() ? 'oggi' : 'questo giorno'}</button>`;
  }
  v.innerHTML = html;

  $$('[data-add]', v).forEach(b => b.addEventListener('click', () => openAddSheet(b.dataset.add)));
  $$('[data-cam]', v).forEach(b => b.addEventListener('click', () => { addMeal = b.dataset.cam; photoQueue = []; requireKey() && $('#photoInput').click(); }));
  $$('[data-qsm]', v).forEach(b => b.addEventListener('click', () => {
    const sm = db.savedMeals[+b.dataset.qsm]; addMeal = b.dataset.meal;
    mealPreview({ title: sm.name, items: sm.items, meal: b.dataset.meal, saved: sm });
  }));
  bindQuickBar(v);
  $('#habYes', v)?.addEventListener('click', () => { const hb = habitFor(); if (hb) mealPreview({ title: `Il tuo ${hb.label.toLowerCase()} solito`, items: hb.items, meal: hb.meal }); });
  $('#habNo', v)?.addEventListener('click', () => { db.settings.habitDismissed = `${today()}-${defaultMeal()}`; save(); render(); });
  watchMiniSum(v, tot, budget, left);
  // alimenti appena aggiunti: compaiono nel pasto con un'animazione e una breve vibrazione
  if (justAdded.size) {
    const first = $('.just-added', v);
    if (first) {
      setTimeout(() => first.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' }), 60);
      navigator.vibrate?.(18);
    }
    justAdded = new Set();
  }
  $$('[data-save]', v).forEach(b => b.addEventListener('click', () => saveMealForm(dayEntries(curDate).filter(e => e.meal === b.dataset.save), b.dataset.save)));
  $$('[data-entry]', v).forEach(li => bindSwipe(li));
  $$('[data-copy]', v).forEach(b => b.addEventListener('click', () => {
    const src = dayEntries(yesterday).filter(e => e.meal === b.dataset.copy);
    const copies = src.map(e => ({ ...e, id: uid(), t: Date.now() }));
    db.entries[curDate] = [...dayEntries(curDate), ...copies];
    justAdded = new Set(copies.map(e => e.id));
    save(); render(); toast('Pasto copiato da ieri');
  }));
  $$('[data-drop]', v).forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.drop;
    db.water[curDate] = (i + 1 === filled) ? i * 250 : (i + 1) * 250;
    save(); render();
  }));
  const qw = $('#quickWeigh', v);
  qw && qw.addEventListener('click', () => bodyForm(null, curDate));
  $('#addExercise', v).addEventListener('click', () => exerciseForm());
  $('#backToday', v)?.addEventListener('click', () => { curDate = today(); render(); });
  $('#balanceLine', v)?.addEventListener('click', () => go('progress'));
  $('#closedOk', v)?.addEventListener('click', () => { db.settings.closedSeen = prevMonth; save(); render(); });
  if ($('.month-closed', v) && !db.achievements[`closed-${prevMonth}`]) {
    db.achievements[`closed-${prevMonth}`] = today(); save();
    if (monthBalance(prevMonth).total < 0) setTimeout(() => confetti(), 300);
  }
  $('#closedDetail', v)?.addEventListener('click', () => { db.settings.closedSeen = prevMonth; save(); go('progress'); });
  $$('[data-ex]', v).forEach(li => li.addEventListener('click', () => exerciseForm(li.dataset.ex)));
}

function exerciseForm(id) {
  const list = dayExercise(curDate);
  const existing = id ? list.find(x => x.id === id) : null;
  const weightRec = latestBody('weight');
  const weight = weightRec?.weight || 70;
  let act = existing?.act || db.settings.lastActivity || ACTIVITIES[0][0];
  let minutes = existing?.minutes || 45;
  let intensity = existing?.intensity || 'Media';
  let manual = existing?.manual ? existing.kcal : null;
  const calc = () => {
    const met = ACTIVITIES.find(a => a[0] === act)?.[1] || 5;
    return exerciseKcal(met, minutes, weight, INTENSITY.find(i => i[0] === intensity)[1]);
  };
  openSheet(`<h3>${existing ? 'Modifica allenamento' : 'Allenamento'}</h3>
    <label class="field"><span>Attività</span><select id="xAct">${ACTIVITIES.map(([n]) => `<option ${n === act ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
    <label class="field"><span>Durata (minuti)</span>
      <div class="row"><button class="step" id="xMinus">−</button><input type="number" inputmode="numeric" id="xMin" value="${minutes}" style="text-align:center"><button class="step" id="xPlus">+</button></div>
    </label>
    <div class="meal-pick">${INTENSITY.map(([n]) => `<button class="chip ${n === intensity ? 'on' : ''}" data-int="${n}">${n}</button>`).join('')}</div>
    <div class="stat" style="margin-bottom:10px"><div class="v" id="xKcal"></div><div class="k" id="xHint"></div></div>
    <label class="field"><span>Oppure kcal dallo smartwatch (facoltativo)</span><input type="number" inputmode="numeric" id="xManual" value="${manual ?? ''}" placeholder="es. 420"></label>
    <div class="btn-row">${existing ? '<button class="btn danger" id="xDel">Elimina</button>' : ''}<button class="btn" id="xSave">Salva</button></div>`, s => {
    const draw = () => {
      const k = manual ?? calc();
      $('#xKcal', s).textContent = `${r0(k)} kcal`;
      $('#xHint', s).textContent = manual != null ? 'valore inserito da te'
        : `stima per ${fmtNum(weight)} kg${weightRec ? '' : ' (registra il peso per una stima più precisa)'}, oltre al consumo a riposo`;
    };
    draw();
    const mi = $('#xMin', s);
    $('#xAct', s).addEventListener('change', e => { act = e.target.value; draw(); });
    mi.addEventListener('input', () => { minutes = num(mi.value) || 0; draw(); });
    $('#xMinus', s).addEventListener('click', () => { minutes = Math.max(5, minutes - 5); mi.value = minutes; draw(); });
    $('#xPlus', s).addEventListener('click', () => { minutes += 5; mi.value = minutes; draw(); });
    $$('[data-int]', s).forEach(c => c.addEventListener('click', () => { intensity = c.dataset.int; $$('[data-int]', s).forEach(x => x.classList.toggle('on', x === c)); draw(); }));
    $('#xManual', s).addEventListener('input', e => { manual = num(e.target.value); draw(); });
    $('#xSave', s).addEventListener('click', () => {
      if (!minutes && manual == null) { toast('Indica la durata'); return; }
      const rec = { id: existing?.id || uid(), name: act, act, minutes, intensity, kcal: r0(manual ?? calc()), manual: manual != null };
      db.exercise[curDate] = existing ? list.map(x => x.id === rec.id ? rec : x) : [...list, rec];
      db.settings.lastActivity = act;
      save(); closeSheet(); render(); toast(`Allenamento salvato: ${rec.kcal} kcal`);
    });
    $('#xDel', s)?.addEventListener('click', () => {
      db.exercise[curDate] = list.filter(x => x.id !== id); save(); closeSheet(); render(); toast('Eliminato');
    });
  });
}

// ---------- Icone degli alimenti ----------
const FOOD_ICONS = [
  [/banana/, '🍌'], [/arancia|mandarin|clementin/, '🍊'], [/fragol/, '🍓'], [/\bmela\b|mele\b/, '🍎'], [/\bpera\b/, '🍐'], [/kiwi/, '🥝'], [/\buva\b/, '🍇'], [/pesca|albicocc/, '🍑'],
  [/ananas/, '🍍'], [/anguria|melone/, '🍉'], [/limone/, '🍋'], [/mirtill|frutti di bosco|frutti rossi/, '🫐'], [/avocado/, '🥑'], [/pomodor/, '🍅'], [/carot/, '🥕'], [/broccol|cavol/, '🥦'],
  [/insalat|lattuga|rucola|spinac|verdur/, '🥗'], [/funghi/, '🍄'], [/mais/, '🌽'], [/peperon/, '🫑'], [/melanzan/, '🍆'], [/patat/, '🥔'], [/pizza/, '🍕'], [/spaghett|pasta|penne|fusilli|lasagn|gnocch|tortellin|ravioli/, '🍝'],
  [/sushi/, '🍣'], [/\briso|risotto/, '🍚'], [/hamburger|panino/, '🍔'], [/piadin|wrap|kebab/, '🌯'], [/cornett|brioche|croissant/, '🥐'], [/pane|toast|fette biscottate|cracker|grissin|focacc/, '🍞'],
  [/uov[oa]|frittata|albume/, '🥚'], [/pollo|tacchin/, '🍗'], [/manzo|bistecc|vitell|carne|bresaol|roast/, '🥩'], [/prosciutt|pancett|speck|salam|mortadell|maiale|salsicc|wurstel/, '🥓'],
  [/salmone|tonno|merluzz|pesce|orata|branzin|sgombr|alici|acciug|trota/, '🐟'], [/gamber|calamar|polpo|cozze|vongol/, '🦐'], [/formagg|parmigian|grana|mozzarell|ricotta|feta|scamorz|stracchin/, '🧀'],
  [/yogurt|skyr/, '🥣'], [/avena|porridge|cereali|muesli|granola|cornflakes/, '🥣'], [/latte\b|cappuccin/, '🥛'], [/caff/, '☕'], [/\bte\b|tisana/, '🍵'],
  [/ceci|lenticch|fagiol|piselli|legumi|edamame/, '🫘'], [/tofu/, '🍢'], [/mandorl|\bnoci\b|nocciol|arachid|anacard|pistacch|frutta secca/, '🥜'], [/olio/, '🫒'], [/burro/, '🧈'],
  [/gelato/, '🍨'], [/biscott/, '🍪'], [/torta|crostat|tiramisu/, '🍰'], [/cioccolat|nutella/, '🍫'], [/miele|marmellat/, '🍯'], [/birra/, '🍺'], [/vino|prosecco|spritz/, '🍷'],
  [/proteine|whey|protein/, '💪'], [/acqua/, '💧'], [/succo|spremut/, '🧃'], [/zupp|minestr|brodo|vellutat/, '🍲'], [/frutta|frutti/, '🍎'],
];
const foodIcon = name => { const n = normName(name); return (FOOD_ICONS.find(([re]) => re.test(n)) || [, '🍴'])[1]; };

// ---------- Inserimento rapido dal Diario ----------
let qaMeal = null, recog = null;
const speechSupported = () => !!(window.SpeechRecognition || window.webkitSpeechRecognition);
const qaTarget = () => qaMeal || (curDate === today() ? defaultMeal() : 'pranzo');
// Il pasto "solito" per quest'ora: la combinazione più frequente degli ultimi 30 giorni (almeno 2 volte)
function habitFor() {
  if (curDate !== today()) return null;
  const meal = defaultMeal();
  if (dayEntries(today()).some(e => e.meal === meal) || db.settings.habitDismissed === `${today()}-${meal}`) return null;
  const combos = new Map();
  for (let i = 1; i <= 30; i++) {
    const items = dayEntries(addDays(today(), -i)).filter(e => e.meal === meal);
    if (!items.length) continue;
    const key = items.map(e => normName(e.name)).sort().join('|');
    const o = combos.get(key) || { n: 0, items };
    o.n++; combos.set(key, o);
  }
  const best = [...combos.values()].sort((a, b) => b.n - a.n)[0];
  if (!best || best.n < 2) return null;
  const m = MEALS.find(x => x.id === meal);
  return { meal, label: m.label, icon: m.icon, items: best.items, n: best.n };
}
function habitCard() {
  const hb = habitFor();
  if (!hb) return '';
  return `<div class="card habit">
    <div class="row" style="align-items:flex-start"><span class="habit-ico">${hb.icon}</span><div class="grow">
      <b>È ora di ${hb.label.toLowerCase()}</b>
      <div class="small muted">Di solito: ${esc(hb.items.map(e => e.name).join(', '))} · ${r0(sumNutr(hb.items).kcal)} kcal <span class="pill">${hb.n} volte</span></div>
    </div></div>
    <div class="btn-row" style="margin-top:10px"><button class="btn secondary" id="habNo">No, grazie</button><button class="btn" id="habYes">Aggiungi</button></div>
  </div>`;
}
// Riepilogo compatto sotto l'intestazione quando l'anello esce dallo schermo
let miniObs = null;
function watchMiniSum(v, tot, budget, left) {
  miniObs?.disconnect();
  const mini = $('#miniSum'), card = $('.summary', v)?.closest('.card');
  if (!card) { mini.hidden = true; return; }
  const g = db.goals;
  mini.innerHTML = `<b class="${left >= 0 ? 'good' : 'bad'}">${r0(Math.abs(left))} kcal ${left >= 0 ? 'rimaste' : 'in più'}</b><span>P ${r0(tot.p)}/${r0(g.protein)}</span><span>C ${r0(tot.c)}/${r0(g.carbs)}</span><span>G ${r0(tot.f)}/${r0(g.fat)}</span>`;
  miniObs = new IntersectionObserver(([en]) => { mini.hidden = en.isIntersecting || tab !== 'today'; }, { rootMargin: '-70px 0px 0px 0px' });
  miniObs.observe(card);
}
function quickBar() {
  const t = qaTarget();
  const empty = !dayEntries(curDate).length;
  return `<div class="card qa">
    <div class="qa-bar">
      <span class="qa-ico">✨</span>
      <input id="qaInput" type="search" enterkeyhint="send" placeholder="Cosa hai mangiato?" autocomplete="off" aria-label="Cosa hai mangiato">
      ${speechSupported() ? '<button id="qaMic" class="qa-btn ghost" aria-label="Detta cosa hai mangiato">🎤</button>' : ''}
      <button id="qaCam" class="qa-btn" aria-label="Fotografa il pasto">📷</button>
    </div>
    <div class="qa-meals">${MEALS.map(m => `<button class="chip ${m.id === t ? 'on' : ''}" data-qm="${m.id}">${m.icon} ${m.label}</button>`).join('')}</div>
    <div id="qaSug" class="qa-sug" hidden></div>
    ${empty ? `<p class="qa-empty">✨ Giornata ancora da scrivere. Prova «cappuccino e cornetto»${speechSupported() ? ', tocca 🎤 per dettare' : ''} o 📷 per una foto.</p>` : ''}
  </div>`;
}
// Alimenti più frequenti in un pasto negli ultimi 45 giorni
function frequentFor(meal) {
  const cnt = new Map();
  for (let i = 1; i <= 45; i++) for (const e of dayEntries(addDays(today(), -i))) {
    if (e.meal !== meal) continue;
    const k = normName(e.name);
    const o = cnt.get(k) || { n: 0, item: e };
    o.n++; cnt.set(k, o);
  }
  return [...cnt.values()].sort((a, b) => b.n - a.n).slice(0, 5).map(o => ({ name: o.item.name, grams: o.item.grams, per100: o.item.per100, veg: o.item.veg, freq: o.n }));
}
function bindQuickBar(v) {
  const inp = $('#qaInput', v), box = $('#qaSug', v);
  if (!inp) return;
  let brandTimer, brandSeq = 0, rows = [];
  const pick = r => {
    addMeal = qaTarget();
    inp.blur(); box.hidden = true;
    if (r.kind === 'food') quickAdd(r.food);
    else if (r.kind === 'saved') mealPreview({ title: r.sm.name, items: r.sm.items, meal: addMeal, saved: r.sm });
    else if (r.kind === 'ref') mealPreview({ title: r.title, items: r.items, meal: addMeal });
    else if (r.kind === 'yesterday') mealPreview({ title: `${MEALS.find(m => m.id === addMeal).label} di ieri`, items: r.items, meal: addMeal });
    else if (r.kind === 'ai') { if (requireKey()) runAnalysis({ text: r.text }); }
  };
  const row = (r, i) => `<button class="qa-row" data-qr="${i}"><span class="qa-ri">${r.icon}</span><span class="grow"><span class="name">${r.title}</span>${r.sub ? `<br><span class="small muted">${r.sub}</span>` : ''}</span>${r.kcal != null ? `<span class="kc">${r0(r.kcal)}</span>` : ''}</button>`;
  const draw = () => {
    const raw = inp.value.trim(), term = normName(raw), t = qaTarget();
    const label = MEALS.find(m => m.id === t).label.toLowerCase();
    rows = [];
    if (!term) {
      db.savedMeals.filter(sm => sm.meal === t).slice(0, 3).forEach(sm => rows.push({ kind: 'saved', sm, icon: '⭐', title: esc(sm.name), sub: `${sm.items.length} alimenti`, kcal: sumNutr(sm.items).kcal }));
      const y = dayEntries(addDays(curDate, -1)).filter(e => e.meal === t);
      if (y.length) rows.push({ kind: 'yesterday', items: y, icon: '↺', title: `Come ${label} di ieri`, sub: esc(y.map(e => e.name).join(', ')).slice(0, 70), kcal: sumNutr(y).kcal });
      frequentFor(t).forEach(f => rows.push({ kind: 'food', food: f, icon: foodIcon(f.name), title: esc(f.name), sub: `${r0(f.grams)} g · ${f.freq} volte di recente a ${label}`, kcal: nutrients(f).kcal }));
      box.innerHTML = rows.length ? `<p class="qa-h">Suggeriti per ${label}</p>${rows.map(row).join('')}` : `<p class="small muted" style="margin:6px 2px">Scrivi un alimento ("mela", "yogurt Müller"), una frase ("80 g di pasta al pomodoro") o "pranzo di ieri".</p>`;
    } else {
      const ref = parseMealRef(raw);
      if (ref) {
        const items = dayEntries(ref.date).filter(e => e.meal === ref.meal);
        const title = `${MEALS.find(m => m.id === ref.meal).label} di ${fmtDate(ref.date, { weekday: 'long', day: 'numeric', month: 'long' })}`;
        rows.push(items.length ? { kind: 'ref', items, title, icon: '↺', sub: esc(items.map(e => e.name).join(', ')).slice(0, 70), kcal: sumNutr(items).kcal } : { kind: 'none', icon: '∅', title: `${title}: niente registrato` });
      }
      db.savedMeals.filter(sm => normName(sm.name).includes(term) || sm.items.some(e => normName(e.name).includes(term))).slice(0, 3)
        .forEach(sm => rows.push({ kind: 'saved', sm, icon: '⭐', title: esc(sm.name), sub: `${sm.items.length} alimenti`, kcal: sumNutr(sm.items).kcal }));
      const seen = new Set();
      const base = window.FOODS.map(([name, kcal, p, c, f, fib, portion]) => ({ name, grams: portion, per100: { kcal, p, c, f, fib } }));
      [...db.recent, ...base].filter(x => { const k = normName(x.name); if (!k.includes(term) || seen.has(k)) return false; seen.add(k); return true; }).slice(0, 6)
        .forEach(f => rows.push({ kind: 'food', food: f, icon: foodIcon(f.name), title: esc(f.name), sub: `${r0(f.grams)} g`, kcal: nutrients(f).kcal }));
      if (hasAiKey() && raw.length > 2 && !rows.some(r => r.kind === 'ref')) rows.push({ kind: 'ai', text: raw, icon: '✨', title: `Analizza «${esc(raw)}» con l'AI`, sub: 'calorie e macro anche per frasi e piatti composti' });
      box.innerHTML = rows.map(row).join('') + (term.length >= 3 ? '<div id="qaBrand"></div>' : '');
      clearTimeout(brandTimer);
      if (term.length >= 3) {
        const seq = ++brandSeq;
        brandTimer = setTimeout(async () => {
          try {
            const found = (await offSearch(term)).slice(0, 4);
            if (seq !== brandSeq || !found.length) return;
            const start = rows.length;
            found.forEach(f => rows.push({ kind: 'food', food: f, icon: '🏷️', title: esc(f.name), sub: `${r0(f.grams)} g · prodotto di marca`, kcal: nutrients(f).kcal }));
            const bx = $('#qaBrand', v); if (bx) bx.innerHTML = `<p class="qa-h">Prodotti di marca</p>` + rows.slice(start).map((r, j) => row(r, start + j)).join('');
            bindRows();
          } catch {}
        }, 600);
      }
    }
    box.hidden = false;
    bindRows();
  };
  const bindRows = () => $$('[data-qr]', box).forEach(b => { b.onclick = () => { const r = rows[+b.dataset.qr]; if (r && r.kind !== 'none') pick(r); }; });
  // tocchi sui suggerimenti senza perdere il focus
  box.addEventListener('pointerdown', e => e.preventDefault());
  inp.addEventListener('focus', draw);
  inp.addEventListener('input', draw);
  inp.addEventListener('blur', () => setTimeout(() => { box.hidden = true; }, 150));
  inp.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const best = rows.find(r => r.kind === 'ref') || rows.find(r => r.kind === 'ai') || rows.find(r => r.kind !== 'none');
    if (best) pick(best);
  });
  $$('[data-qm]', v).forEach(c => c.addEventListener('click', () => {
    qaMeal = c.dataset.qm;
    $$('[data-qm]', v).forEach(x => x.classList.toggle('on', x === c));
    if (!box.hidden) draw();
  }));
  $('#qaCam', v).addEventListener('click', () => { addMeal = qaTarget(); photoQueue = []; requireKey() && $('#photoInput').click(); });
  // Dettatura: "cento grammi di pasta al pomodoro e un'insalata"
  const mic = $('#qaMic', v);
  if (mic) mic.addEventListener('click', () => {
    if (mic.classList.contains('rec')) { recog?.stop(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recog = new SR();
    recog.lang = 'it-IT'; recog.interimResults = true; recog.maxAlternatives = 1;
    let finalText = '';
    recog.onresult = ev => {
      let txt = '';
      for (const r of ev.results) { txt += r[0].transcript; if (r.isFinal) finalText = txt; }
      inp.value = txt; draw();
    };
    recog.onerror = ev => { mic.classList.remove('rec'); if (ev.error === 'not-allowed') toast('Consenti il microfono per dettare'); };
    recog.onend = () => {
      mic.classList.remove('rec');
      const text = (finalText || inp.value).trim();
      if (!text) return;
      inp.value = text; draw();
      const best = rows.find(r => r.kind === 'ref') || rows.find(r => r.kind === 'ai');
      if (best) pick(best);
    };
    mic.classList.add('rec'); navigator.vibrate?.(10);
    try { recog.start(); } catch { mic.classList.remove('rec'); }
  });
}

// Scorri a sinistra: elimina · a destra: duplica · tieni premuto: sposta · tocco: modifica
function bindSwipe(li) {
  const id = li.dataset.entry;
  let x0 = 0, y0 = 0, dx = 0, mode = null, timer = null, longDone = false;
  const content = [...li.children];
  const setX = x => content.forEach(c => { c.style.transform = x ? `translateX(${x}px)` : ''; });
  li.addEventListener('pointerdown', e => {
    x0 = e.clientX; y0 = e.clientY; dx = 0; mode = 'press'; longDone = false;
    content.forEach(c => { c.style.transition = 'none'; });
    timer = setTimeout(() => { if (mode === 'press') { longDone = true; mode = null; navigator.vibrate?.(12); entryActions(id); } }, 550);
  });
  li.addEventListener('pointermove', e => {
    if (!mode) return;
    const mx = e.clientX - x0, my = e.clientY - y0;
    if (mode === 'press' && (Math.abs(mx) > 8 || Math.abs(my) > 8)) {
      clearTimeout(timer);
      mode = Math.abs(mx) > Math.abs(my) ? 'swipe' : null;
      if (mode === 'swipe') li.setPointerCapture?.(e.pointerId);
    }
    if (mode === 'swipe') {
      dx = Math.max(-140, Math.min(140, mx));
      setX(dx);
      li.classList.toggle('sw-left', dx < -20); li.classList.toggle('sw-right', dx > 20);
      li.classList.toggle('sw-armed', Math.abs(dx) > 90);
    }
  });
  const end = () => {
    clearTimeout(timer);
    content.forEach(c => { c.style.transition = ''; });
    if (mode === 'swipe') {
      if (dx < -90) removeEntry(id);
      else if (dx > 90) duplicateEntry(id);
      setX(0); li.classList.remove('sw-left', 'sw-right', 'sw-armed');
      li.addEventListener('click', ev => ev.stopPropagation(), { capture: true, once: true });
    } else if (mode === 'press' && !longDone) editEntry(id);
    mode = null;
  };
  li.addEventListener('pointerup', end);
  li.addEventListener('pointercancel', () => { clearTimeout(timer); mode = null; setX(0); li.classList.remove('sw-left', 'sw-right', 'sw-armed'); });
  li.addEventListener('contextmenu', e => e.preventDefault());
}
function removeEntry(id) {
  const list = dayEntries(curDate), i = list.findIndex(e => e.id === id);
  if (i < 0) return;
  const [gone] = list.splice(i, 1);
  save(); render(); navigator.vibrate?.(15);
  toast(`Eliminato: ${gone.name}`, { label: 'Annulla', fn: () => { dayEntries(curDate).splice(i, 0, gone); db.entries[curDate] = dayEntries(curDate); justAdded = new Set([gone.id]); save(); render(); } });
}
function duplicateEntry(id) {
  const list = dayEntries(curDate), i = list.findIndex(e => e.id === id);
  if (i < 0) return;
  const copy = { ...list[i], id: uid(), t: Date.now(), per100: { ...list[i].per100 } };
  list.splice(i + 1, 0, copy);
  justAdded = new Set([copy.id]);
  save(); render();
  toast(`Duplicato: ${copy.name}`, { label: 'Annulla', fn: () => { db.entries[curDate] = dayEntries(curDate).filter(e => e.id !== copy.id); save(); render(); } });
}
function entryActions(id) {
  const e = dayEntries(curDate).find(x => x.id === id);
  if (!e) return;
  openSheet(`<h3>${foodIcon(e.name)} ${esc(e.name)}</h3>
    <p class="small muted" style="margin-top:-6px">${r0(e.grams)} g · ${r0(nutrients(e).kcal)} kcal</p>
    <p class="small" style="margin-bottom:6px">Sposta in:</p>
    <div class="meal-pick">${MEALS.map(m => `<button class="chip ${m.id === e.meal ? 'on' : ''}" data-mv="${m.id}">${m.icon} ${m.label}</button>`).join('')}</div>
    <div class="btn-row" style="margin-bottom:8px"><button class="btn secondary" id="aDup">⧉ Duplica</button><button class="btn secondary" id="aEdit">✎ Modifica</button></div>
    <button class="btn danger" id="aDel">Elimina</button>`, s => {
    $$('[data-mv]', s).forEach(c => c.addEventListener('click', () => {
      e.meal = c.dataset.mv; justAdded = new Set([e.id]); save(); closeSheet(); render(); toast(`Spostato in ${MEALS.find(m => m.id === e.meal).label}`);
    }));
    $('#aDup', s).addEventListener('click', () => { closeSheet(); duplicateEntry(id); });
    $('#aEdit', s).addEventListener('click', () => editEntry(id));
    $('#aDel', s).addEventListener('click', () => { closeSheet(); removeEntry(id); });
  });
}

function editEntry(id) {
  const list = dayEntries(curDate);
  const e = list.find(x => x.id === id);
  if (!e) return;
  let grams = e.grams, meal = e.meal;
  const draw = s => {
    const n = nutrients({ ...e, grams });
    $('#eNutri', s).innerHTML = `<span><b>${r0(n.kcal)}</b> kcal</span><span>P <b>${fmtNum(n.p)}</b></span><span>C <b>${fmtNum(n.c)}</b></span><span>G <b>${fmtNum(n.f)}</b></span><span>Fibre <b>${fmtNum(n.fib)}</b></span>`;
  };
  openSheet(`<h3>Modifica</h3>
    <label class="field"><span>Nome</span><input type="text" id="eName" value="${esc(e.name)}"></label>
    <label class="field"><span>Quantità (g)</span>
      <div class="row"><button class="step" id="eMinus">−</button><input type="number" inputmode="decimal" id="eGrams" value="${r0(grams)}" style="text-align:center"><button class="step" id="ePlus">+</button></div>
    </label>
    ${porChips('data-ep')}
    <div class="nutri" id="eNutri"></div>
    <div class="meal-pick" style="margin-top:14px">${MEALS.map(m => `<button class="chip ${m.id === meal ? 'on' : ''}" data-m="${m.id}">${m.label}</button>`).join('')}</div>
    <div class="btn-row"><button class="btn danger" id="eDel">Elimina</button><button class="btn" id="eSave">Salva</button></div>`, s => {
    draw(s);
    const gi = $('#eGrams', s);
    gi.addEventListener('input', () => { grams = num(gi.value) || 0; draw(s); });
    const base = e.grams;
    $$('[data-ep]', s).forEach(b => b.addEventListener('click', () => {
      grams = r0(base * +b.dataset.k); gi.value = grams; draw(s);
      $$('[data-ep]', s).forEach(x => x.classList.toggle('on', x === b));
    }));
    $('#eMinus', s).addEventListener('click', () => { grams = Math.max(0, grams - 10); gi.value = r0(grams); draw(s); });
    $('#ePlus', s).addEventListener('click', () => { grams += 10; gi.value = r0(grams); draw(s); });
    $$('[data-m]', s).forEach(c => c.addEventListener('click', () => { meal = c.dataset.m; $$('[data-m]', s).forEach(x => x.classList.toggle('on', x === c)); }));
    $('#eDel', s).addEventListener('click', () => {
      db.entries[curDate] = list.filter(x => x.id !== id); save(); closeSheet(); render(); toast('Eliminato');
    });
    $('#eSave', s).addEventListener('click', () => {
      e.name = $('#eName', s).value.trim() || e.name; e.grams = grams; e.meal = meal;
      save(); closeSheet(); render();
    });
  });
}

// ---------- Add ----------
function renderAdd(v) {
  v.innerHTML = `
    <div class="meal-pick">${MEALS.map(m => `<button class="chip ${m.id === addMeal ? 'on' : ''}" data-m="${m.id}">${m.icon} ${m.label}</button>`).join('')}</div>
    <div class="big-actions three">
      <button class="big-action primary" id="takePhoto"><span class="ic">📷</span>Foto</button>
      <button class="big-action" id="pickPhoto"><span class="ic">🖼️</span>Galleria</button>
      <button class="big-action" id="scanCode"><span class="ic">▥</span>Codice a barre</button>
    </div>
    <div class="card">
      <h2>Pasti salvati <small>${db.savedMeals.length || ''}</small></h2>
      ${db.savedMeals.length ? `<ul class="search-results">${db.savedMeals.map((sm, i) => `<li><button data-sm="${i}"><span class="grow"><span class="name">⭐ ${esc(sm.name)}</span><br><span class="small muted">${sm.items.length} alimenti · ${r0(sumNutr(sm.items).kcal)} kcal</span></span><span class="add-mini">+</span></button></li>`).join('')}</ul>`
        : `<p class="small muted" style="margin:0">Nel Diario tocca ⭐ accanto a un pasto per salvarlo e rimetterlo con un tocco.</p>`}
      <button class="btn secondary" id="pastMeals" style="margin-top:10px">↺ Ripeti un pasto passato</button>
    </div>
    <div class="card">
      <h2>Descrivi cosa hai mangiato</h2>
      <textarea id="foodText" placeholder="es. 80 g di pasta al pomodoro con parmigiano, un'insalata con un cucchiaio d'olio e uno yogurt greco Fage 0%"></textarea>
      <button class="btn" id="analyzeText" style="margin-top:10px">✨ Calcola calorie e macro</button>
    </div>
    <div class="card">
      <h2>Cerca alimento o prodotto</h2>
      <input type="search" id="foodSearch" placeholder="es. mela, Nutella, yogurt Müller" autocomplete="off">
      <ul class="search-results" id="searchResults"></ul>
      <ul class="search-results" id="brandResults"></ul>
      <button class="btn ghost" id="manualAdd" style="margin-top:6px">Inserisci valori a mano</button>
    </div>`;
  $$('[data-m]', v).forEach(c => c.addEventListener('click', () => { addMeal = c.dataset.m; $$('[data-m]', v).forEach(x => x.classList.toggle('on', x === c)); }));
  $('#takePhoto', v).addEventListener('click', () => { photoQueue = []; requireKey() && $('#photoInput').click(); });
  $('#pickPhoto', v).addEventListener('click', () => { photoQueue = []; requireKey() && $('#galleryInput').click(); });
  $('#scanCode', v).addEventListener('click', scanBarcode);
  $('#analyzeText', v).addEventListener('click', () => {
    const text = $('#foodText', v).value.trim();
    if (!text) { toast('Scrivi cosa hai mangiato'); return; }
    // "pranzo del 22 settembre", "cena di ieri": si recupera dal diario, senza AI
    const ref = parseMealRef(text);
    if (ref) {
      const items = dayEntries(ref.date).filter(e => e.meal === ref.meal);
      if (items.length) { mealPreview({ title: `${MEALS.find(m => m.id === ref.meal).label} di ${fmtDate(ref.date, { weekday: 'long', day: 'numeric', month: 'long' })}`, items, meal: addMeal }); return; }
      toast(`Niente registrato a ${MEALS.find(m => m.id === ref.meal).label.toLowerCase()} il ${fmtDate(ref.date, { day: 'numeric', month: 'long' })}`);
      return;
    }
    if (!requireKey()) return;
    runAnalysis({ text });
  });
  $$('[data-sm]', v).forEach(b => b.addEventListener('click', () => {
    const sm = db.savedMeals[+b.dataset.sm];
    mealPreview({ title: sm.name, items: sm.items, meal: addMeal, saved: sm });
  }));
  $('#pastMeals', v).addEventListener('click', () => pastMealsSheet());
  const si = $('#foodSearch', v);
  const row = (x, i, attr) => `<li><button ${attr}="${i}"><span class="food-ico">${foodIcon(x.name)}</span><span class="grow"><span class="name">${esc(x.name)}</span><br><span class="small muted">${r0(x.grams)} g · ${r0(x.per100.kcal * x.grams / 100)} kcal</span></span><span class="add-mini">+</span></button></li>`;
  let brandTimer, brandSeq = 0;
  const drawResults = () => {
    const term = si.value.trim().toLowerCase();
    const recents = db.recent.map(r => ({ ...r, recent: true }));
    const base = window.FOODS.map(([name, kcal, p, c, f, fib, portion]) => ({ name, grams: portion, per100: { kcal, p, c, f, fib } }));
    let list;
    if (!term) list = recents.length ? recents.slice(0, 12) : base.slice(0, 12);
    else {
      const seen = new Set();
      list = [...recents, ...base].filter(x => {
        const k = x.name.toLowerCase();
        if (!k.includes(term) || seen.has(k)) return false;
        seen.add(k); return true;
      }).slice(0, 15);
    }
    $('#searchResults', v).innerHTML = (!term && recents.length ? `<li class="small muted" style="border:0;padding-bottom:0">Recenti</li>` : '') +
      (list.length ? list.map((x, i) => row(x, i, 'data-i')).join('') : '');
    $$('#searchResults [data-i]', v).forEach(b => b.addEventListener('click', () => quickAdd(list[+b.dataset.i])));

    // Prodotti di marca da Open Food Facts (serve la connessione)
    clearTimeout(brandTimer);
    const bx = $('#brandResults', v);
    if (term.length < 3) { bx.innerHTML = ''; return; }
    bx.innerHTML = `<li class="small muted">Cerco tra i prodotti di marca…</li>`;
    const seq = ++brandSeq;
    brandTimer = setTimeout(async () => {
      try {
        const found = await offSearch(term);
        if (seq !== brandSeq) return;
        bx.innerHTML = `<li class="small muted" style="padding-bottom:0">Prodotti di marca · Open Food Facts</li>` +
          (found.length ? found.map((x, i) => row(x, i, 'data-b')).join('') : `<li class="small muted">Nessun prodotto trovato${hasAiKey() ? ': prova a descriverlo nel box sopra' : ''}.</li>`);
        $$('[data-b]', bx).forEach(b => b.addEventListener('click', () => quickAdd(found[+b.dataset.b])));
      } catch {
        if (seq === brandSeq) bx.innerHTML = `<li class="small muted">Ricerca prodotti di marca non disponibile (sei offline?).</li>`;
      }
    }, 600);
  };
  si.addEventListener('input', drawResults);
  drawResults();
  $('#manualAdd', v).addEventListener('click', manualForm);
}

// ---------- Open Food Facts (database gratuito di prodotti di marca) ----------
const OFF_FIELDS = 'code,product_name,product_name_it,brands,nutriments,serving_quantity';
function offToFood(p) {
  const n = p.nutriments || {};
  let kcal = n['energy-kcal_100g'];
  if (kcal == null && n.energy_100g != null) kcal = n.energy_100g / 4.184; // kJ → kcal
  const name = (p.product_name_it || p.product_name || '').trim();
  if (kcal == null || !name) return null;
  const brand = (p.brands || '').split(',')[0].trim();
  const serving = +p.serving_quantity;
  return {
    name: brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${name} (${brand})` : name,
    grams: serving > 0 && serving < 2000 ? serving : 100,
    per100: {
      kcal: +kcal, p: +n.proteins_100g || 0, c: +n.carbohydrates_100g || 0, f: +n.fat_100g || 0, fib: +n.fiber_100g || 0,
      ...(n.sugars_100g != null ? { sug: +n.sugars_100g } : {}), ...(n['saturated-fat_100g'] != null ? { sat: +n['saturated-fat_100g'] } : {}),
      ...(n.salt_100g != null ? { salt: +n.salt_100g } : {}), ...(n.calcium_100g != null ? { ca: n.calcium_100g * 1000 } : {}),
      ...(n.iron_100g != null ? { fe: n.iron_100g * 1000 } : {}), ...(n.potassium_100g != null ? { kk: n.potassium_100g * 1000 } : {}),
      ...(n['vitamin-c_100g'] != null ? { vc: n['vitamin-c_100g'] * 1000 } : {}),
    },
    code: p.code,
  };
}
async function offSearch(term) {
  const url = `https://it.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(term)}&search_simple=1&action=process&json=1&page_size=20&fields=${OFF_FIELDS}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('off');
  const j = await res.json();
  return (j.products || []).map(offToFood).filter(Boolean).slice(0, 12);
}
async function offBarcode(code) {
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${OFF_FIELDS}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('off');
  const j = await res.json();
  return j.status === 1 && j.product ? offToFood({ ...j.product, code }) : null;
}

// ---------- Codice a barre ----------
let zxingLoading;
function loadZxing() {
  if (window.ZXing) return Promise.resolve();
  zxingLoading ||= new Promise((resolve, reject) => {
    const sc = document.createElement('script');
    sc.src = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';
    sc.onload = resolve; sc.onerror = () => { zxingLoading = null; reject(new Error('zxing')); };
    document.head.appendChild(sc);
  });
  return zxingLoading;
}

function scanBarcode() {
  openSheet(`<h3>Codice a barre</h3>
    <div class="scanner"><video id="scanVideo" playsinline muted></video><div class="scan-line"></div></div>
    <p class="small muted center" id="scanMsg">Inquadra il codice a barre della confezione</p>
    <div class="row"><input type="text" inputmode="numeric" id="codeInput" placeholder="…oppure scrivi il numero" class="grow"><button class="btn" id="codeGo" style="width:auto">Cerca</button></div>`, async s => {
    let stopped = false, stream = null, reader = null, timer = null;
    sheetCleanup = () => {
      stopped = true; clearInterval(timer);
      try { reader && reader.reset(); } catch {}
      stream && stream.getTracks().forEach(t => t.stop());
    };
    const found = code => { if (stopped) return; sheetCleanup(); sheetCleanup = null; lookupBarcode(code); };
    $('#codeGo', s).addEventListener('click', () => {
      const code = $('#codeInput', s).value.replace(/\D/g, '');
      if (code.length < 8) { toast('Codice non valido'); return; }
      found(code);
    });
    const video = $('#scanVideo', s);
    const msg = t => { const m = $('#scanMsg', s); if (m) m.textContent = t; };
    try {
      if ('BarcodeDetector' in window) {
        const det = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return; }
        video.srcObject = stream; await video.play();
        timer = setInterval(async () => {
          if (stopped || video.readyState < 2) return;
          try { const r = await det.detect(video); if (r[0]) found(r[0].rawValue); } catch {}
        }, 250);
      } else {
        await loadZxing();
        if (stopped) return;
        reader = new ZXing.BrowserMultiFormatReader();
        await reader.decodeFromConstraints({ video: { facingMode: 'environment' } }, video, r => { if (r) found(r.getText()); });
      }
    } catch {
      msg('Fotocamera non disponibile: scrivi il numero sotto il codice a barre.');
    }
  });
}

async function lookupBarcode(code) {
  openSheet(`<h3>Cerco il prodotto…</h3><div class="spinner"></div><p class="center muted small">Codice ${esc(code)}</p>`);
  try {
    const food = await offBarcode(code);
    if (food) { quickAdd(food); return; }
    openSheet(`<h3>Prodotto non trovato</h3>
      <p>Il codice ${esc(code)} non è nel database Open Food Facts.</p>
      <p class="small muted">Puoi fotografare la tabella nutrizionale sulla confezione: l'AI legge i valori dell'etichetta.</p>
      <div class="btn-row"><button class="btn secondary" id="nfManual">A mano</button><button class="btn" id="nfPhoto">📷 Foto etichetta</button></div>`, s => {
      $('#nfManual', s).addEventListener('click', manualForm);
      $('#nfPhoto', s).addEventListener('click', () => { closeSheet(); photoQueue = []; requireKey() && $('#photoInput').click(); });
    });
  } catch {
    openSheet(`<h3>Nessuna connessione</h3><p>Per cercare i prodotti col codice a barre serve internet.</p><button class="btn" id="nfOk">Ok</button>`,
      s => $('#nfOk', s).addEventListener('click', closeSheet));
  }
}

// ---------- Pasti salvati e pasti passati ----------
const cloneItems = items => items.map(e => ({ name: e.name, grams: e.grams, per100: { ...e.per100 }, ...(typeof e.veg === 'boolean' ? { veg: e.veg } : {}) }));

function saveMealForm(items, meal) {
  if (!items.length) return;
  const label = MEALS.find(m => m.id === meal)?.label || 'Pasto';
  const guess = `${label}: ${items.slice(0, 2).map(e => e.name).join(', ')}${items.length > 2 ? '…' : ''}`;
  openSheet(`<h3>⭐ Salva pasto</h3>
    <label class="field"><span>Nome</span><input type="text" id="smName" value="${esc(guess)}" maxlength="60"></label>
    <ul class="items">${items.map(e => `<li><div class="grow"><div class="name">${esc(e.name)}</div><div class="sub">${r0(e.grams)} g</div></div><div class="kc">${r0(nutrients(e).kcal)}</div></li>`).join('')}</ul>
    <div class="totals" style="margin-bottom:12px"><span>Totale</span><span>${r0(sumNutr(items).kcal)} kcal</span></div>
    <button class="btn" id="smSave">Salva</button>`, s => {
    $('#smSave', s).addEventListener('click', () => {
      const name = $('#smName', s).value.trim() || guess;
      db.savedMeals = [{ id: uid(), name, meal, items: cloneItems(items) }, ...db.savedMeals.filter(x => x.name.toLowerCase() !== name.toLowerCase())];
      save(); closeSheet(); render(); toast(`Salvato: ${name}`);
    });
  });
}

// Anteprima modificabile di un gruppo di alimenti da aggiungere (pasto salvato o passato)
function mealPreview({ title, items: src, meal, saved }) {
  const items = cloneItems(src);
  let target = meal || addMeal;
  const draw = s => {
    $('#mpItems', s).innerHTML = items.map((it, i) => `<div class="res-item">
      <div class="line1"><b class="grow">${esc(it.name)}</b><button class="x-btn" data-rm="${i}" aria-label="Togli">×</button></div>
      <div class="grams"><button class="step" data-dec="${i}">−</button><input type="number" inputmode="decimal" data-g="${i}" value="${r0(it.grams)}"><span class="muted small">g · ${r0(nutrients(it).kcal)} kcal</span><button class="step" data-inc="${i}" style="margin-left:auto">+</button></div>
    </div>`).join('') || '<p class="muted">Nessun alimento.</p>';
    const t = sumNutr(items);
    $('#mpTot', s).innerHTML = `<span>Totale</span><span>${r0(t.kcal)} kcal · P ${r0(t.p)} · C ${r0(t.c)} · G ${r0(t.f)}</span>`;
    $$('[data-rm]', s).forEach(b => b.addEventListener('click', () => { items.splice(+b.dataset.rm, 1); draw(s); }));
    $$('[data-g]', s).forEach(inp => inp.addEventListener('change', () => { items[+inp.dataset.g].grams = num(inp.value) || 0; draw(s); }));
    $$('[data-dec]', s).forEach(b => b.addEventListener('click', () => { const it = items[+b.dataset.dec]; it.grams = Math.max(0, it.grams - 10); draw(s); }));
    $$('[data-inc]', s).forEach(b => b.addEventListener('click', () => { items[+b.dataset.inc].grams += 10; draw(s); }));
  };
  openSheet(`<h3>${esc(title)}</h3>
    <div id="mpItems"></div>
    <div class="totals" id="mpTot"></div>
    <p class="small muted">Aggiungi a ${curDate === today() ? 'oggi' : fmtDate(curDate, { weekday: 'long', day: 'numeric', month: 'long' })}:</p>
    <div class="meal-pick">${MEALS.map(m => `<button class="chip ${m.id === target ? 'on' : ''}" data-m="${m.id}">${m.label}</button>`).join('')}</div>
    <div class="btn-row">${saved ? '<button class="btn danger" id="mpDel">Elimina</button>' : '<button class="btn secondary" id="mpStar">⭐ Salva</button>'}<button class="btn" id="mpAdd">Aggiungi</button></div>`, s => {
    draw(s);
    $$('[data-m]', s).forEach(c => c.addEventListener('click', () => { target = c.dataset.m; $$('[data-m]', s).forEach(x => x.classList.toggle('on', x === c)); }));
    $('#mpAdd', s).addEventListener('click', () => {
      const valid = items.filter(i => i.grams > 0);
      if (!valid.length) { toast('Nessun alimento da aggiungere'); return; }
      addEntries(cloneItems(valid), target); addMeal = target;
      closeSheet(); toast(`Aggiunti ${valid.length} alimenti`); go('today');
    });
    $('#mpDel', s)?.addEventListener('click', () => {
      if (!confirm(`Eliminare il pasto salvato "${saved.name}"?`)) return;
      db.savedMeals = db.savedMeals.filter(x => x.id !== saved.id); save(); closeSheet(); render(); toast('Pasto salvato eliminato');
    });
    $('#mpStar', s)?.addEventListener('click', () => saveMealForm(items, target));
  });
}

function pastMealsSheet(filter = 'all', query = '') {
  const norm = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const days = Object.keys(db.entries).filter(d => d <= today()).sort().reverse().slice(0, 365);
  const all = [];
  for (const d of days) for (const m of MEALS) {
    const items = dayEntries(d).filter(e => e.meal === m.id);
    if (items.length) all.push({ d, m, items, text: norm(items.map(e => e.name).join(' | ')) });
  }
  let rows = [];
  openSheet(`<h3>↺ Ripeti un pasto passato</h3>
    <input type="search" id="pmSearch" placeholder="Cerca un ingrediente, es. salmone" value="${esc(query)}" autocomplete="off" style="margin-bottom:10px">
    <div class="meal-pick"><button class="chip ${filter === 'all' ? 'on' : ''}" data-f="all">Tutti</button>${MEALS.map(m => `<button class="chip ${filter === m.id ? 'on' : ''}" data-f="${m.id}">${m.label}</button>`).join('')}</div>
    <div id="pmList"></div>
    <p class="small muted">Suggerimento: puoi anche scrivere "pranzo del 22 settembre" o "cena di ieri" nel box di testo.</p>`, s => {
    const draw = () => {
      const words = norm($('#pmSearch', s).value.trim()).split(/\s+/).filter(Boolean);
      rows = all.filter(r => (filter === 'all' || r.m.id === filter) && words.every(w => r.text.includes(w)));
      // evidenzia gli alimenti che corrispondono alla ricerca
      const label = r => r.items.map(e => {
        const hit = words.some(w => norm(e.name).includes(w));
        return hit ? `<mark>${esc(e.name)}</mark>` : esc(e.name);
      }).join(', ');
      $('#pmList', s).innerHTML = rows.length
        ? `<p class="small muted" style="margin:0 0 4px">${rows.length} ${rows.length === 1 ? 'pasto' : 'pasti'}</p><ul class="search-results">${rows.slice(0, 80).map((r, i) => `<li><button data-pm="${i}"><span class="grow"><span class="name">${r.m.label} · ${fmtDate(r.d)}</span><br><span class="small muted">${label(r)}</span></span><span class="kc">${r0(sumNutr(r.items).kcal)}</span></button></li>`).join('')}</ul>`
        : `<p class="muted">${words.length ? 'Nessun pasto con questo ingrediente.' : 'Nessun pasto registrato.'}</p>`;
      $$('[data-pm]', s).forEach(b => b.addEventListener('click', () => {
        const r = rows[+b.dataset.pm];
        mealPreview({ title: `${r.m.label} di ${fmtDate(r.d, { weekday: 'long', day: 'numeric', month: 'long' })}`, items: r.items, meal: filter === 'all' ? addMeal : r.m.id });
      }));
    };
    draw();
    $('#pmSearch', s).addEventListener('input', draw);
    $$('[data-f]', s).forEach(c => c.addEventListener('click', () => pastMealsSheet(c.dataset.f, $('#pmSearch', s).value)));
  });
}

// Riconosce frasi come "pranzo del 22 settembre", "come la cena di ieri", "colazione del 3/9", "cena di lunedì"
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const GIORNI = ['domenica', 'lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato'];
function parseMealRef(text) {
  const t = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, ' ').trim();
  if (t.length > 70) return null;
  const mm = t.match(/\b(colazione|pranzo|cena|spuntin[oi]|merenda)\b/);
  if (!mm) return null;
  const meal = { colazione: 'colazione', pranzo: 'pranzo', cena: 'cena', merenda: 'spuntini' }[mm[1]] || 'spuntini';
  const rest = t.slice(mm.index + mm[0].length);
  const now = parseYmd(today());
  let d = null, x;
  if (/\b(l )?altro ieri|avantieri\b/.test(rest)) d = addDays(today(), -2);
  else if (/\bieri\b/.test(rest)) d = addDays(today(), -1);
  else if (/\boggi\b/.test(rest)) d = today();
  else if ((x = rest.match(/\b(\d{1,2})\s*[\/.-]\s*(\d{1,2})(?:\s*[\/.-]\s*(\d{2,4}))?\b/))) {
    const y = x[3] ? (x[3].length === 2 ? 2000 + +x[3] : +x[3]) : now.getFullYear();
    d = ymd(new Date(y, +x[2] - 1, +x[1]));
  } else if ((x = rest.match(new RegExp('\\b(\\d{1,2})\\s+(' + MESI.join('|') + ')\\b')))) {
    d = ymd(new Date(now.getFullYear(), MESI.indexOf(x[2]), +x[1]));
  } else if ((x = rest.match(/\b(?:del|di|il)\s+(\d{1,2})\b/))) {
    d = ymd(new Date(now.getFullYear(), now.getMonth(), +x[1]));
    if (d > today()) d = ymd(new Date(now.getFullYear(), now.getMonth() - 1, +x[1]));
  } else if ((x = rest.match(new RegExp('\\b(' + GIORNI.join('|') + ')\\b')))) {
    const back = (now.getDay() - GIORNI.indexOf(x[1]) + 7) % 7 || 7;
    d = addDays(today(), -back);
  }
  if (!d) return null;
  if (d > today()) d = ymd(new Date(parseYmd(d).getFullYear() - 1, parseYmd(d).getMonth(), parseYmd(d).getDate()));
  // se oltre al riferimento ci sono altri cibi (es. "pranzo di ieri e una mela") lascia fare all'AI
  if (/\b(e|con|piu|\+)\s+(un|una|uno|del|della|dei|delle|\d)/.test(t.replace(mm[0], ''))) return null;
  return { meal, date: d };
}

function requireKey() {
  if (hasAiKey()) return true;
  toast('Inserisci prima una chiave AI in Obiettivi → Impostazioni (Gemini è gratis)');
  go('goals');
  setTimeout(() => $('#settingsCard')?.scrollIntoView({ behavior: 'smooth' }), 100);
  return false;
}

let justAdded = new Set();
function addEntries(items, meal) {
  const list = dayEntries(curDate);
  justAdded = new Set();
  for (const it of items) {
    const e = { id: uid(), name: it.name, grams: it.grams, per100: it.per100, meal, t: Date.now(), ...(typeof it.veg === 'boolean' ? { veg: it.veg } : {}) };
    list.push(e);
    justAdded.add(e.id);
    rememberRecent(e);
  }
  db.entries[curDate] = list;
  save();
}

function quickAdd(food) {
  let grams = food.grams;
  const draw = s => {
    const n = nutrients({ per100: food.per100, grams });
    $('#qNutri', s).innerHTML = `<span><b>${r0(n.kcal)}</b> kcal</span><span>P <b>${fmtNum(n.p)}</b></span><span>C <b>${fmtNum(n.c)}</b></span><span>G <b>${fmtNum(n.f)}</b></span>`;
  };
  openSheet(`<h3>${esc(food.name)}</h3>
    <label class="field"><span>Quantità (g)</span>
      <div class="row"><button class="step" id="qMinus">−</button><input type="number" inputmode="decimal" id="qGrams" value="${r0(grams)}" style="text-align:center"><button class="step" id="qPlus">+</button></div>
    </label>
    ${porChips('data-qp')}
    <div class="nutri" id="qNutri"></div>
    <p class="small muted">Per 100 g: ${r0(food.per100.kcal)} kcal · P ${fmtNum(food.per100.p)} · C ${fmtNum(food.per100.c)} · G ${fmtNum(food.per100.f)}</p>
    <button class="btn" id="qAdd">Aggiungi a ${MEALS.find(m => m.id === addMeal).label}</button>`, s => {
    draw(s);
    const gi = $('#qGrams', s);
    gi.addEventListener('input', () => { grams = num(gi.value) || 0; draw(s); });
    $$('[data-qp]', s).forEach(b => b.addEventListener('click', () => {
      grams = r0(food.grams * +b.dataset.k); gi.value = grams; draw(s);
      $$('[data-qp]', s).forEach(x => x.classList.toggle('on', x === b));
    }));
    $('#qMinus', s).addEventListener('click', () => { grams = Math.max(0, grams - 10); gi.value = r0(grams); draw(s); });
    $('#qPlus', s).addEventListener('click', () => { grams += 10; gi.value = r0(grams); draw(s); });
    $('#qAdd', s).addEventListener('click', () => {
      if (!grams) { toast('Indica la quantità'); return; }
      addEntries([{ name: food.name, grams, per100: food.per100 }], addMeal);
      closeSheet(); toast('Aggiunto'); go('today');
    });
  });
}

function manualForm() {
  openSheet(`<h3>Inserimento manuale</h3>
    <label class="field"><span>Nome</span><input type="text" id="mName" placeholder="es. Barretta proteica"></label>
    <div class="grid2">
      <label class="field"><span>Quantità (g)</span><input type="number" inputmode="decimal" id="mGrams" value="100"></label>
      <label class="field"><span>Calorie (kcal)</span><input type="number" inputmode="decimal" id="mKcal"></label>
    </div>
    <div class="grid3">
      <label class="field"><span>Proteine g</span><input type="number" inputmode="decimal" id="mP"></label>
      <label class="field"><span>Carboidrati g</span><input type="number" inputmode="decimal" id="mC"></label>
      <label class="field"><span>Grassi g</span><input type="number" inputmode="decimal" id="mF"></label>
    </div>
    <p class="small muted" style="margin-top:0">I valori si riferiscono alla quantità indicata.</p>
    <button class="btn" id="mAdd">Aggiungi</button>`, s => {
    $('#mAdd', s).addEventListener('click', () => {
      const name = $('#mName', s).value.trim();
      const grams = num($('#mGrams', s).value) || 100;
      const kcal = num($('#mKcal', s).value);
      if (!name || kcal == null) { toast('Servono almeno nome e calorie'); return; }
      const k = 100 / grams;
      addEntries([{ name, grams, per100: { kcal: kcal * k, p: (num($('#mP', s).value) || 0) * k, c: (num($('#mC', s).value) || 0) * k, f: (num($('#mF', s).value) || 0) * k, fib: 0 } }], addMeal);
      closeSheet(); toast('Aggiunto'); go('today');
    });
  });
}

// ---------- Photo ----------
// Più foto dello stesso pasto (es. primo, secondo e contorno): si raccolgono e si analizzano insieme
let photoQueue = [];
const MAX_PHOTOS = 6;
async function handlePhotos(files) {
  files = [...files].slice(0, MAX_PHOTOS - photoQueue.length);
  if (!files.length) { if (photoQueue.length >= MAX_PHOTOS) toast(`Massimo ${MAX_PHOTOS} foto per pasto`); return; }
  try {
    for (const f of files) photoQueue.push(await resizeImage(f, photoQueue.length + files.length > 2 ? 900 : 1024, 0.8));
  } catch { toast('Impossibile leggere la foto'); }
  photoSheet();
}
function photoSheet() {
  const note = $('#pNote')?.value || '';
  openSheet(`<h3>${photoQueue.length > 1 ? `${photoQueue.length} foto del pasto` : 'Foto del pasto'}</h3>
    <div class="thumbs">${photoQueue.map((p, i) => `<div class="thumb"><img src="${p.dataUrl}" alt=""><button data-del="${i}" aria-label="Togli foto">×</button></div>`).join('')}</div>
    ${photoQueue.length < MAX_PHOTOS ? `<div class="btn-row" style="margin-bottom:10px"><button class="btn secondary" id="pMoreCam">📷 Altra foto</button><button class="btn secondary" id="pMoreGal">🖼️ Galleria</button></div>
    <p class="small muted" style="margin-top:-4px">Aggiungi le altre portate dello stesso pasto: l'AI le analizza insieme.</p>` : ''}
    <label class="field"><span>Dettagli (facoltativo)</span><input type="text" id="pNote" value="${esc(note)}" placeholder="es. porzione abbondante, condita con olio, pasta integrale"></label>
    <div class="btn-row"><button class="btn secondary" id="pCancel">Annulla</button><button class="btn" id="pGo">✨ Analizza ${photoQueue.length > 1 ? `${photoQueue.length} foto` : ''}</button></div>`, s => {
    $$('[data-del]', s).forEach(b => b.addEventListener('click', () => { photoQueue.splice(+b.dataset.del, 1); photoQueue.length ? photoSheet() : (closeSheet()); }));
    $('#pMoreCam', s)?.addEventListener('click', () => $('#photoInput').click());
    $('#pMoreGal', s)?.addEventListener('click', () => $('#galleryInput').click());
    $('#pCancel', s).addEventListener('click', () => { photoQueue = []; closeSheet(); });
    $('#pGo', s).addEventListener('click', () => {
      const q = photoQueue; photoQueue = [];
      runAnalysis({ images: q.map(p => p.b64), previews: q.map(p => p.dataUrl), text: $('#pNote', s).value.trim() });
    });
  });
}
for (const id of ['#photoInput', '#galleryInput']) {
  $(id).addEventListener('change', e => { handlePhotos(e.target.files); e.target.value = ''; });
}

function resizeImage(file, maxSide, quality) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      const dataUrl = cv.toDataURL('image/jpeg', quality);
      resolve({ dataUrl, b64: dataUrl.split(',')[1] });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('img')); };
    img.src = url;
  });
}

// ---------- Claude ----------
const FOOD_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          portion: { type: 'string' },
          grams: { type: 'number' },
          kcal: { type: 'number' },
          protein_g: { type: 'number' },
          carbs_g: { type: 'number' },
          fat_g: { type: 'number' },
          fiber_g: { type: 'number' },
          vegetarian: { type: 'boolean' },
          sugar_g: { type: 'number' },
          saturated_fat_g: { type: 'number' },
          salt_g: { type: 'number' },
          calcium_mg: { type: 'number' },
          iron_mg: { type: 'number' },
          potassium_mg: { type: 'number' },
          vitamin_c_mg: { type: 'number' },
          confidence: { type: 'string', enum: ['alta', 'media', 'bassa'] },
        },
        required: ['name', 'portion', 'grams', 'kcal', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'vegetarian', 'sugar_g', 'saturated_fat_g', 'salt_g', 'calcium_mg', 'iron_mg', 'potassium_mg', 'vitamin_c_mg', 'confidence'],
        additionalProperties: false,
      },
    },
    notes: { type: 'string' },
  },
  required: ['items', 'notes'],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `Sei un nutrizionista che aiuta una persona a tenere il diario alimentare dal telefono. Ricevi la foto di un pasto e/o una descrizione testuale e restituisci gli alimenti con le stime nutrizionali.

Come lavorare:
- Elenca separatamente ogni alimento o componente riconoscibile (es. pasta, sugo, parmigiano; oppure un piatto composto se non è scomponibile in modo sensato). Nomi brevi in italiano.
- Se l'utente indica quantità o marche, usale: per un prodotto di marca usa i valori nutrizionali di quel prodotto e metti la marca nel nome (es. "Yogurt greco 0% Fage").
- Se nella foto c'è una confezione o una tabella nutrizionale, leggi marca e valori dall'etichetta e usa quelli, riportati alla porzione mangiata (se non è indicata, usa la porzione consigliata in etichetta).
- Altrimenti stima la porzione realistica dalla foto (dimensione del piatto, posate, confezioni) o da una porzione tipica italiana.
- "grams" è il peso della porzione così come mangiata (cotta se cotta). Per le bevande usa i ml come grammi. Scrivi in "portion" una descrizione leggibile (es. "1 piatto medio", "2 cucchiai").
- Calorie, proteine, carboidrati, grassi e fibre si riferiscono all'intera porzione, basati su tabelle di composizione (CREA, USDA). Includi i condimenti probabili (olio, burro, salse) come voce separata quando sono rilevanti.
- Stima anche zuccheri, grassi saturi, sale, calcio, ferro, potassio e vitamina C dell'intera porzione (0 se assenti).
- "vegetarian" è true se l'alimento non contiene carne né pesce (uova, latte e formaggi vanno bene).
- Se ricevi più foto, sono portate o angolazioni dello stesso pasto: elenca tutto quello che si vede, senza contare due volte lo stesso cibo se compare in più foto.
- "confidence" indica quanto sei sicuro di identificazione e porzione.
- In "notes" scrivi in una o due frasi le ipotesi principali (es. "Ho ipotizzato 1 cucchiaio d'olio"). Se nella foto non c'è cibo, restituisci items vuoto e spiegalo nelle note.`;

async function callClaude(content, { system = SYSTEM_PROMPT, schema = FOOD_SCHEMA } = {}) {
  const model = db.settings.model || 'claude-opus-5';
  const body = {
    model,
    max_tokens: 8000,
    system,
    messages: [{ role: 'user', content }],
    output_config: { format: { type: 'json_schema', schema } },
  };
  const headers = {
    'content-type': 'application/json',
    'x-api-key': db.settings.apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
  if (model !== 'claude-haiku-4-5') body.output_config.effort = 'medium';
  if (model === 'claude-opus-5') {
    // In caso di rifiuto dei classificatori, il server riprova con il modello di riserva consigliato.
    body.fallbacks = 'default';
    headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';
  }
  let res;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers, body: JSON.stringify(body) });
  } catch {
    throw new Error('Connessione assente. Riprova quando sei online.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || `Errore ${res.status}`;
    if (res.status === 401) throw new Error('Chiave API non valida. Controllala nelle impostazioni.');
    if (res.status === 429) throw new Error('Troppe richieste, riprova tra poco.');
    if (res.status === 529 || res.status >= 500) throw new Error('Servizio momentaneamente sovraccarico, riprova tra poco.');
    throw new Error(msg);
  }
  if (data.stop_reason === 'refusal') throw new Error('La richiesta non è stata elaborata. Prova a riformularla.');
  if (data.stop_reason === 'max_tokens') throw new Error('Risposta troppo lunga: prova a dividere il pasto in più parti.');
  const text = (data.content || []).find(b => b.type === 'text')?.text;
  if (!text) throw new Error('Risposta vuota, riprova.');
  return JSON.parse(text);
}

// Google Gemini: ha un livello gratuito (con limiti di richieste al minuto e al giorno).
function toGeminiSchema(sc) {
  const out = { type: sc.type.toUpperCase() };
  if (sc.enum) out.enum = sc.enum;
  if (sc.items) out.items = toGeminiSchema(sc.items);
  if (sc.properties) {
    out.properties = Object.fromEntries(Object.entries(sc.properties).map(([k, v]) => [k, toGeminiSchema(v)]));
    out.propertyOrdering = Object.keys(sc.properties);
  }
  if (sc.required) out.required = sc.required;
  return out;
}
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

async function geminiFetch(path, init = {}) {
  let res;
  try {
    res = await fetch(GEMINI_BASE + path, { ...init, headers: { 'content-type': 'application/json', 'x-goog-api-key': db.settings.geminiKey, ...(init.headers || {}) } });
  } catch {
    throw new Error('Connessione assente. Riprova quando sei online.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || `Errore ${res.status}`;
    if (res.status === 400 && /api key/i.test(msg)) throw new Error('Chiave Gemini non valida. Controllala nelle impostazioni.');
    if (res.status === 403) throw new Error('Chiave Gemini non autorizzata. Controllala nelle impostazioni.');
    const fail = (text, retryable) => Object.assign(new Error(text), { retryable, status: res.status, detail: msg });
    if (res.status === 404) throw fail('Nessun modello Gemini disponibile: premi "Prova" nelle impostazioni per aggiornare l\'elenco.', true);
    if (res.status === 429) throw fail('Limite gratuito di Gemini raggiunto per ora. Riprova tra qualche minuto (o domani se hai finito le richieste del giorno).', true);
    if (res.status >= 500) throw fail('I server di Gemini sono sovraccarichi in questo momento, riprova tra poco.', true);
    throw fail(msg, false);
  }
  return data;
}

// Se un modello è sovraccarico (503), ha finito la quota gratuita (429) o non è più disponibile (404), prova il successivo.
// Parte dall'ultimo modello che ha funzionato; quelli che rispondono 404 vengono scartati per sempre.
const GEMINI_FALLBACKS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];
async function callGemini(input) {
  const st = db.settings;
  const dead = new Set(st.geminiDead || []);
  const primary = st.aiMode === 'precise' ? (st.geminiModel || GEMINI_DEFAULT_MODEL) : GEMINI_FAST_MODEL;
  const chain = [...new Set([primary, st.geminiWorking, ...GEMINI_FALLBACKS, ...(st.geminiModels || [])])]
    .filter(m => m && !dead.has(m)).slice(0, 5);
  let lastErr;
  for (const model of chain) {
    try {
      const out = await callGeminiModel(model, input);
      if (st.geminiWorking !== model) { st.geminiWorking = model; save(); }
      return out;
    } catch (err) {
      lastErr = err;
      if (!err.retryable) throw err;
      if (err.status === 404) {
        st.geminiDead = [...dead.add(model)];
        st.geminiModels = (st.geminiModels || []).filter(m => m !== model);
        if (st.geminiWorking === model) st.geminiWorking = null;
        save();
      }
    }
  }
  throw lastErr || new Error('Nessun modello Gemini disponibile al momento, riprova tra poco.');
}

async function callGeminiModel(model, { prompt, images = [], system = SYSTEM_PROMPT, schema = FOOD_SCHEMA }) {
  const parts = images.map(data => ({ inline_data: { mime_type: 'image/jpeg', data } }));
  parts.push({ text: prompt });
  // Meno "ragionamento" = risposta molto più rapida; per stimare un pasto basta.
  const thinking = /^gemini-3/.test(model) ? { thinkingLevel: /lite/.test(model) ? 'minimal' : 'low' } : null;
  const request = withThinking => geminiFetch(`/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: 'application/json', responseSchema: toGeminiSchema(schema),
        ...(withThinking && thinking ? { thinkingConfig: thinking } : {}),
      },
    }),
  });
  let data;
  try { data = await request(true); }
  catch (err) { if (thinking && err.status === 400) data = await request(false); else throw err; }
  if (data.promptFeedback?.blockReason) throw new Error('La richiesta non è stata elaborata. Prova a riformularla.');
  const cand = data.candidates?.[0];
  const text = (cand?.content?.parts || []).filter(p => p.text && !p.thought).map(p => p.text).join('');
  if (!text) throw new Error(cand?.finishReason === 'MAX_TOKENS' ? 'Risposta troppo lunga: prova a dividere il pasto in più parti.' : 'Risposta vuota, riprova.');
  return JSON.parse(text);
}

// Elenca i modelli "flash" disponibili per la chiave, dal più recente.
async function listGeminiModels() {
  const data = await geminiFetch('/models?pageSize=1000');
  const ver = n => parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/) || [])[1] || 0);
  return (data.models || [])
    .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map(m => m.name.replace(/^models\//, ''))
    .filter(n => /^gemini-[\d.]+-flash(-lite)?(-preview)?$/.test(n) && !(db.settings.geminiDead || []).includes(n))
    .sort((a, b) => /preview/.test(a) - /preview/.test(b) || ver(b) - ver(a) || /lite/.test(a) - /lite/.test(b));
}

function analyzeFood({ prompt, images = [], system, schema }) {
  if (db.settings.provider === 'claude') {
    const content = images.map(data => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } }));
    content.push({ type: 'text', text: prompt });
    return callClaude(content, { system, schema });
  }
  return callGemini({ prompt, images, system, schema });
}

// Micronutrienti per 100 g dai valori della porzione restituiti dall'AI
const microFromAI = (it, k) => ({ sug: (it.sugar_g || 0) * k, sat: (it.saturated_fat_g || 0) * k, salt: (it.salt_g || 0) * k,
  ca: (it.calcium_mg || 0) * k, fe: (it.iron_mg || 0) * k, kk: (it.potassium_mg || 0) * k, vc: (it.vitamin_c_mg || 0) * k });

async function runAnalysis({ text, images = [], previews = [] }) {
  const preview = previews[0];
  openSheet(`<h3>Analizzo…</h3>
    ${previews.length ? `<div class="scan"><img src="${previews[0]}" alt=""><div class="scan-beam"></div>${previews.length > 1 ? `<span class="scan-n">+${previews.length - 1} foto</span>` : ''}</div>`
      : `<div class="skel-wrap">${[0, 1, 2].map(() => '<div class="skel"><i></i><div><b></b><b></b></div></div>').join('')}</div>`}
    <p class="center muted small"><span id="aiStep">Riconosco gli alimenti…</span> · <span id="aiSecs">0</span> s</p>`);
  const steps = ['Riconosco gli alimenti…', 'Stimo le porzioni…', 'Calcolo calorie e macro…', 'Ultimi controlli…'];
  let stepI = 0;
  const stepTimer = setInterval(() => { const el = $('#aiStep'); if (!el) return clearInterval(stepTimer); stepI = Math.min(stepI + 1, steps.length - 1); el.textContent = steps[stepI]; }, 1400);
  const t0 = Date.now();
  const tick = setInterval(() => { const el = $('#aiSecs'); if (el) el.textContent = Math.round((Date.now() - t0) / 1000); else clearInterval(tick); }, 500);
  const what = images.length > 1 ? `${images.length} foto dello stesso pasto (più portate).` : 'Foto del mio pasto.';
  const prompt = images.length
    ? (text ? `${what} Dettagli: ${text}` : what)
    : `Ho mangiato: ${text}`;
  try {
    const out = await analyzeFood({ prompt, images });
    const items = (out.items || []).map(it => {
      const grams = it.grams > 0 ? it.grams : 100;
      const k = 100 / grams;
      return {
        name: it.name, portion: it.portion, confidence: it.confidence, grams, veg: typeof it.vegetarian === 'boolean' ? it.vegetarian : undefined,
        per100: { kcal: it.kcal * k, p: it.protein_g * k, c: it.carbs_g * k, f: it.fat_g * k, fib: (it.fiber_g || 0) * k, ...microFromAI(it, k) },
      };
    });
    reviewResult(items, out.notes, preview);
  } catch (err) {
    openSheet(`<h3>Qualcosa non va</h3><p>${esc(err.message)}</p>${err.detail ? `<p class="small muted">Dettaglio: ${esc(err.detail)}</p>` : ''}
      <div class="btn-row"><button class="btn secondary" id="rClose">Chiudi</button><button class="btn" id="rRetry">Riprova</button></div>`, s => {
      $('#rClose', s).addEventListener('click', closeSheet);
      $('#rRetry', s).addEventListener('click', () => runAnalysis({ text, images, previews }));
    });
  }
}

function reviewResult(items, notes, preview) {
  let meal = addMeal;
  const draw = s => {
    const box = $('#rItems', s);
    box.innerHTML = items.length ? items.map((it, i) => {
      const n = nutrients(it);
      it.base ??= it.grams;
      return `<div class="res-item" style="animation-delay:${i * 80}ms">
        <div class="line1"><span class="food-ico">${foodIcon(it.name)}</span><input type="text" data-name="${i}" value="${esc(it.name)}">
          ${it.confidence ? `<span class="conf ${it.confidence === 'bassa' ? 'low' : ''}">${esc(it.confidence)}</span>` : ''}
          <button class="x-btn" data-rm="${i}" aria-label="Rimuovi">×</button></div>
        <div class="grams"><button class="step" data-dec="${i}">−</button>
          <input type="number" inputmode="decimal" data-g="${i}" value="${r0(it.grams)}"><span class="muted small">g ${it.portion ? '· ' + esc(it.portion) : ''}</span>
          <button class="step" data-inc="${i}" style="margin-left:auto">+</button></div>
        ${porChips(`data-rp="${i}"`, Math.abs(it.grams / it.base - 1) < 0.01 ? 1 : null)}
        <div class="nutri" data-n="${i}"><span><b>${r0(n.kcal)}</b> kcal</span><span>P <b>${fmtNum(n.p)}</b></span><span>C <b>${fmtNum(n.c)}</b></span><span>G <b>${fmtNum(n.f)}</b></span></div>
      </div>`;
    }).join('') : `<p class="muted">Nessun alimento riconosciuto.</p>`;
    drawTotals(s);
    $$('[data-name]', box).forEach(inp => inp.addEventListener('input', () => { items[+inp.dataset.name].name = inp.value; }));
    $$('[data-g]', box).forEach(inp => inp.addEventListener('input', () => { items[+inp.dataset.g].grams = num(inp.value) || 0; drawItemNutri(s, +inp.dataset.g); drawTotals(s); }));
    $$('[data-rm]', box).forEach(b => b.addEventListener('click', () => { items.splice(+b.dataset.rm, 1); draw(s); }));
    const bump = (i, d) => { items[i].grams = Math.max(0, r0(items[i].grams + d)); $(`[data-g="${i}"]`, box).value = items[i].grams; drawItemNutri(s, i); drawTotals(s); };
    $$('[data-dec]', box).forEach(b => b.addEventListener('click', () => bump(+b.dataset.dec, -10)));
    $$('[data-inc]', box).forEach(b => b.addEventListener('click', () => bump(+b.dataset.inc, 10)));
    $$('[data-rp]', box).forEach(b => b.addEventListener('click', () => {
      const i = +b.dataset.rp; items[i].grams = r0(items[i].base * +b.dataset.k);
      $(`[data-g="${i}"]`, box).value = items[i].grams; drawItemNutri(s, i); drawTotals(s);
      $$(`[data-rp="${i}"]`, box).forEach(x => x.classList.toggle('on', x === b));
    }));
  };
  const drawItemNutri = (s, i) => {
    const n = nutrients(items[i]);
    $(`[data-n="${i}"]`, s).innerHTML = `<span><b>${r0(n.kcal)}</b> kcal</span><span>P <b>${fmtNum(n.p)}</b></span><span>C <b>${fmtNum(n.c)}</b></span><span>G <b>${fmtNum(n.f)}</b></span>`;
  };
  const drawTotals = s => {
    const t = sumNutr(items);
    $('#rTot', s).innerHTML = `<span>Totale</span><span>${r0(t.kcal)} kcal · P ${r0(t.p)} · C ${r0(t.c)} · G ${r0(t.f)}</span>`;
  };
  openSheet(`<h3>Ecco cosa ho trovato</h3>
    ${preview ? `<img class="preview" src="${preview}" alt="" style="max-height:140px">` : ''}
    <div id="rItems"></div>
    <div class="totals" id="rTot"></div>
    ${notes ? `<p class="small muted">${esc(notes)}</p>` : ''}
    <p class="small muted">Correggi nomi e grammi se serve: calorie e macro si aggiornano da soli.</p>
    <div class="meal-pick">${MEALS.map(m => `<button class="chip ${m.id === meal ? 'on' : ''}" data-m="${m.id}">${m.label}</button>`).join('')}</div>
    <label class="check"><input type="checkbox" id="rStar"> ⭐ Salva anche come pasto, per rimetterlo con un tocco</label>
    <div class="btn-row"><button class="btn secondary" id="rCancel">Annulla</button><button class="btn" id="rSave">Aggiungi al diario</button></div>`, s => {
    draw(s);
    $$('[data-m]', s).forEach(c => c.addEventListener('click', () => { meal = c.dataset.m; $$('[data-m]', s).forEach(x => x.classList.toggle('on', x === c)); }));
    $('#rCancel', s).addEventListener('click', closeSheet);
    $('#rSave', s).addEventListener('click', () => {
      const valid = items.filter(i => i.grams > 0 && i.name.trim());
      if (!valid.length) { toast('Nessun alimento da aggiungere'); return; }
      const toAdd = valid.map(i => ({ name: i.name.trim(), grams: i.grams, per100: i.per100, veg: i.veg }));
      addEntries(toAdd, meal);
      addMeal = meal;
      if ($('#rStar', s).checked) { saveMealForm(toAdd, meal); go('today'); return; }
      closeSheet(); toast(`Aggiunti ${valid.length} alimenti`); go('today');
    });
  });
}

// ---------- Charts ----------
function lineChart(points, { color = 'var(--accent)', target = null, unit = '', height = 150 } = {}) {
  if (points.length < 2) return `<p class="muted small">Servono almeno due misurazioni per il grafico.</p>`;
  const W = 340, H = height, pl = 34, pr = 8, pt = 10, pb = 20;
  const xs = points.map(p => parseYmd(p.date).getTime());
  const ys = points.map(p => p.y).concat(target != null ? [target] : []);
  let minY = Math.min(...ys), maxY = Math.max(...ys);
  const pad = (maxY - minY) * 0.12 || 1; minY -= pad; maxY += pad;
  const minX = Math.min(...xs), maxX = Math.max(...xs) || minX + 1;
  const X = t => pl + ((t - minX) / (maxX - minX || 1)) * (W - pl - pr);
  const Y = y => pt + (1 - (y - minY) / (maxY - minY)) * (H - pt - pb);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(xs[i]).toFixed(1)},${Y(p.y).toFixed(1)}`).join('');
  const ticks = [minY + pad, (minY + maxY) / 2, maxY - pad];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">
    ${ticks.map(t => `<line x1="${pl}" x2="${W - pr}" y1="${Y(t)}" y2="${Y(t)}" stroke="var(--line)"/><text x="${pl - 4}" y="${Y(t) + 3}" text-anchor="end">${fmtNum(t, 1)}</text>`).join('')}
    ${target != null ? `<line x1="${pl}" x2="${W - pr}" y1="${Y(target)}" y2="${Y(target)}" stroke="var(--warn)" stroke-dasharray="4 4"/>` : ''}
    <path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${points.map((p, i) => `<circle cx="${X(xs[i])}" cy="${Y(p.y)}" r="3" fill="${color}"/>`).join('')}
    <text x="${pl}" y="${H - 4}">${fmtDate(points[0].date, { day: 'numeric', month: 'short' })}</text>
    <text x="${W - pr}" y="${H - 4}" text-anchor="end">${fmtDate(points[points.length - 1].date, { day: 'numeric', month: 'short' })}</text>
  </svg>${target != null ? `<div class="legend"><span><i style="background:${color}"></i>${unit ? 'Valore (' + unit + ')' : 'Valore'}</span><span><i style="background:var(--warn)"></i>Obiettivo</span></div>` : ''}`;
}

function barChart(days, goal) {
  const W = 340, H = 150, pl = 34, pr = 8, pt = 10, pb = 20;
  const max = Math.max(goal * 1.2, ...days.map(d => d.v)) || 1;
  const bw = (W - pl - pr) / days.length;
  const Y = v => pt + (1 - v / max) * (H - pt - pb);
  const labelEvery = Math.ceil(days.length / 6);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">
    <line x1="${pl}" x2="${W - pr}" y1="${Y(goal)}" y2="${Y(goal)}" stroke="var(--warn)" stroke-dasharray="4 4"/>
    <text x="${pl - 4}" y="${Y(goal) + 3}" text-anchor="end">${r0(goal)}</text>
    <text x="${pl - 4}" y="${Y(0) + 3}" text-anchor="end">0</text>
    ${days.map((d, i) => {
      const x = pl + i * bw + bw * 0.15, w = Math.max(1, bw * 0.7);
      const over = d.v > (d.b || goal) * 1.1;
      return d.v > 0 ? `<rect x="${x}" y="${Y(d.v)}" width="${w}" height="${Y(0) - Y(d.v)}" rx="${Math.min(3, w / 2)}" fill="${over ? 'var(--danger)' : 'var(--kcal)'}"/>` : '';
    }).join('')}
    ${days.map((d, i) => i % labelEvery === 0 ? `<text x="${pl + i * bw + bw / 2}" y="${H - 4}" text-anchor="middle">${fmtDate(d.date, days.length > 10 ? { day: 'numeric', month: 'numeric' } : { weekday: 'narrow' })}</text>` : '').join('')}
  </svg>
  <div class="legend"><span><i style="background:var(--kcal)"></i>kcal</span><span><i style="background:var(--danger)"></i>oltre +10%</span><span><i style="background:var(--warn)"></i>obiettivo</span></div>`;
}

// ---------- Progress ----------
function rangeStats(fromDate, toDate) {
  const days = [];
  for (let d = fromDate; d <= toDate; d = addDays(d, 1)) days.push(d);
  const logged = days.filter(d => dayEntries(d).length);
  const totals = logged.map(dayTotals);
  const avg = k => totals.length ? totals.reduce((a, t) => a + t[k], 0) / totals.length : 0;
  const inTarget = logged.filter(d => dayStatus(d) === 'ok').length;
  const workouts = days.reduce((a, d) => a + dayExercise(d).length, 0);
  const burned = days.reduce((a, d) => a + dayExerciseKcal(d), 0);
  const bodyIn = db.body.filter(b => b.date >= fromDate && b.date <= toDate).sort((a, b) => a.date.localeCompare(b.date));
  const delta = k => {
    const l = bodyIn.filter(b => b[k] != null);
    return l.length >= 2 ? l[l.length - 1][k] - l[0][k] : null;
  };
  return { days, logged: logged.length, kcal: avg('kcal'), p: avg('p'), c: avg('c'), f: avg('f'), fib: avg('fib'), inTarget, workouts, burned, dW: delta('weight'), dBF: delta('bodyFat') };
}
const signed = (n, u) => n == null ? '–' : `${n > 0 ? '+' : ''}${fmtNum(n, 1)} ${u}`;

function renderProgress(v) {
  const t = today();
  const from = addDays(t, -(progressRange - 1));
  const s = rangeStats(from, t);
  const g = db.goals;
  const macroK = s.p * 4 + s.c * 4 + s.f * 9 || 1;
  const pct = x => r0((x / macroK) * 100);

  // Obiettivi del mese
  const mStart = t.slice(0, 8) + '01';
  const ms = rangeStats(mStart, t);
  const monthName = parseYmd(t).toLocaleDateString('it-IT', { month: 'long' });
  const lastW = latestBody('weight');
  const dim = new Date(parseYmd(t).getFullYear(), parseYmd(t).getMonth() + 1, 0).getDate();
  const daysLeft = dim - parseYmd(t).getDate();

  let html = monthResultsCard();
  html += `<p class="small muted" style="margin:0 0 6px">Periodo per riepilogo, analisi e grafici:</p>`;
  html += `<div class="seg">${[[7, '7 giorni'], [30, '30 giorni'], [90, '3 mesi'], [365, '1 anno']].map(([n, l]) => `<button data-r="${n}" class="${n === progressRange ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  html += `<div class="card"><h2>Riepilogo <small>ultimi ${RANGE_LABEL[progressRange]}</small></h2><div class="stats">
    <div class="stat"><div class="v">${r0(s.kcal)}</div><div class="k">kcal medie / giorno (obiettivo ${r0(g.kcal)})</div></div>
    <div class="stat"><div class="v">${s.inTarget}<span class="muted" style="font-size:15px">/${s.logged}</span></div><div class="k">giorni verdi (nel target)</div></div>
    <div class="stat"><div class="v">${signed(s.dW, 'kg')}</div><div class="k">variazione peso</div></div>
    <div class="stat"><div class="v">${signed(s.dBF, '%')}</div><div class="k">variazione massa grassa</div></div>
    <div class="stat"><div class="v">${r0(s.p)} g</div><div class="k">proteine medie (obiettivo ${r0(g.protein)})</div></div>
    <div class="stat"><div class="v">${s.logged}<span class="muted" style="font-size:15px">/${s.days.length}</span></div><div class="k">giorni registrati</div></div>
    <div class="stat"><div class="v">${s.workouts}</div><div class="k">allenamenti</div></div>
    <div class="stat"><div class="v">${fmtNum(s.burned, 0)}</div><div class="k">kcal bruciate con lo sport</div></div>
  </div></div>`;

  html += analysisCard();
  html += `<button class="btn secondary" id="openCal" style="margin-bottom:12px">📅 Calendario giorno per giorno</button>`;
  html += balanceCard();

  if (progressRange <= 90) {
    html += `<div class="card"><h2>Calorie giornaliere</h2>${barChart(s.days.map(d => ({ date: d, v: dayTotals(d).kcal, b: dayBudget(d) })), g.kcal)}</div>`;
  } else {
    const weeks = [];
    for (let i = 0; i < s.days.length; i += 7) {
      const chunk = s.days.slice(i, i + 7).filter(d => dayEntries(d).length);
      weeks.push({ date: s.days[i], v: chunk.length ? chunk.reduce((a, d) => a + dayTotals(d).kcal, 0) / chunk.length : 0 });
    }
    html += `<div class="card"><h2>Calorie medie settimanali</h2>${barChart(weeks, g.kcal)}</div>`;
  }

  if (s.logged) {
    html += `<div class="card"><h2>Distribuzione macro <small>media</small></h2>
      <div class="bar" style="height:14px;display:flex">
        <i style="width:${pct(s.p * 4)}%;background:var(--prot);border-radius:0"></i>
        <i style="width:${pct(s.c * 4)}%;background:var(--carb);border-radius:0"></i>
        <i style="width:${pct(s.f * 9)}%;background:var(--fat);border-radius:0"></i>
      </div>
      <div class="legend"><span><i style="background:var(--prot)"></i>Proteine ${pct(s.p * 4)}% · ${r0(s.p)} g</span><span><i style="background:var(--carb)"></i>Carboidrati ${pct(s.c * 4)}% · ${r0(s.c)} g</span><span><i style="background:var(--fat)"></i>Grassi ${pct(s.f * 9)}% · ${r0(s.f)} g</span></div>
    </div>`;
  }

  const wPts = db.body.filter(b => b.weight != null && b.date >= from).sort((a, b) => a.date.localeCompare(b.date)).map(b => ({ date: b.date, y: b.weight }));
  html += `<div class="card"><h2>Peso ${lastW ? `<small>${fmtNum(lastW.weight)} kg</small>` : ''}</h2>${wPts.length ? lineChart(wPts, { target: g.weightTarget, unit: 'kg' }) : '<p class="muted small">Nessuna pesata in questo periodo.</p>'}</div>`;

  // Obiettivi del mese
  html += `<div class="card"><h2>Obiettivi di ${monthName} <small>${daysLeft} giorni rimasti</small></h2>`;
  const dit = g.monthDaysInTarget || 0;
  if (dit) {
    html += `<div class="goal-progress">${macroBar('Giorni in target', ms.inTarget, dit, 'var(--accent)', 'giorni')}</div>`;
  }
  if (g.monthWeight != null) {
    const startM = db.body.filter(b => b.weight != null && b.date < mStart).sort((a, b) => a.date.localeCompare(b.date)).pop()
      || db.body.filter(b => b.weight != null && b.date >= mStart).sort((a, b) => a.date.localeCompare(b.date))[0];
    if (startM && lastW) {
      const need = startM.weight - g.monthWeight;
      const done = startM.weight - lastW.weight;
      const p = need !== 0 ? Math.max(0, Math.min(100, (done / need) * 100)) : 100;
      html += `<div class="goal-progress" style="margin-top:10px"><div class="macro"><div class="top"><span>Peso a fine mese: ${fmtNum(g.monthWeight)} kg</span><span><b>${fmtNum(lastW.weight)}</b> kg</span></div>
        <div class="bar"><i style="width:${p}%;background:var(--accent)"></i></div></div>
        <div class="small muted" style="margin-top:4px">Mancano ${fmtNum(Math.abs(lastW.weight - g.monthWeight))} kg</div></div>`;
    } else html += `<p class="small muted">Registra il peso per seguire l'obiettivo di fine mese (${fmtNum(g.monthWeight)} kg).</p>`;
  }
  html += `<div class="small muted" style="margin-top:10px">Media del mese: ${r0(ms.kcal)} kcal · P ${r0(ms.p)} g · ${ms.logged} giorni registrati</div>`;
  if (!dit && g.monthWeight == null) html += `<p class="small muted">Imposta gli obiettivi mensili nella scheda Obiettivi.</p>`;
  html += `</div>`;

  html += weightGoalCard();
  html += freqCard();
  v.innerHTML = html;
  $$('[data-r]', v).forEach(b => b.addEventListener('click', () => { progressRange = +b.dataset.r; anaMode = 'range'; render(); }));
  $('#openCal', v).addEventListener('click', openCalendar);
  $$('[data-am]', v).forEach(b => b.addEventListener('click', () => { anaMode = b.dataset.am; render(); }));
  $('#anaPrev', v)?.addEventListener('click', () => { anaMonth = shiftMonth(anaMonth, -1); render(); });
  $('#anaNext', v)?.addEventListener('click', () => { if (anaMonth < today().slice(0, 7)) { anaMonth = shiftMonth(anaMonth, 1); render(); } });
  $('#anaEnrich', v)?.addEventListener('click', runEnrich);
  $('#anaHow', v)?.addEventListener('click', scoreHelp);
  $('#freqPrev', v)?.addEventListener('click', () => { freqMonth = shiftMonth(freqMonth, -1); render(); });
  $('#freqNext', v)?.addEventListener('click', () => { if (freqMonth < today().slice(0, 7)) { freqMonth = shiftMonth(freqMonth, 1); render(); } });
  $$('[data-fv]', v).forEach(b => b.addEventListener('click', () => { freqView = b.dataset.fv; freqAll = false; render(); }));
  $('#freqAll', v)?.addEventListener('click', () => { freqAll = true; render(); });
  $('#editStart', v)?.addEventListener('click', startForm);
  $$('[data-ref]', v).forEach(b => b.addEventListener('click', () => { db.goals.deficitRef = b.dataset.ref; save(); render(); }));
}

function balanceCard() {
  const month = today().slice(0, 7);
  const mb = monthBalance(month);
  const name = parseYmd(today()).toLocaleDateString('it-IT', { month: 'long' });
  const ref = ['bmr', 'goal'].includes(db.goals.deficitRef) ? db.goals.deficitRef : 'tdee';
  if (!weightOn(today())) return `<div class="card"><h2>Bilancio calorico di ${name}</h2><p class="small muted">Registra il tuo peso in <b>Corpo</b> per calcolare le calorie consumate.</p></div>`;
  const proj = mb.avg != null && mb.daysLeft ? mb.total + mb.avg * mb.daysLeft : null;
  return `<div class="card">
    <h2>Bilancio calorico di ${name}</h2>
    <div class="balance-big ${mb.total <= 0 ? 'good' : 'bad'}">${fmtBalance(mb.total)}</div>
    ${ref === 'goal'
      ? `<div class="center" style="margin-bottom:10px">${mb.total <= 0 ? 'sotto' : 'sopra'} l'obiettivo calorico <span class="muted small">(per i kg di grasso scegli "Fabbisogno")</span></div>`
      : `<div class="center" style="margin-bottom:10px">≈ <b>${fatKg(mb.total)} kg di grasso</b> ${mb.total <= 0 ? 'persi' : 'accumulati'} <span class="muted small">(7.700 kcal ≈ 1 kg)</span></div>`}
    <div class="calc-rows">
      ${mb.start ? `<div><span>Valore iniziale fino al ${fmtDate(addDays(mb.start.until, -1), { day: 'numeric', month: 'short' })}</span><b>${fmtBalance(-mb.start.kcal)}</b></div>` : ''}
      <div><span>Giorni registrati da ${fmtDate(mb.from, { day: 'numeric', month: 'short' })}${mb.days ? ` (${mb.days})` : ''}</span><b>${fmtBalance(mb.total - (mb.start ? -mb.start.kcal : 0))}</b></div>
      ${mb.avg != null ? `<div><span>Media al giorno</span><b>${fmtBalance(mb.avg)}</b></div>` : ''}
      ${mb.todayVal != null ? `<div><span>Oggi (in corso, si somma a fine giornata)</span><b>${fmtBalance(mb.todayVal)}</b></div>` : ''}
      ${proj != null ? `<div class="sum"><span>A fine mese, di questo passo</span><b>${fmtBalance(proj)}${ref === 'goal' ? '' : ` · ${fatKg(proj)} kg`}</b></div>` : ''}
    </div>
    <p class="small muted" style="margin:10px 0 4px">Calcola rispetto a:</p>
    <div class="seg seg3">
      <button data-ref="tdee" class="${ref === 'tdee' ? 'on' : ''}">Fabbisogno</button>
      <button data-ref="goal" class="${ref === 'goal' ? 'on' : ''}">Obiettivo</button>
      <button data-ref="bmr" class="${ref === 'bmr' ? 'on' : ''}">Metabolismo basale</button>
    </div>
    <p class="small muted" style="margin-top:-4px">${ref === 'tdee'
      ? `Calorie mangiate − calorie consumate (metabolismo basale + giornata tipo + attività fissa + allenamenti, oggi circa ${r0(dayBurn(today()) ?? 0)} kcal). È il deficit reale che fa perdere grasso.`
      : ref === 'goal'
        ? `Calorie mangiate − obiettivo del giorno (${r0(db.goals.kcal)} kcal + eventuale sport). Dice quanto stai sotto o sopra il piano; l'obiettivo contiene già un deficit.`
        : 'Calorie mangiate − metabolismo basale (senza contare movimento e sport).'} Contano solo i giorni in cui hai registrato i pasti. Il valore iniziale va calcolato con lo stesso criterio.${mb.missing ? ' Alcuni giorni non hanno un peso di riferimento.' : ''}</p>
    <button class="btn secondary" id="editStart">${mb.start ? 'Modifica valore iniziale' : 'Inserisci valore iniziale del mese'}</button>
  </div>
  ${historyCard()}`;
}

function historyCard() {
  const h = balanceHistory();
  if (!h.rows.length) return '';
  const vsGoal = db.goals.deficitRef === 'goal';
  return `<div class="card">
    <h2>Storico mese per mese</h2>
    <div class="hist">
      ${[...h.rows].reverse().map(r => `<div class="hrow">
        <span><b>${cap(monthName(r.m, true))}</b><br><small class="muted">${r.closed ? 'chiuso' : 'in corso'}${r.start ? ' · con valore iniziale' : ''}</small></span>
        <span class="${r.total <= 0 ? 'good' : 'bad'}"><b>${fmtBalance(r.total)}</b>${vsGoal ? '' : `<br><small>≈ ${fatKg(r.total)} kg</small>`}</span>
      </div>`).join('')}
      <div class="hrow tot">
        <span><b>Totale</b><br><small class="muted">dal ${h.since ? fmtDate(h.since, { day: 'numeric', month: 'long', year: 'numeric' }) : 'inizio'}</small></span>
        <span class="${h.total <= 0 ? 'good' : 'bad'}"><b>${fmtBalance(h.total)}</b>${vsGoal ? '' : `<br><small>≈ ${fatKg(h.total)} kg di grasso ${h.total <= 0 ? 'persi' : 'in più'}</small>`}</span>
      </div>
    </div>
    <p class="small muted" style="margin-bottom:0">Calcolato rispetto a: ${vsGoal ? 'obiettivo' : db.goals.deficitRef === 'bmr' ? 'metabolismo basale' : 'fabbisogno'} (si cambia nel riquadro sopra). Il mese in corso non include oggi.</p>
  </div>`;
}

function startForm() {
  const month = today().slice(0, 7);
  const cur = db.deficitStart?.[month];
  openSheet(`<h3>Valore iniziale del mese</h3>
    <p class="small muted">Se hai già tenuto il conto altrove, inserisci il deficit accumulato dall'inizio del mese fino al giorno indicato (escluso). L'app aggiunge i giorni da quella data in poi.</p>
    <label class="field"><span>Deficit accumulato (kcal)</span><input type="number" inputmode="numeric" id="sKcal" value="${cur ? cur.kcal : ''}" placeholder="es. 11700"></label>
    <p class="small muted" style="margin-top:-4px">Scrivi il numero senza segno per un deficit. Se eri in surplus, mettilo con il meno (es. −500).</p>
    <label class="field"><span>Fino al giorno (escluso)</span><input type="date" id="sUntil" value="${cur?.until || today()}" min="${month}-01" max="${today()}"></label>
    <div class="btn-row">${cur ? '<button class="btn danger" id="sDel">Rimuovi</button>' : ''}<button class="btn" id="sSave">Salva</button></div>`, s => {
    $('#sSave', s).addEventListener('click', () => {
      const kcal = num($('#sKcal', s).value);
      const until = $('#sUntil', s).value || today();
      if (kcal == null) { toast('Inserisci il valore in kcal'); return; }
      db.deficitStart = { ...(db.deficitStart || {}), [until.slice(0, 7)]: { kcal, until } };
      save(); closeSheet(); render(); toast('Valore iniziale salvato');
    });
    $('#sDel', s)?.addEventListener('click', () => {
      delete db.deficitStart[month]; save(); closeSheet(); render();
    });
  });
}

// ---------- Cosa mangi di più ----------
let freqMonth = null, freqView = 'ing', freqAll = false;
const shiftMonth = (m, n) => { const [y, mm] = m.split('-').map(Number); return ymd(new Date(y, mm - 1 + n, 1)).slice(0, 7); };
const INGREDIENTS = [
  ['Pollo', /pollo/], ['Tacchino', /tacchin/], ['Manzo', /manzo|bistecc|hamburger|macinat|vitell|roast/], ['Maiale', /maiale|lonza|salsicc|braciol|porchett/],
  ['Prosciutto', /prosciutt/], ['Bresaola', /bresaol/], ['Salumi', /salame|mortadell|speck|cotechin/],
  ['Salmone', /salmone/], ['Tonno', /tonno/], ['Pesce', /merluzz|nasell|orata|branzin|pesce|gamber|calamar|polpo|sgombr|alici|acciug|cozze|vongol/],
  ['Uova', /\buov[oa]|albume|frittata/], ['Pasta', /pasta|spaghett|penne|fusilli|rigaton|linguin|lasagn|gnocch|tortellin|ravioli/], ['Riso', /\briso|risotto|basmati/],
  ['Pane', /\bpane|toast|panino|piadin|fette biscottate|cracker|grissin|focacc/], ['Pizza', /pizza/], ['Patate', /patat/], ['Avena e cereali', /avena|porridge|cereali|muesli|granola|cornflakes/],
  ['Yogurt', /yogurt|skyr/], ['Latte', /\blatte\b|cappuccin|latte macchiato/], ['Formaggi', /formagg|parmigian|grana|mozzarell|ricotta|fiocchi di latte|feta|scamorz|stracchin|philadelphia/],
  ['Legumi', /ceci|lenticch|fagiol|piselli|legumi|edamame|tofu|soia/], ['Verdure', /insalat|zucchin|broccol|spinac|carot|pomodor|verdur|melanzan|peperon|cavol|finocch|lattuga|rucola|funghi|asparag|cetriol/],
  ['Frutta', /\bmela|banana|arancia|mandarin|fragol|kiwi|\bpera\b|pesca|albicocc|uva\b|frutta|frutti|mirtill|ananas|anguria|melone/], ['Frutta secca', /mandorl|\bnoci\b|nocciol|arachid|anacard|pistacch|frutta secca|burro d arachidi/],
  ['Olio', /\bolio\b/], ['Dolci', /biscott|cioccolat|torta|gelato|dolce|cornett|brioche|merendin|crostat|nutella|tiramisu|marmellat|miele/],
  ['Proteine in polvere', /proteine|whey|protein/], ['Alcol', /birra|vino|spritz|prosecco|cocktail|amaro/], ['Caffè', /caff/],
];
function foodFrequency(month) {
  const byName = {}, byIng = {};
  for (const [d, list] of Object.entries(db.entries)) {
    if (!d.startsWith(month)) continue;
    for (const e of list) {
      const key = e.name.trim().toLowerCase();
      const n = nutrients(e);
      const add = (map, k, label) => { const o = map[k] ||= { label, count: 0, grams: 0, kcal: 0, days: new Set() }; o.count++; o.grams += e.grams || 0; o.kcal += n.kcal; o.days.add(d); };
      add(byName, key, e.name.trim());
      const norm = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, ' ');
      for (const [label, re] of INGREDIENTS) if (re.test(norm)) add(byIng, label, label);
    }
  }
  const sort = m => Object.values(m).sort((a, b) => b.count - a.count || b.kcal - a.kcal);
  return { ing: sort(byIng), food: sort(byName) };
}
function freqCard() {
  freqMonth ||= today().slice(0, 7);
  const f = foodFrequency(freqMonth);
  const list = freqView === 'ing' ? f.ing : f.food;
  const shown = freqAll ? list : list.slice(0, 12);
  const max = list[0]?.count || 1;
  const kg = g => g >= 1000 ? `${fmtNum(g / 1000, 1)} kg` : `${r0(g)} g`;
  return `<div class="card">
    <div class="cal-head"><button class="icon-btn" id="freqPrev" aria-label="Mese precedente">‹</button><h3 style="font-size:17px">Cosa hai mangiato · ${monthName(freqMonth)}</h3><button class="icon-btn" id="freqNext" aria-label="Mese successivo" ${freqMonth >= today().slice(0, 7) ? 'disabled style="opacity:.35"' : ''}>›</button></div>
    <div class="seg"><button data-fv="ing" class="${freqView === 'ing' ? 'on' : ''}">Per ingrediente</button><button data-fv="food" class="${freqView === 'food' ? 'on' : ''}">Per alimento</button></div>
    ${list.length ? `<div class="freq">${shown.map(x => `<div class="frow">
        <div class="ftop"><b>${esc(x.label)}</b><span><b>${x.count}</b> ${x.count === 1 ? 'volta' : 'volte'}</span></div>
        <div class="bar"><i style="width:${(x.count / max) * 100}%;background:var(--accent)"></i></div>
        <div class="small muted">${x.days.size} ${x.days.size === 1 ? 'giorno' : 'giorni'} · ${kg(x.grams)} · ${fmtNum(x.kcal, 0)} kcal</div>
      </div>`).join('')}</div>
      ${!freqAll && list.length > 12 ? `<button class="btn ghost" id="freqAll">Mostra tutti (${list.length})</button>` : ''}`
      : `<p class="small muted">${freqView === 'ing' ? 'Nessun ingrediente riconosciuto' : 'Nessun alimento registrato'} in questo mese.</p>`}
    ${freqView === 'ing' ? '<p class="small muted" style="margin-bottom:0">Raggruppa alimenti simili (es. "petto di pollo" e "pollo arrosto" contano come Pollo).</p>' : ''}
  </div>`;
}

// ---------- Analisi dell'alimentazione: macro, micro, vegetariano, voto ----------
const normName = t => String(t || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ');
const VEG_MEALS = ['pranzo', 'cena'];
const MICRO_KEYS = ['sug', 'sat', 'salt', 'ca', 'fe', 'kk', 'vc'];
const NONVEG_RE = /pollo|tacchin|manzo|vitell|maiale|prosciutt|bresaol|salam|mortadell|speck|wurstel|salsicc|pancett|guancial|carne|bistecc|hamburger|polpett|ragu|lonza|conigli|agnell|anatra|tonno|salmone|merluzz|nasell|orata|branzin|pesce|gamber|calamar|polpo|seppi|sgombr|alici|acciug|sardin|cozze|vongol|frutti di mare|surimi|baccala|trota|spigola|sushi|kebab|cotolett|lardo|cotechin|porchett|braciol|nuggets|fesa|arrost/;
function entryVeg(e) {
  if (typeof e.veg === 'boolean') return e.veg;
  const fi = db.foodInfo?.[normName(e.name)];
  if (fi && typeof fi.veg === 'boolean') return fi.veg;
  return !NONVEG_RE.test(normName(e.name));
}
function entryMicros(e) {
  if (e.per100 && e.per100.ca != null) return e.per100;
  return db.foodInfo?.[normName(e.name)] || null;
}
function nutritionStats(dates) {
  const days = dates.filter(d => dayEntries(d).length);
  const tot = { kcal: 0, p: 0, c: 0, f: 0, fib: 0 };
  const micro = Object.fromEntries(MICRO_KEYS.map(k => [k, 0]));
  let kcalMicro = 0, meals = 0, vegMeals = 0, fruitVeg = 0, green = 0;
  const groups = new Set();
  for (const d of days) {
    if (dayStatus(d) === 'ok') green++;
    const list = dayEntries(d);
    for (const m of VEG_MEALS) { // pranzi e cene (colazioni e spuntini non contano)
      const ml = list.filter(e => e.meal === m);
      if (!ml.length) continue;
      meals++; if (ml.every(entryVeg)) vegMeals++;
    }
    for (const e of list) {
      const n = nutrients(e);
      for (const k in tot) tot[k] += n[k];
      const mi = entryMicros(e), f = (e.grams || 0) / 100;
      if (mi) { kcalMicro += n.kcal; for (const k of MICRO_KEYS) micro[k] += (mi[k] || 0) * f; }
      const nm = normName(e.name);
      for (const [label, re] of INGREDIENTS) if (re.test(nm)) { groups.add(label); if (label === 'Frutta' || label === 'Verdure') fruitVeg++; }
    }
  }
  const n = days.length || 1;
  const cov = tot.kcal ? kcalMicro / tot.kcal : 0;
  return {
    days: days.length, green, meals, vegMeals, groups: groups.size, fruitVegPerDay: fruitVeg / n, cov,
    avg: Object.fromEntries(Object.entries(tot).map(([k, v]) => [k, v / n])),
    // i micronutrienti noti vengono riportati al totale delle calorie se la copertura è parziale
    mavg: Object.fromEntries(MICRO_KEYS.map(k => [k, cov > 0 ? micro[k] / n / cov : null])),
  };
}
function dietScore(st) {
  const g = db.goals, w = weightOn(today());
  const protGoal = g.protein || (w ? w * 1.6 : 100);
  const parts = [];
  const add = (label, pts, max, tip) => parts.push({ label, pts: Math.max(0, Math.min(max, pts)), max, tip });
  add('Calorie nel target', st.days ? 2 * st.green / st.days : 0, 2, `${st.green} giorni verdi su ${st.days}`);
  add('Proteine', 2 * Math.min(1, st.avg.p / protGoal), 2, `${r0(st.avg.p)} g al giorno su ${r0(protGoal)}`);
  add('Fibre', 1.5 * Math.min(1, st.avg.fib / 25), 1.5, `${r0(st.avg.fib)} g al giorno (consigliati 25–30)`);
  add('Frutta e verdura', 1.5 * Math.min(1, st.fruitVegPerDay / 4), 1.5, `${fmtNum(st.fruitVegPerDay, 1)} porzioni al giorno (consigliate 4–5)`);
  const known = st.cov >= 0.4;
  const satPct = known ? st.mavg.sat * 9 / (st.avg.kcal || 1) * 100 : null;
  add('Grassi saturi', known ? (satPct <= 10 ? 1 : satPct >= 15 ? 0 : (15 - satPct) / 5) : 0.5, 1, known ? `${fmtNum(satPct, 0)}% delle calorie (max 10%)` : 'dati insufficienti');
  add('Sale', known ? (st.mavg.salt <= 5 ? 1 : st.mavg.salt >= 10 ? 0 : (10 - st.mavg.salt) / 5) : 0.5, 1, known ? `${fmtNum(st.mavg.salt, 1)} g al giorno (max 5)` : 'dati insufficienti');
  add('Zuccheri', known ? (st.mavg.sug <= 90 ? 1 : st.mavg.sug >= 140 ? 0 : (140 - st.mavg.sug) / 50) : 0.5, 1, known ? `${r0(st.mavg.sug)} g al giorno (max ~90)` : 'dati insufficienti');
  const score = Math.max(1, Math.round(parts.reduce((a, p) => a + p.pts, 0) * 10) / 10);
  const label = score >= 8.5 ? 'Ottimo' : score >= 7 ? 'Buono' : score >= 5.5 ? 'Discreto' : 'Da migliorare';
  return { score, label, parts };
}
const monthDays = m => { const out = []; const last = ymd(new Date(+m.slice(0, 4), +m.slice(5, 7), 0)); for (let d = `${m}-01`; d <= last && d <= today(); d = addDays(d, 1)) out.push(d); return out; };
const allDays = () => Object.keys(db.entries).filter(d => d <= today() && db.entries[d]?.length).sort();
let anaMode = 'month', anaMonth = null;

const RANGE_LABEL = { 7: '7 giorni', 30: '30 giorni', 90: '3 mesi', 365: '1 anno' };
const rangeDays = () => Array.from({ length: progressRange }, (_, i) => addDays(today(), -i)).reverse();
function analysisCard() {
  anaMonth ||= today().slice(0, 7);
  const dates = anaMode === 'all' ? allDays() : anaMode === 'range' ? rangeDays() : monthDays(anaMonth);
  const st = nutritionStats(dates);
  const female = db.profile.sex === 'f';
  const head = `<div class="card ana">
    <h2>Analisi alimentazione <button class="add-mini" id="anaHow">Come si calcola</button></h2>
    <div class="seg seg3"><button data-am="month" class="${anaMode === 'month' ? 'on' : ''}">Mese</button><button data-am="range" class="${anaMode === 'range' ? 'on' : ''}">Ultimi ${RANGE_LABEL[progressRange]}</button><button data-am="all" class="${anaMode === 'all' ? 'on' : ''}">Da sempre</button></div>
    ${anaMode === 'month' ? `<div class="cal-head"><button class="icon-btn" id="anaPrev" aria-label="Mese precedente">‹</button><h3>${cap(monthName(anaMonth, true))}</h3><button class="icon-btn" id="anaNext" aria-label="Mese successivo" ${anaMonth >= today().slice(0, 7) ? 'disabled style="opacity:.35"' : ''}>›</button></div>` : `<p class="small muted center" style="margin-top:-4px">${st.days} giorni registrati${dates[0] ? ` dal ${fmtDate(dates[0], { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}</p>`}`;
  if (!st.days) return head + `<p class="muted small">Nessun pasto registrato in questo periodo.</p></div>`;
  const sc = dietScore(st);
  const kc = st.avg.kcal || 1;
  const pc = x => r0(x / kc * 100);
  const vegPct = st.meals ? st.vegMeals / st.meals * 100 : 0;
  const allSt = anaMode !== 'all' ? nutritionStats(allDays()) : st;
  const allVeg = allSt.meals ? allSt.vegMeals / allSt.meals * 100 : 0;
  const R = 52, C = 2 * Math.PI * R;
  const scoreCol = sc.score >= 7 ? 'var(--ok)' : sc.score >= 5.5 ? 'var(--warn)' : 'var(--danger)';
  const microRow = (label, val, ref, unit, kind) => {
    if (val == null) return `<div class="mrow"><span>${label}</span><span class="muted">–</span></div>`;
    const ratio = val / ref;
    const good = kind === 'max' ? ratio <= 1 : ratio >= 0.8;
    return `<div class="mrow"><div class="mtop"><span>${label}</span><span><b>${fmtNum(val, unit === 'g' ? 1 : 0)}</b> ${unit} <small class="muted">${kind === 'max' ? 'max' : 'su'} ${fmtNum(ref, 0)}</small></span></div>
      <div class="bar"><i style="width:${Math.min(100, ratio * 100)}%;background:${good ? 'var(--ok)' : kind === 'max' ? 'var(--danger)' : 'var(--warn)'}"></i></div></div>`;
  };
  const missing = foodsMissingInfo().length;
  let html = head + `
    <div class="score-wrap">
      <svg width="128" height="128" viewBox="0 0 128 128"><circle cx="64" cy="64" r="${R}" fill="none" stroke="var(--line)" stroke-width="11"/>
        <circle class="ring-prog" data-to="${C * (1 - sc.score / 10)}" cx="64" cy="64" r="${R}" fill="none" stroke="${scoreCol}" stroke-width="11" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" transform="rotate(-90 64 64)"/></svg>
      <div class="score-num"><b data-count="${sc.score}" data-dec="1">${fmtNum(sc.score, 1)}</b><small>/10</small><span style="color:${scoreCol}">${sc.label}</span></div>
    </div>
    <div class="parts">${sc.parts.map(p => `<div class="prow"><div class="mtop"><span>${p.label}</span><span><b>${fmtNum(p.pts, 1)}</b><small class="muted">/${fmtNum(p.max, 1)}</small></span></div>
      <div class="bar"><i style="width:${p.pts / p.max * 100}%;background:${p.pts / p.max >= 0.75 ? 'var(--ok)' : p.pts / p.max >= 0.4 ? 'var(--warn)' : 'var(--danger)'}"></i></div><small class="muted">${p.tip}</small></div>`).join('')}</div>

    <h3 class="ana-h">🥗 Pranzi e cene vegetariani</h3>
    <div class="veg-big"><b data-count="${vegPct}" data-suffix="%">${r0(vegPct)}%</b><span>${st.vegMeals} su ${st.meals} pranzi e cene${anaMode !== 'all' ? ` · da sempre <b>${r0(allVeg)}%</b> (${allSt.vegMeals} su ${allSt.meals})` : ''}</span></div>
    <div class="bar" style="height:10px"><i style="width:${vegPct}%;background:var(--ok)"></i></div>

    <h3 class="ana-h">Macronutrienti · media al giorno</h3>
    <div class="stats">
      <div class="stat"><div class="v">${r0(st.avg.kcal)}</div><div class="k">kcal</div></div>
      <div class="stat"><div class="v">${r0(st.avg.p)} g</div><div class="k">proteine · ${pc(st.avg.p * 4)}% kcal</div></div>
      <div class="stat"><div class="v">${r0(st.avg.c)} g</div><div class="k">carboidrati · ${pc(st.avg.c * 4)}% kcal</div></div>
      <div class="stat"><div class="v">${r0(st.avg.f)} g</div><div class="k">grassi · ${pc(st.avg.f * 9)}% kcal</div></div>
      <div class="stat"><div class="v">${r0(st.avg.fib)} g</div><div class="k">fibre</div></div>
      <div class="stat"><div class="v">${st.groups}</div><div class="k">gruppi di alimenti diversi</div></div>
    </div>

    <h3 class="ana-h">Micronutrienti · media al giorno</h3>
    ${microRow('Zuccheri', st.mavg.sug, 90, 'g', 'max')}
    ${microRow('Grassi saturi', st.mavg.sat, (st.avg.kcal * 0.1) / 9, 'g', 'max')}
    ${microRow('Sale', st.mavg.salt, 5, 'g', 'max')}
    ${microRow('Calcio', st.mavg.ca, 1000, 'mg', 'min')}
    ${microRow('Ferro', st.mavg.fe, female ? 18 : 10, 'mg', 'min')}
    ${microRow('Potassio', st.mavg.kk, 3900, 'mg', 'min')}
    ${microRow('Vitamina C', st.mavg.vc, female ? 85 : 105, 'mg', 'min')}
    <p class="small muted">Micronutrienti stimati su ${r0(st.cov * 100)}% delle calorie registrate${st.cov < 1 ? ' e riportati al totale' : ''}.</p>
    ${missing ? `<button class="btn secondary" id="anaEnrich">✨ Completa i micronutrienti con l'AI (${missing} alimenti)</button>` : ''}`;
  if (anaMode === 'all' || (anaMode === 'range' && progressRange >= 90)) {
    const months = trackedMonths().filter(m => anaMode === 'all' || m >= dates[0].slice(0, 7));
    html += `<h3 class="ana-h">Mese per mese</h3><div class="hist">${[...months].reverse().map(m => {
      const ms = nutritionStats(monthDays(m));
      if (!ms.days) return '';
      const s2 = dietScore(ms);
      return `<div class="hrow"><span><b>${cap(monthName(m, true))}</b><br><small class="muted">${ms.days} giorni · ${r0(ms.avg.kcal)} kcal/giorno</small></span><span><b>${fmtNum(s2.score, 1)}</b>/10<br><small class="muted">🥗 ${ms.meals ? r0(ms.vegMeals / ms.meals * 100) : 0}% vegetariani</small></span></div>`;
    }).join('')}</div>`;
  }
  return html + `</div>`;
}

function scoreHelp() {
  openSheet(`<h3>Come si calcola il voto</h3>
    <p class="small">Un punteggio indicativo da 1 a 10, basato sulle linee guida per una sana alimentazione (CREA, OMS):</p>
    <ul class="small" style="padding-left:18px;line-height:1.6">
      <li><b>Calorie nel target</b> (2 punti): quota di giorni "verdi".</li>
      <li><b>Proteine</b> (2): media rispetto al tuo obiettivo.</li>
      <li><b>Fibre</b> (1,5): almeno 25 g al giorno.</li>
      <li><b>Frutta e verdura</b> (1,5): almeno 4 porzioni al giorno.</li>
      <li><b>Grassi saturi</b> (1): sotto il 10% delle calorie.</li>
      <li><b>Sale</b> (1): sotto i 5 g al giorno.</li>
      <li><b>Zuccheri</b> (1): sotto circa 90 g al giorno.</li>
    </ul>
    <p class="small muted">Per la quota vegetariana contano solo pranzi e cene: un pasto è vegetariano se nessun alimento contiene carne o pesce. I micronutrienti sono stime dell'AI o delle etichette: usali per vedere le tendenze, non come valori esatti. Non sostituisce il parere di un nutrizionista.</p>
    <button class="btn" id="hOk">Ok</button>`, s => $('#hOk', s).addEventListener('click', closeSheet));
}

// Completa micronutrienti e "vegetariano" per gli alimenti registrati prima (una volta per nome)
const ENRICH_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['foods'],
  properties: { foods: { type: 'array', items: { type: 'object', additionalProperties: false,
    required: ['name', 'vegetarian', 'sugar_g', 'saturated_fat_g', 'salt_g', 'calcium_mg', 'iron_mg', 'potassium_mg', 'vitamin_c_mg'],
    properties: { name: { type: 'string' }, vegetarian: { type: 'boolean' }, sugar_g: { type: 'number' }, saturated_fat_g: { type: 'number' }, salt_g: { type: 'number' },
      calcium_mg: { type: 'number' }, iron_mg: { type: 'number' }, potassium_mg: { type: 'number' }, vitamin_c_mg: { type: 'number' } } } } },
};
const ENRICH_PROMPT = `Sei un nutrizionista. Per ogni alimento dell'elenco stima i valori medi PER 100 GRAMMI secondo le tabelle di composizione (CREA, USDA): zuccheri, grassi saturi, sale, calcio, ferro, potassio, vitamina C. Indica anche se è vegetariano (true se non contiene carne né pesce; uova e latticini vanno bene). Restituisci gli alimenti nello stesso ordine, con lo stesso nome.`;
function foodsMissingInfo() {
  const seen = new Map();
  for (const list of Object.values(db.entries)) for (const e of list) {
    if (entryMicros(e)) continue;
    const k = normName(e.name);
    if (!seen.has(k)) seen.set(k, e);
  }
  return [...seen.values()];
}
async function runEnrich() {
  if (!requireKey()) return;
  const todo = foodsMissingInfo();
  openSheet(`<h3>Completo i micronutrienti…</h3><div class="spinner"></div><p class="center muted small" id="enrMsg">0 di ${todo.length} alimenti</p>`);
  let done = 0;
  try {
    for (let i = 0; i < todo.length; i += 25) {
      const batch = todo.slice(i, i + 25);
      const prompt = batch.map((e, j) => `${j + 1}. ${e.name} (${r0(e.per100.kcal)} kcal per 100 g)`).join('\n');
      const out = await analyzeFood({ prompt, system: ENRICH_PROMPT, schema: ENRICH_SCHEMA });
      (out.foods || []).forEach((f, j) => {
        const src = batch[j] && normName(batch[j].name) === normName(f.name) ? batch[j] : batch.find(b => normName(b.name) === normName(f.name)) || batch[j];
        if (!src) return;
        db.foodInfo[normName(src.name)] = { veg: !!f.vegetarian, sug: f.sugar_g || 0, sat: f.saturated_fat_g || 0, salt: f.salt_g || 0, ca: f.calcium_mg || 0, fe: f.iron_mg || 0, kk: f.potassium_mg || 0, vc: f.vitamin_c_mg || 0 };
      });
      done += batch.length; save();
      const m = $('#enrMsg'); if (m) m.textContent = `${Math.min(done, todo.length)} di ${todo.length} alimenti`;
    }
    closeSheet(); render(); toast('Micronutrienti completati');
  } catch (err) {
    save();
    openSheet(`<h3>Non completato</h3><p>${esc(err.message)}</p><p class="small muted">Gli alimenti già elaborati restano salvati: puoi riprovare più tardi.</p><button class="btn" id="eOk">Ok</button>`, s2 => $('#eOk', s2).addEventListener('click', () => { closeSheet(); render(); }));
  }
}

// ---------- Risultati del mese (in cima ai Progressi) ----------
function greenStreak() {
  let d = dayStatus(today()) === 'ok' ? today() : addDays(today(), -1), n = 0;
  while (dayStatus(d) === 'ok') { n++; d = addDays(d, -1); }
  return n;
}
function monthResultsCard() {
  const m = today().slice(0, 7);
  const ws = db.body.filter(b => b.weight != null).sort((a, b) => a.date.localeCompare(b.date));
  const base = ws.filter(b => b.date < `${m}-01`).pop() || ws.find(b => b.date.startsWith(m));
  const last = ws.at(-1);
  const dW = base && last && last.date >= `${m}-01` && base !== last ? last.weight - base.weight : null;
  const mb = monthBalance(m);
  const days = monthDays(m).filter(d => d < today() || dayEntries(d).length);
  const green = days.filter(d => dayStatus(d) === 'ok').length;
  const vsGoal = db.goals.deficitRef === 'goal';
  const tile = (val, dec, unit, label, cls = '') => `<div class="stat res ${cls}"><div class="v"><span data-count="${val}" data-dec="${dec}" data-sign="1">${val > 0 ? '+' : val < 0 ? '−' : ''}${fmtNum(Math.abs(val), dec)}</span> <small>${unit}</small></div><div class="k">${label}</div></div>`;
  return `<div class="card results">
    <h2>🏁 ${cap(monthName(m))} finora</h2>
    <div class="stats">
      ${dW != null ? tile(Math.round(dW * 10) / 10, 1, 'kg', 'sulla bilancia', dW <= 0 ? 'good' : 'bad') : `<div class="stat res"><div class="v">–</div><div class="k">peso: pesati per vedere i kg persi</div></div>`}
      ${!vsGoal && (mb.days || mb.start) ? tile(-Math.round(-mb.total / 770) / 10, 1, 'kg', 'di grasso stimato', mb.total <= 0 ? 'good' : 'bad') : tile(Math.round(mb.total), 0, 'kcal', 'rispetto all\'obiettivo', mb.total <= 0 ? 'good' : 'bad')}
      <div class="stat res"><div class="v"><span data-count="${green}">${green}</span> <small>/ ${days.length}</small></div><div class="k">giorni verdi</div></div>
      <div class="stat res"><div class="v">🔥 <span data-count="${greenStreak()}">${greenStreak()}</span></div><div class="k">giorni verdi di fila</div></div>
    </div>
  </div>`;
}

// ---------- Animazioni ----------
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const countPrev = {};
function animateView(root) {
  // anelli: dal valore precedente al nuovo
  requestAnimationFrame(() => requestAnimationFrame(() => $$('.ring-prog', root).forEach(c => { c.style.strokeDashoffset = c.dataset.to; })));
  if (reduceMotion()) return;
  // numeri che contano fino al valore
  $$('[data-count]', root).forEach((el, i) => {
    const to = +el.dataset.count, dec = +(el.dataset.dec || 0), suffix = el.dataset.suffix || '', signed = el.dataset.sign;
    const key = el.dataset.key || `${tab}-${i}`;
    const from = countPrev[key] ?? 0;
    countPrev[key] = to;
    if (from === to) return;
    const t0 = performance.now(), dur = 900;
    const fmt = x => (signed ? (x > 0 ? '+' : x < 0 ? '−' : '') + fmtNum(Math.abs(x), dec) : fmtNum(x, dec)) + suffix;
    const step = now => {
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
function confetti() {
  if (reduceMotion()) return;
  const cv = document.createElement('canvas');
  cv.className = 'confetti';
  const dpr = devicePixelRatio || 1;
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  const css = getComputedStyle(document.documentElement);
  const colors = ['--accent', '--prot', '--carb', '--fat', '--ok'].map(v => css.getPropertyValue(v).trim() || '#0f766e');
  const parts = Array.from({ length: 140 }, () => ({
    x: innerWidth / 2 + (Math.random() - .5) * 80, y: innerHeight * .35, vx: (Math.random() - .5) * 13, vy: -Math.random() * 13 - 4,
    w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: colors[Math.floor(Math.random() * colors.length)],
  }));
  const t0 = performance.now();
  const frame = now => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.32; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    }
    if (now - t0 < 2600) requestAnimationFrame(frame); else cv.remove();
  };
  requestAnimationFrame(frame);
}
const celebrateQueue = [];
function celebrate(list) {
  celebrateQueue.push(...list);
  if ($('.celebrate')) return;
  const next = () => {
    const a = celebrateQueue.shift();
    if (!a) return;
    const el = document.createElement('div');
    el.className = 'celebrate';
    el.innerHTML = `<div class="cbox"><div class="cemoji">${a.emoji}</div><h3>${esc(a.title)}</h3><p>${esc(a.text)}</p><button class="btn" id="cOk">Grande! 💪</button></div>`;
    document.body.appendChild(el);
    confetti();
    const close = () => { el.remove(); setTimeout(next, 250); };
    el.querySelector('#cOk').addEventListener('click', close);
    el.addEventListener('click', e => { if (e.target === el) close(); });
  };
  next();
}
// Traguardi: kg persi nel mese e in totale, peso obiettivo, giorni verdi di fila, grasso bruciato
function checkAchievements() {
  const a = db.achievements ||= {};
  const found = [];
  const best = (keys, payload) => { const fresh = keys.filter(k => !a[k]); fresh.forEach(k => { a[k] = today(); }); if (fresh.length) found.push(payload(fresh.length)); };
  const m = today().slice(0, 7);
  const ws = db.body.filter(b => b.weight != null).sort((x, y) => x.date.localeCompare(y.date));
  if (ws.length >= 2) {
    const last = ws.at(-1);
    const base = ws.filter(b => b.date < `${m}-01`).pop() || ws.find(b => b.date.startsWith(m));
    if (base && base !== last && last.date >= `${m}-01`) {
      const k = Math.floor(base.weight - last.weight + 1e-9);
      if (k >= 1) best(Array.from({ length: k }, (_, i) => `wm-${m}-${i + 1}`), () => ({ emoji: '🎉', title: `−${k} kg a ${monthName(m)}!`, text: `Da ${fmtNum(base.weight)} a ${fmtNum(last.weight)} kg questo mese.` }));
    }
    const first = ws[0], kt = Math.floor(first.weight - last.weight + 1e-9);
    if (kt >= 2) best(Array.from({ length: kt - 1 }, (_, i) => `wt-${i + 2}`), () => ({ emoji: '🏆', title: `−${kt} kg in totale!`, text: `Dall'inizio sei passato da ${fmtNum(first.weight)} a ${fmtNum(last.weight)} kg.` }));
    const tgt = db.goals.weightTarget;
    if (tgt != null && first.weight > tgt && last.weight <= tgt) best([`target-${tgt}`], () => ({ emoji: '🥇', title: 'Peso obiettivo raggiunto!', text: `${fmtNum(last.weight)} kg: hai centrato l'obiettivo di ${fmtNum(tgt)} kg.` }));
  }
  let d = addDays(today(), -1), n = 0;
  while (dayStatus(d) === 'ok') { n++; d = addDays(d, -1); }
  const start = addDays(d, 1);
  const marks = [3, 7, 14, 30, 60, 100].filter(k => n >= k);
  if (marks.length) best(marks.map(k => `streak-${k}-${start}`), () => ({ emoji: '🔥', title: `${marks.at(-1)} giorni verdi di fila!`, text: 'Calorie nel target ogni giorno: continua così.' }));
  if (db.goals.deficitRef !== 'goal') {
    const h = balanceHistory(), kg = Math.floor(-h.total / KCAL_PER_KG_FAT + 1e-9);
    if (kg >= 1) best(Array.from({ length: kg }, (_, i) => `fat-${i + 1}`), () => ({ emoji: '🔥', title: `≈ ${kg} kg di grasso bruciati`, text: `Dall'inizio hai accumulato ${fmtBalance(h.total)} di deficit calorico.` }));
  }
  if (found.length) { save(); celebrate(found); }
}

function weightTrend() {
  // kg/settimana dalla regressione lineare delle pesate degli ultimi 28 giorni
  const from = addDays(today(), -28);
  const pts = db.body.filter(b => b.weight != null && b.date >= from).map(b => [parseYmd(b.date).getTime() / 864e5, b.weight]);
  if (pts.length < 3) return null;
  const n = pts.length, mx = pts.reduce((a, p) => a + p[0], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n;
  const den = pts.reduce((a, p) => a + (p[0] - mx) ** 2, 0);
  if (!den) return null;
  return (pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0) / den) * 7;
}

function weightGoalCard() {
  const g = db.goals;
  if (g.weightTarget == null) return '';
  const lastW = latestBody('weight');
  const first = [...db.body].filter(b => b.weight != null).sort((a, b) => a.date.localeCompare(b.date))[0];
  let html = `<div class="card"><h2>Obiettivo peso <small>${fmtNum(g.weightTarget)} kg${g.weightTargetDate ? ' entro ' + fmtDate(g.weightTargetDate, { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</small></h2>`;
  if (!lastW) return html + `<p class="small muted">Registra il tuo peso per vedere i progressi.</p></div>`;
  const total = first.weight - g.weightTarget;
  const done = first.weight - lastW.weight;
  const p = total !== 0 ? Math.max(0, Math.min(100, (done / total) * 100)) : 100;
  html += `<div class="macro"><div class="top"><span>Partenza ${fmtNum(first.weight)} kg</span><span><b>${fmtNum(lastW.weight)}</b> kg</span></div>
    <div class="bar"><i style="width:${p}%;background:var(--accent)"></i></div></div>
    <div class="row between small" style="margin-top:8px"><span class="muted">Completato ${r0(p)}%</span><span class="muted">Mancano ${fmtNum(Math.abs(lastW.weight - g.weightTarget))} kg</span></div>`;
  const trend = weightTrend();
  const infos = [];
  if (g.weightTargetDate && g.weightTargetDate > today()) {
    const weeks = (parseYmd(g.weightTargetDate) - parseYmd(today())) / (7 * 864e5);
    const need = (g.weightTarget - lastW.weight) / weeks;
    infos.push(`Ritmo necessario: <b>${signed(need, 'kg')}</b>/settimana`);
    if (trend != null) {
      const onTrack = Math.sign(need) === Math.sign(trend) && Math.abs(trend) >= Math.abs(need) * 0.8;
      infos.push(`Andamento attuale: <b>${signed(trend, 'kg')}</b>/settimana <span class="pill ${onTrack ? '' : 'warn'}">${onTrack ? 'in linea' : 'da migliorare'}</span>`);
    }
  } else if (trend != null) {
    infos.push(`Andamento attuale: <b>${signed(trend, 'kg')}</b>/settimana`);
    const remaining = g.weightTarget - lastW.weight;
    if (trend !== 0 && Math.sign(remaining) === Math.sign(trend)) {
      const eta = addDays(today(), Math.round((remaining / trend) * 7));
      infos.push(`Arrivo stimato: <b>${fmtDate(eta, { day: 'numeric', month: 'long', year: 'numeric' })}</b>`);
    }
  }
  if (infos.length) html += `<div class="small" style="margin-top:10px;display:grid;gap:4px">${infos.map(i => `<div>${i}</div>`).join('')}</div>`;
  return html + `</div>`;
}

// ---------- Body ----------
function renderBody(v) {
  const g = db.goals, p = db.profile;
  const w = latestBody('weight'), bf = latestBody('bodyFat');
  const hasData = db.body.length > 0;
  const sorted = [...db.body].sort((a, b) => b.date.localeCompare(a.date));
  const bmi = w && p.height ? w.weight / ((p.height / 100) ** 2) : null;
  const lean = w && bf ? w.weight * (1 - bf.bodyFat / 100) : null;
  const lastWH = sorted.find(b => b.waist && b.hips);
  const navy = navyBodyFat(p);

  let html = `<button class="btn" id="newBody" style="margin-bottom:12px">+ Nuova misurazione</button>`;
  html += `<div class="card"><h2>Situazione attuale</h2><div class="stats">
    <div class="stat"><div class="v">${w ? fmtNum(w.weight) : '–'}</div><div class="k">Peso kg${g.weightTarget != null ? ` · obiettivo ${fmtNum(g.weightTarget)}` : ''}</div></div>
    <div class="stat"><div class="v">${bf ? fmtNum(bf.bodyFat) : '–'}</div><div class="k">Massa grassa %${g.bodyFatTarget != null ? ` · obiettivo ${fmtNum(g.bodyFatTarget)}` : ''}</div></div>
    <div class="stat"><div class="v">${lean ? fmtNum(lean) : '–'}</div><div class="k">Massa magra kg</div></div>
    <div class="stat"><div class="v">${bmi ? fmtNum(bmi) : '–'}</div><div class="k">BMI</div></div>
    ${lastWH ? `<div class="stat"><div class="v">${fmtNum(lastWH.waist / lastWH.hips, 2)}</div><div class="k">Rapporto vita/fianchi</div></div>` : ''}
    ${lastWH && p.height ? `<div class="stat"><div class="v">${fmtNum(lastWH.waist / p.height, 2)}</div><div class="k">Vita/altezza (ideale &lt; 0,5)</div></div>` : ''}
    ${navy ? `<div class="stat" style="grid-column:1/-1"><div class="v">${fmtNum(navy.bf)}%</div><div class="k">Massa grassa stimata dalle circonferenze (metodo US Navy, ${fmtDate(navy.date, { day: 'numeric', month: 'short' })}) · ${fmtNum(navy.fatKg)} kg di grasso</div></div>` : ''}
  </div></div>`;

  if (hasData) {
    const available = BODY_FIELDS.filter(f => db.body.some(b => b[f.k] != null));
    if (!available.find(f => f.k === bodyMetric)) bodyMetric = available[0]?.k || 'weight';
    const f = BODY_FIELDS.find(x => x.k === bodyMetric);
    const pts = db.body.filter(b => b[bodyMetric] != null).sort((a, b) => a.date.localeCompare(b.date)).map(b => ({ date: b.date, y: b[bodyMetric] }));
    const target = bodyMetric === 'weight' ? g.weightTarget : bodyMetric === 'bodyFat' ? g.bodyFatTarget : null;
    html += `<div class="card"><h2>Andamento</h2>
      <div class="meal-pick">${available.map(x => `<button class="chip ${x.k === bodyMetric ? 'on' : ''}" data-bm="${x.k}">${x.label}</button>`).join('')}</div>
      ${lineChart(pts, { target, unit: f.unit })}</div>`;
    html += `<div class="card"><h2>Storico <small>${sorted.length} misurazioni</small></h2><ul class="log">${(showAllBody ? sorted : sorted.slice(0, 10)).map(b => `<li data-b="${b.date}">
      <div class="grow"><div><b>${fmtDate(b.date, { day: 'numeric', month: 'short', year: 'numeric' })}</b></div>
      <div class="small muted">${BODY_FIELDS.filter(f => b[f.k] != null).map(f => `${f.label} ${fmtNum(b[f.k])}${f.unit ? ' ' + f.unit : ''}`).join(' · ')}</div></div>
      <span class="muted">›</span></li>`).join('')}</ul>${!showAllBody && sorted.length > 10 ? '<button class="btn ghost" id="allBody">Mostra tutto</button>' : ''}</div>`;
  } else {
    html += `<div class="card empty-card"><div class="empty-ico">⚖️</div><b>Inizia dalla prima pesata</b><p class="small muted">Registra peso, massa grassa e circonferenze: qui vedrai grafici, massa grassa stimata e i kg persi mese per mese.</p></div>`;
  }
  v.innerHTML = html;
  $('#newBody', v).addEventListener('click', () => bodyForm(null, today()));
  $$('[data-bm]', v).forEach(c => c.addEventListener('click', () => { bodyMetric = c.dataset.bm; render(); }));
  $$('[data-b]', v).forEach(li => li.addEventListener('click', () => bodyForm(li.dataset.b)));
  $('#allBody', v)?.addEventListener('click', () => { showAllBody = true; render(); });
}

// Stima della massa grassa con il metodo US Navy (circonferenze in cm)
function navyBodyFat(p) {
  const rec = [...db.body].sort((a, b) => b.date.localeCompare(a.date))
    .find(b => b.neck && b.waist && (p.sex === 'm' || b.hips));
  if (!rec || !p.height) return null;
  const log = Math.log10;
  const bf = p.sex === 'm'
    ? (rec.waist > rec.neck ? 495 / (1.0324 - 0.19077 * log(rec.waist - rec.neck) + 0.15456 * log(p.height)) - 450 : null)
    : (rec.waist + rec.hips > rec.neck ? 495 / (1.29579 - 0.35004 * log(rec.waist + rec.hips - rec.neck) + 0.221 * log(p.height)) - 450 : null);
  if (bf == null || bf < 2 || bf > 70) return null;
  const w = weightOn(rec.date);
  return { bf, date: rec.date, fatKg: w ? w * bf / 100 : null };
}

// Sagoma con i punti di misura; la linea del campo attivo viene evidenziata
function measureFigure() {
  const lines = [
    ['neck', 60, 100, 13, 'Collo', "sotto il pomo d'Adamo"],
    ['chest', 104, 100, 47, 'Petto', 'linea dei capezzoli'],
    ['waist', 150, 100, 41, 'Vita', "all'ombelico"],
    ['hips', 190, 100, 49, 'Fianchi', 'punto più largo dei glutei'],
    ['thigh', 236, 77, 20, 'Coscia', 'a metà coscia'],
  ];
  return `<svg class="measure-fig" viewBox="0 0 300 350" role="img" aria-label="Dove misurare le circonferenze">
    <g class="body">
      <ellipse cx="100" cy="28" rx="17" ry="21"/>
      <path d="M91 44 h18 v18 h-18z"/>
      <path d="M88 60 L112 60 L140 70 Q152 74 152 88 L150 124 Q146 140 142 150 Q150 170 150 190 L146 214 L124 336 L106 336 L102 226 L98 226 L94 336 L76 336 L54 214 L50 190 Q50 170 58 150 Q54 140 50 124 L48 88 Q48 74 60 70 Z"/>
      <path d="M50 76 Q38 80 36 100 L28 186 Q27 196 34 196 Q40 196 41 188 L50 120 Z"/>
      <path d="M150 76 Q162 80 164 100 L172 186 Q173 196 166 196 Q160 196 159 188 L150 120 Z"/>
      <circle cx="100" cy="152" r="2"/>
    </g>
    ${lines.map(([k, y, cx, rx, name, where]) => `<g class="mline" data-line="${k}">
      <ellipse cx="${cx}" cy="${y}" rx="${rx}" ry="5"/>
      <path class="lead" d="M${cx + rx + 3} ${y} L184 ${y}"/>
      <text x="188" y="${y - 2}" class="t1">${name}</text>
      <text x="188" y="${y + 11}" class="t2">${where}</text>
    </g>`).join('')}
  </svg>`;
}

function bodyForm(date, newDate) {
  const existing = date ? db.body.find(b => b.date === date) : db.body.find(b => b.date === newDate);
  const rec = existing || { date: newDate || today() };
  const last = latestBody('weight');
  openSheet(`<h3>${existing ? 'Modifica misurazione' : 'Nuova misurazione'}</h3>
    <label class="field"><span>Data</span><input type="date" id="bDate" value="${rec.date}" max="${today()}"></label>
    <div class="grid2">${BODY_FIELDS.filter(f => !f.circ).map(f => `<label class="field"><span>${f.label}${f.unit ? ' (' + f.unit + ')' : ''}</span>
      <input type="number" inputmode="decimal" step="${f.step}" data-f="${f.k}" value="${rec[f.k] ?? ''}" placeholder="${f.k === 'weight' && last ? fmtNum(last.weight) : ''}"></label>`).join('')}</div>
    <h3 style="font-size:16px;margin:6px 0 4px">Circonferenze</h3>
    <p class="small muted" style="margin:0 0 6px">Metro da sarta aderente senza stringere, orizzontale, sulla pelle. Tocca un campo per vedere il punto.</p>
    ${measureFigure()}
    ${BODY_FIELDS.filter(f => f.circ).map(f => `<label class="field circ-field"><span>${f.label} (${f.unit})</span>
      <input type="number" inputmode="decimal" step="${f.step}" data-f="${f.k}" value="${rec[f.k] ?? ''}">
      <small class="hint" data-hint="${f.k}">${esc(f.hint)}</small></label>`).join('')}
    <label class="field"><span>Note</span><input type="text" id="bNote" value="${esc(rec.note || '')}" placeholder="es. dopo allenamento, bilancia impedenziometrica"></label>
    <div class="btn-row">${existing ? '<button class="btn danger" id="bDel">Elimina</button>' : ''}<button class="btn" id="bSave">Salva</button></div>`, s => {
    const highlight = k => {
      $$('.mline', s).forEach(g => g.classList.toggle('on', g.dataset.line === k));
      $$('[data-hint]', s).forEach(h => h.classList.toggle('show', h.dataset.hint === k));
    };
    $$('.circ-field input', s).forEach(i => i.addEventListener('focus', () => highlight(i.dataset.f)));
    $$('.mline', s).forEach(g => g.addEventListener('click', () => $(`[data-f="${g.dataset.line}"]`, s).focus()));
    $('#bSave', s).addEventListener('click', () => {
      const d = $('#bDate', s).value || today();
      const out = { date: d };
      let any = false;
      $$('[data-f]', s).forEach(i => { const n = num(i.value); if (n != null) { out[i.dataset.f] = n; any = true; } });
      const note = $('#bNote', s).value.trim();
      if (note) out.note = note;
      if (!any) { toast('Inserisci almeno un valore'); return; }
      db.body = db.body.filter(b => b.date !== d && (!existing || b.date !== existing.date));
      db.body.push(out);
      const changed = out.weight != null && autoGoals();
      save(); closeSheet(); render();
      if (out.weight != null) setTimeout(checkAchievements, 400);
      toast(changed ? `Misurazione salvata · nuovo obiettivo ${db.goals.kcal} kcal` : 'Misurazione salvata');
    });
    const del = $('#bDel', s);
    del && del.addEventListener('click', () => {
      db.body = db.body.filter(b => b.date !== existing.date); save(); closeSheet(); render(); toast('Eliminata');
    });
  });
}

// ---------- Goals & settings ----------
const GOAL_TYPES = [
  ['lose', 'Dimagrire (circa −0,5 kg/sett.)'],
  ['lose_slow', 'Dimagrire piano (circa −0,25 kg/sett.)'],
  ['maintain', 'Mantenere il peso'],
  ['gain', 'Aumentare massa (circa +0,25 kg/sett.)'],
];
const GOAL_DELTA = { lose: -500, lose_slow: -250, maintain: 0, gain: 250 };

function suggestGoals(p, weight) {
  // Metabolismo basale con Mifflin-St Jeor, poi stile di vita (senza sport) + attività fissa di ogni giorno.
  const bmr = 10 * weight + 6.25 * p.height - 5 * p.age + (p.sex === 'm' ? 5 : -161);
  const lifestyleKcal = bmr * ((p.lifestyle || 1.2) - 1);
  const tdee = bmr + lifestyleKcal + (p.baseActivity || 0);
  const delta = GOAL_DELTA[p.goalType] ?? 0;
  const minKcal = p.sex === 'm' ? 1500 : 1200;
  const kcal = Math.max(minKcal, Math.round((tdee + delta) / 10) * 10);
  return {
    bmr: r0(bmr), lifestyleKcal: r0(lifestyleKcal), baseActivity: r0(p.baseActivity || 0), tdee: r0(tdee), delta, kcal,
    ...macrosFor(kcal, weight, p.goalType), water: Math.round((weight * 35) / 250) * 250,
  };
}

// Macro per un obiettivo calorico: proteine in base al peso, grassi almeno il 25% delle kcal, carboidrati il resto.
// Senza peso registrato: 25% proteine, 30% grassi, 45% carboidrati.
function macrosFor(kcal, weight, goalType) {
  let protein, fat;
  if (weight) {
    protein = weight * (goalType.startsWith('lose') ? 2.0 : goalType === 'gain' ? 1.8 : 1.6);
    fat = Math.max(weight * 0.9, (kcal * 0.25) / 9);
    // Con poche calorie proteine e grassi non devono lasciare i carboidrati sotto il 20%
    const room = kcal * 0.8;
    if (protein * 4 + fat * 9 > room) { const k = room / (protein * 4 + fat * 9); protein *= k; fat *= k; }
  } else {
    protein = (kcal * 0.25) / 4;
    fat = (kcal * 0.30) / 9;
  }
  protein = Math.round(protein); fat = Math.round(fat);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { protein, fat, carbs, fiber: Math.round((kcal / 1000) * 14) };
}

// Con "aggiornamento automatico" attivo, gli obiettivi seguono peso e profilo.
function autoGoals() {
  const w = latestBody('weight');
  if (!db.goals.auto || !w) return false;
  const sg = suggestGoals(db.profile, w.weight);
  const changed = sg.kcal !== db.goals.kcal;
  Object.assign(db.goals, { kcal: sg.kcal, protein: sg.protein, carbs: sg.carbs, fat: sg.fat, fiber: sg.fiber, water: sg.water });
  return changed;
}

function renderGoals(v) {
  const g = db.goals, p = db.profile, st = db.settings;
  const w = latestBody('weight');
  const field = (id, label, val, extra = '') => `<label class="field"><span>${label}</span><input type="number" inputmode="decimal" id="${id}" value="${val ?? ''}" ${extra}></label>`;
  const curPal = st.palette || 'salvia';
  const curScheme = st.scheme === 'dark' || (st.scheme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  const geminiModels = st.geminiModels?.length ? st.geminiModels : [st.geminiModel || GEMINI_DEFAULT_MODEL];
  v.innerHTML = `
  <div class="card">
    <h2>Il tuo fabbisogno</h2>
    <label class="field"><span>Come ti chiami? (facoltativo, per il saluto)</span><input type="text" id="pName" value="${esc(p.name || '')}" maxlength="30" autocomplete="given-name"></label>
    <div class="grid2">
      <label class="field"><span>Sesso</span><select id="pSex"><option value="m" ${p.sex === 'm' ? 'selected' : ''}>Uomo</option><option value="f" ${p.sex === 'f' ? 'selected' : ''}>Donna</option></select></label>
      ${field('pAge', 'Età', p.age)}
      ${field('pH', 'Altezza (cm)', p.height)}
      <label class="field"><span>Peso attuale</span><input type="text" value="${w ? fmtNum(w.weight) + ' kg' : 'registralo in Corpo'}" disabled></label>
    </div>
    <label class="field"><span>Com'è la tua giornata tipo (sport escluso)</span><select id="pLife">${LIFESTYLE.map(([k, l]) => `<option value="${k}" ${+p.lifestyle === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="field"><span>Attività fissa di ogni giorno (kcal)</span><input type="number" inputmode="numeric" id="pBase" value="${p.baseActivity || ''}" placeholder="es. 200 per camminate e passi quotidiani"></label>
    <p class="small muted" style="margin-top:-4px">Metti qui quello che fai tutti i giorni (es. 40 min a piedi ≈ 150–200 kcal). Gli allenamenti occasionali invece li aggiungi nel Diario, giorno per giorno.</p>
    <label class="field"><span>Obiettivo</span><select id="pGoal">${GOAL_TYPES.map(([k, l]) => `<option value="${k}" ${p.goalType === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <div class="calc" id="calcBox"></div>
    <label class="check"><input type="checkbox" id="gAuto" ${g.auto ? 'checked' : ''}> Aggiorna gli obiettivi da solo quando cambia il peso</label>
    <button class="btn" id="applyCalc">Usa questi valori come obiettivi</button>
  </div>
  <div class="card">
    <h2>Obiettivi giornalieri</h2>
    <div class="grid2">
      ${field('gKcal', 'Calorie (kcal)', g.kcal)}
      ${field('gProt', 'Proteine (g)', g.protein)}
      ${field('gCarb', 'Carboidrati (g)', g.carbs)}
      ${field('gFat', 'Grassi (g)', g.fat)}
      ${field('gFib', 'Fibre (g)', g.fiber)}
      ${field('gWater', 'Acqua (ml)', g.water)}
    </div>
    <p class="small muted" id="macroCheck" style="margin-top:0"></p>
    <button class="btn secondary" id="fixMacros" hidden style="margin-bottom:10px">Ricalcola macro per queste calorie</button>
    <label class="field"><span>Calorie degli allenamenti da aggiungere al budget del giorno</span><select id="gAddBack">
      ${[[1, 'Tutte (100%)'], [0.5, 'Metà (50%) – più prudente'], [0, 'Nessuna']].map(([k, l]) => `<option value="${k}" ${+g.exerciseAddBack === k ? 'selected' : ''}>${l}</option>`).join('')}
    </select></label>
    <h2 style="margin-top:6px">Obiettivi a lungo termine</h2>
    <div class="grid2">
      ${field('gWT', 'Peso obiettivo (kg)', g.weightTarget, 'step="0.1"')}
      <label class="field"><span>Entro il</span><input type="date" id="gWTD" value="${g.weightTargetDate || ''}"></label>
      ${field('gBF', 'Massa grassa obiettivo (%)', g.bodyFatTarget, 'step="0.1"')}
    </div>
    <h2 style="margin-top:6px">Obiettivi del mese</h2>
    <div class="grid2">
      ${field('gMW', 'Peso a fine mese (kg)', g.monthWeight, 'step="0.1"')}
      ${field('gMD', 'Giorni in target calorie', g.monthDaysInTarget)}
    </div>
    <button class="btn" id="saveGoals">Salva obiettivi</button>
  </div>
  <div class="card" id="settingsCard">
    <h2>Intelligenza artificiale</h2>
    <p class="small muted" style="margin-top:0">Serve per riconoscere i cibi da foto e testo. Ricerca, codice a barre e tutto il resto funzionano anche senza.</p>
    <div class="seg" id="provSeg">
      <button data-prov="gemini" class="${st.provider !== 'claude' ? 'on' : ''}">Gemini · gratis</button>
      <button data-prov="claude" class="${st.provider === 'claude' ? 'on' : ''}">Claude · a pagamento</button>
    </div>
    <div id="provGemini" ${st.provider === 'claude' ? 'hidden' : ''}>
      <label class="field"><span>Chiave API di Google Gemini</span><input type="password" id="sGKey" value="${esc(st.geminiKey)}" placeholder="AIza..." autocomplete="off"></label>
      <p class="small muted" style="margin-top:-4px">Gratis su <b>aistudio.google.com</b> → Get API key (basta un account Google, niente carta). Il piano gratuito ha un limite di richieste al giorno, più che sufficiente per un diario, e Google può usare i dati inviati per migliorare i suoi servizi.</p>
      <div class="seg" id="aiModeSeg">
        <button data-mode="fast" class="${st.aiMode !== 'precise' ? 'on' : ''}">⚡ Veloce</button>
        <button data-mode="precise" class="${st.aiMode === 'precise' ? 'on' : ''}">🎯 Preciso</button>
      </div>
      <p class="small muted" style="margin-top:-4px">Veloce risponde in 1–2 secondi ed è ottimo per il diario di tutti i giorni. Preciso è più lento (5–10 secondi): utile per piatti complessi o foto difficili.</p>
      <label class="field" id="gModelField" ${st.aiMode === 'precise' ? '' : 'hidden'}><span>Modello (modalità Preciso)</span><select id="sGModel">${geminiModels.map(m => `<option ${m === st.geminiModel ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select></label>
    </div>
    <div id="provClaude" ${st.provider === 'claude' ? '' : 'hidden'}>
      <label class="field"><span>Chiave API di Claude</span><input type="password" id="sKey" value="${esc(st.apiKey)}" placeholder="sk-ant-..." autocomplete="off"></label>
      <p class="small muted" style="margin-top:-4px">Creala su <b>console.anthropic.com</b> → API Keys. Si paga a consumo (pochi centesimi a foto). Riconoscimento più preciso.</p>
      <label class="field"><span>Modello</span><select id="sModel">${MODELS.map(m => `<option value="${m.id}" ${st.model === m.id ? 'selected' : ''}>${m.label}</option>`).join('')}</select></label>
    </div>
    <p class="small muted">Le chiavi restano solo su questo telefono e vengono inviate solo al servizio scelto.</p>
    <div class="btn-row"><button class="btn secondary" id="testKey">Prova</button><button class="btn" id="saveSettings">Salva</button></div>
  </div>
  <div class="card">
    <h2>Aspetto</h2>
    <p class="small muted" style="margin-top:0">Tocca una combinazione per provarla subito.</p>
    ${PALETTES.map(([id, name, light, dark]) => `<div class="pal-group"><b>${name}</b><div class="pal-row">
      ${[['light', 'Chiaro', light], ['dark', 'Scuro', dark]].map(([sc, label, c]) => `<button class="pal-tile ${id === curPal && sc === curScheme ? 'on' : ''}" data-pal="${id}" data-sc="${sc}">
        <span class="mock" style="background:${c.bg}">
          <span class="mcard" style="background:${c.card}"><span class="ring" style="border-color:${c.accent}"></span>
            <span class="bars"><i style="background:${c.prot};width:80%"></i><i style="background:${c.carb};width:60%"></i><i style="background:${c.fat};width:45%"></i></span></span>
          <span class="mbtn" style="background:${c.accent};color:${c.on}">+ Aggiungi</span>
        </span>
        <span class="lbl">${label}${id === curPal && sc === curScheme ? '<span class="check">✓</span>' : ''}</span>
      </button>`).join('')}
    </div></div>`).join('')}
    <label class="check"><input type="checkbox" id="autoScheme" ${st.scheme === 'auto' ? 'checked' : ''}> Passa da solo tra chiaro e scuro seguendo il telefono</label>
  </div>
  <div class="card">
    <h2>Dati</h2>
    <p class="small muted" style="margin-top:0">I dati restano sul telefono. Esporta un backup ogni tanto: servirà anche per passare a un altro dispositivo.</p>
    <div class="btn-row"><button class="btn secondary" id="exportData">Esporta backup</button><button class="btn secondary" id="importData">Importa</button></div>
    <button class="btn danger" id="wipe" style="margin-top:6px">Cancella tutti i dati</button>
  </div>
  <p class="center small muted">Versione ${APP_VERSION} · ${esc(location.host)}</p>`;

  const readProfile = () => ({
    name: $('#pName', v).value.trim(), sex: $('#pSex', v).value, age: num($('#pAge', v).value) || p.age, height: num($('#pH', v).value) || p.height,
    lifestyle: +$('#pLife', v).value, baseActivity: Math.max(0, num($('#pBase', v).value) || 0), goalType: $('#pGoal', v).value,
  });
  let sg = null;
  const drawCalc = () => {
    const box = $('#calcBox', v);
    if (!w) { sg = null; box.innerHTML = `<p class="small muted">Registra il tuo peso nella scheda <b>Corpo</b> per calcolare il fabbisogno.</p>`; return; }
    sg = suggestGoals(readProfile(), w.weight);
    box.innerHTML = `<div class="calc-rows">
      <div><span>Metabolismo basale</span><b>${sg.bmr}</b></div>
      <div><span>+ Giornata tipo</span><b>${sg.lifestyleKcal}</b></div>
      ${sg.baseActivity ? `<div><span>+ Attività fissa</span><b>${sg.baseActivity}</b></div>` : ''}
      <div class="sum"><span>= Fabbisogno giornaliero</span><b>${sg.tdee} kcal</b></div>
      ${sg.delta ? `<div><span>${sg.delta < 0 ? '− Deficit per dimagrire' : '+ Surplus per aumentare'}</span><b>${Math.abs(sg.delta)}</b></div>` : ''}
      <div class="sum accent"><span>Calorie da mangiare</span><b>${sg.kcal} kcal</b></div>
    </div>
    <p class="small muted">Proteine ${sg.protein} g · Carboidrati ${sg.carbs} g · Grassi ${sg.fat} g · Fibre ${sg.fiber} g · Acqua ${fmtNum(sg.water / 1000, 2)} L. Gli allenamenti si aggiungono giorno per giorno.</p>`;
  };
  ['#pSex', '#pAge', '#pH', '#pLife', '#pBase', '#pGoal'].forEach(id => $(id, v).addEventListener('input', drawCalc));
  $('#pName', v).addEventListener('change', e => { db.profile.name = e.target.value.trim(); save(); });
  drawCalc();
  $('#applyCalc', v).addEventListener('click', () => {
    db.profile = readProfile();
    db.goals.auto = $('#gAuto', v).checked;
    if (!sg) { save(); toast('Profilo salvato. Registra il peso per calcolare gli obiettivi'); return; }
    Object.assign(db.goals, { kcal: sg.kcal, protein: sg.protein, carbs: sg.carbs, fat: sg.fat, fiber: sg.fiber, water: sg.water });
    save(); render(); toast(`Obiettivo: ${sg.kcal} kcal al giorno`);
  });
  $('#gAuto', v).addEventListener('change', e => { db.goals.auto = e.target.checked; save(); });

  const checkMacros = () => {
    const k = num($('#gKcal', v).value) || 0;
    const m = (num($('#gProt', v).value) || 0) * 4 + (num($('#gCarb', v).value) || 0) * 4 + (num($('#gFat', v).value) || 0) * 9;
    const diff = r0(m - k);
    $('#macroCheck', v).textContent = `I macro valgono ${r0(m)} kcal${Math.abs(diff) > 50 ? ` (${diff > 0 ? '+' : ''}${diff} rispetto all'obiettivo calorie)` : ' ✓'}`;
    $('#fixMacros', v).hidden = Math.abs(diff) <= 50 || k < 800;
  };
  const fillMacros = () => {
    const k = num($('#gKcal', v).value);
    const m = macrosFor(k, w?.weight, $('#pGoal', v).value);
    $('#gProt', v).value = m.protein; $('#gCarb', v).value = m.carbs; $('#gFat', v).value = m.fat; $('#gFib', v).value = m.fiber;
  };
  ['#gProt', '#gCarb', '#gFat'].forEach(id => $(id, v).addEventListener('input', checkMacros));
  // Cambiando le calorie, i macro si adattano (poi si possono ritoccare a mano)
  $('#gKcal', v).addEventListener('input', () => {
    const k = num($('#gKcal', v).value);
    if (k >= 800 && k <= 6000) fillMacros();
    checkMacros();
  });
  $('#fixMacros', v).addEventListener('click', () => { fillMacros(); checkMacros(); toast('Macro ricalcolati: tocca "Salva obiettivi"'); });
  checkMacros();
  $('#saveGoals', v).addEventListener('click', () => {
    const val = id => num($(id, v).value);
    const kcal = val('#gKcal') || g.kcal;
    // Se l'obiettivo calorie viene cambiato a mano, disattiva l'aggiornamento automatico
    if (kcal !== g.kcal && db.goals.auto) { db.goals.auto = false; toast('Aggiornamento automatico disattivato: usi obiettivi personalizzati'); }
    Object.assign(db.goals, {
      kcal, protein: val('#gProt') ?? g.protein, carbs: val('#gCarb') ?? g.carbs, fat: val('#gFat') ?? g.fat,
      fiber: val('#gFib') ?? g.fiber, water: val('#gWater') ?? g.water, exerciseAddBack: +$('#gAddBack', v).value,
      weightTarget: val('#gWT'), weightTargetDate: $('#gWTD', v).value, bodyFatTarget: val('#gBF'),
      monthWeight: val('#gMW'), monthDaysInTarget: val('#gMD') ?? 0,
    });
    save(); render(); toast('Obiettivi salvati');
  });

  $$('#aiModeSeg [data-mode]', v).forEach(b => b.addEventListener('click', () => {
    db.settings.aiMode = b.dataset.mode; save();
    $$('#aiModeSeg [data-mode]', v).forEach(x => x.classList.toggle('on', x === b));
    $('#gModelField', v).hidden = b.dataset.mode !== 'precise';
    toast(b.dataset.mode === 'fast' ? 'Modalità veloce' : 'Modalità precisa');
  }));
  $$('[data-prov]', v).forEach(b => b.addEventListener('click', () => {
    $$('[data-prov]', v).forEach(x => x.classList.toggle('on', x === b));
    $('#provGemini', v).hidden = b.dataset.prov !== 'gemini';
    $('#provClaude', v).hidden = b.dataset.prov !== 'claude';
  }));
  const saveSettings = () => {
    db.settings.provider = $('#provSeg .on', v).dataset.prov;
    db.settings.geminiKey = $('#sGKey', v).value.trim();
    db.settings.geminiModel = $('#sGModel', v).value;
    db.settings.apiKey = $('#sKey', v).value.trim();
    db.settings.model = $('#sModel', v).value;
    save();
  };
  $('#saveSettings', v).addEventListener('click', () => { saveSettings(); toast('Impostazioni salvate'); });
  $('#testKey', v).addEventListener('click', async e => {
    saveSettings();
    if (!hasAiKey()) { toast('Inserisci la chiave'); return; }
    const b = e.currentTarget; b.disabled = true; b.textContent = 'Provo…';
    try {
      if (db.settings.provider === 'gemini') {
        db.settings.geminiDead = [];
        db.settings.geminiWorking = null;
        const models = await listGeminiModels();
        if (models.length) {
          db.settings.geminiModels = models;
          if (!models.includes(db.settings.geminiModel)) db.settings.geminiModel = models.includes(GEMINI_DEFAULT_MODEL) ? GEMINI_DEFAULT_MODEL : models[0];
          save();
          const sel = $('#sGModel', v);
          sel.innerHTML = models.map(m => `<option ${m === db.settings.geminiModel ? 'selected' : ''}>${esc(m)}</option>`).join('');
        }
      }
      const out = await analyzeFood({ prompt: 'Ho mangiato: una mela' });
      toast(`Funziona! Mela ≈ ${r0(out.items[0]?.kcal)} kcal`);
    } catch (err) { toast(err.message); }
    b.disabled = false; b.textContent = 'Prova';
  });
  $$('[data-pal]', v).forEach(b => b.addEventListener('click', () => {
    db.settings.palette = b.dataset.pal;
    db.settings.scheme = b.dataset.sc;
    save(); applyPalette(); render();
  }));
  $('#autoScheme', v).addEventListener('change', e => {
    db.settings.scheme = e.target.checked ? 'auto' : curScheme;
    save(); applyPalette(); render();
  });
  $('#exportData', v).addEventListener('click', () => {
    const copy = { ...db, settings: { ...db.settings, apiKey: '', geminiKey: '' } };
    const blob = new Blob([JSON.stringify(copy, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `dieta-backup-${today()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('#importData', v).addEventListener('click', () => $('#importInput').click());
  $('#wipe', v).addEventListener('click', () => {
    if (!confirm('Cancellare diario, misure e obiettivi da questo telefono? Non si può annullare.')) return;
    const keep = db.settings;
    db = structuredClone(DEFAULT_DB); db.settings = keep; save(); render(); toast('Dati cancellati');
  });
}

$('#importInput').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    if (!d || typeof d !== 'object' || !d.entries) throw new Error();
    if (!confirm('Sostituire i dati attuali con quelli del backup?')) return;
    const { apiKey, geminiKey } = db.settings;
    localStorage.setItem(KEY, JSON.stringify(d));
    db = load();
    if (!db.settings.apiKey) db.settings.apiKey = apiKey;
    if (!db.settings.geminiKey) db.settings.geminiKey = geminiKey;
    save(); render(); toast('Backup importato');
  } catch { toast('File di backup non valido'); }
});

// ---------- Boot ----------
function applyPalette() {
  const p = db.settings.palette || 'salvia';
  if (p === 'salvia') delete document.documentElement.dataset.palette;
  else document.documentElement.dataset.palette = p;
  const scheme = db.settings.scheme || 'auto';
  if (scheme === 'auto') delete document.documentElement.dataset.scheme;
  else document.documentElement.dataset.scheme = scheme;
  // colore della barra di stato del telefono
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', accent || '#0f766e');
}
applyPalette();
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyPalette);

// Configurazione con un link: ...#k=CHIAVE_GEMINI. La chiave resta nel telefono e sparisce dall'indirizzo.
async function importKeyFromLink() {
  const params = new URLSearchParams(location.hash.slice(1));
  const key = params.get('k');
  if (!key) return;
  history.replaceState(null, '', location.pathname + location.search);
  db.settings.geminiKey = key.trim();
  db.settings.provider = 'gemini';
  save();
  toast('Chiave Gemini configurata ✓');
  try {
    const models = await listGeminiModels();
    if (models.length) {
      db.settings.geminiModels = models;
      db.settings.geminiModel = models.includes(GEMINI_DEFAULT_MODEL) ? GEMINI_DEFAULT_MODEL : models[0];
      save();
    }
  } catch {}
  render();
}

let lastSeenDay = today();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  // Se l'app resta aperta oltre la mezzanotte, passa al nuovo giorno.
  if (lastSeenDay !== today()) {
    if (curDate === lastSeenDay) curDate = today();
    lastSeenDay = today();
    render();
    setTimeout(checkAchievements, 800);
  }
});
// Chi ha cambiato le calorie con una versione vecchia ha ancora i macro iniziali (130/220/65): ricalcolali.
(() => {
  const g = db.goals;
  if (g.protein === 130 && g.carbs === 220 && g.fat === 65 && g.kcal !== 2000) {
    Object.assign(g, macrosFor(g.kcal, latestBody('weight')?.weight, db.profile.goalType));
    save();
  }
})();
render();
importKeyFromLink();
setTimeout(checkAchievements, 1200);

// ---------- Tasto indietro del telefono: torna alla schermata precedente invece di chiudere l'app ----------
let lastBack = 0;
history.replaceState({ dieta: 'base' }, '');
history.pushState({ dieta: 'guard' }, '');
window.addEventListener('popstate', () => {
  const cel = $('.celebrate');
  if (cel) cel.remove();
  else if (!$('#sheet').hidden) closeSheet();
  else if (navStack.length) { const prev = navStack.pop(); curDate = prev.curDate; go(prev.tab, false); }
  else if (curDate !== today()) { curDate = today(); render(); }
  else if (tab !== 'today') go('today', false);
  else if (Date.now() - lastBack < 2000) { history.back(); return; }
  else { lastBack = Date.now(); toast('Premi di nuovo indietro per uscire'); }
  history.pushState({ dieta: 'guard' }, '');
});
// Chiede al browser di non cancellare mai i dati salvati (diario, misure, chiave)
navigator.storage?.persist?.().catch(() => {});
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
