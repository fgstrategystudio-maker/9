(() => {
'use strict';

// ---------- Storage ----------
const KEY = 'dieta.v1';
const MEALS = [
  { id: 'colazione', label: 'Colazione' },
  { id: 'pranzo', label: 'Pranzo' },
  { id: 'cena', label: 'Cena' },
  { id: 'spuntini', label: 'Spuntini' },
];
const MODELS = [
  { id: 'claude-opus-5', label: 'Claude Opus 5 — più preciso' },
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5 — più veloce ed economico' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 — il più economico' },
];
const BODY_FIELDS = [
  { k: 'weight', label: 'Peso', unit: 'kg', step: 0.1 },
  { k: 'bodyFat', label: 'Massa grassa', unit: '%', step: 0.1 },
  { k: 'muscle', label: 'Massa muscolare', unit: 'kg', step: 0.1 },
  { k: 'water', label: 'Acqua corporea', unit: '%', step: 0.1 },
  { k: 'visceral', label: 'Grasso viscerale', unit: '', step: 1 },
  { k: 'waist', label: 'Vita', unit: 'cm', step: 0.5 },
  { k: 'hips', label: 'Fianchi', unit: 'cm', step: 0.5 },
  { k: 'chest', label: 'Petto', unit: 'cm', step: 0.5 },
  { k: 'arm', label: 'Braccio', unit: 'cm', step: 0.5 },
  { k: 'thigh', label: 'Coscia', unit: 'cm', step: 0.5 },
];

const DEFAULT_DB = {
  version: 1,
  profile: { sex: 'm', age: 35, height: 175, activity: 1.375, goalType: 'lose' },
  goals: {
    kcal: 2000, protein: 130, carbs: 220, fat: 65, fiber: 28, water: 2000,
    weightTarget: null, weightTargetDate: '', bodyFatTarget: null,
    monthWeight: null, monthDaysInTarget: 20,
  },
  entries: {},   // { 'YYYY-MM-DD': [entry] }
  water: {},     // { 'YYYY-MM-DD': ml }
  body: [],      // [{ date, weight, bodyFat, ... }]
  recent: [],
  settings: { apiKey: '', model: 'claude-opus-5' },
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_DB);
    const d = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT_DB), ...d,
      profile: { ...DEFAULT_DB.profile, ...d.profile },
      goals: { ...DEFAULT_DB.goals, ...d.goals },
      settings: { ...DEFAULT_DB.settings, ...d.settings },
    };
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
function rememberRecent(item) {
  const key = item.name.trim().toLowerCase();
  db.recent = [{ name: item.name, grams: item.grams, per100: item.per100 }, ...db.recent.filter(r => r.name.trim().toLowerCase() !== key)].slice(0, 40);
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

// ---------- Sheet ----------
function openSheet(html, onMount) {
  const s = $('#sheet');
  s.innerHTML = html;
  s.hidden = false; $('#sheetBackdrop').hidden = false;
  s.scrollTop = 0;
  document.body.style.overflow = 'hidden';
  onMount && onMount(s);
}
function closeSheet() {
  $('#sheet').hidden = true; $('#sheetBackdrop').hidden = true;
  $('#sheet').innerHTML = '';
  document.body.style.overflow = '';
}
$('#sheetBackdrop').addEventListener('click', closeSheet);

// ---------- Navigation ----------
let tab = 'today';
let curDate = today();
let addMeal = defaultMeal();
let progressRange = 30;
let bodyMetric = 'weight';
let showAllBody = false;

const TITLES = { today: 'Diario', add: 'Aggiungi', progress: 'Progressi', body: 'Corpo', goals: 'Obiettivi' };
function go(t) {
  tab = t;
  $$('.tabbar button').forEach(b => b.classList.toggle('active', b.dataset.tab === t));
  render();
  window.scrollTo(0, 0);
}
$$('.tabbar button').forEach(b => b.addEventListener('click', () => {
  if (b.dataset.tab === 'add') addMeal = curDate === today() ? defaultMeal() : addMeal;
  go(b.dataset.tab);
}));
$('#prevDay').addEventListener('click', () => { curDate = addDays(curDate, -1); render(); });
$('#nextDay').addEventListener('click', () => { if (curDate < today()) { curDate = addDays(curDate, 1); render(); } });
$('#dateLabel').addEventListener('click', () => { curDate = today(); render(); });

function render() {
  $('#title').textContent = TITLES[tab];
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
}

// ---------- Today ----------
function ringSvg(value, goal, color, size = 132, stroke = 12) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  const over = goal > 0 && value > goal * 1.05;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${over ? 'var(--danger)' : color}" stroke-width="${stroke}"
      stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}"/>
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
  const left = g.kcal - tot.kcal;
  const water = db.water[curDate] || 0;
  const glasses = Math.max(1, Math.round(g.water / 250));
  const filled = Math.round(water / 250);
  const weighed = db.body.some(b => b.date === curDate && b.weight != null);
  const yesterday = addDays(curDate, -1);

  let html = '';
  if (!db.settings.apiKey) {
    html += `<div class="banner">Per riconoscere i cibi da <b>foto</b> e <b>testo</b> inserisci la tua chiave API di Claude in <b>Obiettivi → Impostazioni</b>. Nel frattempo puoi usare la ricerca alimenti.</div>`;
  }
  html += `<div class="card">
    <div class="summary">
      <div class="ring">${ringSvg(tot.kcal, g.kcal, 'var(--kcal)')}
        <div class="ring-label"><span class="big">${r0(Math.abs(left))}</span><span class="lbl">${left >= 0 ? 'kcal rimaste' : 'kcal in più'}</span></div>
      </div>
      <div class="macros">
        ${macroBar('Calorie', tot.kcal, g.kcal, 'var(--kcal)', 'kcal')}
        ${macroBar('Proteine', tot.p, g.protein, 'var(--prot)')}
        ${macroBar('Carboidrati', tot.c, g.carbs, 'var(--carb)')}
        ${macroBar('Grassi', tot.f, g.fat, 'var(--fat)')}
      </div>
    </div>
    <div class="row between small muted" style="margin-top:12px">
      <span>Fibre ${r0(tot.fib)} / ${r0(g.fiber)} g</span>
      <span>Mangiate ${r0(tot.kcal)} di ${r0(g.kcal)} kcal</span>
    </div>
  </div>`;

  for (const m of MEALS) {
    const list = dayEntries(curDate).filter(e => e.meal === m.id);
    const mt = sumNutr(list);
    const yList = dayEntries(yesterday).filter(e => e.meal === m.id);
    html += `<div class="card">
      <div class="meal-head">
        <h2>${m.label} ${list.length ? `<small>${r0(mt.kcal)} kcal</small>` : ''}</h2>
        <button class="add-mini" data-add="${m.id}">+ Aggiungi</button>
      </div>`;
    if (list.length) {
      html += `<ul class="items">${list.map(e => {
        const n = nutrients(e);
        return `<li data-entry="${e.id}">
          <div class="grow"><div class="name">${esc(e.name)}</div>
          <div class="sub">${r0(e.grams)} g · P ${r0(n.p)} · C ${r0(n.c)} · G ${r0(n.f)}</div></div>
          <div class="kc">${r0(n.kcal)}</div>
        </li>`;
      }).join('')}</ul>
      <div class="small muted" style="margin-top:4px">P ${r0(mt.p)} g · C ${r0(mt.c)} g · G ${r0(mt.f)} g</div>`;
    } else {
      html += `<div class="empty">Niente ancora.${yList.length ? ` <button class="add-mini" style="margin-left:6px" data-copy="${m.id}">Ripeti ieri (${r0(sumNutr(yList).kcal)} kcal)</button>` : ''}</div>`;
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

  $$('[data-add]', v).forEach(b => b.addEventListener('click', () => { addMeal = b.dataset.add; go('add'); }));
  $$('[data-entry]', v).forEach(li => li.addEventListener('click', () => editEntry(li.dataset.entry)));
  $$('[data-copy]', v).forEach(b => b.addEventListener('click', () => {
    const src = dayEntries(yesterday).filter(e => e.meal === b.dataset.copy);
    db.entries[curDate] = [...dayEntries(curDate), ...src.map(e => ({ ...e, id: uid(), t: Date.now() }))];
    save(); render(); toast('Pasto copiato da ieri');
  }));
  $$('[data-drop]', v).forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.drop;
    db.water[curDate] = (i + 1 === filled) ? i * 250 : (i + 1) * 250;
    save(); render();
  }));
  const qw = $('#quickWeigh', v);
  qw && qw.addEventListener('click', () => bodyForm(null, curDate));
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
    <div class="nutri" id="eNutri"></div>
    <div class="meal-pick" style="margin-top:14px">${MEALS.map(m => `<button class="chip ${m.id === meal ? 'on' : ''}" data-m="${m.id}">${m.label}</button>`).join('')}</div>
    <div class="btn-row"><button class="btn danger" id="eDel">Elimina</button><button class="btn" id="eSave">Salva</button></div>`, s => {
    draw(s);
    const gi = $('#eGrams', s);
    gi.addEventListener('input', () => { grams = num(gi.value) || 0; draw(s); });
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
    <div class="meal-pick">${MEALS.map(m => `<button class="chip ${m.id === addMeal ? 'on' : ''}" data-m="${m.id}">${m.label}</button>`).join('')}</div>
    <div class="big-actions">
      <button class="big-action primary" id="takePhoto"><span class="ic">📷</span>Scatta foto</button>
      <button class="big-action" id="pickPhoto"><span class="ic">🖼️</span>Dalla galleria</button>
    </div>
    <div class="card">
      <h2>Descrivi cosa hai mangiato</h2>
      <textarea id="foodText" placeholder="es. 80 g di pasta al pomodoro con parmigiano, un'insalata con un cucchiaio d'olio e una mela"></textarea>
      <button class="btn" id="analyzeText" style="margin-top:10px">✨ Calcola calorie e macro</button>
    </div>
    <div class="card">
      <h2>Cerca alimento</h2>
      <input type="search" id="foodSearch" placeholder="Cerca tra recenti e alimenti comuni" autocomplete="off">
      <ul class="search-results" id="searchResults"></ul>
      <button class="btn ghost" id="manualAdd" style="margin-top:6px">Inserisci valori a mano</button>
    </div>`;
  $$('[data-m]', v).forEach(c => c.addEventListener('click', () => { addMeal = c.dataset.m; $$('[data-m]', v).forEach(x => x.classList.toggle('on', x === c)); }));
  $('#takePhoto', v).addEventListener('click', () => requireKey() && $('#photoInput').click());
  $('#pickPhoto', v).addEventListener('click', () => requireKey() && $('#galleryInput').click());
  $('#analyzeText', v).addEventListener('click', () => {
    const text = $('#foodText', v).value.trim();
    if (!text) { toast('Scrivi cosa hai mangiato'); return; }
    if (!requireKey()) return;
    runAnalysis({ text });
  });
  const si = $('#foodSearch', v);
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
      }).slice(0, 25);
    }
    $('#searchResults', v).innerHTML = (!term && recents.length ? `<li class="small muted" style="border:0;padding-bottom:0">Recenti</li>` : '') +
      (list.length ? list.map((x, i) => `<li><button data-i="${i}"><span class="grow"><span class="name">${esc(x.name)}</span><br><span class="small muted">${r0(x.grams)} g · ${r0(x.per100.kcal * x.grams / 100)} kcal</span></span><span class="add-mini">+</span></button></li>`).join('')
        : `<li class="muted small">Nessun risultato. ${db.settings.apiKey ? 'Prova a descriverlo nel box sopra.' : ''}</li>`);
    $$('#searchResults [data-i]', v).forEach(b => b.addEventListener('click', () => quickAdd(list[+b.dataset.i])));
  };
  si.addEventListener('input', drawResults);
  drawResults();
  $('#manualAdd', v).addEventListener('click', manualForm);
}

function requireKey() {
  if (db.settings.apiKey) return true;
  toast('Inserisci prima la chiave API in Obiettivi → Impostazioni');
  go('goals');
  setTimeout(() => $('#settingsCard')?.scrollIntoView({ behavior: 'smooth' }), 100);
  return false;
}

function addEntries(items, meal) {
  const list = dayEntries(curDate);
  for (const it of items) {
    const e = { id: uid(), name: it.name, grams: it.grams, per100: it.per100, meal, t: Date.now() };
    list.push(e);
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
    <div class="nutri" id="qNutri"></div>
    <p class="small muted">Per 100 g: ${r0(food.per100.kcal)} kcal · P ${fmtNum(food.per100.p)} · C ${fmtNum(food.per100.c)} · G ${fmtNum(food.per100.f)}</p>
    <button class="btn" id="qAdd">Aggiungi a ${MEALS.find(m => m.id === addMeal).label}</button>`, s => {
    draw(s);
    const gi = $('#qGrams', s);
    gi.addEventListener('input', () => { grams = num(gi.value) || 0; draw(s); });
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
async function handlePhoto(file) {
  if (!file) return;
  try {
    const { dataUrl, b64 } = await resizeImage(file, 1280, 0.85);
    openSheet(`<h3>Foto del pasto</h3>
      <img class="preview" src="${dataUrl}" alt="">
      <label class="field"><span>Dettagli (facoltativo)</span><input type="text" id="pNote" placeholder="es. porzione abbondante, condita con olio, pasta integrale"></label>
      <button class="btn" id="pGo">✨ Riconosci cibo e calorie</button>`, s => {
      $('#pGo', s).addEventListener('click', () => runAnalysis({ imageB64: b64, preview: dataUrl, text: $('#pNote', s).value.trim() }));
    });
  } catch {
    toast('Impossibile leggere la foto');
  }
}
for (const id of ['#photoInput', '#galleryInput']) {
  $(id).addEventListener('change', e => { handlePhoto(e.target.files[0]); e.target.value = ''; });
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
          confidence: { type: 'string', enum: ['alta', 'media', 'bassa'] },
        },
        required: ['name', 'portion', 'grams', 'kcal', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'confidence'],
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
- Se l'utente indica quantità o marche, usale. Altrimenti stima la porzione realistica dalla foto (dimensione del piatto, posate, confezioni) o da una porzione tipica italiana.
- "grams" è il peso della porzione così come mangiata (cotta se cotta). Per le bevande usa i ml come grammi. Scrivi in "portion" una descrizione leggibile (es. "1 piatto medio", "2 cucchiai").
- Calorie, proteine, carboidrati, grassi e fibre si riferiscono all'intera porzione, basati su tabelle di composizione (CREA, USDA). Includi i condimenti probabili (olio, burro, salse) come voce separata quando sono rilevanti.
- "confidence" indica quanto sei sicuro di identificazione e porzione.
- In "notes" scrivi in una o due frasi le ipotesi principali (es. "Ho ipotizzato 1 cucchiaio d'olio"). Se nella foto non c'è cibo, restituisci items vuoto e spiegalo nelle note.`;

async function callClaude(content) {
  const model = db.settings.model || 'claude-opus-5';
  const body = {
    model,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
    output_config: { format: { type: 'json_schema', schema: FOOD_SCHEMA } },
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

async function runAnalysis({ text, imageB64, preview }) {
  openSheet(`<h3>Analizzo…</h3>${preview ? `<img class="preview" src="${preview}" alt="">` : ''}
    <div class="spinner"></div><p class="center muted small">Riconoscimento alimenti e calcolo di calorie e macro</p>`);
  const content = [];
  if (imageB64) content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageB64 } });
  content.push({
    type: 'text',
    text: imageB64
      ? (text ? `Foto del mio pasto. Dettagli: ${text}` : 'Foto del mio pasto.')
      : `Ho mangiato: ${text}`,
  });
  try {
    const out = await callClaude(content);
    const items = (out.items || []).map(it => {
      const grams = it.grams > 0 ? it.grams : 100;
      const k = 100 / grams;
      return {
        name: it.name, portion: it.portion, confidence: it.confidence, grams,
        per100: { kcal: it.kcal * k, p: it.protein_g * k, c: it.carbs_g * k, f: it.fat_g * k, fib: (it.fiber_g || 0) * k },
      };
    });
    reviewResult(items, out.notes, preview);
  } catch (err) {
    openSheet(`<h3>Qualcosa non va</h3><p>${esc(err.message)}</p>
      <div class="btn-row"><button class="btn secondary" id="rClose">Chiudi</button><button class="btn" id="rRetry">Riprova</button></div>`, s => {
      $('#rClose', s).addEventListener('click', closeSheet);
      $('#rRetry', s).addEventListener('click', () => runAnalysis({ text, imageB64, preview }));
    });
  }
}

function reviewResult(items, notes, preview) {
  let meal = addMeal;
  const draw = s => {
    const box = $('#rItems', s);
    box.innerHTML = items.length ? items.map((it, i) => {
      const n = nutrients(it);
      return `<div class="res-item">
        <div class="line1"><input type="text" data-name="${i}" value="${esc(it.name)}">
          ${it.confidence ? `<span class="conf ${it.confidence === 'bassa' ? 'low' : ''}">${esc(it.confidence)}</span>` : ''}
          <button class="x-btn" data-rm="${i}" aria-label="Rimuovi">×</button></div>
        <div class="grams"><button class="step" data-dec="${i}">−</button>
          <input type="number" inputmode="decimal" data-g="${i}" value="${r0(it.grams)}"><span class="muted small">g ${it.portion ? '· ' + esc(it.portion) : ''}</span>
          <button class="step" data-inc="${i}" style="margin-left:auto">+</button></div>
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
    <div class="btn-row"><button class="btn secondary" id="rCancel">Annulla</button><button class="btn" id="rSave">Aggiungi al diario</button></div>`, s => {
    draw(s);
    $$('[data-m]', s).forEach(c => c.addEventListener('click', () => { meal = c.dataset.m; $$('[data-m]', s).forEach(x => x.classList.toggle('on', x === c)); }));
    $('#rCancel', s).addEventListener('click', closeSheet);
    $('#rSave', s).addEventListener('click', () => {
      const valid = items.filter(i => i.grams > 0 && i.name.trim());
      if (!valid.length) { toast('Nessun alimento da aggiungere'); return; }
      addEntries(valid.map(i => ({ name: i.name.trim(), grams: i.grams, per100: i.per100 })), meal);
      addMeal = meal;
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
      const over = d.v > goal * 1.1;
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
  const g = db.goals.kcal;
  const inTarget = totals.filter(t => t.kcal >= g * 0.9 && t.kcal <= g * 1.1).length;
  const bodyIn = db.body.filter(b => b.date >= fromDate && b.date <= toDate).sort((a, b) => a.date.localeCompare(b.date));
  const delta = k => {
    const l = bodyIn.filter(b => b[k] != null);
    return l.length >= 2 ? l[l.length - 1][k] - l[0][k] : null;
  };
  return { days, logged: logged.length, kcal: avg('kcal'), p: avg('p'), c: avg('c'), f: avg('f'), fib: avg('fib'), inTarget, dW: delta('weight'), dBF: delta('bodyFat') };
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

  let html = `<div class="seg">${[[7, '7 giorni'], [30, '30 giorni'], [90, '3 mesi'], [365, '1 anno']].map(([n, l]) => `<button data-r="${n}" class="${n === progressRange ? 'on' : ''}">${l}</button>`).join('')}</div>`;

  html += `<div class="card"><h2>Riepilogo</h2><div class="stats">
    <div class="stat"><div class="v">${r0(s.kcal)}</div><div class="k">kcal medie / giorno (obiettivo ${r0(g.kcal)})</div></div>
    <div class="stat"><div class="v">${s.inTarget}<span class="muted" style="font-size:15px">/${s.logged}</span></div><div class="k">giorni in target (±10%)</div></div>
    <div class="stat"><div class="v">${signed(s.dW, 'kg')}</div><div class="k">variazione peso</div></div>
    <div class="stat"><div class="v">${signed(s.dBF, '%')}</div><div class="k">variazione massa grassa</div></div>
    <div class="stat"><div class="v">${r0(s.p)} g</div><div class="k">proteine medie (obiettivo ${r0(g.protein)})</div></div>
    <div class="stat"><div class="v">${s.logged}<span class="muted" style="font-size:15px">/${s.days.length}</span></div><div class="k">giorni registrati</div></div>
  </div></div>`;

  if (progressRange <= 90) {
    html += `<div class="card"><h2>Calorie giornaliere</h2>${barChart(s.days.map(d => ({ date: d, v: dayTotals(d).kcal })), g.kcal)}</div>`;
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
  v.innerHTML = html;
  $$('[data-r]', v).forEach(b => b.addEventListener('click', () => { progressRange = +b.dataset.r; render(); }));
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

  let html = `<button class="btn" id="newBody" style="margin-bottom:12px">+ Nuova misurazione</button>`;
  html += `<div class="card"><h2>Situazione attuale</h2><div class="stats">
    <div class="stat"><div class="v">${w ? fmtNum(w.weight) : '–'}</div><div class="k">Peso kg${g.weightTarget != null ? ` · obiettivo ${fmtNum(g.weightTarget)}` : ''}</div></div>
    <div class="stat"><div class="v">${bf ? fmtNum(bf.bodyFat) : '–'}</div><div class="k">Massa grassa %${g.bodyFatTarget != null ? ` · obiettivo ${fmtNum(g.bodyFatTarget)}` : ''}</div></div>
    <div class="stat"><div class="v">${lean ? fmtNum(lean) : '–'}</div><div class="k">Massa magra kg</div></div>
    <div class="stat"><div class="v">${bmi ? fmtNum(bmi) : '–'}</div><div class="k">BMI</div></div>
    ${lastWH ? `<div class="stat"><div class="v">${fmtNum(lastWH.waist / lastWH.hips, 2)}</div><div class="k">Rapporto vita/fianchi</div></div>` : ''}
    ${lastWH && p.height ? `<div class="stat"><div class="v">${fmtNum(lastWH.waist / p.height, 2)}</div><div class="k">Vita/altezza (ideale &lt; 0,5)</div></div>` : ''}
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
    html += `<p class="muted center small">Registra peso, massa grassa e circonferenze per seguire i tuoi progressi nel tempo.</p>`;
  }
  v.innerHTML = html;
  $('#newBody', v).addEventListener('click', () => bodyForm(null, today()));
  $$('[data-bm]', v).forEach(c => c.addEventListener('click', () => { bodyMetric = c.dataset.bm; render(); }));
  $$('[data-b]', v).forEach(li => li.addEventListener('click', () => bodyForm(li.dataset.b)));
  $('#allBody', v)?.addEventListener('click', () => { showAllBody = true; render(); });
}

function bodyForm(date, newDate) {
  const existing = date ? db.body.find(b => b.date === date) : db.body.find(b => b.date === newDate);
  const rec = existing || { date: newDate || today() };
  const last = latestBody('weight');
  openSheet(`<h3>${existing ? 'Modifica misurazione' : 'Nuova misurazione'}</h3>
    <label class="field"><span>Data</span><input type="date" id="bDate" value="${rec.date}" max="${today()}"></label>
    <div class="grid2">${BODY_FIELDS.map(f => `<label class="field"><span>${f.label}${f.unit ? ' (' + f.unit + ')' : ''}</span>
      <input type="number" inputmode="decimal" step="${f.step}" data-f="${f.k}" value="${rec[f.k] ?? ''}" placeholder="${f.k === 'weight' && last ? fmtNum(last.weight) : ''}"></label>`).join('')}</div>
    <label class="field"><span>Note</span><input type="text" id="bNote" value="${esc(rec.note || '')}" placeholder="es. dopo allenamento, bilancia impedenziometrica"></label>
    <div class="btn-row">${existing ? '<button class="btn danger" id="bDel">Elimina</button>' : ''}<button class="btn" id="bSave">Salva</button></div>`, s => {
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
      save(); closeSheet(); render(); toast('Misurazione salvata');
    });
    const del = $('#bDel', s);
    del && del.addEventListener('click', () => {
      db.body = db.body.filter(b => b.date !== existing.date); save(); closeSheet(); render(); toast('Eliminata');
    });
  });
}

// ---------- Goals & settings ----------
const ACTIVITY = [
  [1.2, 'Sedentario (poco o nessun esercizio)'],
  [1.375, 'Leggero (1–3 allenamenti/sett.)'],
  [1.55, 'Moderato (3–5 allenamenti/sett.)'],
  [1.725, 'Intenso (6–7 allenamenti/sett.)'],
  [1.9, 'Molto intenso (lavoro fisico + sport)'],
];
const GOAL_TYPES = [
  ['lose', 'Dimagrire (circa −0,5 kg/sett.)'],
  ['lose_slow', 'Dimagrire piano (circa −0,25 kg/sett.)'],
  ['maintain', 'Mantenere il peso'],
  ['gain', 'Aumentare massa (circa +0,25 kg/sett.)'],
];

function suggestGoals(p, weight) {
  // Mifflin-St Jeor
  const bmr = 10 * weight + 6.25 * p.height - 5 * p.age + (p.sex === 'm' ? 5 : -161);
  const tdee = bmr * p.activity;
  const delta = { lose: -500, lose_slow: -250, maintain: 0, gain: 250 }[p.goalType];
  const minKcal = p.sex === 'm' ? 1500 : 1200;
  const kcal = Math.max(minKcal, Math.round((tdee + delta) / 10) * 10);
  const protein = Math.round(weight * (p.goalType.startsWith('lose') ? 2.0 : 1.6));
  const fat = Math.round(Math.max(weight * 0.9, (kcal * 0.25) / 9));
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { bmr: r0(bmr), tdee: r0(tdee), kcal, protein, fat, carbs, fiber: Math.round((kcal / 1000) * 14), water: Math.round((weight * 35) / 250) * 250 };
}

function renderGoals(v) {
  const g = db.goals, p = db.profile, st = db.settings;
  const w = latestBody('weight');
  const field = (id, label, val, extra = '') => `<label class="field"><span>${label}</span><input type="number" inputmode="decimal" id="${id}" value="${val ?? ''}" ${extra}></label>`;
  v.innerHTML = `
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
    <button class="btn secondary" id="openCalc">🧮 Calcolali per me</button>
  </div>
  <div class="card">
    <h2>Obiettivi a lungo termine</h2>
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
  <div class="card">
    <h2>Profilo</h2>
    <div class="grid2">
      <label class="field"><span>Sesso</span><select id="pSex"><option value="m" ${p.sex === 'm' ? 'selected' : ''}>Uomo</option><option value="f" ${p.sex === 'f' ? 'selected' : ''}>Donna</option></select></label>
      ${field('pAge', 'Età', p.age)}
      ${field('pH', 'Altezza (cm)', p.height)}
      <label class="field"><span>Peso attuale</span><input type="text" value="${w ? fmtNum(w.weight) + ' kg' : 'da registrare in Corpo'}" disabled></label>
    </div>
    <label class="field"><span>Attività</span><select id="pAct">${ACTIVITY.map(([k, l]) => `<option value="${k}" ${+p.activity === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="field"><span>Obiettivo</span><select id="pGoal">${GOAL_TYPES.map(([k, l]) => `<option value="${k}" ${p.goalType === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <button class="btn secondary" id="saveProfile">Salva profilo</button>
  </div>
  <div class="card" id="settingsCard">
    <h2>Impostazioni</h2>
    <label class="field"><span>Chiave API di Claude</span><input type="password" id="sKey" value="${esc(st.apiKey)}" placeholder="sk-ant-..." autocomplete="off"></label>
    <p class="small muted" style="margin-top:-4px">Creala su <b>console.anthropic.com</b> → API Keys. Resta salvata solo su questo telefono e viene inviata solo ad Anthropic.</p>
    <label class="field"><span>Modello</span><select id="sModel">${MODELS.map(m => `<option value="${m.id}" ${st.model === m.id ? 'selected' : ''}>${m.label}</option>`).join('')}</select></label>
    <div class="btn-row"><button class="btn secondary" id="testKey">Prova</button><button class="btn" id="saveSettings">Salva</button></div>
  </div>
  <div class="card">
    <h2>Dati</h2>
    <p class="small muted" style="margin-top:0">I dati restano sul telefono. Esporta un backup ogni tanto: servirà anche per passare a un altro dispositivo.</p>
    <div class="btn-row"><button class="btn secondary" id="exportData">Esporta backup</button><button class="btn secondary" id="importData">Importa</button></div>
    <button class="btn danger" id="wipe" style="margin-top:6px">Cancella tutti i dati</button>
  </div>`;

  const checkMacros = () => {
    const k = num($('#gKcal', v).value) || 0;
    const m = (num($('#gProt', v).value) || 0) * 4 + (num($('#gCarb', v).value) || 0) * 4 + (num($('#gFat', v).value) || 0) * 9;
    const diff = r0(m - k);
    $('#macroCheck', v).textContent = `I macro valgono ${r0(m)} kcal${Math.abs(diff) > 50 ? ` (${diff > 0 ? '+' : ''}${diff} rispetto all'obiettivo calorie)` : ' ✓'}`;
  };
  ['#gKcal', '#gProt', '#gCarb', '#gFat'].forEach(id => $(id, v).addEventListener('input', checkMacros));
  checkMacros();

  const readProfile = () => ({
    sex: $('#pSex', v).value, age: num($('#pAge', v).value) || p.age, height: num($('#pH', v).value) || p.height,
    activity: +$('#pAct', v).value, goalType: $('#pGoal', v).value,
  });
  $('#saveProfile', v).addEventListener('click', () => { db.profile = readProfile(); save(); toast('Profilo salvato'); });
  $('#saveGoals', v).addEventListener('click', () => {
    const val = id => num($(id, v).value);
    Object.assign(db.goals, {
      kcal: val('#gKcal') || g.kcal, protein: val('#gProt') ?? g.protein, carbs: val('#gCarb') ?? g.carbs, fat: val('#gFat') ?? g.fat,
      fiber: val('#gFib') ?? g.fiber, water: val('#gWater') ?? g.water,
      weightTarget: val('#gWT'), weightTargetDate: $('#gWTD', v).value, bodyFatTarget: val('#gBF'),
      monthWeight: val('#gMW'), monthDaysInTarget: val('#gMD') ?? 0,
    });
    save(); toast('Obiettivi salvati');
  });
  $('#openCalc', v).addEventListener('click', () => {
    const prof = readProfile();
    const weight = w?.weight;
    if (!weight) { toast('Registra prima il tuo peso nella scheda Corpo'); return; }
    db.profile = prof; save();
    const sg = suggestGoals(prof, weight);
    openSheet(`<h3>Obiettivi consigliati</h3>
      <p class="small muted">Metabolismo basale ${sg.bmr} kcal · fabbisogno giornaliero stimato ${sg.tdee} kcal (formula Mifflin-St Jeor).</p>
      <div class="stats">
        <div class="stat"><div class="v">${sg.kcal}</div><div class="k">kcal</div></div>
        <div class="stat"><div class="v">${sg.protein} g</div><div class="k">proteine</div></div>
        <div class="stat"><div class="v">${sg.carbs} g</div><div class="k">carboidrati</div></div>
        <div class="stat"><div class="v">${sg.fat} g</div><div class="k">grassi</div></div>
        <div class="stat"><div class="v">${sg.fiber} g</div><div class="k">fibre</div></div>
        <div class="stat"><div class="v">${fmtNum(sg.water / 1000, 2)} L</div><div class="k">acqua</div></div>
      </div>
      <p class="small muted">Sono stime di partenza: dopo 2–3 settimane guarda l'andamento del peso e correggi di 100–200 kcal. Per esigenze mediche chiedi a un professionista.</p>
      <div class="btn-row"><button class="btn secondary" id="cNo">Annulla</button><button class="btn" id="cYes">Usa questi valori</button></div>`, s => {
      $('#cNo', s).addEventListener('click', closeSheet);
      $('#cYes', s).addEventListener('click', () => {
        Object.assign(db.goals, { kcal: sg.kcal, protein: sg.protein, carbs: sg.carbs, fat: sg.fat, fiber: sg.fiber, water: sg.water });
        save(); closeSheet(); render(); toast('Obiettivi aggiornati');
      });
    });
  });
  const saveSettings = () => { db.settings.apiKey = $('#sKey', v).value.trim(); db.settings.model = $('#sModel', v).value; save(); };
  $('#saveSettings', v).addEventListener('click', () => { saveSettings(); toast('Impostazioni salvate'); });
  $('#testKey', v).addEventListener('click', async e => {
    saveSettings();
    if (!db.settings.apiKey) { toast('Inserisci la chiave'); return; }
    const b = e.currentTarget; b.disabled = true; b.textContent = 'Provo…';
    try {
      const out = await callClaude([{ type: 'text', text: 'Ho mangiato: una mela' }]);
      toast(`Funziona! Mela ≈ ${r0(out.items[0]?.kcal)} kcal`);
    } catch (err) { toast(err.message); }
    b.disabled = false; b.textContent = 'Prova';
  });
  $('#exportData', v).addEventListener('click', () => {
    const copy = { ...db, settings: { ...db.settings, apiKey: '' } };
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
    const key = db.settings.apiKey;
    localStorage.setItem(KEY, JSON.stringify(d));
    db = load();
    if (!db.settings.apiKey) db.settings.apiKey = key;
    save(); render(); toast('Backup importato');
  } catch { toast('File di backup non valido'); }
});

// ---------- Boot ----------
let lastSeenDay = today();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  // Se l'app resta aperta oltre la mezzanotte, passa al nuovo giorno.
  if (lastSeenDay !== today()) {
    if (curDate === lastSeenDay) curDate = today();
    lastSeenDay = today();
    render();
  }
});
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/dieta/sw.js', { scope: '/dieta' }).catch(() => {});
})();
