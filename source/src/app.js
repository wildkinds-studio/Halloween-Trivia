'use strict';

// ===================== Utilities =====================
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const uid = (p = '') => p + Math.random().toString(36).slice(2, 9) + (Date.now() % 1e7).toString(36);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clone = (o) => JSON.parse(JSON.stringify(o));
const reduceMotion = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
const plural = (n, one, many) => `${n} ${n === 1 ? one : (many || one + 's')}`;
const DIFF = {
  1: { key: 'easy', label: 'Easy', pts: 1 },
  2: { key: 'medium', label: 'Medium', pts: 2 },
  3: { key: 'hard', label: 'Hard', pts: 3 },
};
const ptsOf = (q) => (DIFF[q && q.diff] || DIFF[1]).pts;

function hashStr(s) {
  let h = 2166136261;
  for (const ch of String(s || '')) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function colorFor(id) { return `hsl(${hashStr(id) % 360} 52% 40%)`; }
function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  const first = Array.from(parts[0])[0] || '';
  const last = parts.length > 1 ? (Array.from(parts[parts.length - 1])[0] || '') : '';
  return (first + last).toUpperCase();
}
function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
function shortDate(ts) {
  try { return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ''; }
}
function todayLabel() {
  try { return new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }); } catch { return ''; }
}
function dataURLtoBlob(dataURL) {
  const [head, body] = dataURL.split(',');
  const mime = (head.match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
  if (/;base64/.test(head)) {
    const bin = atob(body);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }
  return new Blob([decodeURIComponent(body)], { type: mime });
}
function blobToDataURL(blob) {
  return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => rej(fr.error); fr.readAsDataURL(blob); });
}

// ===================== Icons =====================
const ICONS = {
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3.5"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  left: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  right: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  up: '<path d="m18 15-6-6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  play: '<path d="M7 4v16l13-8Z"/>',
  soundOn: '<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  soundOff: '<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="m22 9-6 6M16 9l6 6"/>',
  expand: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  paste: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
  sort: '<path d="M4 20h4v-5H4zM10 20h4v-9h-4zM16 20h4V6h-4z"/>',
  home: '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2Z"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  upload: '<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  flag: '<path d="M4 22V4M4 4h13l-2 4 2 4H4"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  plusminus: '<path d="M12 3v8M8 7h8M8 19h8"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sparkle: '<path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2Z"/>',
};
const ic = (name) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

// ===================== Local storage (IndexedDB, falling back to localStorage, then memory) =====================
const lsGet = (k) => { try { const v = localStorage.getItem(k); return v == null ? undefined : JSON.parse(v); } catch { return undefined; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
const lsDel = (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } };
const lsWorks = () => { try { localStorage.setItem('td:probe', '1'); localStorage.removeItem('td:probe'); return true; } catch { return false; } };

const Local = (() => {
  let dbp = null;
  let mode = 'idb'; // 'idb' | 'ls' | 'mem'
  let degraded = false; // IndexedDB exists but couldn't be used this session
  let why = ''; // 'open' (couldn't open in time), 'write' (writes failing), 'forced' (host chose to continue)
  const mem = new Map();
  const api = { onRecovered: null };
  function fallback(reason = 'open') {
    degraded = typeof indexedDB !== 'undefined';
    why = reason;
    mode = lsWorks() ? 'ls' : 'mem';
  }
  function open(timeoutMs = 8000) {
    if (dbp) return dbp;
    if (typeof indexedDB === 'undefined') { fallback(); degraded = false; return Promise.resolve(null); }
    const p = new Promise((res) => {
      let settled = false;
      const finish = (v) => { if (!settled) { settled = true; res(v); } };
      try {
        const req = indexedDB.open('trivia-day', 1);
        req.onupgradeneeded = () => { try { req.result.createObjectStore('kv'); } catch { /* exists */ } };
        req.onsuccess = () => {
          const db = req.result;
          db.onclose = () => { if (dbp === p) dbp = null; }; // Safari can drop the connection; reopen on next use
          db.onversionchange = () => { try { db.close(); } catch { /* ignore */ } if (dbp === p) dbp = null; };
          if (settled) {
            // Opened after we had given up on it: switch back and let the app merge what it saved meanwhile.
            mode = 'idb'; degraded = false; why = ''; dbp = Promise.resolve(db);
            if (api.onRecovered) api.onRecovered();
            return;
          }
          finish(db);
        };
        req.onerror = () => finish(null);
        setTimeout(() => finish(null), timeoutMs);
      } catch { finish(null); }
    }).then((db) => {
      if (db) { mode = 'idb'; degraded = false; why = ''; return db; }
      fallback();
      return null;
    });
    dbp = p;
    return p;
  }
  function idbReq(db, kind, fn) {
    return new Promise((res, rej) => {
      try {
        const tx = db.transaction('kv', kind);
        const r = fn(tx.objectStore('kv'));
        tx.oncomplete = () => res(r && r.result);
        tx.onerror = () => rej(tx.error || (r && r.error) || new Error('idb error'));
        tx.onabort = () => rej(tx.error || new Error('aborted'));
      } catch (e) { rej(e); }
    });
  }
  // Run against IndexedDB, reconnecting once if the connection was lost.
  async function withDb(kind, fn) {
    let db = await open();
    if (!db) return { skipped: true };
    try { return { value: await idbReq(db, kind, fn) }; } catch (e) {
      console.warn('idb op failed, reconnecting', e);
      dbp = null;
      db = await open(3000);
      if (!db) return { skipped: true };
      return { value: await idbReq(db, kind, fn) }; // a second failure propagates
    }
  }
  Object.defineProperties(api, {
    mode: { get: () => mode, enumerable: true },
    degraded: { get: () => degraded, enumerable: true },
    why: { get: () => why, enumerable: true },
  });
  Object.assign(api, {
    open,
    reset() { dbp = null; },
    // Send all reads and writes to localStorage for this session (used when IndexedDB can't be read).
    forceFallback() { fallback('forced'); dbp = Promise.resolve(null); },
    // Reads from IndexedDB throw on failure so a broken read is never mistaken for "nothing saved".
    async get(key) {
      if (mode === 'idb') { const r = await withDb('readonly', (s) => s.get(key)); if (!r.skipped) return r.value; }
      if (mode === 'ls') return lsGet('td:' + key);
      return mem.get(key);
    },
    // Resolves 'idb' or 'ls' (where it was saved), or false when it only reached memory.
    async set(key, val) {
      if (mode === 'idb') {
        try { const r = await withDb('readwrite', (s) => s.put(val, key)); if (!r.skipped) return 'idb'; }
        catch (e) {
          // A full disk on one photo shouldn't move every save to the fallback.
          if (e && e.name === 'QuotaExceededError' && String(key).startsWith('photo:')) return false;
          console.warn('idb write failed, using localStorage', e); fallback('write');
        }
      }
      if (mode === 'ls' && lsSet('td:' + key, val)) return 'ls';
      mem.set(key, val);
      return false;
    },
    async del(key) {
      if (mode === 'idb') { try { await withDb('readwrite', (s) => s.delete(key)); } catch { /* ignore */ } }
      lsDel('td:' + key);
      mem.delete(key);
    },
    async keys(prefix) {
      let out = [];
      if (mode === 'idb') { const r = await withDb('readonly', (s) => s.getAllKeys()); if (!r.skipped) out = r.value || []; }
      if (mode === 'ls') { try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('td:')) out.push(k.slice(3)); } } catch { /* ignore */ } }
      if (mode === 'mem') out = Array.from(mem.keys());
      return out.map(String).filter((k) => k.startsWith(prefix));
    },
  });
  return api;
})();

// ===================== State =====================
const STATE_V = 1;
const TAB_ID = Math.random().toString(36).slice(2, 10);
// Every id the app makes is [a-z0-9]; anything else came from a damaged or crafted file and is dropped.
const okId = (s) => typeof s === 'string' && /^[a-z0-9_-]{1,40}$/i.test(s);
const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);

function freshState() {
  return { v: STATE_V, title: 'Trivia Day', settings: { sound: true }, metaAt: 0, players: {}, games: {}, deletedGames: {}, updatedAt: 0 };
}
function migrate(s) {
  const src = isObj(s) ? s : {};
  const out = freshState();
  out.title = typeof src.title === 'string' ? src.title : out.title;
  out.settings = Object.assign({ sound: true }, isObj(src.settings) ? src.settings : {});
  out.metaAt = Number(src.metaAt) || 0;
  out.updatedAt = Number(src.updatedAt) || 0;
  for (const [id, p] of Object.entries(isObj(src.players) ? src.players : {})) {
    if (!okId(id) || !isObj(p)) continue;
    out.players[id] = Object.assign({}, p, { id, name: String(p.name == null ? '' : p.name) });
    if (p.photoAsset != null && !okId(p.photoAsset)) out.players[id].photoAsset = null;
  }
  for (const [id, g] of Object.entries(isObj(src.games) ? src.games : {})) {
    if (!okId(id) || !isObj(g)) continue;
    out.games[id] = normalizeGame(Object.assign({}, g, { id }));
  }
  for (const [id, at] of Object.entries(isObj(src.deletedGames) ? src.deletedGames : {})) if (okId(id)) out.deletedGames[id] = Number(at) || 0;
  return out;
}
function normalizeGame(g) {
  g.name = String(g.name == null ? '' : g.name);
  g.playerIds = (Array.isArray(g.playerIds) ? g.playerIds : []).filter(okId);
  g.rounds = (Array.isArray(g.rounds) ? g.rounds : []).filter((r) => isObj(r) && okId(r.id) && okId(r.masterId));
  for (const r of g.rounds) {
    r.category = String(r.category == null ? '' : r.category);
    r.emoji = String(r.emoji == null ? '' : r.emoji);
    r.themeId = THEME_BY_ID[r.themeId] ? r.themeId : DEFAULT_THEME;
    r.questions = (Array.isArray(r.questions) ? r.questions : []).filter((q) => isObj(q) && okId(q.id));
    for (const q of r.questions) {
      q.text = String(q.text == null ? '' : q.text); q.answer = String(q.answer == null ? '' : q.answer); q.diff = [1, 2, 3].includes(q.diff) ? q.diff : 1;
      q.wrong = Array.isArray(q.wrong) ? q.wrong.slice(0, 5).map((w) => String(w == null ? '' : w)) : ['', '', ''];
      if (!q.wrong.length) q.wrong = [''];
      if (!Number.isInteger(q.seed)) q.seed = hashStr(q.id + ':seed') & 0x7fffffff;
    }
  }
  const idMap = (o, val) => Object.fromEntries(Object.entries(isObj(o) ? o : {}).filter(([k, v]) => okId(k) && val(v)));
  g.marks = idMap(g.marks, Array.isArray);
  for (const k of Object.keys(g.marks)) g.marks[k] = g.marks[k].filter(okId);
  g.revealed = idMap(g.revealed, () => true);
  g.markAt = idMap(g.markAt, Number.isFinite);
  // Each tick (question + player) has its own stamp so two devices marking the same answer both count.
  g.tickAt = idMap(g.tickAt, isObj);
  for (const k of Object.keys(g.tickAt)) g.tickAt[k] = idMap(g.tickAt[k], Number.isFinite);
  g.delQ = idMap(g.delQ, Number.isFinite);
  g.done = idMap(g.done, () => true);
  g.adjustLog = (Array.isArray(g.adjustLog) ? g.adjustLog : []).filter((a) => isObj(a) && okId(a.pid) && (a.r == null || okId(a.r)) && Number.isFinite(a.d));
  if (isObj(g.adjust)) {
    for (const [pid, v] of Object.entries(g.adjust)) if (okId(pid) && Number(v)) g.adjustLog.push({ pid, d: Number(v), r: null });
  }
  delete g.adjust;
  if (!isObj(g.pos) || !['intro', 'q', 'aintro', 'a', 'board', 'final'].includes(g.pos.stage)) g.pos = { roundId: null, stage: 'intro', q: 0 };
  if (g.pos.roundId != null && !okId(g.pos.roundId)) g.pos.roundId = null;
  g.pos.q = Number.isInteger(g.pos.q) ? g.pos.q : 0;
  g.posAt = Number(g.posAt) || 0;
  const okPos = (p) => isObj(p) && ['intro', 'q', 'aintro', 'a', 'board', 'final'].includes(p.stage) && (p.roundId == null || okId(p.roundId)) && Number.isInteger(p.q == null ? 0 : p.q);
  if (g.resume && !(isObj(g.resume) && okPos(g.resume.pos) && ['playing', 'finished'].includes(g.resume.status))) delete g.resume;
  if (g.endedFrom && !okPos(g.endedFrom)) delete g.endedFrom;
  if (g.endedFrom && g.endedFrom.resume && !(isObj(g.endedFrom.resume) && okPos(g.endedFrom.resume.pos))) g.endedFrom.resume = null;
  g.status = ['setup', 'playing', 'finished'].includes(g.status) ? g.status : 'setup';
  g.updatedAt = Number(g.updatedAt) || 0;
  return g;
}

// JSON with sorted keys, for comparing two copies of a record regardless of key order.
function stableStr(v) {
  if (Array.isArray(v)) return '[' + v.map(stableStr).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => JSON.stringify(k) + ':' + stableStr(v[k])).join(',') + '}';
  return JSON.stringify(v);
}
// Combine two copies of one game: questions, rounds and marks merge by id using their own stamps,
// positions and status come from whichever copy was touched last. Nothing either side added is lost.
function mergeGame(a, b) {
  const [newer, older] = (b.updatedAt || 0) > (a.updatedAt || 0) ? [b, a] : [a, b];
  const g = clone(newer);
  if ((older.posAt || 0) > (newer.posAt || 0)) {
    for (const k of ['pos', 'status', 'resume', 'endedFrom', 'finishedAt', 'startedAt']) { if (older[k] === undefined) delete g[k]; else g[k] = clone(older[k]); }
    g.posAt = older.posAt;
  }
  for (const id of older.playerIds || []) if (!g.playerIds.includes(id)) g.playerIds.push(id);
  g.delQ = Object.assign({}, older.delQ || {}, newer.delQ || {});
  for (const [k, v] of Object.entries(older.delQ || {})) g.delQ[k] = Math.max(g.delQ[k] || 0, v);
  const oRounds = Object.fromEntries((older.rounds || []).map((r) => [r.id, r]));
  const seen = new Set();
  g.rounds = g.rounds.map((r) => {
    seen.add(r.id);
    const o = oRounds[r.id]; if (!o) return r;
    const m = (o.at || 0) > (r.at || 0) ? Object.assign({}, r, { category: o.category, themeId: o.themeId, themeAuto: o.themeAuto, emoji: o.emoji, skip: o.skip, at: o.at }) : r;
    const oq = Object.fromEntries(o.questions.map((q) => [q.id, q]));
    const qs = new Set();
    m.questions = r.questions.map((q) => { qs.add(q.id); const x = oq[q.id]; return x && (x.at || 0) > (q.at || 0) ? clone(x) : q; });
    o.questions.forEach((q, i) => { if (!qs.has(q.id)) { m.questions.splice(Math.min(i, m.questions.length), 0, clone(q)); qs.add(q.id); } });
    return m;
  });
  for (const r of older.rounds || []) if (!seen.has(r.id)) g.rounds.push(clone(r));
  for (const r of g.rounds) r.questions = r.questions.filter((q) => !(g.delQ[q.id] && g.delQ[q.id] >= (q.at || 0)));
  g.marks = {}; g.markAt = {}; g.tickAt = {};
  const nm = newer.marks || {}; const om = older.marks || {}; const na = newer.markAt || {}; const oa = older.markAt || {};
  const nt = newer.tickAt || {}; const ot = older.tickAt || {};
  for (const qid of new Set([...Object.keys(nm), ...Object.keys(om), ...Object.keys(nt), ...Object.keys(ot)])) {
    const an = na[qid] || 0; const ao = oa[qid] || 0;
    const nOn = new Set(nm[qid] || []); const oOn = new Set(om[qid] || []);
    // A copy from before per-tick stamps vouches for its whole list as of the question's stamp.
    const stampN = (pid) => (isObj(nt[qid]) ? nt[qid][pid] || 0 : an);
    const stampO = (pid) => (isObj(ot[qid]) ? ot[qid][pid] || 0 : ao);
    const list = []; const ticks = {};
    for (const pid of new Set([...nOn, ...oOn, ...Object.keys(nt[qid] || {}), ...Object.keys(ot[qid] || {})])) {
      const sn = stampN(pid); const so = stampO(pid);
      const on = sn > so ? nOn.has(pid) : so > sn ? oOn.has(pid) : nOn.has(pid) || oOn.has(pid);
      if (sn || so) ticks[pid] = Math.max(sn, so);
      if (on) list.push(pid);
    }
    g.marks[qid] = list;
    if (Object.keys(ticks).length) g.tickAt[qid] = ticks;
    if (an || ao) g.markAt[qid] = Math.max(an, ao);
  }
  g.revealed = Object.assign({}, older.revealed || {}, newer.revealed || {});
  g.done = Object.assign({}, older.done || {}, newer.done || {});
  const adj = {};
  for (const e of [...(older.adjustLog || []), ...(newer.adjustLog || [])]) {
    const k = e.pid + '|' + (e.r || ''); if (!adj[k] || (e.at || 0) >= (adj[k].at || 0)) adj[k] = clone(e);
  }
  g.adjustLog = Object.values(adj);
  g.updatedAt = Math.max(a.updatedAt || 0, b.updatedAt || 0);
  return g;
}

// Meeko's photo list from a stored guide record (including the single photo from before he had several).
function guidePhotoList(g) {
  if (Array.isArray(g.photos)) return g.photos.filter((x) => isObj(x) && okId(x.id));
  return g.hasPhoto !== false && (typeof g.photoAsset === 'string' || g.photoAt) ? [{ id: GUIDE_ID, at: Number(g.photoAt) || 0, asset: typeof g.photoAsset === 'string' ? g.photoAsset : null, assetAt: Number(g.photoAssetAt) || 0 }] : [];
}
// Two copies of Meeko: each setting comes from whichever copy changed it last; photos are the union of both,
// minus any removed on either side after they were added (`removed` keeps when each was taken out).
function mergeGuide(a, b) {
  if (!isObj(a)) return isObj(b) ? clone(b) : a;
  if (!isObj(b)) return clone(a);
  const [newer, older] = (Number(b.at) || 0) > (Number(a.at) || 0) ? [b, a] : [a, b];
  const out = clone(newer);
  // Settings field by field (a copy without per-field stamps vouches for all of them at its own stamp).
  const st = (g, k) => (isObj(g.stamps) ? Number(g.stamps[k]) || 0 : Number(g.at) || 0);
  out.stamps = {};
  for (const k of GUIDE_FIELDS) {
    const from = st(older, k) > st(newer, k) ? older : newer;
    if (k in from) out[k] = clone(from[k]); else delete out[k];
    const t = Math.max(st(older, k), st(newer, k)); if (t) out.stamps[k] = t;
  }
  const removed = {};
  for (const r of [older.removed, newer.removed]) if (isObj(r)) for (const [id, at] of Object.entries(r)) if (okId(id) && Number.isFinite(at)) removed[id] = Math.max(removed[id] || 0, at);
  const byId = {};
  for (const ph of [...guidePhotoList(older), ...guidePhotoList(newer)]) {
    const cur = byId[ph.id];
    if (!cur || (ph.at || 0) > (cur.at || 0) || ((ph.at || 0) === (cur.at || 0) && (ph.assetAt || 0) > (cur.assetAt || 0))) byId[ph.id] = clone(ph);
  }
  out.photos = Object.values(byId).filter((ph) => !(removed[ph.id] >= (ph.at || 0))).sort((x, y) => (x.at || 0) - (y.at || 0) || (x.id < y.id ? -1 : 1));
  out.removed = removed;
  if (out.photos.length || Array.isArray(a.photos) || Array.isArray(b.photos)) { out.hasPhoto = out.photos.length > 0; out.photoAt = null; out.photoAsset = null; out.photoAssetAt = null; }
  return out;
}

// Merge another copy of the state into dst, record by record: the newer player, game, title or
// deletion wins. A stale tab, device or backup can therefore add and update, but never wipe.
function mergeInto(dst, src) {
  let changed = false;
  // Title and sound go by the meta stamp. Meeko is merged on his own (mergeGuide): his settings by their
  // stamp and his photos one by one, so a photo added on any device is never lost to another device's list.
  const gMine = dst.settings && dst.settings.guide; const gTheirs = src.settings && src.settings.guide;
  if ((src.metaAt || 0) > (dst.metaAt || 0)) {
    dst.title = src.title; dst.settings = Object.assign({}, dst.settings, src.settings); dst.metaAt = src.metaAt; changed = true;
  }
  const gMerged = mergeGuide(gMine, gTheirs);
  if (gMerged !== undefined) {
    if (stableStr(gMerged) !== stableStr(dst.settings.guide)) { dst.settings = Object.assign({}, dst.settings, { guide: gMerged }); changed = true; }
    // This side now holds something the other copy lacks: make its meta record newer so it gets sent on.
    if (stableStr(gMerged) !== stableStr(gTheirs)) dst.metaAt = bump(Math.max(dst.metaAt || 0, src.metaAt || 0));
  }
  for (const [id, p] of Object.entries(src.players || {})) {
    const cur = dst.players[id];
    if (!cur || (p.updatedAt || 0) > (cur.updatedAt || 0)) { dst.players[id] = clone(p); changed = true; }
  }
  for (const [id, at] of Object.entries(src.deletedGames || {})) {
    if ((dst.deletedGames[id] || 0) < at) { dst.deletedGames[id] = at; changed = true; }
  }
  for (const [id, g] of Object.entries(src.games || {})) {
    const cur = dst.games[id];
    if (!cur) { dst.games[id] = normalizeGame(clone(g)); changed = true; continue; }
    const before = stableStr(cur); const theirs = stableStr(normalizeGame(clone(g)));
    if (before === theirs) continue;
    const merged = normalizeGame(mergeGame(cur, g));
    const after = stableStr(merged);
    if (after === before) continue;
    // A blend of both sides is newer than either, so it gets saved and sent on.
    if (after !== theirs) merged.updatedAt = bump(Math.max(cur.updatedAt || 0, g.updatedAt || 0));
    dst.games[id] = merged; changed = true;
  }
  for (const [id, at] of Object.entries(dst.deletedGames)) {
    const g = dst.games[id];
    if (!g) continue;
    if ((g.updatedAt || 0) > at) delete dst.deletedGames[id]; else delete dst.games[id];
    changed = true;
  }
  dst.updatedAt = Math.max(dst.updatedAt || 0, src.updatedAt || 0);
  return changed;
}

let S = freshState();
const UI = {
  route: 'home', gameId: null, roundId: null, step: 'players', returnTo: null,
  boardAnimated: {}, finalShown: {}, booted: false, renderPending: false,
};
const overlays = []; // stack of {type, el, ...}

// Later than both the clock and the record's last stamp, so an edit always sorts after the copy it edits
// even when another device's clock runs fast.
const bump = (prev) => Math.max(Date.now(), (Number(prev) || 0) + 1);
const touchGame = (g) => { if (g) g.updatedAt = bump(g.updatedAt); };
const touchPlayer = (p) => { if (p) p.updatedAt = bump(p.updatedAt); };
// Where the game is (position, status) has its own stamp, so an edit elsewhere never moves the host.
const touchPos = (g) => { if (g) g.posAt = bump(g.posAt); };
const touchRound = (r) => { if (r) r.at = bump(r.at); };
const touchQ = (q) => { if (q) q.at = bump(q.at); };
const G = () => S.games[UI.gameId] || null;
const rosterList = () => Object.values(S.players).filter((p) => !p.deleted).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
const nameOf = (id) => (S.players[id] && S.players[id].name) || 'Unknown player';
const gameName = (g) => (g && String(g.name || '').trim()) || 'Untitled game';

function commit(fn, opts = {}) {
  if (fn) fn(S);
  S.updatedAt = Date.now();
  Saver.schedule(opts.immediate);
  if (opts.render !== false) render();
}
// Re-render for changes that arrived from elsewhere (another tab, the cloud) without yanking focus mid-typing.
function softRender() {
  if (!UI.booted) return;
  const a = document.activeElement;
  if (a && a.matches && a.matches('input, textarea') && (appRoot.contains(a) || (ovRoot && ovRoot.contains(a)))) { UI.renderPending = true; return; }
  UI.renderPending = false;
  render();
}

let chan = null;
try { chan = new BroadcastChannel('trivia-day'); } catch { chan = null; }

// IndexedDB writes are async and can be cut off by a reload; this synchronous copy covers that gap.
function mirrorNow() { if (!Saver.blocked) lsSet('td:mirror', S); }
const Saver = {
  t: null, pending: false, failed: false, blocked: false, flushing: false, again: false, lastSeen: 0,
  schedule(immediate) {
    if (this.blocked) return;
    this.pending = true;
    clearTimeout(this.t);
    if (immediate) this.flush(); else this.t = setTimeout(() => this.flush(), 200);
    Cloud.schedule();
  },
  async flush() {
    clearTimeout(this.t);
    if (!this.pending || this.blocked) return;
    if (this.flushing) { this.again = true; return; }
    this.flushing = true;
    this.pending = false;
    try {
      // Another tab may have saved since we last looked: fold its changes in rather than overwrite them.
      let stored = null;
      try { stored = await Local.get('state'); } catch { stored = null; }
      if (stored && stored.v && stored.writer !== TAB_ID) {
        if (mergeInto(S, migrate(stored))) softRender();
      }
      const snap = Object.assign(clone(S), { writer: TAB_ID });
      const where = await Local.set('state', snap);
      const ok = !!where;
      if (ok) {
        this.lastSeen = Math.max(this.lastSeen, snap.updatedAt || 0);
        if (where === 'idb') { lsDel('td:mirror'); lsDel('td:state'); }
        if (chan) { try { chan.postMessage({ type: 'saved', tab: TAB_ID }); } catch { /* ignore */ } }
      }
      const bad = !ok || where !== 'idb';
      if (bad && !this.failed) { this.failed = true; toast(ok ? 'Saving to a backup spot on this device. Reload when you can.' : 'This browser is not saving. Keep this tab open.', 'bad'); updateSyncNote(); }
      if (!bad && this.failed) { this.failed = false; updateSyncNote(); }
    } finally {
      this.flushing = false;
      if (this.again) { this.again = false; this.pending = true; this.flush(); }
    }
  },
};

// ===================== Photos =====================
const Photos = {
  map: {}, // playerId -> {data, at}
  async loadAll() {
    const keys = await Local.keys('photo:');
    await Promise.all(keys.map(async (k) => {
      const id = k.slice(6);
      if (!okId(id)) return;
      const v = await Local.get(k);
      if (v && typeof v.data === 'string' && v.data.startsWith('data:image/')) this.map[id] = v;
    }));
    if (Local.mode !== 'idb') return;
    const stray = [];
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('td:photo:')) stray.push(k); } } catch { /* ignore */ }
    for (const k of stray) {
      const id = k.slice(9); const v = lsGet(k);
      if (!okId(id) || !v || typeof v.data !== 'string' || !v.data.startsWith('data:image/')) { lsDel(k); continue; }
      const cur = this.map[id];
      if (!cur || (v.at || 0) > (cur.at || 0)) { if ((await Local.set('photo:' + id, v)) === 'idb') { this.map[id] = v; lsDel(k); } }
      else lsDel(k);
    }
  },
  async reload(id) {
    let v = null;
    try { v = await Local.get('photo:' + id); } catch { v = null; }
    if (v && v.data) this.map[id] = v; else delete this.map[id];
  },
  src(p) {
    if (!p) return null;
    if (p.demo) return demoAvatar(p);
    if (p.hasPhoto === false) return null;
    const e = this.map[p.id];
    if (e && (!p.photoAt || e.at >= p.photoAt)) return e.data;
    if (p.photoAsset) return '/_blob/' + p.photoAsset;
    return e ? e.data : null;
  },
  async set(id, data, at) {
    this.map[id] = { data, at };
    const ok = await Local.set('photo:' + id, { data, at });
    if (!ok) toast("This photo couldn't be saved on this device (storage may be full). It stays until you reload.", 'bad');
    if (chan) { try { chan.postMessage({ type: 'photo', tab: TAB_ID, id }); } catch { /* ignore */ } }
  },
  async remove(id) {
    delete this.map[id];
    await Local.del('photo:' + id);
    if (chan) { try { chan.postMessage({ type: 'photo', tab: TAB_ID, id }); } catch { /* ignore */ } }
  },
  async clearAll() { for (const id of Object.keys(this.map)) await this.remove(id); },
};
const hasPhoto = (p) => !!Photos.src(p);
const inAnyGame = (pid) => Object.values(S.games).some((g) => g.playerIds.includes(pid));

const demoCache = {};
function demoAvatar(p) {
  if (demoCache[p.id]) return demoCache[p.id];
  const h = hashStr(p.id) % 360;
  const skins = ['#f1c7a5', '#d9a27c', '#a8714f', '#7a4a2e', '#f6d5bf'];
  const skin = skins[hashStr(p.id + 's') % skins.length];
  const outfit = `hsl(${(h + 150) % 360} 72% 56%)`;
  const bg = `hsl(${h} 55% 28%)`;
  const hair = `hsl(${(h + 30) % 360} 35% 18%)`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect width="300" height="400" fill="${bg}"/><circle cx="250" cy="60" r="90" fill="rgba(255,255,255,.08)"/><path d="M36 400 C48 292 92 252 150 252 C208 252 252 292 264 400Z" fill="${outfit}"/><path d="M118 252 L150 306 L182 252Z" fill="rgba(255,255,255,.4)"/><rect x="132" y="208" width="36" height="52" rx="14" fill="${skin}"/><circle cx="150" cy="164" r="62" fill="${skin}"/><path d="M86 160 C86 108 120 94 150 94 C186 94 216 112 214 160 C200 128 172 122 150 122 C124 122 100 132 86 160Z" fill="${hair}"/><circle cx="128" cy="170" r="6" fill="#222"/><circle cx="172" cy="170" r="6" fill="#222"/><path d="M130 196 Q150 212 170 196" stroke="#222" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`;
  demoCache[p.id] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  return demoCache[p.id];
}

// Initials always sit underneath; if a photo fails to load it removes itself and they show through.
function avatar(p, cls = '') {
  const src = Photos.src(p);
  const bg = colorFor(p ? p.id : 'x');
  return `<span class="av ${cls}" style="background:${bg}"><span class="ini">${esc(initials(p && p.name) || '?')}</span>${src ? `<img src="${esc(src)}" alt="" draggable="false" onerror="this.remove()">` : ''}</span>`;
}
function portrait(p, cls = '') {
  const src = Photos.src(p);
  const bg = colorFor(p ? p.id : 'x');
  return `<span class="portrait ${cls}" style="background:${bg}"><span class="ini">${esc(initials(p && p.name) || '?')}</span>${src ? `<img src="${esc(src)}" alt="" draggable="false" onerror="this.remove()">` : ''}</span>`;
}

// ===================== Cloud backup (claude.ai artifact db + assets, or this site's own /api) =====================
// One document per player (players/<id>) and per game (games/<id>, a tombstone when deleted), plus
// trivia/meta for the event name and settings. A device only writes records it changed more recently
// than the copy it last saw in the cloud, so a stale device can't overwrite anyone else's work.
const CLOUD_BACKOFF = [10000, 30000, 120000, 300000];
// The home-screen app saves to the cloud at most this often (every tap is already saved on the device),
// which keeps a whole event inside the free plan's monthly allowance.
const HTTP_GAP = Number(lsGet('td:httpgap')) || 25000;

// The home-screen version's own cloud: /api on the site it's served from, unlocked with the event code.
// Same shape as the claude.ai db/assets capabilities, so Cloud below works with either.
const HttpCloud = {
  key: '', cache: null, cacheAt: 0, inflight: null, usage: null,
  headers(extra = {}) { return { 'x-trivia-key': this.key, ...extra }; },
  async call(path, opts = {}, ms = 15000) {
    const ac = typeof AbortController === 'function' ? new AbortController() : null;
    const t = setTimeout(() => ac && ac.abort(), ms);
    let r;
    try { r = await fetch(path, { ...opts, headers: this.headers(opts.headers), cache: 'no-store', ...(ac ? { signal: ac.signal } : {}) }); }
    catch { throw { code: 'unavailable', message: 'offline' }; }
    finally { clearTimeout(t); }
    if (r.ok) return r;
    let body = {};
    try { body = await r.json(); } catch { /* not json */ }
    throw { code: body.code || (r.status === 401 ? 'revoked' : r.status === 429 ? 'quota_exceeded' : r.status === 409 ? 'conflict' : 'unavailable'), message: body.message || 'HTTP ' + r.status };
  },
  async probe() {
    const ac = typeof AbortController === 'function' ? new AbortController() : null;
    const t = setTimeout(() => ac && ac.abort(), 6000);
    try {
      const r = await fetch('/api/ping', { cache: 'no-store', ...(ac ? { signal: ac.signal } : {}) });
      const j = r.ok ? await r.json() : null;
      return !!(j && j.ok && j.app === 'trivia-day' && j.cloud);
    } catch { return false; } finally { clearTimeout(t); }
  },
  async login(key) {
    const ac = typeof AbortController === 'function' ? new AbortController() : null;
    const t = setTimeout(() => ac && ac.abort(), 15000);
    const r = await fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key }), cache: 'no-store', ...(ac ? { signal: ac.signal } : {}) }).catch(() => null);
    clearTimeout(t);
    if (!r) throw { code: 'unavailable', message: 'offline' };
    if (!r.ok) { let b = {}; try { b = await r.json(); } catch { /* ignore */ } throw { code: b.code || 'unavailable', message: b.message || '' }; }
  },
  // One request fetches every document; reads within a moment of each other share it.
  async docs() {
    if (this.cache && Date.now() - this.cacheAt < 2000) return this.cache;
    if (!this.inflight) {
      this.inflight = this.call('/api/db').then((r) => r.json()).then((j) => {
        this.cache = isObj(j.docs) ? j.docs : {}; this.cacheAt = Date.now(); this.usage = j.usage || null;
        return this.cache;
      }).finally(() => { this.inflight = null; });
    }
    return this.inflight;
  },
};
HttpCloud.db = {
  doc(path) {
    return {
      async get() { const all = await HttpCloud.docs(); const d = all[path]; return { id: path.split('/').pop(), exists: !!d, data: () => (d ? clone(d) : undefined) }; },
      set: (data) => HttpCloud.db.setMany([{ path, data }]),
    };
  },
  collection(name) {
    return {
      async get() {
        const all = await HttpCloud.docs();
        const ids = Object.keys(all).filter((k) => k.startsWith(name + '/') && k.split('/').length === 2);
        return { docs: ids.map((k) => ({ id: k.slice(name.length + 1), data: () => clone(all[k]) })) };
      },
    };
  },
  // Each document says which cloud copy it was merged against (base); the server refuses the whole
  // batch with 'conflict' if any of them changed since, and Cloud.flush re-reads and tries again.
  async setMany(list) {
    let r;
    try { r = await HttpCloud.call('/api/db', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ set: list }) }); }
    catch (e) { if (e && e.code === 'conflict') HttpCloud.cache = null; throw e; }
    try { const j = await r.json(); if (j && j.limit) HttpCloud.usage = { ...(HttpCloud.usage || {}), writes: j.writes, limit: j.limit }; } catch { /* fine */ }
    if (HttpCloud.cache) for (const d of list) HttpCloud.cache[d.path] = clone(d.data);
  },
};
HttpCloud.assets = {
  async upload(blob, opts = {}) {
    const r = await HttpCloud.call('/api/asset', { method: 'POST', headers: { 'content-type': opts.type || blob.type || 'image/jpeg' }, body: blob }, 45000);
    return r.json();
  },
  async delete(id) { await HttpCloud.call('/api/asset?id=' + encodeURIComponent(id), { method: 'DELETE' }); },
};

const Cloud = {
  status: 'off', db: null, assets: null, downloads: null, pulled: false, http: false, lastPush: 0,
  remoteAt: new Map(), timer: null, flushing: false, again: false, fails: 0, gen: 0,
  quotaWarned: false, photoWarned: false, uploading: new Set(),
  async init() {
    const c = window.claude;
    if (!c || typeof c.use !== 'function') return this.initHttp();
    this.status = 'connecting'; updateSyncNote();
    const safeUse = (n) => Promise.resolve().then(() => c.use(n)).catch(() => null);
    const [db, assets, downloads] = await Promise.all([safeUse('db'), safeUse('assets'), safeUse('downloads')]);
    this.downloads = downloads;
    this.assets = assets;
    if (!db) { this.status = 'off'; updateSyncNote(); return; }
    this.db = db;
    await this.tryPull();
  },
  // Home-screen app: use this site's cloud if it has one. A device that already has the event code
  // keeps trying even when it starts offline.
  async initHttp() {
    if (!/^https?:$/.test(location.protocol) || this.http || this.probing) return;
    HttpCloud.key = lsGet('td:cloudkey') || '';
    this.probing = true;
    const has = await HttpCloud.probe().finally(() => { this.probing = false; });
    if (!has && !HttpCloud.key) {
      // Opened offline for the first time: look again when it comes back online or to the foreground.
      if (!this.reprobe) { this.reprobe = () => { if (!this.http && !window.claude) this.initHttp(); }; window.addEventListener('online', this.reprobe); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') this.reprobe(); }); }
      return;
    }
    if (this.http) return;
    this.http = true;
    if (!HttpCloud.key) { this.status = 'needkey'; updateSyncNote(); softRender(); return; }
    this.db = HttpCloud.db; this.assets = HttpCloud.assets;
    this.status = 'connecting'; updateSyncNote();
    await this.tryPull();
  },
  async connect(key) {
    key = String(key || '').trim();
    if (!key) throw { code: 'revoked', message: 'Enter the event code' };
    await HttpCloud.login(key);
    HttpCloud.key = key; lsSet('td:cloudkey', key);
    this.http = true; this.db = HttpCloud.db; this.assets = HttpCloud.assets;
    this.pulled = false; this.fails = 0; this.remoteAt.clear(); HttpCloud.cache = null;
    this.status = 'connecting'; updateSyncNote();
    await this.tryPull();
  },
  disconnect() {
    fetch('/api/login?out=1', { method: 'POST', cache: 'no-store' }).catch(() => {}); // forget the photo cookie too
    lsDel('td:cloudkey'); HttpCloud.key = ''; HttpCloud.cache = null;
    this.gen++; clearTimeout(this.timer); this.timer = null;
    this.db = null; this.assets = null; this.pulled = false; this.remoteAt.clear();
    this.status = 'needkey'; updateSyncNote();
  },
  async tryPull() {
    const gen = ++this.gen; const was = this.status;
    try {
      await Promise.race([this.pull(), sleep(15000).then(() => { throw { code: 'unavailable', message: 'timed out' }; })]);
      if (gen !== this.gen) return;
      this.pulled = true; this.status = 'on'; this.fails = 0;
      updateSyncNote();
      if (was !== 'on') softRender();
      this.schedule(200);
      this.cacheRemotePhotos().then(() => this.uploadPendingPhotos());
    } catch (e) {
      if (gen !== this.gen) return;
      // Never push until we've seen the cloud copy, or an older device could overwrite newer data.
      console.warn('cloud pull failed', e);
      this.status = e && (e.code === 'revoked' || e.code === 'not_granted' || e.code === 'capability_disabled') ? (this.http ? 'badkey' : 'off') : 'error';
      updateSyncNote();
      if (this.status === 'badkey') softRender();
      if (this.status === 'error') setTimeout(() => { if (gen === this.gen) this.tryPull(); }, CLOUD_BACKOFF[Math.min(this.fails++, CLOUD_BACKOFF.length - 1)]);
    }
  },
  // Quietly pick up changes made on other devices (when the app comes back to the foreground).
  refresh() {
    if (!this.db || !this.pulled || this.refreshing) return;
    this.refreshing = true;
    Promise.race([this.pull(), sleep(15000)]).catch(() => {}).finally(() => { this.refreshing = false; this.cacheRemotePhotos(); });
  },
  async pull() {
    this.lastPull = Date.now();
    const [meta, players, games] = await Promise.all([
      this.db.doc('trivia/meta').get(), this.db.collection('players').get(), this.db.collection('games').get(),
    ]);
    const remote = { title: S.title, settings: S.settings, metaAt: 0, players: {}, games: {}, deletedGames: {} };
    if (meta.exists) {
      const m = meta.data() || {};
      remote.metaAt = Number(m.metaAt) || 0;
      if (typeof m.title === 'string') remote.title = m.title;
      if (isObj(m.settings)) remote.settings = m.settings;
      this.remoteAt.set('trivia/meta', remote.metaAt);
    }
    for (const d of players.docs) {
      const p = d.data();
      if (!okId(d.id) || !isObj(p)) continue;
      remote.players[d.id] = p;
      this.remoteAt.set('players/' + d.id, Number(p.updatedAt) || 0);
    }
    for (const d of games.docs) {
      const g = d.data();
      if (!okId(d.id) || !isObj(g)) continue;
      this.remoteAt.set('games/' + d.id, Number(g.updatedAt) || 0);
      if (g.deleted) remote.deletedGames[d.id] = Number(g.updatedAt) || 0; else remote.games[d.id] = g;
    }
    const guideBefore = guide().photos;
    const changed = mergeInto(S, migrate(remote));
    // Meeko photos another device removed: their cloud copies go too (one may have finished uploading here
    // after the removal, which would otherwise leave it in the cloud for good).
    const guideNow = new Set(guide().photos.map((ph) => ph.id));
    for (const ph of guideBefore) if (ph.asset && !guideNow.has(ph.id)) this.dropAsset(ph.asset);
    // Photos removed on another device go here too.
    for (const p of Object.values(S.players)) {
      const e = Photos.map[p.id];
      if (p.hasPhoto === false && e && e.at <= (p.photoAt || 0)) await Photos.remove(p.id);
    }
    const keepMk = new Set(guide().photos.map((ph) => ph.id));
    for (const id of Object.keys(Photos.map)) if (isGuidePhotoId(id) && !keepMk.has(id) && !guideSaving.has(id)) await Photos.remove(id);
    if (changed) {
      S.updatedAt = Math.max(S.updatedAt, Date.now());
      Saver.pending = true; Saver.flush();
      softRender();
      refreshGuideSheet();
    }
    // A merge can leave this device holding something newer than the cloud: send it back up.
    if (this.pulled && !this.flushing && this.docsToPush().length) this.schedule();
  },
  // Save less often as the month's allowance gets used (two busy devices, or a long setup week).
  gap() {
    const u = HttpCloud.usage; const k = u && u.limit ? (Number(u.writes) || 0) / u.limit : 0;
    return k > 0.8 ? HTTP_GAP * 5 : k > 0.5 ? HTTP_GAP * 2.4 : HTTP_GAP;
  },
  schedule(delay = 1200) {
    if (!this.db || !this.pulled) return;
    if (this.http) {
      // Leave a queued save alone (it picks this change up too); otherwise save after the gap.
      if (this.timer) return;
      this.timer = setTimeout(() => { this.timer = null; this.flush(); }, Math.max(delay, this.gap() - (Date.now() - this.lastPush)));
      return;
    }
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), delay);
  },
  docsToPush() {
    const out = [];
    const known = (path) => (this.remoteAt.has(path) ? this.remoteAt.get(path) : -1);
    if ((S.metaAt || 0) > known('trivia/meta')) out.push({ path: 'trivia/meta', at: S.metaAt || 0, data: { v: STATE_V, title: S.title, settings: S.settings, metaAt: S.metaAt || 0 } });
    for (const p of Object.values(S.players)) if ((p.updatedAt || 0) > known('players/' + p.id)) out.push({ path: 'players/' + p.id, at: p.updatedAt || 0, data: p });
    for (const g of Object.values(S.games)) if ((g.updatedAt || 0) > known('games/' + g.id)) out.push({ path: 'games/' + g.id, at: g.updatedAt || 0, data: g });
    for (const [id, at] of Object.entries(S.deletedGames)) if (!S.games[id] && at > known('games/' + id)) out.push({ path: 'games/' + id, at, data: { id, deleted: true, updatedAt: at } });
    return out;
  },
  // A game may have been changed on another device since we last saw it: fold that in before writing.
  // Returns false when the game turned out to be deleted there (nothing to write).
  async reconcileGame(d) {
    const id = d.path.slice(6);
    const snap = await this.db.doc(d.path).get();
    if (!snap.exists) return true;
    const rem = snap.data() || {};
    const remAt = Number(rem.updatedAt) || 0;
    if (remAt <= (this.remoteAt.has(d.path) ? this.remoteAt.get(d.path) : -1)) return true;
    this.remoteAt.set(d.path, remAt);
    const incoming = migrate(rem.deleted ? { deletedGames: { [id]: remAt } } : { games: { [id]: rem } });
    if (mergeInto(S, incoming)) softRender();
    const g = S.games[id];
    if (!g) { Saver.pending = true; Saver.flush(); return false; }
    g.updatedAt = bump(Math.max(g.updatedAt || 0, remAt));
    d.data = g; d.at = g.updatedAt;
    Saver.pending = true; Saver.flush();
    return true;
  },
  // Same for the meta record (title, settings, Meeko): another device may have added photos since we looked.
  async reconcileMeta(d) {
    const snap = await this.db.doc(d.path).get();
    if (!snap.exists) return;
    const m = snap.data() || {};
    const remAt = Number(m.metaAt) || 0;
    if (remAt <= (this.remoteAt.has(d.path) ? this.remoteAt.get(d.path) : -1)) return;
    this.remoteAt.set(d.path, remAt);
    if (mergeInto(S, migrate({ title: typeof m.title === 'string' ? m.title : S.title, settings: isObj(m.settings) ? m.settings : S.settings, metaAt: remAt }))) { softRender(); refreshGuideSheet(); }
    S.metaAt = bump(Math.max(S.metaAt || 0, remAt));
    d.data = { v: STATE_V, title: S.title, settings: S.settings, metaAt: S.metaAt }; d.at = S.metaAt;
    Saver.pending = true; Saver.flush();
  },
  async write(path, data) {
    const ref = this.db.doc(path);
    const body = clone(data);
    try { await ref.set(body); } catch (e) {
      if (e && (e.code === 'unavailable' || !e.code)) { await sleep(500 + Math.random() * 700); await ref.set(body); } else throw e;
    }
  },
  async flush() {
    if (!this.db || !this.pulled) return;
    if (this.flushing) { this.again = true; return; }
    this.flushing = true;
    const gen = this.gen; const was = this.status;
    let failed = null;
    try {
      // After a failure, or when we haven't looked in a while, pick up other devices' changes first so
      // nothing older from here gets written over them.
      if (this.fails > 0 || Date.now() - (this.lastPull || 0) > 30000) {
        await Promise.race([this.pull(), sleep(15000).then(() => { throw { code: 'unavailable', message: 'timed out' }; })]);
        if (gen !== this.gen) return;
      }
      const batch = [];
      for (const d of this.docsToPush()) {
        if (d.path.startsWith('games/') && !d.data.deleted && !(await this.reconcileGame(d))) continue;
        if (gen !== this.gen) return;
        if (this.db.setMany) { batch.push(d); continue; }
        if (d.path === 'trivia/meta') { await this.reconcileMeta(d); if (gen !== this.gen) return; }
        await this.write(d.path, d.data); this.remoteAt.set(d.path, d.at);
      }
      // The home-screen cloud takes every changed document in one request.
      if (batch.length) {
        await this.db.setMany(batch.map((d) => ({ path: d.path, data: clone(d.data), base: this.remoteAt.has(d.path) ? this.remoteAt.get(d.path) : null })));
        if (gen !== this.gen) return;
        for (const d of batch) this.remoteAt.set(d.path, d.at);
        this.lastPush = Date.now();
      }
      this.status = 'on'; this.fails = 0; this.conflicts = 0;
    } catch (e) {
      if (gen !== this.gen) return;
      // Another device saved first: read its copy, merge, and send ours again.
      if (e && e.code === 'conflict' && (this.conflicts = (this.conflicts || 0) + 1) <= 4) { this.lastPull = 0; this.again = true; this.retrySoon = true; return; }
      failed = e;
      console.warn('cloud push failed', e);
      const code = e && e.code;
      if (code === 'revoked' || code === 'not_granted' || code === 'capability_disabled') this.status = this.http ? 'badkey' : 'off';
      else if (code === 'quota_exceeded') {
        this.status = 'full';
        if (!this.quotaWarned) { this.quotaWarned = true; toast(this.http ? "This month's cloud backup allowance is used up. Everything is still saved on this device." : 'Cloud backup is full. Everything is still saved on this device.', 'bad'); }
      } else this.status = 'error';
    } finally {
      this.flushing = false;
      if (gen === this.gen) {
      updateSyncNote();
      // Settings and the home card change shape when the code stops working or the allowance runs out.
      if (was !== this.status && [was, this.status].some((x) => ['badkey', 'needkey', 'full', 'off'].includes(x))) softRender();
      // A clash retries within a second, not after the usual gap (clashes are rare, so this costs little).
      if (this.again && this.retrySoon) { this.again = false; this.retrySoon = false; clearTimeout(this.timer); this.timer = setTimeout(() => { this.timer = null; this.flush(); }, 300 + Math.random() * 700); }
      else if (this.again) { this.again = false; this.schedule(300); }
      else if (failed && (this.status === 'error' || this.status === 'full')) this.schedule(CLOUD_BACKOFF[Math.min(this.fails++, CLOUD_BACKOFF.length - 1)]);
      else if (!failed) this.uploadPendingPhotos();
      }
    }
  },
  async uploadPhoto(p) {
    if (!this.assets || !this.pulled || !p || p.demo || p.deleted || p.hasPhoto === false) return;
    const entry = Photos.map[p.id];
    if (!entry) return;
    if (p.photoAt && entry.at < p.photoAt) return; // an older copy than the current photo: never upload it
    if (p.photoAsset && (p.photoAssetAt || 0) >= entry.at) return;
    if (this.uploading.has(p.id)) return;
    this.uploading.add(p.id);
    const gen = this.gen;
    try {
      const blob = dataURLtoBlob(entry.data);
      const res = await this.assets.upload(blob, { type: blob.type || 'image/jpeg' });
      if (gen !== this.gen) return;
      const cur = S.players[p.id] || p;
      const old = cur.photoAsset; const oldAt = cur.photoAssetAt || 0;
      cur.photoAsset = res.id; cur.photoAssetAt = entry.at; touchPlayer(cur);
      commit(null, { render: false });
      if (old && old !== res.id && entry.at > oldAt) this.dropAsset(old);
    } catch (e) {
      console.warn('photo upload failed', e);
      if (!this.photoWarned && e && (e.code === 'quota_or_state' || e.code === 'too_large')) {
        this.photoWarned = true;
        toast(this.http ? 'Some photos could not be backed up to the cloud. They are still saved on this device.' : 'Some photos could not be backed up to Claude. They are still saved on this device.', 'bad');
      }
    } finally { this.uploading.delete(p.id); updateSyncNote(); }
  },
  // Meeko's photos go up one by one, the same way as players'; their records live in settings.guide.photos.
  guidePhotoNeedsUpload(ph) {
    const e = Photos.map[ph.id];
    return !!e && !(ph.at && e.at < ph.at) && !(ph.asset && ph.assetAt >= e.at);
  },
  async uploadGuidePhoto() {
    if (!this.assets || !this.pulled) return;
    for (const ph of guide().photos) {
      if (!this.guidePhotoNeedsUpload(ph) || this.uploading.has(ph.id)) continue;
      const entry = Photos.map[ph.id];
      this.uploading.add(ph.id);
      const gen = this.gen;
      try {
        const blob = dataURLtoBlob(entry.data);
        const res = await this.assets.upload(blob, { type: blob.type || 'image/jpeg' });
        if (gen !== this.gen) return;
        const now = guide().photos; const cur = now.find((x) => x.id === ph.id);
        if (!cur) { this.dropAsset(res.id); continue; } // removed while uploading
        const old = cur.asset;
        setGuide({ photos: now.map((x) => (x.id === ph.id ? { ...x, asset: res.id, assetAt: entry.at } : x)) });
        commit(null, { render: false });
        if (old && old !== res.id) this.dropAsset(old);
      } catch (e) { console.warn('guide photo upload failed', e); } finally { this.uploading.delete(ph.id); updateSyncNote(); }
    }
  },
  photosPending() {
    if (!this.assets || this.status !== 'on') return false;
    if (guide().photos.some((ph) => this.guidePhotoNeedsUpload(ph))) return true;
    return Object.values(S.players).some((p) => !p.deleted && !p.demo && p.hasPhoto !== false && Photos.map[p.id] && (Photos.map[p.id].at || 0) > (p.photoAssetAt || 0) && !(p.photoAt && Photos.map[p.id].at < p.photoAt));
  },
  uploadPendingPhotos() {
    if (!this.assets || !this.pulled) return;
    for (const p of Object.values(S.players)) if (!p.deleted && Photos.map[p.id]) this.uploadPhoto(p);
    if (guide().photos.length) this.uploadGuidePhoto();
  },
  async cacheRemotePhotos() {
    await Promise.all([...Object.values(S.players), ...guide().photos.map(guidePhotoRec)].map(async (p) => {
      if (p.deleted || !p.photoAsset || p.hasPhoto === false) return;
      const at = p.photoAssetAt || p.photoAt || 0;
      const e = Photos.map[p.id];
      if (e && e.at >= at) return;
      const ac = typeof AbortController === 'function' ? new AbortController() : null;
      const t = setTimeout(() => ac && ac.abort(), 8000);
      try {
        const r = await fetch('/_blob/' + p.photoAsset, { ...(ac ? { signal: ac.signal } : {}), ...(this.http ? { headers: HttpCloud.headers() } : {}) });
        if (!r.ok) return;
        const data = await blobToDataURL(await r.blob());
        if (typeof data === 'string' && data.startsWith('data:image/')) await Photos.set(p.id, data, at);
      } catch { /* offline or not served; the URL still displays */ } finally { clearTimeout(t); }
    }));
  },
  dropAsset(id) { if (this.assets && id) Promise.resolve().then(() => this.assets.delete(id)).catch(() => {}); },
};

function syncInfo() {
  if (Saver.blocked) return { cls: 'bad', text: "Saved games couldn't be loaded, so nothing is being saved. Reload to try again." };
  if (Local.mode === 'mem' || (Saver.failed && !Local.degraded)) return { cls: 'bad', text: 'Not saving: this browser is blocking storage. Keep this tab open.' };
  if (Local.degraded && Local.why === 'forced') return { cls: 'warn', text: 'Using the app without your saved games. Anything new is kept and merged back in. Reload to try again.' };
  if (Local.degraded && Local.why === 'open') return { cls: 'warn', text: "Couldn't open your saved games yet. Anything you add is kept and merged back in. Reload to try again." };
  if (Local.degraded) return { cls: 'warn', text: "Saving to a backup spot on this device. Reload when you can so it's moved back." };
  if (Cloud.status === 'on' && Cloud.photosPending()) return { cls: 'warn', text: 'Saved on this device · some photos not backed up yet' };
  if (Cloud.status === 'on') return { cls: 'ok', text: Cloud.http ? 'Saved on this device and backed up to the cloud' : 'Saved on this device and backed up to Claude' };
  if (Cloud.status === 'connecting') return { cls: 'warn', text: 'Saved on this device · connecting backup' };
  if (Cloud.status === 'needkey') return { cls: 'warn', text: 'Saved on this device · enter the event code to back up to the cloud' };
  if (Cloud.status === 'badkey') return { cls: 'warn', text: 'Saved on this device · cloud backup needs the event code again' };
  if (Cloud.status === 'full') return { cls: 'warn', text: Cloud.http ? "Saved on this device · this month's cloud allowance is used up" : 'Saved on this device · cloud backup is full' };
  if (Cloud.status === 'error') return { cls: 'warn', text: 'Saved on this device · cloud backup paused, retrying' };
  return { cls: 'ok', text: 'Saved on this device' };
}
function syncNoteHTML() { const s = syncInfo(); return `<div class="sync-note ${s.cls}" data-sync><span class="led"></span><span>${esc(s.text)}</span></div>`; }
function updateSyncNote() {
  for (const el of $$('[data-sync]')) el.outerHTML = syncNoteHTML();
  refreshGuideCloud();
  const chip = $('[data-save-chip]');
  const bad = syncInfo().cls === 'bad' || Local.degraded;
  if (chip) { chip.hidden = !bad; chip.textContent = syncInfo().cls === 'bad' ? 'Not saving' : 'Backup storage'; }
}

// ===================== Sound =====================
const Sound = {
  ctx: null, buffers: {}, loading: {},
  // Meeko's recorded barks (SFX_DATA), decoded once and played through Web Audio.
  sample(name, vol = 0.9) {
    const c = this.ensure(); if (!c || typeof SFX_DATA === 'undefined' || !SFX_DATA[name]) return;
    const play = (buf) => { try { const src = c.createBufferSource(); const g = c.createGain(); g.gain.value = vol; src.buffer = buf; src.connect(g); g.connect(c.destination); src.start(); } catch { /* ignore */ } };
    if (this.buffers[name]) { play(this.buffers[name]); return; }
    this.load(name).then((b) => { if (b) play(b); });
  },
  load(name) {
    const c = this.ctx;
    if (!this.loading[name]) {
      const bin = atob(SFX_DATA[name]); const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      this.loading[name] = new Promise((res, rej) => c.decodeAudioData(bytes.buffer, res, rej)).then((b) => (this.buffers[name] = b)).catch(() => null);
    }
    return this.loading[name];
  },
  ensure() {
    if (!S.settings.sound) return null;
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; this.ctx = new AC();
        if (typeof SFX_DATA !== 'undefined') for (const n of Object.keys(SFX_DATA)) this.load(n);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    } catch { return null; }
  },
  tone(f, t0, dur, type = 'sine', vol = 0.15) {
    const c = this.ctx; const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.05);
  },
  play(name) {
    const c = this.ensure(); if (!c) return;
    const t = c.currentTime + 0.01;
    try {
      switch (name) {
        case 'tap': this.tone(620, t, 0.07, 'triangle', 0.1); break;
        case 'next': this.tone(440, t, 0.08, 'sine', 0.09); this.tone(660, t + 0.05, 0.1, 'sine', 0.09); break;
        case 'back': this.tone(520, t, 0.08, 'sine', 0.08); this.tone(390, t + 0.05, 0.1, 'sine', 0.08); break;
        case 'correct': this.tone(880, t, 0.1, 'triangle', 0.14); this.tone(1320, t + 0.07, 0.16, 'triangle', 0.12); break;
        case 'undo': this.tone(300, t, 0.12, 'sine', 0.1); break;
        case 'reveal': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, t + i * 0.07, 0.24, 'triangle', 0.12)); break;
        case 'board': [392, 523, 659, 784].forEach((f, i) => this.tone(f, t + i * 0.09, 0.3, 'triangle', 0.11)); break;
        case 'spooky': [[220, 0], [261.6, 0.02], [311.1, 0.04]].forEach(([f, d]) => this.tone(f, t + d, 1.4, 'triangle', 0.05)); [[523.3, 0.35], [466.2, 0.6], [392, 0.85], [311.1, 1.1]].forEach(([f, d]) => this.tone(f, t + d, 0.5, 'sine', 0.06)); break;
        case 'fanfare': [[523, 0], [659, 0.13], [784, 0.26], [1047, 0.39], [784, 0.56], [1047, 0.69]].forEach(([f, d], i) => this.tone(f, t + d, i === 5 ? 0.7 : 0.17, 'square', 0.06)); break;
        default: break;
      }
    } catch { /* audio is a nice-to-have */ }
  },
};

// ===================== Game Master Meeko =====================
// The host character: a dog who announces rounds, comments on the leaderboard and crowns the winner.
// His name, voice setting and photos live in settings.guide (synced like the event name). Each photo is
// stored like a player's under its own id ('mk…'), and he switches photo as the game goes. Up to 10 can be
// added at a time; photos added on two devices at once are all kept.
const GUIDE_ID = 'guide'; // the single photo from before he had several
const GUIDE_MAX = 10; // the most the sheet adds; a list merged from two devices can hold more
const isGuidePhotoId = (id) => id === GUIDE_ID || /^mk/.test(id);
const guideSaving = new Set(); // photos being saved right now (not yet listed in settings.guide)
function guide() {
  const g = isObj(S.settings.guide) ? S.settings.guide : {};
  let photos;
  if (Array.isArray(g.photos)) {
    photos = g.photos.filter((x) => isObj(x) && okId(x.id) && isGuidePhotoId(x.id))
      .map((x) => ({ id: x.id, at: Number(x.at) || 0, asset: typeof x.asset === 'string' && okId(x.asset) ? x.asset : null, assetAt: Number(x.assetAt) || 0 }));
  } else {
    const has = g.hasPhoto !== false && (typeof g.photoAsset === 'string' || Photos.map[GUIDE_ID]);
    photos = has ? guidePhotoList({ ...g, photoAt: g.photoAt || 1 }) : [];
  }
  return {
    id: GUIDE_ID, name: typeof g.name === 'string' && g.name.trim() ? g.name.trim().slice(0, 30) : 'Meeko',
    voice: g.voice !== false, mode: g.mode === 'round' ? 'round' : 'each', photos,
    // Voice choice is remembered by name too, since each device has its own list of voices.
    voiceURI: typeof g.voiceURI === 'string' ? g.voiceURI : '', voiceName: typeof g.voiceName === 'string' ? g.voiceName : '',
    rate: numIn(g.rate, 0.5, 2, 1.02), pitch: numIn(g.pitch, 0.1, 2, 1.12), bark: g.bark !== false,
  };
}
function numIn(v, lo, hi, dflt) { const n = Number(v); return Number.isFinite(n) && n >= lo && n <= hi ? n : dflt; }
// A photo entry in the shape Photos.src and the cloud code use for players.
const guidePhotoRec = (ph) => ({ id: ph.id, hasPhoto: true, photoAt: ph.at, photoAsset: ph.asset, photoAssetAt: ph.assetAt });
// The photo for his n-th appearance (null: none yet, so the cartoon shows).
function guideSrc(n = 0) {
  const srcs = guide().photos.map((ph) => Photos.src(guidePhotoRec(ph))).filter(Boolean);
  if (!srcs.length) return null;
  return srcs[((Math.floor(n) % srcs.length) + srcs.length) % srcs.length];
}
// Which photo a play screen gets: a new one every appearance, or one per round.
function meekoTurn(g, i, stage) {
  if (guide().mode === 'round') return i;
  return i * 3 + ({ intro: 0, aintro: 1, board: 2, final: 0 }[stage] || 0);
}
// Each of his settings carries its own stamp, so a device only overrides what was actually changed on it.
const GUIDE_FIELDS = ['name', 'mode', 'voice', 'bark', 'rate', 'pitch', 'voiceURI', 'voiceName'];
function setGuide(patch) {
  const cur = isObj(S.settings.guide) ? S.settings.guide : {};
  // A record from before per-field stamps vouches for every field at its own stamp; keep that.
  const stamps = isObj(cur.stamps) ? { ...cur.stamps } : Object.fromEntries(cur.at ? GUIDE_FIELDS.map((k) => [k, Number(cur.at) || 0]) : []);
  for (const k of Object.keys(patch)) if (GUIDE_FIELDS.includes(k)) stamps[k] = bump(Math.max(stamps[k] || 0, cur.at || 0));
  S.settings.guide = { ...cur, ...patch, stamps, at: bump(cur.at) };
  S.metaAt = bump(S.metaAt);
}
const art = (name, ...a) => (typeof HART !== 'undefined' && HART[name] ? HART[name](...a) : '');
// His portrait: one of his photos, or the cartoon dog until there is one. No hat (several photos have their own).
function meekoPic(cls = '', n = 0, src = guideSrc(n)) {
  return `<span class="meeko-pic hat-off ${cls}" aria-hidden="true"><span class="meeko-face">${art('dog')}${src ? `<img src="${esc(src)}" alt="" draggable="false" onerror="this.remove()">` : ''}</span></span>`;
}
// Pick a line for an event. Lines needing a value we don't have are skipped; `k` walks through the
// list so consecutive rounds don't repeat, and the same screen always shows the same line.
function meekoLine(event, vars = {}, key = '', k = 0) {
  const pool = (typeof MEEKO_LINES !== 'undefined' && MEEKO_LINES[event]) || [];
  const v = { guide: guide().name, ...vars };
  const usable = pool.filter((l) => (l.match(/\{(\w+)\}/g) || []).every((t) => { const x = v[t.slice(1, -1)]; return x !== undefined && x !== null && x !== ''; }));
  if (!usable.length) return '';
  const line = usable[(hashStr(event + ':' + key) + k) % usable.length];
  return line.replace(/\{(\w+)\}/g, (_, n) => String(v[n])).replace(/\b1 (point|question|place|round|guest)s\b/g, '1 $1');
}
function meekoSay(text, { key = '', size = 'md', cls = '', pic = 0 } = {}) {
  if (!text) return '';
  const g = guide();
  return `<div class="meeko-say meeko-${size} ${cls}">
    ${meekoPic('', pic)}
    <div class="meeko-bubble"><div class="meeko-name">Game Master ${esc(g.name)}${'speechSynthesis' in window ? `<button class="meeko-replay" data-act="meeko-replay" aria-label="Hear ${esc(g.name)} say it again">${ic(S.settings.sound && g.voice ? 'soundOn' : 'soundOff')}</button>` : ''}</div>
      <p class="meeko-line" data-say-key="${esc(key)}" aria-label="${esc(text)}"><span class="full">${esc(text)}</span><span class="typed" aria-hidden="true"></span></p></div>
  </div>`;
}
// Lines for the play screens.
function soleLeader(st) {
  const top = st.filter((x) => x.rank === 1);
  return top.length === 1 && top[0].score > 0 ? nameOf(top[0].id) : '';
}
function introLine(g, r) {
  const pr = playable(g); const i = pr.indexOf(r); const host = S.players[r.masterId];
  const vars = { round: i + 1, total: pr.length, category: (r.category || '').trim() || 'a mystery round', host: host ? host.name : 'our trivia master', count: r.questions.length };
  if (i > 0) vars.leader = soleLeader(computeStandings(g, i - 1));
  const ev = i === 0 ? 'game_start' : i === pr.length - 1 ? 'round_last' : 'round_intro';
  return meekoLine(ev, vars, g.id, i);
}
function answersLine(g, r) {
  const pr = playable(g); const i = pr.indexOf(r); const host = S.players[r.masterId];
  return meekoLine('answers_intro', { host: host ? host.name : 'Trivia master', category: (r.category || '').trim() || 'this round', count: r.questions.length }, g.id, i);
}
function boardLine(g, r) {
  const pr = playable(g); const i = pr.indexOf(r); const last = i === pr.length - 1;
  const cur = computeStandings(g, i); const prev = i > 0 ? computeStandings(g, i - 1) : [];
  const top = cur.filter((x) => x.rank === 1);
  let comment = '';
  if (cur.length && cur[0].score > 0) {
    const second = cur.find((x) => x.rank > 1);
    const gap = second ? cur[0].score - second.score : 0;
    const prevRank = Object.fromEntries(prev.map((x) => [x.id, x.rank]));
    const movers = i > 0 ? cur.map((x) => ({ id: x.id, up: (prevRank[x.id] || x.rank) - x.rank })).filter((x) => x.up >= 2).sort((a, b) => b.up - a.up) : [];
    // A mover who has just taken first place isn't chasing the leader, so drop {leader} for them.
    const moverVars = movers.length ? { mover: nameOf(movers[0].id), places: movers[0].up, leader: movers[0].id === top[0].id ? undefined : nameOf(top[0].id) } : null;
    if (top.length > 1) comment = meekoLine('board_tie', { names: listNames(top.map((x) => nameOf(x.id))), points: top[0].score }, g.id, i);
    else if (movers.length && i % 2 === 1) comment = meekoLine('board_mover', moverVars, g.id, i);
    else if (second && gap <= 2) comment = meekoLine('board_close', { leader: nameOf(top[0].id), second: nameOf(second.id), gap }, g.id, i);
    else if (gap >= 8) comment = meekoLine('board_runaway', { leader: nameOf(top[0].id), gap }, g.id, i);
    else if (movers.length) comment = meekoLine('board_mover', moverVars, g.id, i);
    else comment = meekoLine('board_lead', { leader: nameOf(top[0].id), points: top[0].score, gap: gap || undefined }, g.id, i);
    // Now and then, a kind word for whoever's at the bottom.
    const bottom = cur.filter((x) => x.rank === cur[cur.length - 1].rank);
    if (!last && i % 3 === 2 && cur.length > 2 && bottom.length === 1 && bottom[0].score < cur[0].score && comment.length < 90) comment += ' ' + meekoLine('board_last_place', { name: nameOf(bottom[0].id) }, g.id, i);
  }
  const next = pr[i + 1];
  const tail = last || !next || backToWinner(g, i) ? meekoLine('board_before_final', {}, g.id, i)
    : meekoLine('board_next', { nextCategory: (next.category || '').trim() || 'a mystery round', nextHost: nameOf(next.masterId) || 'our next trivia master' }, g.id, i);
  return (comment ? comment + ' ' : '') + tail;
}
function finalLine(g) {
  const pr = playable(g); const st = computeStandings(g, pr.length - 1);
  if (!st.length || st[0].score <= 0) return meekoLine('final_none', {}, g.id);
  const top = st.filter((x) => x.rank === 1);
  return top.length > 1 ? meekoLine('final_tie', { names: listNames(top.map((x) => nameOf(x.id))), points: top[0].score }, g.id)
    : meekoLine('final_winner', { winner: nameOf(top[0].id), points: top[0].score }, g.id);
}

// Meeko's voice: the device's text-to-speech, only when sound is on. The voice, speed and pitch are
// chosen in Settings (Voice and sounds); "Automatic" picks the best Australian English voice available.
const FUN_VOICES = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Junior|Kathy|Ralph)\b/;
const ACCENTS = { AU: 'Australian', GB: 'British', US: 'American', IE: 'Irish', IN: 'Indian', ZA: 'South African', NZ: 'New Zealand', CA: 'Canadian', SC: 'Scottish' };
const accentOf = (lang) => { const m = /^en[-_]([A-Za-z]{2})/.exec(lang || ''); return m ? `${ACCENTS[m[1].toUpperCase()] || m[1].toUpperCase()} English` : (lang || ''); };
const Voice = {
  auto: undefined, timer: null,
  ok() { return 'speechSynthesis' in window && typeof SpeechSynthesisUtterance === 'function'; },
  list() { if (!this.ok()) return []; try { return speechSynthesis.getVoices() || []; } catch { return []; } },
  autoPick(vs = this.list()) {
    if (this.auto !== undefined && vs.length) return this.auto;
    if (!vs.length) return null;
    const en = vs.filter((x) => /^en[-_]/i.test(x.lang) && !FUN_VOICES.test(x.name));
    const by = (re) => en.find((x) => re.test(x.lang));
    this.auto = en.find((x) => /^en[-_]AU/i.test(x.lang) && /premium|enhanced/i.test(x.name)) || en.find((x) => /^en[-_]AU/i.test(x.lang) && /karen|lee|catherine/i.test(x.name))
      || by(/^en[-_]AU/i) || by(/^en[-_]GB/i) || by(/^en[-_]US/i) || en[0] || null;
    return this.auto;
  },
  find(uri, name, vs = this.list()) { return (uri && vs.find((x) => x.voiceURI === uri)) || (name && vs.find((x) => x.name === name)) || null; },
  pick() { const gd = guide(); return this.find(gd.voiceURI, gd.voiceName) || this.autoPick(); },
  speak(text, v, rate, pitch) {
    try {
      clearTimeout(this.timer); speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-AU';
      u.rate = rate; u.pitch = pitch; u.volume = 1;
      speechSynthesis.speak(u);
    } catch { /* speech is a nice-to-have */ }
  },
  // `still` (optional) is checked when a delayed line is due, so it never plays over a different screen.
  say(text, delay = 0, still = null) {
    if (!this.ok() || !text || !S.settings.sound || !guide().voice) return;
    clearTimeout(this.timer);
    const go = () => { if (still && !still()) return; const gd = guide(); this.speak(text, this.pick(), gd.rate, gd.pitch); };
    if (delay) this.timer = setTimeout(go, delay); else go();
  },
  // Settings preview: plays even when the game's sound is muted (they tapped to hear it).
  preview(text, v, rate, pitch) { if (this.ok()) this.speak(text, v, rate, pitch); },
  stop() { clearTimeout(this.timer); if (this.ok()) { try { speechSynthesis.cancel(); } catch { /* ignore */ } } },
  // iPad only lets a page start speech from a tap; an empty utterance on the first tap unlocks it for later.
  unlock() {
    if (this.unlocked || !this.ok()) return;
    this.unlocked = true;
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch { /* ignore */ }
  },
};
if (Voice.ok()) {
  try {
    speechSynthesis.addEventListener('voiceschanged', () => {
      Voice.auto = undefined;
      const ov = topOverlay('voice'); if (ov) renderOverlay(ov);
    });
  } catch { /* old Safari */ }
}

// After a render: type out a new line (once per screen) and say it; stop talking when he's off screen.
function meekoAfterRender() {
  const el = $('.meeko-line[data-say-key]', appRoot);
  if (!el) { if (UI.meekoTalking) { Voice.stop(); UI.meekoTalking = false; } UI.meekoKey = null; return; }
  const key = el.dataset.sayKey; const text = el.getAttribute('aria-label') || '';
  // Moved to a different Meeko screen: drop anything still queued or playing from the last one.
  if (UI.meekoKey && UI.meekoKey !== key && UI.meekoTalking) { Voice.stop(); UI.meekoTalking = false; }
  UI.meekoKey = key;
  UI.meekoSaid = UI.meekoSaid || {};
  if (!key || UI.meekoSaid[key]) return;
  UI.meekoSaid[key] = true;
  if (UI.route === 'play') {
    // A woof on the round intro, a bark on answers and the leaderboard, a howl for the winner; he speaks after it.
    const stage = document.body.dataset.stage;
    const bark = guide().bark && S.settings.sound ? { intro: 'woofwoof', aintro: 'bark', board: 'bark', final: 'howl' }[stage] : null;
    const still = () => { const cur = $('.meeko-line[data-say-key]', appRoot); return !!cur && cur.dataset.sayKey === key; };
    if (bark) { if (stage === 'final') setTimeout(() => { if (still()) Sound.sample('howl', 0.8); }, 1500); else Sound.sample(bark); }
    Voice.say(text, !bark ? 0 : stage === 'final' ? 4300 : stage === 'intro' ? 800 : 450, still);
    UI.meekoTalking = true;
  }
  if (reduceMotion()) return;
  const typed = $('.typed', el); el.classList.add('typing');
  const chars = Array.from(text); let n = 0;
  const step = () => {
    if (!document.body.contains(el)) return;
    n = Math.min(chars.length, n + 2);
    typed.textContent = chars.slice(0, n).join('');
    if (n < chars.length) el._tw = setTimeout(step, 28); else el.classList.remove('typing');
  };
  step();
}

// ===================== Wake lock & fullscreen =====================
let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator && !wakeLock && document.visibilityState === 'visible') {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!on && wakeLock) { const w = wakeLock; wakeLock = null; await w.release(); }
  } catch { wakeLock = null; }
}
const fsSupported = () => !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
const fsActive = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
async function toggleFullscreen() {
  try {
    if (fsActive()) await (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else { const el = document.documentElement; await (el.requestFullscreen || el.webkitRequestFullscreen).call(el); }
  } catch { toast('Full screen is not available here'); }
}

// ===================== Toasts & confetti =====================
function toast(msg, kind = '') {
  let wrap = $('.toast-wrap');
  if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; wrap.setAttribute('role', 'status'); document.body.appendChild(wrap); }
  const t = document.createElement('div');
  t.className = 'toast ' + kind; t.textContent = msg; wrap.appendChild(t);
  setTimeout(() => t.remove(), kind === 'bad' ? 5000 : 2600);
}
function confetti(duration = 2800, count = 170) {
  if (reduceMotion()) return;
  const c = document.createElement('canvas'); c.className = 'confetti'; document.body.appendChild(c);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = (c.width = innerWidth * dpr); const H = (c.height = innerHeight * dpr);
  const ctx = c.getContext('2d');
  const colors = ['#ff8a1f', '#9b5cff', '#8be04e', '#ffd54a', '#efeaff', '#ff4d6d'];
  const parts = Array.from({ length: count }, (_, i) => ({
    x: Math.random() * W, y: -Math.random() * H * 0.6, vx: (Math.random() - 0.5) * 5 * dpr, vy: (2 + Math.random() * 4) * dpr,
    r: (5 + Math.random() * 7) * dpr, a: Math.random() * 6.28, va: (Math.random() - 0.5) * 0.3, c: colors[i % colors.length],
  }));
  const start = performance.now();
  (function frame(now) {
    const e = now - start;
    ctx.clearRect(0, 0, W, H);
    const fade = Math.max(0, Math.min(1, 1 - (e - duration + 700) / 700));
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.06 * dpr; p.vx *= 0.995; p.a += p.va;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.globalAlpha = fade; ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore();
    }
    if (e < duration) requestAnimationFrame(frame); else c.remove();
  })(start);
}

// ===================== Game logic =====================
function newGame() {
  const base = `${S.title || 'Trivia Day'} · ${(() => { try { return new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); } catch { return ''; } })()}`;
  const names = new Set(Object.values(S.games).map((g) => g.name));
  let name = base; let n = 2;
  while (names.has(name)) name = `${base} (${n++})`;
  const g = normalizeGame({ id: uid('g'), name, status: 'setup', createdAt: Date.now(), updatedAt: Date.now(), playerIds: [], rounds: [] });
  return g;
}
function newRound(masterId) {
  return { id: uid('r'), masterId, category: '', themeId: DEFAULT_THEME, themeAuto: true, emoji: '', skip: false, questions: [] };
}
function ensureRounds(g) {
  for (const pid of g.playerIds) if (!g.rounds.some((r) => r.masterId === pid)) g.rounds.push(newRound(pid));
}
const livePlayerIds = (g) => g.playerIds.filter((id) => S.players[id] && !S.players[id].deleted);
// Games still being set up drop players who have since been deleted (here, on another device, or by a restore).
function pruneSetup(g) {
  if (!g || g.status !== 'setup') return false;
  const keep = livePlayerIds(g);
  if (keep.length === g.playerIds.length) return false;
  g.playerIds = keep; touchGame(g); return true;
}
const setupRounds = (g) => g.rounds.filter((r) => g.playerIds.includes(r.masterId) && S.players[r.masterId]);
const playable = (g) => g.rounds.filter((r) => g.playerIds.includes(r.masterId) && !r.skip && r.questions.length > 0);
function diffCounts(r) { const c = { 1: 0, 2: 0, 3: 0 }; for (const q of r.questions) c[q.diff] = (c[q.diff] || 0) + 1; return c; }
const roundPoints = (r) => r.questions.reduce((s, q) => s + ptsOf(q), 0);

function curRound(g) {
  const pr = playable(g);
  if (!pr.length) return null;
  let r = pr.find((x) => x.id === g.pos.roundId);
  if (!r) {
    // The round we were on was removed or emptied: move on to the next one, or back to the
    // last one before it (its leaderboard if it was already scored).
    const all = g.rounds; const idx = all.findIndex((x) => x.id === g.pos.roundId);
    const later = idx >= 0 ? all.slice(idx + 1).find((x) => pr.includes(x)) : null;
    if (later) { r = later; g.pos = { roundId: r.id, stage: 'intro', q: 0 }; }
    else {
      const before = idx >= 0 ? all.slice(0, idx).reverse().find((x) => pr.includes(x)) : null;
      r = before || pr[pr.length - 1];
      g.pos = { roundId: r.id, stage: g.done[r.id] ? 'board' : 'intro', q: 0 };
    }
    touchGame(g);
  }
  const n = r.questions.length;
  if (g.pos.q >= n) g.pos.q = n - 1;
  if (g.pos.q < 0) g.pos.q = 0;
  return r;
}
function setPos(g, stage, roundId, q = 0) { g.pos = { roundId: roundId || g.pos.roundId, stage, q }; touchPos(g); touchGame(g); }
function finishGame(g, early = false) {
  const pr = playable(g);
  if (early && g.pos.stage !== 'final') g.endedFrom = { ...g.pos, resume: g.resume || null }; else delete g.endedFrom;
  delete g.resume;
  g.status = 'finished'; g.finishedAt = g.finishedAt || Date.now();
  setPos(g, 'final', pr.length ? pr[pr.length - 1].id : g.pos.roundId);
}
// On a board of a finished game (or one reopened to fix a score), Next goes back to the podium.
function backToWinner(g, i) {
  const pr = playable(g);
  return g.status === 'finished' || (!!g.resume && g.resume.status === 'finished' && pr.slice(i + 1).every((x) => g.done[x.id]));
}
const samePos = (a, b) => !!a && !!b && a.roundId === b.roundId && a.stage === b.stage && (a.q || 0) === (b.q || 0);
function stepForward(g) {
  const pr = playable(g); const r = curRound(g); if (!r) return;
  const i = pr.indexOf(r); const n = r.questions.length; const p = g.pos;
  switch (p.stage) {
    case 'intro': setPos(g, 'q', r.id, 0); break;
    case 'q': if (p.q < n - 1) setPos(g, 'q', r.id, p.q + 1); else setPos(g, 'aintro', r.id); break;
    case 'aintro': setPos(g, 'a', r.id, 0); break;
    case 'a': if (p.q < n - 1) setPos(g, 'a', r.id, p.q + 1); else { g.done[r.id] = true; setPos(g, 'board', r.id); } break;
    case 'board':
      if (backToWinner(g, i)) { g.status = 'finished'; delete g.resume; setPos(g, 'final', pr[pr.length - 1].id); }
      else if (i < pr.length - 1) setPos(g, 'intro', pr[i + 1].id);
      else finishGame(g);
      break;
    default: break;
  }
  if (g.resume && samePos(g.resume.pos, g.pos)) delete g.resume;
}
function stepBack(g) {
  const pr = playable(g); const r = curRound(g); if (!r) return;
  const i = pr.indexOf(r); const n = r.questions.length; const p = g.pos;
  switch (p.stage) {
    case 'intro': if (i > 0) setPos(g, g.done[pr[i - 1].id] ? 'board' : 'intro', pr[i - 1].id); break;
    case 'q': if (p.q > 0) setPos(g, 'q', r.id, p.q - 1); else setPos(g, 'intro', r.id); break;
    case 'aintro': setPos(g, 'q', r.id, n - 1); break;
    case 'a': if (p.q > 0) setPos(g, 'a', r.id, p.q - 1); else setPos(g, 'aintro', r.id); break;
    case 'board': setPos(g, 'a', r.id, n - 1); break;
    case 'final':
      if (g.endedFrom) {
        const { resume, ...pos } = g.endedFrom;
        delete g.endedFrom; g.status = 'playing'; g.pos = pos; touchPos(g);
        if (resume) g.resume = resume;
        touchGame(g);
      }
      else { const last = pr.slice().reverse().find((x) => g.done[x.id]) || pr[pr.length - 1]; setPos(g, 'board', last.id); }
      break;
    default: break;
  }
}

// Standings after the playable round at index `upto` (inclusive). upto = -1 → before any round.
function computeStandings(g, upto) {
  const pr = playable(g);
  const ids = g.playerIds.filter((id) => S.players[id]);
  const tot = {}; const last = {};
  for (const id of ids) { tot[id] = 0; last[id] = 0; }
  pr.forEach((r, i) => {
    if (i > upto) return;
    for (const q of r.questions) {
      for (const pid of g.marks[q.id] || []) {
        if (!(pid in tot) || pid === r.masterId) continue;
        tot[pid] += ptsOf(q);
        if (i === upto) last[pid] += ptsOf(q);
      }
    }
  });
  const bonus = {};
  for (const a of g.adjustLog) {
    if (!(a.pid in tot)) continue;
    const i = adjustIndex(g, a, pr);
    if (i > upto) continue;
    tot[a.pid] += a.d;
    if (i === upto) bonus[a.pid] = (bonus[a.pid] || 0) + a.d;
  }
  const rows = ids.map((id) => ({ id, score: tot[id], round: last[id], bonus: bonus[id] || 0 }));
  rows.sort((a, b) => b.score - a.score || nameOf(a.id).localeCompare(nameOf(b.id)));
  let rank = 0;
  rows.forEach((row, i) => { if (i === 0 || row.score !== rows[i - 1].score) rank = i + 1; row.rank = rank; });
  for (const row of rows) row.tie = rows.filter((x) => x.rank === row.rank).length > 1;
  return rows;
}
// A bonus counts from the leaderboard of the round it was given in (or from the start if that round is gone).
function adjustIndex(g, a, pr = playable(g)) { return a.r ? pr.findIndex((x) => x.id === a.r) : -1; }
const adjustTotal = (g, pid) => g.adjustLog.filter((a) => a.pid === pid).reduce((s, a) => s + (a.d || 0), 0);
function roundScores(g, r) {
  const out = {};
  for (const q of r.questions) for (const pid of g.marks[q.id] || []) if (pid !== r.masterId) out[pid] = (out[pid] || 0) + ptsOf(q);
  return out;
}
const listNames = (a) => (a.length <= 2 ? a.join(' and ') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
function gameStatusLine(g) {
  if (g.status === 'setup') {
    const rs = setupRounds(g).filter((r) => !r.skip);
    const ready = rs.filter((r) => r.category.trim() && r.questions.length).length;
    if (!g.playerIds.length) return 'No players picked yet';
    return `${plural(g.playerIds.length, 'player')} · ${ready} of ${rs.length} rounds ready`;
  }
  if (g.status === 'finished') {
    const pr = playable(g); const st = computeStandings(g, pr.length - 1);
    const w = st.filter((x) => x.rank === 1);
    if (!w.length) return 'Finished';
    if (w[0].score <= 0) return 'No points scored';
    if (w.length > 3) return `${w.length}-way tie (${w[0].score} pts)`;
    return `${w.length > 1 ? 'Winners' : 'Winner'}: ${listNames(w.map((x) => nameOf(x.id)))} (${w[0].score} pts)`;
  }
  const pr = playable(g); const r = curRound(g);
  if (!r) return 'No rounds to play';
  const i = pr.indexOf(r);
  const stage = { intro: 'starting', q: `question ${g.pos.q + 1}`, aintro: 'answers next', a: `answer ${g.pos.q + 1}`, board: 'leaderboard', final: 'final scores' }[g.pos.stage] || '';
  return `Round ${i + 1} of ${pr.length} · ${r.category || 'Untitled'} · ${stage}`;
}

// ===================== Multiple choice =====================
// Every question is the right answer plus wrong ones. Players see them in a shuffled order that is
// fixed per question (q.seed), so the right answer isn't always A and every device shows the same letters.
const LETTERS = 'ABCDEF';
function mulberry(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const PIN_LAST = /^(all|none|both|neither)\b.*\b(above|these|them)\b/i; // "All of the above" stays last
function choiceList(q) {
  const right = String(q.answer || '').trim();
  const wrong = (q.wrong || []).map((w) => String(w).trim()).filter(Boolean);
  if (!right || !wrong.length) return [];
  const list = [{ t: right, ok: true }, ...wrong.map((t) => ({ t, ok: false }))];
  const rnd = mulberry(((q.seed >>> 0) ^ hashStr(q.id)) >>> 0);
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  return [...list.filter((c) => !PIN_LAST.test(c.t)), ...list.filter((c) => PIN_LAST.test(c.t))];
}
function mcProblem(q) {
  if (!String(q.answer || '').trim()) return 'Add the right answer';
  if (!(q.wrong || []).some((w) => String(w).trim())) return 'Add at least one wrong answer';
  return '';
}
const newSeed = () => Math.floor(Math.random() * 0x7fffffff);
function choicesHTML(ch, { compact = false, revealed = false } = {}) {
  const long = ch.some((c) => c.t.length > 34);
  return `<div class="choices ${compact ? 'compact' : ''} ${long ? 'long' : ''}" data-n="${ch.length}">${ch.map((c, k) => `<div class="choice ${revealed ? (c.ok ? 'correct' : 'dim') : ''}"><span class="letter">${LETTERS[k]}</span><span class="ct">${esc(c.t)}</span>${revealed && c.ok ? `<span class="tickmark" aria-label="Right answer">${ic('check')}</span>` : ''}</div>`).join('')}</div>`;
}
function mcPreview(q) {
  const prob = mcProblem(q);
  if (prob) return `<span class="hint warn">${esc(prob)} so this shows as multiple choice.</span>`;
  return `<span class="hint">Players see:</span>${choiceList(q).map((c, k) => `<span class="mc-chip ${c.ok ? 'ok' : ''}"><b>${LETTERS[k]}</b> ${esc(c.t)}</span>`).join('')}<button class="link-btn" data-act="q-shuffle" data-q="${q.id}">${ic('shuffle')} Shuffle order</button>`;
}

// ===================== Paste import =====================
// Strict: the whole cell or label is a difficulty ("hard", "3", "2 pts").
function parseDiff(s) {
  s = String(s || '').trim().toLowerCase().replace(/\s*(?:pts?|points?)\.?$/, '').replace(/[.!]+$/, '');
  if (/^(e|easy|1|one)$/.test(s)) return 1;
  if (/^(m|med|medium|2|two)$/.test(s)) return 2;
  if (/^(h|hard|3|three|difficult)$/.test(s)) return 3;
  return 0;
}
// Loose: only for text already known to be a difficulty (a difficulty column or "Difficulty:" line).
function parseDiffLoose(s) {
  const strict = parseDiff(s);
  if (strict) return strict;
  const t = String(s || '').toLowerCase();
  if (/\b(hard|difficult|tricky|tough)\b/.test(t)) return 3;
  if (/\b(med|medium|moderate|intermediate)\b/.test(t)) return 2;
  if (/\b(easy|simple)\b/.test(t)) return 1;
  const m = t.match(/^\s*([123])\s*(?:pts?|points?)?\b/);
  return m ? Number(m[1]) : 0;
}
const TAG = '(easy|medium|med|hard|difficult|e|m|h|[123]\\s*(?:pts?|points?)?)';
const TAG_END = new RegExp(`\\s*[[(]\\s*${TAG}\\s*[\\])]\\s*$`, 'i');
// At the start of a line a bare "(1)" is numbering, so a number needs "pt" to count as a level there.
const TAG_START = /^\s*[[(]\s*(easy|medium|med|hard|difficult|e|m|h|[123]\s*(?:pts?|points?))\s*[\])]\s*/i;
const TAG_WORD_START = /^(easy|medium|med|hard)\s*[:\-–]\s+/i;
// Pull a difficulty tag like "(hard)", "[3 pts]" or "EASY:" off either end of a line.
function extractTag(t) {
  let text = String(t).trim(); let diff = 0; let m;
  if ((m = text.match(TAG_END))) { diff = parseDiff(m[1]); text = text.slice(0, m.index).trim(); }
  if (!diff && (m = text.match(TAG_START))) { diff = parseDiff(m[1]); text = text.slice(m[0].length).trim(); }
  if (!diff && (m = text.match(TAG_WORD_START))) { diff = parseDiff(m[1]); text = text.slice(m[0].length).trim(); }
  return { text, diff };
}
// "1. ", "2) ", "(3) ", "Q4: ", "5 - Who…" and "1.What" are numbering; "1.5 million", "10:30", "3-2-1",
// "2001: A Space Odyssey" and "4 - 2" are not.
const NUMBERING = /^(?:q(?:uestion)?\s*\d*\s*[:.)]\s*|\(\d{1,2}\)\s+|\d{1,2}\s*[.)]\s+|\d{1,2}\s*[:\-–]\s+(?=[^\d\s])|\d{1,2}[.)](?=[A-Za-z]))/i;
const stripNum = (t) => String(t).replace(NUMBERING, '').trim();
const CHAT_PREFIX = [
  /^\[\d{1,2}[/.]\d{1,2}[/.]\d{2,4},?\s[^\]]*\]\s*[^:]{1,40}:\s*/, // WhatsApp (iOS): [28/10/2026, 9:14 pm] Sam:
  /^\d{1,2}[/.]\d{1,2}[/.]\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s?[ap]\.?m\.?)?\s*[-–]\s*[^:]{1,40}:\s*/i, // WhatsApp export
];
const BULLET = /^(?:[•·▪◦●‣*➤►▶→]|\p{Extended_Pictographic}️?|[-–—](?=\s))\s*/u;
// Markdown from ChatGPT and friends: headings, **bold** and *italic* markers.
const MD_HEADING = /^#{1,6} +(?=\S)/;
const MARKDOWN = (l) => (l.includes('\t') ? l : l.replace(MD_HEADING, '')).replace(/\*\*|__/g, '').replace(/(^|[\s(])[*_]([^*_\s](?:[^*_]*[^*_\s])?)[*_](?=$|[\s).,:;!?])/g, '$1$2');
const ANSWER_LABEL = /^(?:a\d*\s*[:)]|a\d*\.\s+|(?:(?:correct|right)\s+)?ans(?:wer)?\s*\d*\s*[:.)\-–])\s*(.*)$/i;
const OPTION = /^\(?([A-Fa-f])\s*[).:\-–]\s*(.*)$/; // "A) Sydney", "b. Canberra", "(C) Perth"
const OPTIONS_LABEL = /^(?:options?|choices?)\s*[:\-–]\s*(.*)$/i;
const WRONG_LABEL = /^(?:wrong|incorrect|other)\s*(?:answers?|options?|choices?)?\s*[:\-–]\s*(.*)$/i;
const RIGHT_MARK = /\s*(?:\*+|✅|✔️?|✓|☑️?|\((?:correct|right|answer)\)|\[(?:correct|right|answer)\]|<-+|←|-+>)\s*$/iu;
const normText = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const listSplit = (t) => String(t).split(/\s*[,;|/]\s*/).map((x) => x.trim()).filter(Boolean);
// Options written on the question line: "Capital? A) Sydney B) Canberra C) Perth".
function splitInlineOptions(text) {
  const re = /(?:^|\s)\(?([A-Fa-f])[).]\s+/g; const hits = []; let m;
  while ((m = re.exec(text))) hits.push({ letter: m[1].toUpperCase(), idx: m.index + (/^\s/.test(m[0]) ? 1 : 0), end: re.lastIndex });
  const start = hits.findIndex((h, k) => h.letter === 'A' && hits[k + 1] && hits[k + 1].letter === 'B');
  if (start < 0) return null;
  const run = [hits[start]];
  for (let k = start + 1; k < hits.length && hits[k].letter === LETTERS[run.length]; k++) run.push(hits[k]);
  const q = text.slice(0, run[0].idx).trim();
  if (!q) return null;
  const options = run.map((h, k) => text.slice(h.end, k + 1 < run.length ? run[k + 1].idx : text.length).trim());
  let answer = '';
  const am = options[options.length - 1].match(/\s+(?:correct\s+|right\s+)?(?:answer|ans)\s*[:\-–]\s*(.+)$/i);
  if (am) { answer = am[1].trim(); options[options.length - 1] = options[options.length - 1].slice(0, am.index).trim(); }
  return { text: q, options, answer };
}
// Turn a question's options plus whatever answer was given into right answer + wrong answers.
function resolveChoices(cur) {
  const opts = (cur.options || []).map((o) => ({ ...o, text: String(o.text || '').replace(RIGHT_MARK, '').trim(), star: o.star || RIGHT_MARK.test(String(o.text || '')) }));
  const given = String(cur.answer || '').trim();
  if (!opts.length) { cur.wrong = (cur.wrongLine || []).slice(0, 5); return; }
  let idx = -1;
  if (given) {
    const lm = given.match(/^\(?([A-Fa-f])\)?(?:\s*[).:\-–]\s*(.*))?$/);
    if (lm && LETTERS.indexOf(lm[1].toUpperCase()) < opts.length) idx = LETTERS.indexOf(lm[1].toUpperCase());
    if (idx < 0) idx = opts.findIndex((o) => normText(o.text) === normText(given));
  }
  if (idx < 0) { const st = opts.filter((o) => o.star); if (st.length === 1) idx = opts.indexOf(st[0]); }
  if (idx < 0 && !given) { const b = opts.filter((o) => o.bold); if (b.length === 1) idx = opts.indexOf(b[0]); }
  const texts = opts.map((o) => o.text);
  if (idx >= 0) { cur.answer = texts[idx]; cur.wrong = texts.filter((t, k) => k !== idx && t); }
  else if (given) cur.wrong = texts.filter((t) => t && normText(t) !== normText(given));
  else { cur.answer = ''; cur.wrong = texts.filter(Boolean); cur.unmarked = true; }
  cur.wrong = cur.wrong.slice(0, 5);
}
const DIFF_LABEL = /^(?:d\s*[:)]|diff(?:iculty)?\s*[:.)\-–]|level\s*[:.)\-–]|points?\s*[:.)\-–])\s*(.*)$/i;
const CATEGORY_LABEL = /^(?:category|topic|theme|round(?:\s*\d+)?(?:\s*name)?)\s*[:\-–]\s*(.*)$/i;
const SECTION = /^(easy|medium|med|hard|difficult)(?:\s+(?:questions?|ones|round|section))?\s*:?$/i;
const SECTION_PTS = /^(easy|medium|med|hard|difficult)(?:\s+(?:questions?|ones|round|section))?\s*[-–:]?\s*\(?\s*\d\s*(?:pts?|points?)(?:\s+each)?\s*\)?\s*:?$/i;
const ANSWER_KEY = /^(?:the\s+)?(?:answers|answer\s+(?:key|sheet))\s*:?$/i;
const HEADER_CELL = /^(#|no\.?|num(?:ber)?|q|questions?|[a-f]|answers?|(?:right|correct)(?:\s+answers?)?|(?:wrong|incorrect|other)(?:\s+answers?)?(?:\s*\d)?|(?:options?|choices?|distractors?)(?:\s*[a-f\d])?|difficulty|diff|level|points?|pts|score|category|round|notes?|comments?)$/i;
// A cell that is only a level, e.g. "Hard", "Easy (1 pt)", "Hard - 3pts" (not "Die Hard").
const DIFF_CELL = /^\W*(easy|medium|med|hard|difficult|tricky|tough|moderate|simple)\W*(?:\(?\s*-?\s*\d\s*(?:pts?|points?)\s*\)?)?\W*$/i;
const isDiffCell = (c) => !!c && (!!parseDiff(c) || DIFF_CELL.test(c));
// Which column is which, from a header row like "Question | Right answer | Wrong 1 | Wrong 2 | Level"
// or "Question | A | B | C | D | Answer".
function mapHeader(cells) {
  const m = { q: -1, a: -1, wrong: [], opts: [], diff: -1 };
  cells.forEach((c, k) => {
    const t = c.trim();
    if (/^(q|questions?)$/i.test(t)) m.q = k;
    else if (/^[a-f]$/i.test(t) || /^(?:options?|choices?)\s*[a-f\d]$/i.test(t)) m.opts.push(k);
    else if (/^(answers?|(?:right|correct)(?:\s+answers?)?)$/i.test(t)) m.a = k;
    else if (/^(wrong|incorrect|other|options?|choices?|distractors?)/i.test(t)) m.wrong.push(k);
    else if (/^(difficulty|diff|level|points?|pts|score)$/i.test(t)) m.diff = k;
  });
  if (m.q < 0) m.q = 0;
  if (m.a < 0 && !m.opts.length) m.a = m.q === 0 ? 1 : 0;
  return m;
}
const QEND = /\?["'”’)\]]*\s*(?:[([][^()[\]]*[)\]])?\s*$/; // ends like a question, allowing a trailing hint "(2 words)"
const QSTART = /^(who|what|which|where|when|why|how|name|identify|list|give|complete|finish|spell|translate|unscramble|guess|true or false)\b/i;
// "Question? - Answer" / "Question? A: Answer": safe to split as soon as the line is read.
const INLINE_SURE = /^(.+?\?["'”’]?)\s*(?:\b(?:a\d*\s*[:)\-–]|a\d*\.\s+|ans(?:wer)?\s*[:.\-–]\s*)|[-–—=:])\s*(.+)$/i;
// "Question? (Answer)" and "Clue = Answer": only when nothing better turned up; flagged for checking.
function splitSoft(text) {
  let m;
  if ((m = text.match(/^(.+?\?)\s*\(([^()]+)\)\s*$/)) && !/\b(words?|letters?|hint|clue|pts?|points?)\b/i.test(m[2]) && !parseDiff(m[2])) return { text: m[1].trim(), answer: m[2].trim() };
  if ((m = text.match(/^(.+?)\s+(?:=|answer\s*[:\-–])\s+(.+)$/i))) return { text: m[1].trim(), answer: m[2].trim() };
  return null;
}
const unwrap = (s) => s.replace(/^\((.+)\)$/, '$1').trim();

function parseQuestions(text, defDiff = 1) {
  const clean = (l) => {
    for (const re of CHAT_PREFIX) l = l.replace(re, '');
    const raw = l.trim();
    return {
      hash: MD_HEADING.test(raw),
      star: /^(?:\*(?!\*)|✅|✔️?|✓|☑️?)\s*\(?[A-Fa-f][).:]/u.test(raw), // "* B) Canberra" marks the right option
      bold: /^(?:[-•*]\s+)?\*\*[^*].*\*\*\s*$/.test(raw),
      text: MARKDOWN(raw).replace(BULLET, '').trim(),
    };
  };
  const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n').map(clean).filter((l) => l.text);
  // Whether a spreadsheet's first column is row numbers is decided once for the whole paste.
  const splitRow = (l) => l.replace(/^\|/, '').replace(/\|$/, '').split(/\s*(?:\||\t)\s*/).map((c) => c.trim());
  const rows = lines.filter((l) => l.text.includes('|') || l.text.includes('\t')).map((l) => splitRow(l.text)).filter((c) => c.length >= 3 && !c.every((x) => !x || /^:?-{2,}:?$/.test(x)));
  const body = rows.filter((c) => !c.every((x) => !x || HEADER_CELL.test(x)));
  const numCol = rows.some((c) => c[0] === '#') || (body.length >= 2 && body.every((c) => /^\d{1,3}[.)]?$/.test(c[0])));
  const isNum = (s) => !!s && NUMBERING.test(s);

  const out = []; let cur = null; let category = ''; let section = 0; let keyMode = false; let colMap = null;
  const push = () => {
    if (cur && cur.text && !/^(your\s+)?questions?\??$/i.test(cur.text)) {
      if (!cur.answer && !cur.options.length) { const sp = splitSoft(cur.text); if (sp) { cur.text = sp.text; cur.answer = sp.answer; cur.soft = true; } }
      resolveChoices(cur);
      out.push(cur);
    }
    cur = null;
  };
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].text;
    const next = lines[i + 1] && lines[i + 1].text; const next2 = lines[i + 2] && lines[i + 2].text;
    let m;
    if ((m = line.match(CATEGORY_LABEL))) { push(); if (m[1].trim() && !category) category = m[1].trim(); continue; }
    // CSV: exactly two commas and a level in the last cell.
    if (!line.includes('|') && !line.includes('\t')) {
      const parts = line.split(',');
      if (parts.length === 3 && parseDiff(parts[2])) line = parts.map((p) => p.trim()).join('\t');
    }

    // Table rows: "Question | Answer | Difficulty", tab-separated rows from a spreadsheet, markdown tables.
    if (line.includes('|') || line.includes('\t')) {
      push();
      let cells = splitRow(line);
      if (cells.every((c) => !c || /^:?-{2,}:?$/.test(c))) continue; // markdown divider
      if (cells.length >= 3 && /^#?\d{0,3}[.)]?$/.test(cells[0]) && (numCol || cells.length >= 4 || !parseDiffLoose(cells[2]))) cells.shift(); // number column
      if (cells.every((c) => !c || HEADER_CELL.test(c))) { colMap = mapHeader(cells); continue; } // header row
      if (/^(q|questions?)\??$/i.test(cells[0]) && /^(a|answers?|(?:right|correct)\s+answers?)$/i.test(cells[1] || '')) continue; // untouched template row
      let diff = 0; let qText = ''; let right = ''; let wrongs = []; let opts = null;
      if (colMap) {
        qText = cells[colMap.q] || ''; right = colMap.a >= 0 ? cells[colMap.a] || '' : '';
        wrongs = colMap.wrong.map((k) => cells[k]).filter(Boolean);
        if (colMap.opts.length) opts = colMap.opts.map((k) => ({ text: cells[k] || '' }));
        diff = colMap.diff >= 0 ? parseDiffLoose(cells[colMap.diff]) : 0;
      } else {
        if (cells.length >= 3 && parseDiff(cells[0]) && /^[a-z]+$|^[123]$/i.test(cells[0]) && !isDiffCell(cells[cells.length - 1])) { diff = parseDiff(cells[0]); cells = cells.slice(1); } // difficulty first
        else if (cells.length >= 3 && isDiffCell(cells[cells.length - 1])) { diff = parseDiffLoose(cells[cells.length - 1]); cells = cells.slice(0, -1); } // difficulty last
        qText = cells[0] || ''; right = cells[1] || ''; wrongs = cells.slice(2).filter(Boolean);
      }
      const q = extractTag(stripNum(qText));
      const a = extractTag(right);
      if (!diff) diff = q.diff || a.diff;
      if (!q.text || /^(your\s+)?questions?\??$/i.test(q.text)) continue;
      const item = { text: q.text, answer: a.text, diff: diff || section, wrongLine: wrongs };
      if (opts) item.options = opts;
      resolveChoices(item);
      out.push(item);
      continue;
    }

    // "Answers" key at the end: numbered lines fill in the questions above.
    if (ANSWER_KEY.test(line) && out.length + (cur ? 1 : 0) >= 2) { push(); keyMode = true; continue; }
    if (keyMode) {
      const km = line.match(/^(?:q(?:uestion)?\s*)?(\d{1,2})\s*[.):\-–]\s*(.+)$/i);
      const target = km ? out[+km[1] - 1] : out.find((q) => !q.answer);
      if (target) {
        const t = extractTag(km ? km[2] : line);
        if (!target.answer) { target.answer = unwrap(t.text); target.unmarked = false; if (target.options && target.options.length) resolveChoices(target); }
        if (t.diff) target.diff = t.diff;
        continue;
      }
    }
    // "Easy (1 point each)" is always a heading.
    if ((m = line.match(SECTION_PTS))) { push(); section = parseDiff(m[1]); continue; }

    // Lettered options: "A) Sydney" counts as an option when a "B)" follows or options have started.
    if (cur && (m = line.match(OPTION))) {
      const L = m[1].toUpperCase();
      const nm = next && next.match(OPTION);
      if (cur.options.length ? L === LETTERS[cur.options.length] : (L === 'A' && nm && nm[1].toUpperCase() === 'B')) {
        cur.options.push({ text: m[2], star: lines[i].star, bold: lines[i].bold }); continue;
      }
    }
    if (cur && (m = line.match(OPTIONS_LABEL))) { cur.options = listSplit(m[1]).map((t) => ({ text: t })); continue; }
    if (cur && (m = line.match(WRONG_LABEL))) { cur.wrongLine = listSplit(m[1]); continue; }
    const waiting = cur && !cur.answer && !cur.options.length;
    if ((m = line.match(ANSWER_LABEL))) { if (cur) { const t = extractTag(m[1]); cur.answer = unwrap(t.text); if (t.diff) cur.diff = t.diff; } continue; }
    if ((m = line.match(DIFF_LABEL))) { if (cur) cur.diff = parseDiffLoose(m[1]) || cur.diff; continue; }
    // A bare "Easy"/"Hard questions" line is a heading unless a question is waiting for its answer
    // ("What's the opposite of soft?\nHard"). In a questions-only numbered list it is still a heading.
    if ((m = line.match(SECTION)) && (!waiting || (cur.numbered && isNum(next) && (!next2 || isNum(next2) || SECTION.test(next2))))) { push(); section = parseDiff(m[1]); continue; }
    const numbered = NUMBERING.test(line);
    if (cur && cur.options.length && !cur.answer && !numbered && !QEND.test(line)) { const t = extractTag(line); cur.answer = t.text; if (t.diff) cur.diff = t.diff; continue; }
    if (waiting && !numbered) {
      // A question that wrapped onto the next line.
      if (!/[?.!:)\]"”’']\s*$/.test(cur.text) && /^[a-z]/.test(line) && (!cur.numbered || QEND.test(line))) { cur.text += ' ' + line; continue; }
      if (cur.numbered || ((QEND.test(cur.text) || cur.tagged || QSTART.test(cur.text)) && !QEND.test(line) && !QSTART.test(line))) {
        const t = extractTag(line); cur.answer = unwrap(t.text); if (t.diff) cur.diff = t.diff; continue;
      }
    }
    push();
    const t = extractTag(stripNum(line));
    cur = { text: t.text, answer: '', diff: t.diff || section, numbered, tagged: !!t.diff, hash: lines[i].hash, options: [], wrongLine: [] };
    const inl = splitInlineOptions(cur.text);
    if (inl) { cur.text = inl.text; cur.options = inl.options.map((x) => ({ text: x })); if (inl.answer) cur.answer = inl.answer; continue; }
    if ((m = cur.text.match(INLINE_SURE))) {
      const a = extractTag(m[2]);
      cur.text = m[1].trim();
      if (parseDiff(a.text)) cur.diff = cur.diff || parseDiff(a.text); // "Question? - Easy": a level, not an answer
      else { cur.answer = a.text; if (a.diff) cur.diff = a.diff; }
    }
  }
  push();
  // A greeting or title line before a numbered list ("Here's my round!", "### Movie Trivia") is not a question.
  if (out.length >= 2 && !out[0].numbered && !out[0].answer && !out[0].tagged && !QEND.test(out[0].text) && out[1].numbered) {
    const intro = out.shift();
    if (intro.hash && !category) category = intro.text;
  }
  return {
    category,
    questions: out.map((q) => ({ text: q.text, answer: q.answer, wrong: (q.wrong || []).slice(0, 5), diff: q.diff || defDiff, split: !!q.soft, unmarked: !!q.unmarked })),
  };
}
const TEMPLATE = 'Category: \n\n1. Your question?\nA) \nB) \nC) \nD) \nAnswer: \nLevel: easy\n';

// ===================== Demo data =====================
function loadDemo() {
  const now = Date.now();
  const names = ['Alex', 'Bea', 'Charlie', 'Dee'];
  const ids = names.map((n, i) => {
    const id = uid('p');
    S.players[id] = { id, name: `${n} (demo)`, demo: true, createdAt: now + i, updatedAt: now + i, hasPhoto: true };
    return id;
  });
  const g = newGame();
  g.name = 'Demo game'; g.demo = true; g.playerIds = ids.slice();
  const R = (pi, category, themeId, qs) => ({ id: uid('r'), masterId: ids[pi], category, themeId, themeAuto: false, emoji: '', skip: false,
    questions: qs.map(([text, answer, wrong, diff]) => ({ id: uid('q'), text, answer, wrong, diff, seed: newSeed() })) });
  g.rounds = [
    R(0, 'Horror Movies', 'haunt', [
      ["What is the name of the killer doll in the Child's Play films?", 'Chucky', ['Annabelle', 'Slappy', 'Billy'], 1],
      ['Which 1960 Alfred Hitchcock film is set at the Bates Motel?', 'Psycho', ['Vertigo', 'The Birds', 'Rear Window'], 2],
      ["In which year was John Carpenter's original Halloween released?", '1978', ['1974', '1981', '1984'], 3]]),
    R(1, 'Space', 'orbit', [
      ['Which planet is known as the Red Planet?', 'Mars', ['Venus', 'Jupiter', 'Mercury'], 1],
      ['What is the name of the galaxy our solar system is in?', 'The Milky Way', ['Andromeda', 'The Whirlpool Galaxy', 'Triangulum'], 2],
      ['Roughly how long does sunlight take to reach Earth?', 'About 8 minutes', ['About 8 seconds', 'About 8 hours', 'About 1 minute'], 3]]),
    R(2, 'Food & Drink', 'diner', [
      ['Which fruit is the main ingredient in guacamole?', 'Avocado', ['Lime', 'Tomato', 'Cucumber'], 1],
      ['Which nut is used to make marzipan?', 'Almond', ['Hazelnut', 'Walnut', 'Pistachio'], 2],
      ['Which spice comes from the dried stigmas of a crocus flower?', 'Saffron', ['Turmeric', 'Paprika', 'Cumin'], 3]]),
    R(3, 'Music Legends', 'vinyl', [
      ['Which band recorded “Bohemian Rhapsody”?', 'Queen', ['The Beatles', 'Led Zeppelin', 'ABBA'], 1],
      ['In which English city were The Beatles formed?', 'Liverpool', ['Manchester', 'London', 'Birmingham'], 2],
      ["What was Elvis Presley's middle name?", 'Aaron', ['James', 'Lee', 'Wayne'], 3]]),
  ];
  normalizeGame(g);
  S.games[g.id] = g;
  return g;
}

// ===================== Overlays =====================
let ovRoot;
function pushOverlay(ov) {
  ov.openedAt = performance.now();
  ov.el = document.createElement('div');
  ov.el.className = 'ov-layer';
  ovRoot.appendChild(ov.el);
  overlays.push(ov);
  renderOverlay(ov);
  const focusEl = ov.el.querySelector('[autofocus]') || ov.el.querySelector('.sheet');
  if (focusEl) { try { focusEl.focus({ preventScroll: true }); } catch { /* ignore */ } }
  return ov;
}
function renderOverlay(ov) {
  const fn = OVERLAY_VIEWS[ov.type];
  if (!fn) return;
  if (ov.el.firstChild) ov.el.classList.add('entered');
  try { ov.el.innerHTML = fn(ov); } catch (e) { console.error(e); ov.el.innerHTML = ''; }
  if (ov.after) ov.after(ov);
}
function popOverlay() {
  const ov = overlays.pop();
  if (!ov) return;
  if (ov.onClose) ov.onClose();
  ov.el.remove();
}
function closeAllOverlays() { while (overlays.length) popOverlay(); }
const topOverlay = (type) => { const o = overlays[overlays.length - 1]; return o && (!type || o.type === type) ? o : null; };

function askConfirm({ title, body = '', ok = 'OK', danger = false }) {
  return new Promise((resolve) => {
    pushOverlay({ type: 'confirm', title, body, ok, danger, resolve, onClose() { resolve(false); } });
  });
}

// ===================== Views =====================
function themeClasses(t) {
  return [t.light ? 'th-light' : '', t.boxed ? 'th-boxed' : '', t.upper ? 'th-upper' : '', t.titleItalic ? 'th-italic' : ''].join(' ');
}
const roundEmoji = (r) => (r.emoji && r.emoji.trim()) || themeOf(r.themeId).emoji;

function viewHome() {
  const roster = rosterList();
  const games = Object.values(S.games).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const live = games.filter((g) => g.status !== 'finished').slice(0, 2);
  const finished = games.filter((g) => g.status === 'finished');
  const missing = roster.filter((p) => !hasPhoto(p)).length;
  const lastWin = finished[0] ? gameStatusLine(finished[0]).replace(/^Winner: /, '') : '';
  return `<main class="page">
    <header class="home-hero">
      <div>
        <div class="date">${esc(todayLabel())}</div>
        <h1>${esc(S.title || 'Trivia Day')}<span class="dot">.</span></h1>
        <div class="edition">Halloween edition</div>
        <div class="marquee" aria-hidden="true">${'<i></i>'.repeat(12)}</div>
      </div>
      <button class="icon-btn" data-act="route" data-to="settings" aria-label="Settings">${ic('gear')}</button>
    </header>
    ${homeMeeko(roster, live)}
    ${live.map(continueCard).join('')}
    ${cloudCardHTML()}
    <section class="tiles">
      <button class="tile tile-new" data-act="new-game">
        <span class="tile-icon">${ic('play')}</span>
        <div class="stack" style="gap:6px"><h2>New game</h2><p>Pick who's playing, then add each guest's category and questions.</p></div>
      </button>
      <button class="tile" data-act="route" data-to="players">
        <span class="tile-icon">${ic('users')}</span>
        <div class="stack" style="gap:6px"><h2>Players</h2><p>${roster.length ? `${plural(roster.length, 'guest')} on the list${missing ? ` · ${missing} still need a photo` : ''}` : 'Add your guests and snap a photo of each outfit.'}</p></div>
        ${roster.length ? `<div class="strip">${roster.slice(0, 12).map((p) => avatar(p)).join('')}</div>` : ''}
      </button>
      <button class="tile" data-act="route" data-to="history">
        <span class="tile-icon">${ic('trophy')}</span>
        <div class="stack" style="gap:6px"><h2>Past games</h2><p>${finished.length ? `${plural(finished.length, 'game')} played${lastWin ? ` · last winner ${esc(lastWin)}` : ''}` : 'Final scores land here after each game.'}</p></div>
      </button>
    </section>
    ${roster.length ? '' : `
    <section class="stack">
      <div class="section-title"><h2>How the day runs</h2></div>
      <div class="how">
        <div class="step"><span class="n">STEP 1</span><b>Add players</b><p>Each guest gets a profile photo of them in their outfit.</p></div>
        <div class="step"><span class="n">STEP 2</span><b>Set up rounds</b><p>Every guest picks a category and writes up to 10 questions: easy, medium or hard.</p></div>
        <div class="step"><span class="n">STEP 3</span><b>Host your round</b><p>The guest runs their round as trivia master on a screen themed to their category.</p></div>
        <div class="step"><span class="n">STEP 4</span><b>Score it</b><p>Reveal each answer and tap who got it. Easy 1 point, medium 2, hard 3.</p></div>
      </div>
      <div class="panel demo-row"><div><b>Want a dry run first?</b><p class="muted">Load four demo players and a short game to see every screen. Remove it any time in Settings.</p></div><button class="btn" data-act="load-demo">${ic('sparkle')} Try the demo game</button></div>
    </section>`}
    ${syncNoteHTML()}
  </main>`;
}
function homeMeeko(roster, live) {
  UI.homeSeed = UI.homeSeed || Math.floor(Math.random() * 1000);
  const g = live.find((x) => x.status === 'playing');
  let line;
  if (g) { const pr = playable(g); const r = curRound(g); line = meekoLine('home_live', { round: Math.max(1, pr.indexOf(r) + 1), total: pr.length }, 'h', UI.homeSeed); }
  else line = roster.length ? meekoLine('home_ready', { count: roster.length }, 'h', UI.homeSeed) : meekoLine('home_first', {}, 'h', UI.homeSeed);
  const nPh = guide().photos.length;
  return `<section class="home-meeko">${meekoSay(line, { size: 'lg', pic: UI.homeSeed })}<button class="link-btn meeko-edit" data-act="edit-guide">${ic('camera')} ${nPh ? `${esc(guide().name)}'s photos (${nPh})` : `Add ${esc(guide().name)}'s photos`}</button></section>`;
}
function continueCard(g) {
  return `<section class="continue-card">
    <div class="avatars">${g.playerIds.slice(0, 5).map((id) => avatar(S.players[id])).join('')}</div>
    <div style="min-width:0"><div class="eyebrow">${g.status === 'playing' ? 'Game in progress' : 'Being set up'}</div><h3>${esc(gameName(g))}</h3><div class="status">${esc(gameStatusLine(g))}</div></div>
    <div class="actions"><button class="btn btn-primary" data-act="open-game" data-g="${g.id}">${g.status === 'playing' ? `${ic('play')} Continue` : 'Keep setting up'}</button></div>
  </section>`;
}

function viewPlayers() {
  const roster = rosterList();
  return `<main class="page">
    <header class="page-head">
      <button class="icon-btn" data-act="route" data-to="home" aria-label="Back to home">${ic('left')}</button>
      <div style="flex:1;min-width:0"><h1>Players</h1><div class="sub">${roster.length ? `${plural(roster.length, 'guest')} · tap a card to edit or retake a photo` : 'Add everyone who is playing today'}</div></div>
      <button class="btn btn-primary" data-act="add-player">${ic('plus')} Add player</button>
    </header>
    ${meekoSay(meekoLine('players_tip', {}, 'p', UI.homeSeed || 0), { size: 'sm', cls: 'tip', pic: (UI.homeSeed || 0) + 1 })}
    <section class="player-grid">
      ${roster.map((p) => `<button class="player-card" data-act="edit-player" data-p="${p.id}">${portrait(p)}${p.demo ? '<span class="tag">Demo</span>' : !hasPhoto(p) ? '<span class="tag">No photo yet</span>' : ''}<span class="name">${esc(p.name)}</span></button>`).join('')}
      <button class="player-card add" data-act="add-player"><span class="portrait"><span class="plus">${ic('camera')}<span>Add a player</span></span></span><span class="name">&nbsp;</span></button>
    </section>
  </main>`;
}

function viewSetup() {
  const g = G();
  if (pruneSetup(g)) Saver.schedule();
  const step = UI.step;
  const steps = [['players', 'Players'], ['rounds', 'Categories & questions'], ['review', 'Start']];
  const canRounds = g.playerIds.length >= 2;
  let body = ''; let foot = '';
  if (step === 'players') {
    const roster = rosterList();
    const n = g.playerIds.length;
    body = `
      <div class="field"><label for="g-name">Game name</label><input class="input" id="g-name" data-bind="g-name" value="${esc(g.name)}" maxlength="60" autocomplete="off"></div>
      <div class="section-title"><h2>Who's playing?</h2><div class="row">${roster.length ? `<button class="link-btn" data-act="select-all">${roster.every((p) => g.playerIds.includes(p.id)) ? 'Clear all' : 'Select everyone'}</button>` : ''}</div></div>
      <section class="player-grid">
        ${roster.map((p) => { const on = g.playerIds.includes(p.id); return `<button class="player-card selectable" data-act="toggle-player" data-p="${p.id}" aria-pressed="${on}">${portrait(p)}<span class="check">${ic('check')}</span><span class="name">${esc(p.name)}</span></button>`; }).join('')}
        <button class="player-card add" data-act="add-player" data-from="setup"><span class="portrait"><span class="plus">${ic('camera')}<span>New player</span></span></span><span class="name">&nbsp;</span></button>
      </section>`;
    foot = `<span class="grow">${n ? `${plural(n, 'player')} picked${n < 2 ? ' · pick at least 2' : ''}` : 'Tap the people who are playing'}</span>
      <button class="btn btn-primary" data-act="step" data-s="rounds" ${canRounds ? '' : 'disabled'}>Next: categories ${ic('right')}</button>`;
  } else if (step === 'rounds') {
    const rs = setupRounds(g);
    let num = 0;
    body = `
      <div class="section-title"><h2>Rounds &amp; questions</h2><button class="btn btn-sm btn-ghost" data-act="shuffle-rounds">${ic('shuffle')} Shuffle order</button></div>
      <p class="muted">Rounds play top to bottom. Each guest is trivia master for their own round and sits out the scoring for it.</p>
      <div class="round-list">${rs.map((r, i) => { const plays = !r.skip && r.questions.length; if (plays) num++; return roundRow(g, r, i, rs.length, plays ? num : 0); }).join('')}</div>`;
    const ready = rs.filter((r) => !r.skip && r.category.trim() && r.questions.length).length;
    const hosting = rs.filter((r) => !r.skip).length;
    foot = `<button class="btn btn-ghost" data-act="step" data-s="players">${ic('left')} Players</button>
      <span class="grow">${ready} of ${hosting} rounds ready</span>
      <button class="btn btn-primary" data-act="step" data-s="review">Next: review ${ic('right')}</button>`;
  } else {
    const pr = playable(g);
    const qs = pr.reduce((s, r) => s + r.questions.length, 0);
    const pts = pr.reduce((s, r) => s + roundPoints(r), 0);
    const warns = setupWarnings(g);
    body = `
      <div class="panel big-stats"><div><b>${pr.length}</b><span>rounds</span></div><div><b>${qs}</b><span>questions</span></div><div><b>${pts}</b><span>points in play</span></div><div><b>${g.playerIds.length}</b><span>players</span></div></div>
      ${warns.length ? `<ul class="warn-list">${warns.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
      <div class="section-title"><h2>Running order</h2><button class="link-btn" data-act="step" data-s="rounds">Change order</button></div>
      <div class="review-grid">${pr.map((r, i) => reviewCard(r, i)).join('') || '<p class="muted">No rounds have questions yet.</p>'}</div>`;
    foot = `<button class="btn btn-ghost" data-act="step" data-s="rounds">${ic('left')} Rounds</button><span class="grow"></span>
      <button class="btn btn-xl btn-primary" data-act="start-game" ${pr.length && g.playerIds.length >= 2 ? '' : 'disabled'}>${ic('play')} Start the game</button>`;
  }
  return `<main class="page">
    <header class="page-head">
      <button class="icon-btn" data-act="route" data-to="home" aria-label="Back to home">${ic('left')}</button>
      <div style="flex:1;min-width:0"><div class="eyebrow">${g.demo ? 'Demo game' : 'New game'}</div><h1>${esc(gameName(g))}</h1></div>
    </header>
    <nav class="stepper" aria-label="Setup steps">${steps.map(([id, label], i) => `<button data-act="step" data-s="${id}" ${id !== 'players' && !canRounds ? 'disabled' : ''} ${step === id ? 'aria-current="step"' : ''}><span class="n">${i + 1}</span>${label}</button>`).join('')}</nav>
    ${body}
  </main>
  <div class="footer-bar"><div class="inner">${foot}</div></div>`;
}
function setupWarnings(g) {
  const out = [];
  for (const r of setupRounds(g)) {
    if (r.skip) continue;
    const who = nameOf(r.masterId);
    if (!r.questions.length) out.push(`${who}'s round has no questions yet, so it will be skipped.`);
    else {
      if (!r.category.trim()) out.push(`${who}'s round has no category name.`);
      const notMC = r.questions.filter((q) => mcProblem(q)).length;
      const noText = r.questions.filter((q) => !q.text.trim()).length;
      if (noText) out.push(`${who}'s round has ${plural(noText, 'question')} with no question text.`);
      if (notMC) out.push(`${who}'s round has ${plural(notMC, 'question')} missing a right answer or wrong answers, so ${notMC === 1 ? "it isn't" : "they aren't"} multiple choice yet.`);
    }
  }
  if (g.playerIds.length < 2) out.push('Pick at least two players.');
  return out;
}
function roundRow(g, r, i, n, num) {
  const p = S.players[r.masterId]; const t = themeOf(r.themeId); const c = diffCounts(r);
  const notMC = r.questions.filter((q) => mcProblem(q)).length;
  const status = r.skip ? '<span class="chip off">Just playing</span>'
    : !r.questions.length ? '<span class="chip warn">No questions yet</span>'
      : !r.category.trim() ? '<span class="chip warn">Needs a category</span>'
        : notMC ? `<span class="chip warn">${notMC} need${notMC === 1 ? 's' : ''} choices</span>` : '<span class="chip ok">Ready</span>';
  return `<div class="round-row ${r.skip ? 'skip' : ''}">
    <div class="order">
      <button class="icon-btn sm" data-act="round-move" data-r="${r.id}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move up">${ic('up')}</button>
      <button class="icon-btn sm" data-act="round-move" data-r="${r.id}" data-dir="1" ${i === n - 1 ? 'disabled' : ''} aria-label="Move down">${ic('down')}</button>
    </div>
    <span class="swatch th-${t.id}" style="${themeVars(t)}" aria-hidden="true">${esc(roundEmoji(r))}</span>
    <button class="who" data-act="edit-round" data-r="${r.id}" style="background:none;border:0;text-align:left;padding:0">
      <span class="cat ${r.category.trim() ? '' : 'empty'}">${esc(r.category.trim() || 'No category yet')}</span>
      <span class="by">${r.skip ? 'Not hosting' : num ? `Round ${num}` : 'Not in the running order until it has questions'} · ${esc(p ? p.name : 'Unknown')}</span>
    </button>
    <div class="counts">${r.questions.length && !r.skip ? `<span class="chip off">${r.questions.length} Q</span>${c[1] ? `<span class="chip d1">${c[1]} easy</span>` : ''}${c[2] ? `<span class="chip d2">${c[2]} med</span>` : ''}${c[3] ? `<span class="chip d3">${c[3]} hard</span>` : ''}` : ''}${status}</div>
    <button class="btn btn-sm" data-act="edit-round" data-r="${r.id}">${ic('edit')} Edit</button>
  </div>`;
}
function reviewCard(r, i) {
  const t = themeOf(r.themeId); const p = S.players[r.masterId]; const c = diffCounts(r);
  return `<div class="review-card stage th-${t.id} ${themeClasses(t)}" style="${themeVars(t)}">
    <div class="rc-top"><span class="rc-no">Round ${i + 1}</span><span style="font-size:28px" aria-hidden="true">${esc(roundEmoji(r))}</span></div>
    <div class="rc-title">${esc(r.category || 'Untitled round')}</div>
    <div class="rc-foot">${avatar(p)}<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p ? p.name : '')}</span><span class="nums">${r.questions.length} Q · ${c[1]}/${c[2]}/${c[3]}</span></div>
  </div>`;
}

function viewRound() {
  const g = G();
  const r = g && g.rounds.find((x) => x.id === UI.roundId);
  if (!r) { UI.route = UI.returnTo === 'play' ? 'play' : 'setup'; return viewFor(); }
  const p = S.players[r.masterId]; const t = themeOf(r.themeId);
  const live = UI.returnTo === 'play';
  return `<main class="page">
    <header class="page-head">
      <button class="icon-btn" data-act="round-done" aria-label="Back">${ic('left')}</button>
      <div style="flex:1;min-width:0"><div class="eyebrow">${live ? 'Editing during the game' : 'Round setup'}</div><h1>${esc(p ? p.name : 'Guest')}'s round</h1></div>
      <button class="btn btn-primary" data-act="round-done">${ic('check')} Done</button>
    </header>
    ${meekoSay(meekoLine('setup_tip', {}, r.id), { size: 'sm', cls: 'tip', pic: hashStr(r.id) })}
    <div class="editor-grid">
      <div class="stack" style="gap:20px">
        <div class="field"><label for="r-cat">Category</label><input class="input big" id="r-cat" data-bind="r-cat" value="${esc(r.category)}" placeholder="e.g. 90s Movies" maxlength="60" autocomplete="off"></div>
        ${live && !r.skip && roundStarted(g, r) ? '' : `<button class="switch" role="switch" aria-checked="${!r.skip}" data-act="r-skip"><span class="track"></span><span>${esc(p ? p.name : 'This guest')} is hosting a round</span></button>`}
        ${r.skip ? '<p class="muted">They will still play and score in everyone else\'s rounds.</p>' : `
        <div class="section-title"><h2>Questions <span class="muted nums" id="q-count">${r.questions.length}</span></h2>
          <div class="row"><button class="btn btn-sm btn-ghost" data-act="open-paste">${ic('paste')} Paste a list</button><button class="btn btn-sm btn-ghost" data-act="q-sort" ${r.questions.length < 2 ? 'disabled' : ''}>${ic('sort')} Easy to hard</button></div></div>
        <div class="q-list" id="q-list">${r.questions.length ? r.questions.map((q, i) => qCard(q, i, r.questions.length)).join('') : `<div class="q-empty"><b>No questions yet</b><span>Type them in one by one, or paste a list your guest sent you.</span><div class="row" style="justify-content:center"><button class="btn btn-primary" data-act="q-add">${ic('plus')} Add a question</button><button class="btn" data-act="open-paste">${ic('paste')} Paste a list</button></div></div>`}</div>
        ${r.questions.length ? `<div class="row"><button class="btn" data-act="q-add">${ic('plus')} Add question</button><span class="hint" id="q-hint">${esc(qHint(r))}</span></div>` : ''}`}
      </div>
      <aside class="stack" id="round-side">
        <div id="pv-slot">${previewCard(r, p)}</div>
        <div class="field"><span class="label">Theme</span>
          <div class="theme-grid">${THEMES.map((th) => `<button class="theme-tile th-${th.id} ${themeClasses(th)}" style="${themeVars(th)}" data-act="pick-theme" data-t="${th.id}" aria-pressed="${r.themeId === th.id}" aria-label="${th.name} theme"><span class="tt-inner"><span class="tt-aa">Aa</span><span class="tt-name">${th.name}</span></span><span class="tt-emoji" aria-hidden="true">${th.emoji}</span></button>`).join('')}</div>
          <p class="hint" id="theme-hint">${r.themeAuto !== false ? 'Matched to the category name. Tap any theme to choose your own.' : `You picked ${esc(t.name)}. <button class="link-btn" data-act="theme-auto">Match to category instead</button>`}</p>
        </div>
        <div class="field"><label for="r-emoji">Round icon</label><div class="row"><input class="input emoji-input" id="r-emoji" data-bind="r-emoji" value="${esc(r.emoji)}" placeholder="${esc(t.emoji)}" maxlength="8" autocomplete="off"><span class="hint" style="flex:1;min-width:140px">Any emoji. Leave it blank to use the theme's.</span></div></div>
      </aside>
    </div>
  </main>`;
}
function qHint(r) {
  const n = r.questions.length;
  const pts = roundPoints(r);
  if (n > 10) return `${n} questions, ${pts} points. That's more than 10, so this round will run long.`;
  return `${plural(n, 'question')} · ${pts} points · up to 10 is plenty`;
}
function qCard(q, i, n) {
  return `<div class="q-card" data-qcard="${q.id}">
    <div class="q-top"><span class="q-n">${i + 1}</span>
      <div class="seg" role="group" aria-label="Difficulty">${[1, 2, 3].map((d) => `<button data-act="q-diff" data-q="${q.id}" data-d="${d}" data-diff="${d}" aria-pressed="${q.diff === d}">${DIFF[d].label}<span class="p">${d}pt${d > 1 ? 's' : ''}</span></button>`).join('')}</div>
      <div class="q-tools">
        <button class="icon-btn sm" data-act="q-move" data-q="${q.id}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move question up">${ic('up')}</button>
        <button class="icon-btn sm" data-act="q-move" data-q="${q.id}" data-dir="1" ${i === n - 1 ? 'disabled' : ''} aria-label="Move question down">${ic('down')}</button>
        <button class="icon-btn sm" data-act="q-del" data-q="${q.id}" aria-label="Delete question">${ic('trash')}</button>
      </div>
    </div>
    <textarea class="textarea" id="qt-${q.id}" data-bind="q-text" data-q="${q.id}" rows="2" placeholder="Type the question">${esc(q.text)}</textarea>
    <div class="mc-edit">
      <div class="mc-row right"><span class="mc-tag ok">${ic('check')} Right answer</span><textarea class="textarea ans" id="qa-${q.id}" data-bind="q-ans" data-q="${q.id}" rows="1" placeholder="The correct answer" autocomplete="off" enterkeyhint="next">${esc(q.answer)}</textarea></div>
      <span class="mc-tag no">${ic('close')} Wrong answers</span>
      ${q.wrong.map((w, k) => `<div class="mc-row wrong"><input class="input" id="qw-${q.id}-${k}" data-bind="q-wrong" data-q="${q.id}" data-i="${k}" value="${esc(w)}" placeholder="A wrong answer" autocomplete="off" enterkeyhint="next"><button class="icon-btn sm" data-act="q-make-right" data-q="${q.id}" data-i="${k}" aria-label="Make this the right answer" title="Make this the right answer">${ic('check')}</button><button class="icon-btn sm" data-act="q-wrong-del" data-q="${q.id}" data-i="${k}" ${q.wrong.length <= 1 ? 'disabled' : ''} aria-label="Remove this wrong answer">${ic('close')}</button></div>`).join('')}
      ${q.wrong.length < 5 ? `<button class="link-btn mc-add" data-act="q-wrong-add" data-q="${q.id}">${ic('plus')} Add another wrong answer</button>` : ''}
      <div class="mc-preview" id="qp-${q.id}">${mcPreview(q)}</div>
    </div>
  </div>`;
}
function refreshQPreview(q) { const el = $('#qp-' + q.id); if (el) el.innerHTML = mcPreview(q); }
function rerenderQCard(q, focusSel) {
  const { r, i } = findQ(q.id); const el = $(`[data-qcard="${q.id}"]`);
  if (!r || !el) { render(); return; }
  el.outerHTML = qCard(q, i, r.questions.length);
  autosizeAll();
  if (focusSel) { const f = $(focusSel); if (f) { f.focus(); try { const v = f.value || ''; f.setSelectionRange(v.length, v.length); } catch { /* ignore */ } } }
}
function previewCard(r, p) {
  const t = themeOf(r.themeId);
  return `<div class="preview-card"><div class="stage th-${t.id} ${themeClasses(t)}" style="${themeVars(t)}"><div class="pv">
    <div class="pv-emoji" aria-hidden="true">${esc(roundEmoji(r))}</div>
    <div class="pv-title">${esc(r.category.trim() || 'Your category')}</div>
    <div class="pv-by">Hosted by ${esc(p ? p.name : 'your guest')}</div>
  </div></div></div>`;
}
function refreshRoundSide(r) {
  const p = S.players[r.masterId]; const t = themeOf(r.themeId);
  const slot = $('#pv-slot'); if (slot) slot.innerHTML = previewCard(r, p);
  for (const b of $$('.theme-tile')) b.setAttribute('aria-pressed', String(b.dataset.t === r.themeId));
  const hint = $('#theme-hint');
  if (hint) hint.innerHTML = r.themeAuto !== false ? 'Matched to the category name. Tap any theme to choose your own.' : `You picked ${esc(t.name)}. <button class="link-btn" data-act="theme-auto">Match to category instead</button>`;
  const em = $('#r-emoji'); if (em) em.placeholder = t.emoji;
}

// ---------- Play screens ----------
function resumeLabel(g) {
  const rp = g.resume && g.resume.pos;
  if (!rp) return '';
  if (rp.stage === 'final') return 'Back to the winner';
  const i = playable(g).findIndex((x) => x.id === rp.roundId);
  return i >= 0 ? `Back to round ${i + 1}` : 'Back to where you were';
}
function playBar(crumb, p) {
  const g = G();
  const back = g && g.resume ? `<button class="btn btn-sm btn-resume" data-act="resume">${ic('left')} ${esc(resumeLabel(g))}</button>` : '';
  return `<div class="play-bar${back ? ' has-resume' : ''}">
    <button class="icon-btn" data-act="menu" aria-label="Game menu">${ic('menu')}</button>
    <div class="grow"><span class="crumb">${esc(crumb)}</span>${p ? `<span class="pill">${avatar(p)}<span>${esc(p.name)}</span></span>` : ''}${back}<span class="chip save-chip" data-save-chip ${syncInfo().cls === 'bad' || Local.degraded ? '' : 'hidden'}>${syncInfo().cls === 'bad' ? 'Not saving' : 'Backup storage'}</span></div>
    <button class="icon-btn" data-act="toggle-sound" aria-label="${S.settings.sound ? 'Mute sound effects' : 'Turn sound effects on'}">${ic(S.settings.sound ? 'soundOn' : 'soundOff')}</button>
    ${fsSupported() ? `<button class="icon-btn" data-act="fullscreen" aria-label="Full screen">${ic('expand')}</button>` : ''}
  </div>`;
}
function diffBadge(d) {
  const x = DIFF[d] || DIFF[1];
  return `<span class="diff-badge d${d}"><i></i>${x.label}<span class="pts">${plural(x.pts, 'point')}</span></span>`;
}
function dotsHTML(r, cur, stage) {
  return `<div class="dots" aria-hidden="true">${r.questions.map((q, k) => `<i class="d${q.diff} ${k < cur ? 'done' : ''} ${k === cur ? 'on' : ''}"></i>`).join('')}</div>`;
}
function viewPlay() {
  const g = G();
  if (!g || g.status === 'setup') { UI.route = 'home'; return viewHome(); }
  const r = curRound(g);
  if (!r) return `<main class="page"><div class="panel stack"><h2>No rounds to play</h2><p class="muted">None of the rounds in this game have questions any more. Scores already given are kept with the questions that are left.</p><div class="row"><button class="btn btn-primary" data-act="to-setup">${ic('edit')} Back to setup</button><button class="btn" data-act="route" data-to="home">Home</button></div></div></main>`;
  const st = g.pos.stage;
  if (st === 'board') return viewBoard(g, r);
  if (st === 'final') return viewFinal(g);
  const t = themeOf(r.themeId); const p = S.players[r.masterId]; const pr = playable(g); const i = pr.indexOf(r); const n = r.questions.length;
  const q = r.questions[g.pos.q];
  const stageName = { intro: 'Up next', q: 'Questions', aintro: 'Answers', a: 'Answers' }[st] || '';
  let inner = '';
  if (st === 'intro') {
    const c = diffCounts(r);
    inner = `<div class="intro">
        <div class="round-no">Round ${i + 1} of ${pr.length}</div>
        <div class="emoji" aria-hidden="true">${esc(roundEmoji(r))}</div>
        <h1 class="cat-title">${esc(r.category || 'Mystery round')}</h1>
        <div class="host">${avatar(p)}<div><small>Your trivia master</small><strong>${esc(p ? p.name : '')}</strong></div></div>
        <div class="meta"><span class="chip off">${plural(n, 'question')}</span>${c[1] ? `<span class="chip d1">${c[1]} easy</span>` : ''}${c[2] ? `<span class="chip d2">${c[2]} medium</span>` : ''}${c[3] ? `<span class="chip d3">${c[3]} hard</span>` : ''}</div>
        ${meekoSay(introLine(g, r), { key: `${g.id}:${r.id}:intro`, size: 'md', cls: 'on-stage', pic: meekoTurn(g, i, 'intro') })}
      </div>
      <div class="play-foot"><button class="btn btn-stage-ghost" data-act="back" ${i === 0 ? 'disabled' : ''}>${ic('left')} Back</button><div class="mid"></div><button class="btn btn-xl btn-stage" data-act="fwd">Start questions ${ic('right')}</button></div>`;
  } else if (st === 'q') {
    inner = `<div class="q-stage">
        <div class="q-head"><div class="q-count">Question ${g.pos.q + 1}<small>of ${n}</small></div>${diffBadge(q.diff)}</div>
        ${(() => { const ch = choiceList(q); return `<div class="q-card-big ${ch.length ? 'has-choices' : ''}"><div class="q-fit"><div class="q-text" data-fit>${esc(q.text.trim() || 'No question text was entered for this one.')}</div></div>${ch.length ? choicesHTML(ch) : ''}</div>`; })()}
      </div>
      <div class="play-foot"><button class="btn btn-stage-ghost" data-act="back">${ic('left')} Back</button><div class="mid">${dotsHTML(r, g.pos.q)}</div>
        <button class="btn btn-xl btn-stage" data-act="fwd">${g.pos.q < n - 1 ? `Next question ${ic('right')}` : `Pens down ${ic('right')}`}</button></div>`;
  } else if (st === 'aintro') {
    inner = `<div class="inter">
        <div class="emoji" aria-hidden="true" style="font-size:clamp(56px,10vh,110px)">${esc(roundEmoji(r))}</div>
        <h1>Answers</h1>
        ${meekoSay(answersLine(g, r), { key: `${g.id}:${r.id}:aintro`, size: 'lg', cls: 'on-stage', pic: meekoTurn(g, i, 'aintro') })}
      </div>
      <div class="play-foot"><button class="btn btn-stage-ghost" data-act="back">${ic('left')} Back</button><div class="mid"></div><button class="btn btn-xl btn-stage" data-act="fwd">Reveal answers ${ic('right')}</button></div>`;
  } else {
    const revealed = !!g.revealed[q.id];
    const ch = choiceList(q); const okIdx = ch.findIndex((c) => c.ok);
    const cands = g.playerIds.filter((id) => id !== r.masterId && S.players[id]);
    const marked = (g.marks[q.id] || []).filter((id) => cands.includes(id));
    inner = `<div class="a-stage">
        <div class="q-head"><div class="q-count">Answer ${g.pos.q + 1}<small>of ${n}</small></div>${diffBadge(q.diff)}</div>
        <div class="a-card ${ch.length ? 'has-choices' : ''}">
          <div class="a-q">${esc(q.text.trim() || 'No question text')}</div>
          ${ch.length ? choicesHTML(ch, { compact: true, revealed }) : ''}
          <div class="a-reveal">${revealed
            ? `<span class="lbl">Answer</span><div class="a-answer ${q.answer.trim() ? '' : 'none'}">${okIdx >= 0 ? `<span class="a-letter">${LETTERS[okIdx]}</span>` : ''}${esc(q.answer.trim() || 'No answer was entered')}</div>`
            : `<button class="reveal-btn" data-act="reveal" data-q="${q.id}">${ic('eye')} Reveal the answer</button>`}</div>
        </div>
        <div class="who-label"><span class="q">Who got it right?</span><span class="count" id="who-count">${whoCount(marked.length, cands.length)}</span></div>
        <div class="tiles-area"><div class="pick-grid">${(() => { const labels = shortNames(cands); return cands.map((pid) => pickTile(S.players[pid], q, marked.includes(pid), labels[pid])).join(''); })()}</div></div>
      </div>
      <div class="play-foot"><button class="btn btn-stage-ghost" data-act="back">${ic('left')} Back</button><div class="mid">${dotsHTML(r, g.pos.q)}</div>
        <button class="btn btn-xl btn-stage" data-act="fwd">${g.pos.q < n - 1 ? `Next answer ${ic('right')}` : `Leaderboard ${ic('trophy')}`}</button></div>`;
  }
  return `<main class="play"><section class="stage th-${t.id} ${themeClasses(t)}" style="${themeVars(t)}"><div class="play-inner">
    ${playBar(`Round ${i + 1} of ${pr.length} · ${stageName}`, st === 'intro' ? null : p)}
    ${inner}
  </div></section></main>`;
}
function whoCount(k, m) { return k ? `${k} of ${m} got it` : 'Nobody yet'; }
function shortNames(ids) {
  const parts = Object.fromEntries(ids.map((id) => [id, nameOf(id).trim().split(/\s+/)]));
  const count = {};
  for (const id of ids) { const f = (parts[id][0] || '').toLowerCase(); count[f] = (count[f] || 0) + 1; }
  const out = {};
  for (const id of ids) {
    const p = parts[id]; const f = p[0] || '';
    out[id] = count[f.toLowerCase()] > 1 ? (p.length > 1 ? `${f} ${Array.from(p[p.length - 1])[0]}.` : nameOf(id)) : f;
  }
  // Still clashing ("Sam B." twice): lengthen the surname, then fall back to the full name.
  for (let k = 2; k <= 6; k++) {
    const seen = {}; for (const id of ids) seen[out[id]] = (seen[out[id]] || 0) + 1;
    const dup = ids.filter((id) => seen[out[id]] > 1);
    if (!dup.length) break;
    for (const id of dup) { const p = parts[id]; out[id] = p.length > 1 ? `${p[0]} ${Array.from(p[p.length - 1]).slice(0, k).join('')}${Array.from(p[p.length - 1]).length > k ? '.' : ''}` : nameOf(id); }
  }
  { const seen = {}; for (const id of ids) seen[out[id]] = (seen[out[id]] || 0) + 1; for (const id of ids) if (seen[out[id]] > 1) out[id] = nameOf(id); }
  return out;
}
function pickTile(pl, q, on, label) {
  return `<button class="pick" data-act="mark" data-q="${q.id}" data-p="${pl.id}" aria-pressed="${on}" aria-label="${esc(pl.name)}">${portrait(pl)}<span class="pname">${esc(label || pl.name)}</span><span class="tick">${ic('check')}</span><span class="plus-pts">+${ptsOf(q)}</span></button>`;
}

function viewBoard(g, r) {
  const pr = playable(g); const i = pr.indexOf(r); const last = i === pr.length - 1;
  const cur = computeStandings(g, i); const prev = computeStandings(g, i - 1);
  const prevIdx = {}; const prevRow = {};
  prev.forEach((x, k) => { prevIdx[x.id] = k; prevRow[x.id] = x; });
  const max = Math.max(1, ...cur.map((x) => x.score));
  const pct = (s) => Math.round(clamp(s / max, 0, 1) * 100);
  const host = S.players[r.masterId];
  const next = pr[i + 1];
  const rows = cur.map((row, k) => {
    const pl = S.players[row.id];
    const pv = prevRow[row.id] || { score: 0, rank: row.rank };
    const mv = i > 0 ? pv.rank - row.rank : 0;
    const base = row.id === r.masterId ? 'Hosted this round' : row.round ? `+${row.round} this round` : 'No points this round';
    const note = row.bonus ? `${base} · ${row.bonus > 0 ? '+' : ''}${row.bonus} bonus` : base;
    return `<div class="lb-row ${row.rank <= 3 ? 'r' + row.rank : ''}" data-from="${prevIdx[row.id] ?? k}" data-to="${k}" data-s0="${pv.score}" data-s1="${row.score}">
      <div class="rank">${row.tie ? '=' : ''}${row.rank}${mv > 0 ? `<span class="mv up" aria-label="up ${mv}">▲${mv}</span>` : mv < 0 ? `<span class="mv down" aria-label="down ${-mv}">▼${-mv}</span>` : ''}</div>
      ${avatar(pl)}
      <div class="nm"><b>${esc(pl ? pl.name : '')}</b><small class="${row.round || row.bonus || row.id === r.masterId ? '' : 'zero'}">${esc(note)}</small></div>
      <div class="bar"><i style="--w:${pct(pv.score)}%" data-w1="${pct(row.score)}"></i></div>
      <div class="score" data-score>${pv.score}</div>
      ${row.rank === 1 && row.score > 0 ? '<span class="crown" aria-hidden="true">👑</span>' : ''}
    </div>`;
  }).join('');
  return `<main class="play"><section class="stage board"><div class="play-inner">
    ${playBar(`Round ${i + 1} of ${pr.length} complete`, null)}
    <div class="board-head"><div class="bh-title"><h1>${last ? 'Final <span>scores</span>' : 'Leader<span>board</span>'}</h1><div class="after">After ${esc(r.category || `round ${i + 1}`)} with ${esc(host ? host.name : '')}</div></div>
      ${meekoSay(boardLine(g, r), { key: `${g.id}:${r.id}:board`, size: 'sm', cls: 'on-board', pic: meekoTurn(g, i, 'board') })}</div>
    <div class="lb" id="lb" data-key="${g.id}:${r.id}">${rows}</div>
    <div class="play-foot"><button class="btn btn-ghost" data-act="back">${ic('left')} Back</button><div class="mid"></div>
      ${last || backToWinner(g, i) ? `<button class="btn btn-xl btn-primary" data-act="fwd">${ic('trophy')} ${backToWinner(g, i) ? 'Back to the winner' : 'Reveal the winner'}</button>`
        : `<button class="btn btn-xl btn-primary" data-act="fwd"><span style="overflow:hidden;text-overflow:ellipsis">Next: ${esc(next.category || `Round ${i + 2}`)}</span> ${ic('right')}</button>`}
    </div>
  </div></section></main>`;
}
function layoutBoard() {
  const lb = $('#lb'); if (!lb) return null;
  const rows = $$('.lb-row', lb); const n = rows.length || 1;
  const H = lb.clientHeight; const W = lb.clientWidth;
  // A long list on a wide, short screen splits into two columns so photos stay a decent size.
  const cols = n > 6 && W >= 860 && Math.floor(H / n) < 66 ? 2 : 1;
  const perCol = Math.ceil(n / cols);
  const gap = 14;
  const rowH = clamp(Math.floor(H / perCol), 40, 100);
  const colW = cols === 2 ? Math.floor((W - gap) / 2) : W;
  lb.style.setProperty('--row-h', rowH + 'px');
  lb.style.setProperty('--av-size', Math.max(32, rowH - 14) + 'px');
  lb.style.setProperty('--col-w', colW + 'px');
  lb.classList.toggle('two-col', cols === 2);
  for (const el of rows) el.classList.toggle('compact', rowH < 58 || cols === 2);
  return { rowH, perCol, colW, gap };
}
function placeRow(el, idx, L) {
  const c = Math.floor(idx / L.perCol); const r = idx % L.perCol;
  el.style.transform = `translate(${c * (L.colW + L.gap)}px, ${r * L.rowH}px)`;
}
function animateBoard(snapOnly) {
  const lb = $('#lb'); if (!lb) return;
  const L = layoutBoard();
  const rows = $$('.lb-row', lb);
  const key = lb.dataset.key;
  const finalState = () => {
    for (const t of lb._timers || []) clearTimeout(t);
    lb._timers = []; lb.dataset.final = '1';
    for (const el of rows) {
      el.style.transition = 'none'; placeRow(el, +el.dataset.to, L);
      const bar = el.querySelector('.bar i'); bar.style.transition = 'none'; bar.style.setProperty('--w', bar.dataset.w1 + '%');
      el.querySelector('[data-score]').textContent = el.dataset.s1;
    }
    lb.classList.add('shown');
    void lb.offsetHeight; // commit the final positions before transitions come back
    for (const el of rows) { el.style.transition = ''; el.querySelector('.bar i').style.transition = ''; }
  };
  if (snapOnly || UI.boardAnimated[key] || reduceMotion()) { finalState(); return; }
  UI.boardAnimated[key] = true;
  for (const el of rows) { el.style.transition = 'none'; placeRow(el, +el.dataset.from, L); }
  void lb.offsetHeight;
  for (const el of rows) el.style.transition = '';
  const live = () => document.body.contains(lb) && lb.dataset.final !== '1';
  lb._timers = [
    setTimeout(() => {
      if (!live()) return;
      lb.classList.add('shown'); Sound.play('board');
      for (const el of rows) {
        const bar = el.querySelector('.bar i'); bar.style.setProperty('--w', bar.dataset.w1 + '%');
        countUp(el.querySelector('[data-score]'), +el.dataset.s0, +el.dataset.s1, 1000, lb);
      }
    }, 450),
    setTimeout(() => { if (live()) for (const el of rows) placeRow(el, +el.dataset.to, L); }, 1600),
    setTimeout(() => { if (live()) confetti(2200, 120); }, 2600),
  ];
}
function countUp(el, from, to, ms, owner) {
  if (!el) return;
  const start = performance.now();
  (function tick(now) {
    if (!document.body.contains(el) || (owner && owner.dataset.final === '1')) return;
    const k = clamp((now - start) / ms, 0, 1);
    el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(tick);
  })(start);
}

function viewFinal(g) {
  const pr = playable(g); const st = computeStandings(g, pr.length - 1);
  const top = st.slice(0, 3); const rest = st.slice(3);
  const winners = st.filter((x) => x.rank === 1);
  const line = !st.length ? '' : st[0].score <= 0 ? 'No points scored this time.'
    : winners.length > 3 ? `It's a ${winners.length}-way tie at the top!`
      : winners.length > 1 ? `It's a tie between ${esc(listNames(winners.map((x) => nameOf(x.id))))}!`
        : `${esc(nameOf(winners[0].id))} wins ${esc(S.title || 'Trivia Day')}!`;
  const pod = (row, k) => {
    if (!row) return '<div class="pod empty"></div>';
    const pl = S.players[row.id];
    return `<div class="pod p${k + 1} rk${Math.min(row.rank, 3)}">${portrait(pl)}<div class="nm">${esc(pl ? pl.name : '')}</div><div class="block"><span class="place">${row.tie ? '=' : ''}${ordinal(row.rank)}</span><span class="pts">${plural(row.score, 'pt')}</span></div></div>`;
  };
  return `<main class="play"><section class="stage board"><div class="play-inner">
    ${playBar('Game over', null)}
    <div class="board-head"><div class="bh-title"><h1>And the winner <span>is…</span></h1><div class="after">${esc(gameName(g))}</div></div>
      ${meekoSay(finalLine(g), { key: `${g.id}:final`, size: 'sm', cls: 'on-board', pic: meekoTurn(g, playable(g).length, 'final') })}</div>
    <div class="podium-wrap" style="${rest.length ? '' : 'grid-template-columns:minmax(0,1fr)'}">
      <div class="podium">${[1, 0, 2].map((k) => pod(top[k], k)).join('')}</div>
      ${rest.length ? `<div class="rest">${rest.map((row) => { const pl = S.players[row.id]; return `<div class="rest-row"><span class="rank">${row.tie ? '=' : ''}${row.rank}</span>${avatar(pl)}<b>${esc(pl ? pl.name : '')}</b><span class="score">${row.score}</span></div>`; }).join('')}</div>` : ''}
    </div>
    ${finalLine(g) ? '' : `<div class="winner-line">${line}</div>`}
    <div class="play-foot"><button class="btn btn-ghost" data-act="back">${ic('left')} Back</button><div class="mid"></div>
      <button class="btn" data-act="open-results" data-g="${g.id}">${ic('list')} Round by round</button>
      <button class="btn btn-xl btn-primary" data-act="finish-game">${ic('home')} Finish</button></div>
  </div></section></main>`;
}

function viewResults() {
  const g = G(); if (!g) { UI.route = 'history'; return viewHistory(); }
  const pr = playable(g); const st = computeStandings(g, pr.length - 1);
  const per = pr.map((r) => roundScores(g, r));
  const hasAdj = g.playerIds.some((id) => adjustTotal(g, id) !== 0);
  // Toughest question: fewest correct among eligible players.
  let tough = null;
  for (const r of pr) {
    const elig = g.playerIds.filter((id) => id !== r.masterId && S.players[id]).length;
    for (const q of r.questions) {
      const k = (g.marks[q.id] || []).filter((id) => id !== r.masterId).length;
      if (g.revealed[q.id] || g.done[r.id]) if (!tough || k / Math.max(1, elig) < tough.ratio) tough = { q, r, k, elig, ratio: k / Math.max(1, elig) };
    }
  }
  let best = null;
  pr.forEach((r, i) => { for (const [pid, s] of Object.entries(per[i])) if (!best || s > best.s) best = { pid, s, r }; });
  return `<main class="page">
    <header class="page-head">
      <button class="icon-btn" data-act="route" data-to="${g.status === 'finished' ? 'history' : 'play'}" aria-label="Back">${ic('left')}</button>
      <div style="flex:1;min-width:0"><div class="eyebrow">${esc(shortDate(g.finishedAt || g.updatedAt))}</div><h1>${esc(gameName(g))}</h1><div class="sub">${esc(gameStatusLine(g))}</div></div>
      ${g.status === 'finished' ? `<button class="btn" data-act="open-final" data-g="${g.id}">${ic('trophy')} Podium</button>` : ''}
    </header>
    <div class="table-wrap"><table class="scores">
      <thead><tr><th class="pcol">Player</th><th>Total</th>${pr.map((r, i) => `<th class="cat" title="${esc(r.category)}">R${i + 1} · ${esc(r.category || 'Untitled')}</th>`).join('')}${hasAdj ? '<th>Bonus</th>' : ''}</tr></thead>
      <tbody>${st.map((row) => { const pl = S.players[row.id]; return `<tr><td class="p"><span class="pc">${row.tie ? '=' : ''}${row.rank}. ${avatar(pl)} <span class="pn">${esc(pl ? pl.name : '')}</span></span></td><td class="tot">${row.score}</td>${pr.map((r, i) => r.masterId === row.id ? '<td class="host">host</td>' : `<td>${per[i][row.id] || 0}</td>`).join('')}${hasAdj ? `<td>${adjustTotal(g, row.id) > 0 ? '+' : ''}${adjustTotal(g, row.id)}</td>` : ''}</tr>`; }).join('')}</tbody>
    </table></div>
    <div class="how" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">
      ${best ? `<div class="step"><span class="n">BEST ROUND</span><b>${esc(nameOf(best.pid))}</b><p>${plural(best.s, 'point')} in ${esc(best.r.category || 'a round')}</p></div>` : ''}
      ${tough ? `<div class="step"><span class="n">TOUGHEST QUESTION</span><b>${esc(tough.q.text)}</b><p>${tough.k} of ${tough.elig} got it · answer: ${esc(tough.q.answer || '—')}</p></div>` : ''}
    </div>
  </main>`;
}

function viewHistory() {
  const games = Object.values(S.games).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return `<main class="page">
    <header class="page-head"><button class="icon-btn" data-act="route" data-to="home" aria-label="Back to home">${ic('left')}</button><div style="flex:1;min-width:0"><h1>Games</h1><div class="sub">Finished games keep their scores here.</div></div></header>
    <div class="game-list">${games.length ? games.map((g) => {
      const st = g.status === 'finished' ? computeStandings(g, playable(g).length - 1) : [];
      const w = st[0] ? S.players[st[0].id] : null;
      return `<div class="game-row">
        ${w ? avatar(w, 'av-56') : `<span class="chip ${g.status === 'playing' ? 'warn' : 'off'}">${g.status === 'playing' ? 'Playing' : 'Setup'}</span>`}
        <div style="min-width:0"><h3>${esc(gameName(g))}</h3><div class="meta">${esc(shortDate(g.finishedAt || g.updatedAt))} · ${esc(gameStatusLine(g))}</div></div>
        <div class="acts"><button class="btn btn-sm" data-act="open-game" data-g="${g.id}">${g.status === 'finished' ? 'Scores' : g.status === 'playing' ? 'Continue' : 'Set up'}</button><button class="btn btn-sm btn-danger" data-act="delete-game" data-g="${g.id}">Delete</button></div>
      </div>`;
    }).join('') : '<div class="panel"><p class="muted">No games yet. Start one from the home screen.</p></div>'}</div>
  </main>`;
}

const cloudLinked = () => Cloud.http && !['needkey', 'badkey'].includes(Cloud.status);
function cloudKeyForm(id) {
  return `<form class="row cloud-form" data-cloud-form onsubmit="return false"><input class="input" id="${id}" type="text" inputmode="text" autocapitalize="none" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Event code" maxlength="60" enterkeyhint="go" style="max-width:260px"><button class="btn btn-primary" data-act="cloud-connect" data-input="${id}">${ic('check')} Connect</button></form>`;
}
function voiceSummary() {
  const gd = guide();
  if (!gd.voice) return `Voice off${gd.bark ? ', barks on' : ''}.`;
  const v = Voice.find(gd.voiceURI, gd.voiceName);
  return `Voice: ${v ? v.name : gd.voiceName ? `${gd.voiceName} (not on this device, using Automatic)` : 'Automatic'}${gd.bark ? ', with barks' : ''}.`;
}
function cloudSettingHTML() {
  return cloudLinked()
    ? `<div class="setting"><div class="txt"><b>Cloud backup</b><span>On. Every device that enters the event code shares the same players, photos and games, so you can set up on a phone and play on the iPad.</span></div><button class="btn btn-ghost" data-act="cloud-disconnect">Disconnect this device</button></div>`
    : `<div class="setting"><div class="txt"><b>Cloud backup</b><span>${Cloud.status === 'badkey' ? 'The event code stopped working. Enter it again to keep backing up.' : 'Enter the event code to back everything up and share it with your other devices.'}</span></div>${cloudKeyForm('cloud-key-s')}</div>`;
}
function cloudCardHTML() {
  if (!Cloud.http || cloudLinked() || (Cloud.status === 'needkey' && lsGet('td:cloudskip'))) return '';
  return `<section class="panel cloud-card"><div class="txt"><b>${Cloud.status === 'badkey' ? 'Cloud backup needs the event code again' : 'Back up to the cloud'}</b><p class="muted">Everything already saves on this iPad. With the event code it's also backed up online and shared with your other devices.</p></div>
    ${cloudKeyForm('cloud-key-h')}${Cloud.status === 'needkey' ? '<button class="link-btn" data-act="cloud-skip">Not now</button>' : ''}</section>`;
}

function viewSettings() {
  const hasDemo = Object.values(S.players).some((p) => p.demo && !p.deleted) || Object.values(S.games).some((g) => g.demo);
  return `<main class="page">
    <header class="page-head"><button class="icon-btn" data-act="route" data-to="home" aria-label="Back to home">${ic('left')}</button><div style="flex:1;min-width:0"><h1>Settings</h1></div></header>
    <div class="settings-list">
      <div class="setting"><div class="txt"><b>Event name</b><span>Shown on the home screen and the winner screen.</span></div><input class="input" style="max-width:360px" id="s-title" data-bind="title" value="${esc(S.title)}" maxlength="40" autocomplete="off"></div>
      <div class="setting guide-setting">${meekoPic('sm')}<div class="txt"><b>Game Master ${esc(guide().name)}</b><span>Your host. He announces each round, comments on the scores and crowns the winner. ${voiceSummary()} ${guide().photos.length ? `${plural(guide().photos.length, 'photo')}, ${guide().mode === 'round' ? 'a new one each round' : 'a new one every time he appears'}.` : 'Add up to 10 photos and he switches between them.'}</span></div>
        <div class="row"><button class="btn" data-act="edit-guide">${ic('camera')} Photos and name</button><button class="btn" data-act="open-voice">${ic('soundOn')} Voice and sounds</button></div></div>
      <div class="setting"><div class="txt"><b>Sound effects</b><span>Chimes for reveals, correct taps and the leaderboard.</span></div><button class="switch" role="switch" aria-checked="${!!S.settings.sound}" data-act="toggle-sound"><span class="track"></span><span>${S.settings.sound ? 'On' : 'Off'}</span></button></div>
      <div class="setting"><div class="txt"><b>Where your data lives</b><span>${esc(syncInfo().text)}. ${cloudLinked() ? 'Photos are backed up privately and shared only with devices that have the event code.' : 'Photos stay with this app and are never shared.'}</span></div>${syncNoteHTML()}</div>
      ${Cloud.http ? cloudSettingHTML() : ''}
      <div class="setting"><div class="txt"><b>Backup file</b><span>Save everything (players, photos, games) to one file, or restore from one.</span></div>
        <div class="row"><button class="btn" data-act="export">${ic('download')} Save backup</button><label class="btn btn-ghost" for="restore-file">${ic('upload')} Restore</label><input class="file-hidden" id="restore-file" type="file" accept="application/json,.json" data-restore-input></div></div>
      <div class="setting"><div class="txt"><b>Demo game</b><span>${hasDemo ? 'Demo players and the demo game are loaded.' : 'Four sample players and a short game for a dry run.'}</span></div>${hasDemo ? `<button class="btn btn-danger" data-act="remove-demo">Remove demo</button>` : `<button class="btn" data-act="load-demo">${ic('sparkle')} Load demo</button>`}</div>
      <div class="setting"><div class="txt"><b>Start over</b><span>Deletes every player, photo and game from this app.</span></div><button class="btn btn-danger" data-act="erase-all">${ic('trash')} Erase everything</button></div>
    </div>
  </main>`;
}

function guideSheet(ov) {
  const cropping = !!ov.crop;
  const list = ov.photos;
  const sel = clamp(ov.sel || 0, 0, Math.max(0, list.length - 1));
  const src = list[sel] ? list[sel].data : null;
  const full = list.length >= GUIDE_MAX;
  const name = ov.name.trim() || 'Meeko';
  return `<div class="scrim"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="gd-t" tabindex="-1">
    <div class="sheet-head"><h2 id="gd-t">${cropping ? 'Frame the photo' : 'Your Game Master'}</h2>${cropping ? '' : `<button class="icon-btn sm" data-act="ov-close" aria-label="Close">${ic('close')}</button>`}</div>
    <div class="sheet-body"><div class="photo-edit">
      ${cropping
        ? `<div class="stack"><div class="crop-frame square" id="crop-frame"><div class="guides"></div></div><input class="range" id="crop-zoom" type="range" min="1" max="4" step="0.01" value="1" aria-label="Zoom"></div>`
        : `<div class="stack guide-preview">${meekoPic('xl', 0, src)}${list.length > 1 ? `<p class="hint" style="text-align:center">Photo ${sel + 1} of ${list.length}</p>` : ''}</div>`}
      <div class="stack">
        ${cropping
          ? `<p class="hint">Fit his head inside the circle, hat and all. That circle is what shows in the game.</p>
             <div class="row"><button class="btn btn-primary" data-act="crop-use">${ic('check')} Use this photo</button><button class="btn btn-ghost" data-act="crop-cancel">Cancel</button></div>`
          : `<div class="field"><label for="pl-name">Name</label><input class="input big" id="pl-name" data-bind="pl-name" value="${esc(ov.name)}" placeholder="Meeko" maxlength="30" autocomplete="off" enterkeyhint="done"></div>
             <div class="field"><label>Photos <span class="muted">${list.length > GUIDE_MAX ? list.length : `${list.length} of ${GUIDE_MAX}`}</span></label>
               <div class="gp-grid">${list.map((ph, k) => `<div class="gp ${k === sel ? 'on' : ''}"><button class="gp-pick" data-act="gp-sel" data-i="${k}" aria-label="Show photo ${k + 1}">${ph.data ? `<img src="${esc(ph.data)}" alt="" draggable="false">` : art('dog')}</button><button class="gp-del" data-act="gp-del" data-i="${k}" aria-label="Remove photo ${k + 1}">${ic('close')}</button>${gpBadge(ph)}</div>`).join('')}
                 ${full ? '' : `<label class="gp gp-add" for="pl-lib">${ic('plus')}<span>Add</span></label>`}</div></div>
             <div class="photo-actions">
               <label class="btn ${full ? 'is-off' : ''}" for="${full ? '' : 'pl-cam'}">${ic('camera')} Take photo</label>
               <label class="btn btn-ghost ${full ? 'is-off' : ''}" for="${full ? '' : 'pl-lib'}">${ic('image')} Choose photos</label>
             </div>
             <input class="file-hidden" id="pl-cam" type="file" accept="image/*" capture="environment" data-photo-input>
             <input class="file-hidden" id="pl-lib" type="file" accept="image/*" multiple data-photo-input>
             ${list.length > GUIDE_MAX ? `<p class="hint">Photos added on different devices are all kept. Remove some to add more.</p>` : ''}
             ${guideCloudNote(list)}
             <div class="field"><label>He switches photo</label>
               <div class="seg gp-mode" role="group" aria-label="When ${esc(name)} switches photo">
                 <button data-act="gp-mode" data-m="each" aria-pressed="${ov.mode !== 'round'}">Every time he appears</button>
                 <button data-act="gp-mode" data-m="round" aria-pressed="${ov.mode === 'round'}">Each new round</button>
               </div></div>
             <p class="hint">Pick up to ${GUIDE_MAX} at once from your library. He shows as Game Master ${esc(name)} on the round intros, answers, leaderboard and winner screens.${list.length ? ' Tap a photo to preview it, or the × to remove it. To frame one by hand, add it on its own.' : ' Until you add one he appears as a cartoon dog.'}</p>`}
      </div>
    </div></div>
    ${cropping ? '' : `<div class="sheet-foot"><span class="spacer"></span><button class="btn btn-ghost" data-act="ov-close">Cancel</button><button class="btn btn-primary" data-act="guide-save">Save</button></div>`}
  </div></div>`;
}
// Backed up or not, per photo: a tick once it's in the cloud, an arrow while it uploads.
const gpLive = (ph) => (ph.id && guide().photos.find((x) => x.id === ph.id)) || ph;
const gpBackedUp = (ph) => { const live = gpLive(ph); return !!(live.id && live.asset && !Cloud.guidePhotoNeedsUpload(live)); };
function gpBadge(ph) {
  if (!ph.id || !Cloud.assets) return '';
  const up = gpBackedUp(ph);
  return `<span class="gp-cloud ${up ? 'ok' : 'wait'}" data-gp="${esc(ph.id)}" title="${up ? 'Backed up' : 'Not backed up yet'}">${ic(up ? 'check' : 'upload')}</span>`;
}
function guideCloudNote(list) {
  const note = (cls, html) => `<div class="gp-cloudnote ${cls}" data-gp-note>${html}</div>`;
  if (!list.length) return note('', '');
  if (Cloud.http && !cloudLinked()) return note('warn', `<p><b>${Cloud.status === 'badkey' ? 'The event code needs entering again.' : 'These photos are only on this device.'}</b> Enter the event code to back them up, so every device with the code gets them and you never add them again.</p>${cloudKeyForm('cloud-key-g')}`);
  const where = Cloud.http ? 'the cloud' : 'Claude';
  if (Cloud.status === 'full') return note('', `<p>${Cloud.http ? "This month's cloud allowance is used up" : 'Cloud backup is full'}, so new photos stay on this device for now.</p>`);
  if (Cloud.status === 'connecting' || Cloud.status === 'error') return note('', '<p>Backing up when the connection comes back. They are saved on this device meanwhile.</p>');
  if (Cloud.status !== 'on') return note('', '');
  if (list.some((ph) => !ph.id)) return note('', `<p>New photos go up to ${where} when you tap Save.</p>`);
  if (list.some((ph) => !gpBackedUp(ph))) return note('', `<p>${ic('upload')} Backing up to ${where}… Keep the app open for a moment.</p>`);
  return note('ok', `<p>${ic('check')} ${Cloud.http ? 'Saved to the cloud: every device with the event code gets them.' : 'Backed up to Claude: open this page on another device and they come too.'}</p>`);
}
function guideOverlay() { const o = overlays[overlays.length - 1]; return o && o.type === 'player' && o.guide ? o : null; }
// Keep the open Meeko sheet's ticks and note current without redrawing it (typing and framing carry on).
function refreshGuideCloud() {
  const ov = guideOverlay();
  if (!ov || !ov.guide || ov.crop || !ov.el) return;
  for (const el of $$('[data-gp]', ov.el)) { const ph = ov.photos.find((x) => x.id === el.dataset.gp); if (ph) { const html = gpBadge(ph); if (html !== el.outerHTML) el.outerHTML = html; } }
  const note = $('[data-gp-note]', ov.el); if (!note) return;
  const html = guideCloudNote(ov.photos);
  const t = document.createElement('div'); t.innerHTML = html;
  if (t.firstElementChild && t.firstElementChild.outerHTML !== note.outerHTML) note.outerHTML = html;
}
// Photos added or removed on another device while the sheet is open show up in it straight away.
function refreshGuideSheet() {
  const ov = guideOverlay();
  if (!ov || !ov.guide || ov.saving || !ov.el) return;
  const live = guide().photos; const liveIds = new Set(live.map((ph) => ph.id)); const orig = new Set(ov.origIds || []);
  const n = ov.photos.length;
  ov.photos = ov.photos.filter((ph) => !ph.id || liveIds.has(ph.id) || !orig.has(ph.id));
  let changed = ov.photos.length !== n;
  for (const ph of live) if (!orig.has(ph.id)) { ov.photos.push({ ...ph, data: Photos.src(guidePhotoRec(ph)) }); orig.add(ph.id); changed = true; }
  ov.origIds = [...orig];
  if (!changed) { refreshGuideCloud(); return; }
  ov.sel = clamp(ov.sel || 0, 0, Math.max(0, ov.photos.length - 1));
  if (!ov.crop) renderOverlay(ov);
}
// Photos added several at a time skip the framing step: a square crop (he shows in a circle) from the
// middle, a little above centre so ears and hats stay in.
function autoCropDataURL(canvas) {
  const W = 600; const H = 600; const sw = canvas.width; const sh = canvas.height;
  let cw = sw; let ch = sh;
  if (sw / sh > W / H) cw = (sh * W) / H; else ch = (sw * H) / W;
  const out = document.createElement('canvas'); out.width = W; out.height = H;
  out.getContext('2d').drawImage(canvas, (sw - cw) / 2, (sh - ch) * 0.3, cw, ch, 0, 0, W, H);
  return out.toDataURL('image/jpeg', 0.86);
}

// ---------- Overlay views ----------
const VOICE_SAMPLE = (name) => `Hello! I'm Game Master ${name}. Round 1 is Horror Movies, so grab your pens and let's get spooky!`;
function voiceRow(v, ov, auto) {
  const id = v ? v.voiceURI : '';
  const on = (ov.uri || '') === id;
  const label = v ? v.name : 'Automatic';
  const sub = v ? accentOf(v.lang) + (/premium|enhanced/i.test(v.name) ? ' · high quality' : '') : `Best Australian voice on this device${auto ? ` (${auto.name})` : ''}`;
  return `<div class="vp-row ${on ? 'on' : ''}"><button class="vp-pick" data-act="vp-pick" data-uri="${esc(id)}" aria-pressed="${on}"><span class="vp-dot"></span><span class="vp-txt"><b>${esc(label)}</b><small>${esc(sub)}</small></span></button>
    <button class="icon-btn sm vp-play" data-act="vp-play" data-uri="${esc(id)}" aria-label="Hear ${esc(label)}">${ic('play')}</button></div>`;
}
function voiceSheet(ov) {
  const vs = Voice.list(); const auto = Voice.autoPick(vs);
  const en = vs.filter((v) => /^en([-_]|$)/i.test(v.lang));
  const order = ['AU', 'GB', 'IE', 'NZ', 'US'];
  const rank = (v) => { const k = order.indexOf((/^en[-_]([A-Za-z]{2})/.exec(v.lang) || [])[1] || ''); return (k < 0 ? 9 : k) * 10 + (/premium/i.test(v.name) ? 0 : /enhanced/i.test(v.name) ? 1 : 2); };
  const normal = en.filter((v) => !FUN_VOICES.test(v.name)).sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  const fun = en.filter((v) => FUN_VOICES.test(v.name)).sort((a, b) => a.name.localeCompare(b.name));
  const missing = ov.uri && !Voice.find(ov.uri, ov.name, vs);
  return `<div class="scrim"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="vp-t" tabindex="-1">
    <div class="sheet-head"><h2 id="vp-t">${esc(guide().name)}'s voice and sounds</h2><button class="icon-btn sm" data-act="ov-close" aria-label="Close">${ic('close')}</button></div>
    <div class="sheet-body stack" style="gap:18px">
      <div class="vp-switches">
        <button class="switch" role="switch" aria-checked="${ov.voice}" data-act="vp-voice"><span class="track"></span><span>He speaks his lines</span></button>
        <button class="switch" role="switch" aria-checked="${ov.bark}" data-act="vp-bark"><span class="track"></span><span>Barks when he appears, howls for the winner</span></button>
        <button class="btn btn-sm btn-ghost" data-act="vp-woof">${ic('soundOn')} Hear the bark</button>
      </div>
      <div class="vp-sliders">
        <label class="vp-slider"><span>Speed <b id="vp-rate-v">${ov.rate.toFixed(2)}×</b></span><input class="range" type="range" min="0.6" max="1.5" step="0.02" value="${ov.rate}" data-bind="vp-rate" aria-label="Speed"></label>
        <label class="vp-slider"><span>Pitch <b id="vp-pitch-v">${ov.pitch.toFixed(2)}</b></span><input class="range" type="range" min="0.5" max="2" step="0.02" value="${ov.pitch}" data-bind="vp-pitch" aria-label="Pitch"></label>
      </div>
      ${!Voice.ok() ? '<p class="hint">This browser has no text-to-speech, so he stays quiet here.</p>' : !vs.length ? '<p class="hint">Loading the voices on this device…</p>' : ''}
      ${missing ? `<p class="hint">${esc(ov.name || 'The chosen voice')} isn't on this device, so Automatic is used here.</p>` : ''}
      <div class="vp-list">
        <div class="vp-group">Recommended</div>${voiceRow(null, ov, auto)}
        ${normal.length ? `<div class="vp-group">English voices on this device</div>${normal.map((v) => voiceRow(v, ov)).join('')}` : ''}
        ${fun.length ? `<div class="vp-group">Fun voices <small>try Whisper or Bad News for spooky</small></div>${fun.map((v) => voiceRow(v, ov)).join('')}` : ''}
      </div>
      <p class="hint">Want more? On the iPad open Settings → Accessibility → Spoken Content → Voices → English and download an "Enhanced" or "Premium" voice (they sound much more natural), then close and reopen this app.</p>
    </div>
    <div class="sheet-foot"><span class="spacer"></span><button class="btn btn-ghost" data-act="ov-close">Cancel</button><button class="btn btn-primary" data-act="vp-save">Save</button></div>
  </div></div>`;
}
const OVERLAY_VIEWS = {
  voice: voiceSheet,
  confirm(ov) {
    return `<div class="scrim"><div class="sheet narrow dialog" role="alertdialog" aria-modal="true" aria-labelledby="cf-t" tabindex="-1" autofocus>
      <div class="sheet-head"><h2 id="cf-t">${esc(ov.title)}</h2></div>
      <div class="sheet-body"><p>${esc(ov.body)}</p></div>
      <div class="sheet-foot"><button class="btn btn-ghost" data-act="cf-no">Cancel</button><button class="btn ${ov.danger ? 'btn-danger solid' : 'btn-primary'}" data-act="cf-yes">${esc(ov.ok)}</button></div>
    </div></div>`;
  },
  player(ov) {
    if (ov.guide) return guideSheet(ov);
    const p = ov.id ? S.players[ov.id] : null;
    const src = ov.photo !== undefined ? ov.photo : (p ? Photos.src(p) : null);
    const cropping = !!ov.crop;
    const bg = colorFor(ov.id || ov.tmpId);
    return `<div class="scrim"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="pl-t" tabindex="-1">
      <div class="sheet-head"><h2 id="pl-t">${cropping ? 'Frame the photo' : p ? 'Edit player' : 'New player'}</h2>${cropping ? '' : `<button class="icon-btn sm" data-act="ov-close" aria-label="Close">${ic('close')}</button>`}</div>
      <div class="sheet-body">
        <div class="photo-edit">
          ${cropping
            ? `<div class="stack"><div class="crop-frame" id="crop-frame"><div class="guides"></div></div><input class="range" id="crop-zoom" type="range" min="1" max="4" step="0.01" value="1" aria-label="Zoom"></div>`
            : `<div class="stack"><span class="portrait" style="background:${bg}">${src ? `<img src="${esc(src)}" alt="Photo of ${esc(ov.name)}">` : `<span class="ini">${esc(initials(ov.name) || '?')}</span>`}</span></div>`}
          <div class="stack">
            ${cropping
              ? `<p class="hint">Drag to frame them, outfit and all. Pinch or use the slider to zoom.</p>
                 <div class="row"><button class="btn btn-primary" data-act="crop-use">${ic('check')} Use this photo</button><button class="btn btn-ghost" data-act="crop-cancel">Cancel</button></div>`
              : `<div class="field"><label for="pl-name">Name</label><input class="input big" id="pl-name" data-bind="pl-name" value="${esc(ov.name)}" placeholder="e.g. Sam" maxlength="40" autocomplete="off" enterkeyhint="done" ${p ? '' : 'autofocus'}></div>
                 <div class="photo-actions">
                   <label class="btn" for="pl-cam">${ic('camera')} ${src ? 'Retake photo' : 'Take photo'}</label>
                   <label class="btn btn-ghost" for="pl-lib">${ic('image')} Choose from library</label>
                   ${src && !(p && p.demo) ? `<button class="btn btn-ghost" data-act="photo-remove">${ic('trash')} Remove photo</button>` : ''}
                 </div>
                 <input class="file-hidden" id="pl-cam" type="file" accept="image/*" capture="environment" data-photo-input>
                 <input class="file-hidden" id="pl-lib" type="file" accept="image/*" data-photo-input>
                 <p class="hint">Get their whole outfit in. It shows as a tall portrait on the answer and winner screens.</p>`}
          </div>
        </div>
      </div>
      ${cropping ? '' : `<div class="sheet-foot">${p ? '<button class="btn btn-danger" data-act="player-delete">Delete player</button>' : ''}<span class="spacer"></span><button class="btn btn-ghost" data-act="ov-close">Cancel</button><button class="btn btn-primary" data-act="player-save">${p ? 'Save' : 'Add player'}</button></div>`}
    </div></div>`;
  },
  paste(ov) {
    const parsed = parseQuestions(ov.text, ov.defDiff);
    return `<div class="scrim"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="ps-t" tabindex="-1">
      <div class="sheet-head"><h2 id="ps-t">Paste a list of questions</h2><button class="icon-btn sm" data-act="ov-close" aria-label="Close">${ic('close')}</button></div>
      <div class="sheet-body">
        <p class="muted">Paste questions with their choices, e.g. <b>1. Question?</b> then <b>A) … B) … C) …</b> and <b>Answer: B</b>. Spreadsheet rows (<b>question | right answer | wrong | wrong | level</b>) and copies from ChatGPT work too.</p>
        <textarea class="textarea" id="paste-text" data-bind="paste" rows="8" placeholder="1. What is the capital of Australia?&#10;A) Sydney&#10;B) Canberra&#10;C) Melbourne&#10;Answer: B" autofocus>${esc(ov.text)}</textarea>
        <div class="row between"><div class="row"><span class="hint">No level given? Use</span><div class="seg" role="group" aria-label="Default difficulty">${[1, 2, 3].map((d) => `<button data-act="paste-def" data-d="${d}" data-diff="${d}" aria-pressed="${ov.defDiff === d}">${DIFF[d].label}</button>`).join('')}</div></div>
          <button class="btn btn-sm btn-ghost" data-act="copy-template">${ic('copy')} Copy a template for guests</button></div>
        ${ov.showTemplate ? `<div class="field"><label for="paste-template">Template to send your guests</label><textarea class="textarea" id="paste-template" rows="4" readonly>${esc(TEMPLATE)}</textarea></div>` : ''}
        <div id="paste-preview">${pastePreview(parsed)}</div>
      </div>
      <div class="sheet-foot"><button class="btn btn-ghost" data-act="ov-close">Cancel</button><button class="btn btn-primary" id="paste-add" data-act="paste-add" ${parsed.questions.length ? '' : 'disabled'}>Add ${plural(parsed.questions.length, 'question')}</button></div>
    </div></div>`;
  },
  menu() {
    const g = G(); const r = g && curRound(g);
    return `<div class="scrim" data-dismiss><div class="sheet narrow" role="dialog" aria-modal="true" aria-labelledby="mn-t" tabindex="-1">
      <div class="sheet-head"><h2 id="mn-t">Game menu</h2><button class="icon-btn sm" data-act="ov-close" aria-label="Close">${ic('close')}</button></div>
      <div class="sheet-body"><div class="menu-list">
        <button class="menu-item" data-act="ov-close">${ic('play')}<span>Back to the game</span></button>
        <button class="menu-item" data-act="open-standings">${ic('trophy')}<span>Scores so far<small>A quick look without leaving this screen</small></span></button>
        <button class="menu-item" data-act="open-jump">${ic('list')}<span>Jump to a round<small>Fix a score or go back to a question</small></span></button>
        ${r ? `<button class="menu-item" data-act="edit-round-live" data-r="${r.id}">${ic('edit')}<span>Edit this round's questions<small>${esc(r.category || 'Untitled')} · fix a typo or an answer</small></span></button>` : ''}
        ${g && g.status === 'playing' ? `<button class="menu-item" data-act="open-late">${ic('users')}<span>Add a late arrival<small>They join on 0 points</small></span></button>` : ''}
        <button class="menu-item" data-act="open-adjust">${ic('plusminus')}<span>Bonus or penalty points<small>For disputes and judges' calls</small></span></button>
        <button class="menu-item" data-act="toggle-sound">${ic(S.settings.sound ? 'soundOn' : 'soundOff')}<span>Sound effects are ${S.settings.sound ? 'on' : 'off'}</span></button>
        <button class="menu-item" data-act="exit-game">${ic('home')}<span>Exit to home<small>The game is saved. Continue it any time.</small></span></button>
        ${g && g.status === 'playing' ? `<button class="menu-item danger" data-act="end-game">${ic('flag')}<span>End the game now<small>Go straight to the winner with the scores so far</small></span></button>` : ''}
      </div></div>
    </div></div>`;
  },
  standings() {
    const g = G(); const pr = playable(g); const st = computeStandings(g, pr.length - 1);
    const done = pr.filter((r) => g.done[r.id]).length;
    return `<div class="scrim" data-dismiss><div class="sheet narrow" role="dialog" aria-modal="true" aria-labelledby="sd-t" tabindex="-1">
      <div class="sheet-head"><h2 id="sd-t">Scores so far</h2><button class="icon-btn sm" data-act="ov-close" aria-label="Close">${ic('close')}</button></div>
      <div class="sheet-body"><p class="muted">${done} of ${pr.length} rounds scored. Includes any answers marked in the current round.</p>
        <div class="jump-list">${st.map((row) => { const pl = S.players[row.id]; return `<div class="adjust-row" style="grid-template-columns:40px auto minmax(0,1fr) auto"><span class="val" style="min-width:0">${row.tie ? '=' : ''}${row.rank}</span>${avatar(pl)}<span class="nm">${esc(pl ? pl.name : '')}</span><span class="val">${row.score}</span></div>`; }).join('')}</div>
      </div></div></div>`;
  },
  jump() {
    const g = G(); const pr = playable(g); const r = curRound(g);
    return `<div class="scrim" data-dismiss><div class="sheet narrow" role="dialog" aria-modal="true" aria-labelledby="jp-t" tabindex="-1">
      <div class="sheet-head"><h2 id="jp-t">Jump to a round</h2><button class="icon-btn sm" data-act="ov-close" aria-label="Close">${ic('close')}</button></div>
      <div class="sheet-body"><div class="jump-list">${pr.map((x, i) => `<div class="jump-row ${r && x.id === r.id ? 'current' : ''}"><span class="n">${i + 1}</span><span class="t">${esc(roundEmoji(x))} ${esc(x.category || 'Untitled')}<small>${esc(nameOf(x.masterId))}${g.done[x.id] ? ' · scored' : ''}</small></span>
        <span class="b"><button class="btn btn-sm" data-act="jump" data-r="${x.id}" data-s="intro">Start</button><button class="btn btn-sm" data-act="jump" data-r="${x.id}" data-s="a">Answers</button>${g.done[x.id] ? `<button class="btn btn-sm" data-act="jump" data-r="${x.id}" data-s="board">Scores</button>` : ''}</span></div>`).join('')}</div>
        ${(() => { const out = g.rounds.filter((x) => x.skip && g.playerIds.includes(x.masterId) && x.questions.length && S.players[x.masterId]); return out.length ? `<h3 style="margin-top:8px">Taken out</h3><div class="jump-list">${out.map((x) => `<div class="jump-row"><span class="n">–</span><span class="t">${esc(roundEmoji(x))} ${esc(x.category || 'Untitled')}<small>${esc(nameOf(x.masterId))}</small></span><span class="b"><button class="btn btn-sm" data-act="unskip" data-r="${x.id}">Put back</button></span></div>`).join('')}</div>` : ''; })()}</div>
    </div></div>`;
  },
  late() {
    const g = G();
    const others = rosterList().filter((p) => !g.playerIds.includes(p.id));
    return `<div class="scrim" data-dismiss><div class="sheet narrow" role="dialog" aria-modal="true" aria-labelledby="lt-t" tabindex="-1">
      <div class="sheet-head"><h2 id="lt-t">Add a late arrival</h2><button class="icon-btn sm" data-act="ov-close" aria-label="Close">${ic('close')}</button></div>
      <div class="sheet-body"><p class="muted">They join on 0 points and can score from the next answer you mark.</p>
        ${others.length ? `<div class="jump-list">${others.map((p) => `<div class="adjust-row" style="grid-template-columns:auto minmax(0,1fr) auto">${avatar(p)}<span class="nm">${esc(p.name)}</span><button class="btn btn-sm btn-primary" data-act="join-late" data-p="${p.id}">Add to game</button></div>`).join('')}</div>` : ''}
        <button class="btn" data-act="late-new">${ic('plus')} New player</button>
      </div></div></div>`;
  },
  adjust() {
    const g = G();
    const ids = g.playerIds.filter((id) => S.players[id]);
    return `<div class="scrim" data-dismiss><div class="sheet narrow" role="dialog" aria-modal="true" aria-labelledby="aj-t" tabindex="-1">
      <div class="sheet-head"><h2 id="aj-t">Bonus or penalty points</h2><button class="icon-btn sm" data-act="ov-close" aria-label="Close">${ic('close')}</button></div>
      <div class="sheet-body"><p class="muted">Counts on this round's leaderboard and every one after it.</p>
        <div class="jump-list">${ids.map((id) => { const v = adjustTotal(g, id); const pl = S.players[id]; return `<div class="adjust-row">${avatar(pl)}<span class="nm">${esc(pl.name)}</span><button class="icon-btn sm" data-act="adj" data-p="${id}" data-d="-1" aria-label="Take a point from ${esc(pl.name)}">−</button><span class="val" id="adj-${id}">${v > 0 ? '+' : ''}${v}</span><button class="icon-btn sm" data-act="adj" data-p="${id}" data-d="1" aria-label="Give ${esc(pl.name)} a point">+</button></div>`; }).join('')}</div>
      </div>
      <div class="sheet-foot"><button class="btn btn-primary" data-act="ov-close">Done</button></div>
    </div></div>`;
  },
};
function pastePreview(parsed) {
  // (Answers split off after "?" + dash are certain; only "(answer)" and "=" splits are flagged.)
  if (!parsed.questions.length) return '<p class="hint">Nothing recognised yet. Paste or type above and the questions appear here.</p>';
  return `<div class="stack" style="gap:8px">${parsed.category ? `<p class="hint">Category found: <b>${esc(parsed.category)}</b></p>` : ''}${parsed.questions.map((q, i) => `<div class="q-card" style="padding:10px 12px;gap:6px"><div class="row" style="gap:8px"><b class="nums">${i + 1}.</b><span class="chip d${q.diff}">${DIFF[q.diff].label}</span><span style="flex:1;min-width:0;overflow-wrap:anywhere">${esc(q.text)}</span></div><div class="pv-choices">${q.answer ? `<span class="mc-chip ok">${ic('check')} ${esc(q.answer)}</span>` : ''}${q.wrong.map((w) => `<span class="mc-chip">${esc(w)}</span>`).join('')}</div>${q.split ? '<div class="hint warn" style="padding-left:28px">Answer split from the question line. Check it.</div>' : ''}${q.unmarked ? '<div class="hint warn" style="padding-left:28px">No right answer marked. Tick it after adding.</div>' : !q.answer ? '<div class="hint warn" style="padding-left:28px">No answer found. Type it in after adding.</div>' : !q.wrong.length ? '<div class="hint warn" style="padding-left:28px">No wrong answers yet. Add them after adding.</div>' : ''}</div>`).join('')}</div>`;
}

// ===================== Photo cropper =====================
async function loadImageFile(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('decode')); im.src = url; });
    const w = img.naturalWidth; const h = img.naturalHeight;
    if (!w || !h) throw new Error('empty');
    const s = Math.min(1, 1800 / Math.max(w, h));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(h * s));
    c.className = 'src';
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c;
  } finally { URL.revokeObjectURL(url); }
}
function setupCropper(ov) {
  const frame = $('#crop-frame', ov.el); const zoom = $('#crop-zoom', ov.el);
  if (!frame || !ov.crop) return;
  const cr = ov.crop; const src = cr.canvas;
  frame.prepend(src);
  const fw = frame.clientWidth; const fh = frame.clientHeight;
  cr.fw = fw; cr.fh = fh;
  cr.min = Math.max(fw / src.width, fh / src.height);
  if (!cr.scale || cr.reset) { cr.scale = cr.min; cr.x = (fw - src.width * cr.scale) / 2; cr.y = (fh - src.height * cr.scale) / 2; cr.reset = false; }
  const fix = () => {
    cr.scale = clamp(cr.scale, cr.min, cr.min * 4);
    cr.x = clamp(cr.x, fw - src.width * cr.scale, 0);
    cr.y = clamp(cr.y, fh - src.height * cr.scale, 0);
    src.style.transform = `translate(${cr.x}px, ${cr.y}px) scale(${cr.scale})`;
    zoom.value = String(cr.scale / cr.min);
  };
  const zoomAt = (ns, cx, cy) => { const k = ns / cr.scale; cr.x = cx - (cx - cr.x) * k; cr.y = cy - (cy - cr.y) * k; cr.scale = ns; fix(); };
  fix();
  const pts = new Map(); let pinch = null;
  frame.addEventListener('pointerdown', (e) => { frame.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: cr.scale }; } });
  frame.addEventListener('pointermove', (e) => {
    const prev = pts.get(e.pointerId); if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY }; pts.set(e.pointerId, cur);
    if (pts.size === 1) { cr.x += cur.x - prev.x; cr.y += cur.y - prev.y; fix(); }
    else if (pts.size === 2 && pinch) {
      const [a, b] = [...pts.values()]; const rect = frame.getBoundingClientRect();
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt(pinch.s * (d / Math.max(1, pinch.d)), (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top);
    }
  });
  const end = (e) => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; };
  frame.addEventListener('pointerup', end); frame.addEventListener('pointercancel', end);
  frame.addEventListener('wheel', (e) => { e.preventDefault(); const rect = frame.getBoundingClientRect(); zoomAt(cr.scale * (e.deltaY < 0 ? 1.08 : 0.92), e.clientX - rect.left, e.clientY - rect.top); }, { passive: false });
  zoom.addEventListener('input', () => zoomAt(cr.min * Number(zoom.value), fw / 2, fh / 2));
}
function cropToDataURL(cr) {
  const H = Math.round((600 * cr.fh) / cr.fw) || 800;
  const out = document.createElement('canvas'); out.width = 600; out.height = H;
  const ctx = out.getContext('2d');
  const k = 600 / cr.fw;
  ctx.fillStyle = '#111'; ctx.fillRect(0, 0, 600, H);
  ctx.setTransform(cr.scale * k, 0, 0, cr.scale * k, cr.x * k, cr.y * k);
  ctx.drawImage(cr.canvas, 0, 0);
  return out.toDataURL('image/jpeg', 0.86);
}

// ===================== Render =====================
let appRoot;
function viewFor() {
  switch (UI.route) {
    case 'players': return viewPlayers();
    case 'setup': return G() ? viewSetup() : (UI.route = 'home', viewHome());
    case 'round': return G() ? viewRound() : (UI.route = 'home', viewHome());
    case 'play': return viewPlay();
    case 'results': return viewResults();
    case 'history': return viewHistory();
    case 'settings': return viewSettings();
    default: UI.route = 'home'; return viewHome();
  }
}
function render() {
  if (!appRoot) return;
  const prevRoute = appRoot.dataset.route; const prevKey = appRoot.dataset.key;
  let html;
  try { html = viewFor(); } catch (e) {
    console.error(e);
    html = `<main class="page"><div class="panel stack"><h2>Something went wrong on this screen</h2><p class="muted">Your game is saved. Head home and open it again.</p><p class="hint">${esc(e && e.message)}</p><div class="row"><button class="btn btn-primary" data-act="route" data-to="home">Go home</button></div></div></main>`;
  }
  appRoot.innerHTML = html;
  const g = G();
  const key = UI.route + '|' + (UI.route === 'play' && g ? `${g.pos.roundId}:${g.pos.stage}:${g.pos.q}` : UI.step + ':' + UI.roundId);
  if (prevKey !== key) UI.renderedAt = performance.now();
  appRoot.dataset.route = UI.route; appRoot.dataset.key = key;
  document.body.classList.toggle('is-play', UI.route === 'play');
  document.body.dataset.route = UI.route;
  { const g = UI.route === 'play' ? G() : null; document.body.dataset.stage = g && g.pos ? g.pos.stage : ''; }
  if (prevRoute !== UI.route || (prevKey !== key && UI.route !== 'play')) window.scrollTo(0, 0);
  keepAwake(UI.route === 'play');
  persistUI();
  postRender();
}
function warmFonts(rounds) {
  if (!document.fonts || !document.fonts.load) return;
  for (const r of rounds) {
    const t = themeOf(r.themeId);
    for (const f of [`${t.qWeight || 400} 40px ${t.q}`, `400 40px ${t.title}`, `800 40px ${t.q}`]) document.fonts.load(f).catch(() => {});
  }
}
function autosize(el) { if (!el) return; el.style.height = 'auto'; el.style.height = el.scrollHeight + 2 + 'px'; }
function autosizeAll() { for (const el of $$('#q-list textarea', appRoot)) autosize(el); }
// Shrink the round intro's title until the whole intro fits between the top and bottom bars.
function fitIntro() {
  const intro = $('.intro', appRoot); const title = intro && $('.cat-title', intro);
  if (!title) return;
  title.style.fontSize = ''; title.style.maxWidth = '';
  // Keep the title's width while shrinking it, so a boxed title wraps into fewer, bigger lines.
  if (intro.scrollHeight > intro.clientHeight) title.style.maxWidth = title.getBoundingClientRect().width + 'px';
  let fs = parseFloat(getComputedStyle(title).fontSize) || 60;
  while (intro.scrollHeight > intro.clientHeight && fs > 24) { fs -= 4; title.style.fontSize = fs + 'px'; }
}
// Winner screen on a short screen: shrink the podium photos until everything fits.
function fitPodium() {
  const w = $('.podium-wrap', appRoot); if (!w) return;
  let k = 1; w.style.setProperty('--pk', '1');
  while (w.scrollHeight > w.clientHeight + 1 && k > 0.55) { k -= 0.05; w.style.setProperty('--pk', String(k)); }
}
function postRender() {
  meekoAfterRender();
  fitPodium();
  for (const el of $$('[data-fit]', appRoot)) fitText(el);
  fitIntro();
  autosizeAll();
  if (UI.route === 'play') { const g = G(); const r = g && curRound(g); if (r && g.pos.stage === 'intro') warmFonts([r]); }
  layoutPickGrid();
  if ($('#lb')) animateBoard();
  if (UI.route === 'play') {
    const g = G();
    if (g && g.pos.stage === 'final' && !UI.finalShown[g.id]) { UI.finalShown[g.id] = true; setTimeout(() => { confetti(3400, 220); Sound.play('fanfare'); }, 300); }
  }
}
function fitText(el) {
  const box = el.parentElement; if (!box) return;
  const scale = parseFloat(getComputedStyle(el).getPropertyValue('--t-qscale')) || 1;
  const maxPx = Math.round(Math.min(120, Math.max(36, box.clientHeight / 3.2)) * scale);
  let lo = 18; let hi = maxPx; let best = lo;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    el.style.fontSize = mid + 'px';
    if (el.scrollHeight <= box.clientHeight + 1 && el.scrollWidth <= box.clientWidth + 1) { best = mid; lo = mid + 1; } else hi = mid - 1;
  }
  el.style.fontSize = best + 'px';
}
function layoutPickGrid() {
  const area = $('.tiles-area', appRoot); const grid = area && $('.pick-grid', area);
  if (!grid) return;
  const n = grid.children.length; if (!n) return;
  const cs = getComputedStyle(area);
  const W = area.clientWidth; const H = area.clientHeight - parseFloat(cs.paddingTop || 0) - parseFloat(cs.paddingBottom || 0);
  const gap = W < 700 ? 10 : 14; const label = 34;
  let best = { w: 0, cols: Math.min(n, 4) };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const byW = (W - gap * (cols - 1)) / cols;
    const byH = ((H - gap * (rows - 1)) / rows - label) * 0.75;
    const w = Math.min(byW, byH, 230);
    if (w > best.w + 0.5) best = { w, cols };
  }
  grid.style.setProperty('--cols', best.cols);
  grid.style.setProperty('--tile-w', Math.max(64, Math.floor(best.w)) + 'px');
  grid.style.setProperty('--tile-gap', gap + 'px');
  grid.style.setProperty('--label-h', label + 'px');
  for (const n of $$('.pname', grid)) {
    n.style.fontSize = '';
    let fs = parseFloat(getComputedStyle(n).fontSize) || 16;
    while (n.scrollWidth > n.clientWidth + 1 && fs > 11) { fs -= 1; n.style.fontSize = fs + 'px'; }
  }
}
function persistUI() {
  try { localStorage.setItem('td:ui', JSON.stringify({ route: UI.route, gameId: UI.gameId, roundId: UI.roundId, step: UI.step, returnTo: UI.returnTo })); } catch { /* per-viewer convenience only */ }
}
function restoreUI(hot) {
  let u = hot && hot.route ? hot : null;
  if (!u) { try { u = JSON.parse(localStorage.getItem('td:ui') || 'null'); } catch { u = null; } }
  if (!u) {
    const playing = Object.values(S.games).filter((g) => g.status === 'playing').sort((a, b) => b.updatedAt - a.updatedAt)[0];
    if (playing) { UI.route = 'play'; UI.gameId = playing.id; }
    return;
  }
  Object.assign(UI, { route: u.route || 'home', gameId: u.gameId || null, roundId: u.roundId || null, step: u.step || 'players', returnTo: u.returnTo || null });
  if (['setup', 'round', 'play', 'results'].includes(UI.route) && !G()) UI.route = 'home';
  const g = G();
  if (UI.route === 'play' && g && g.status === 'setup') UI.route = 'setup';
  if (UI.route === 'setup' && g && g.status !== 'setup') UI.route = g.status === 'playing' ? 'play' : 'results';
}

function navigate(route, extra = {}) {
  if (route !== UI.route && UI.meekoTalking) { Voice.stop(); UI.meekoTalking = false; }
  closeAllOverlays();
  for (const c of $$('canvas.confetti')) c.remove();
  Object.assign(UI, { route }, extra);
  render();
}
function openGame(id) {
  const g = S.games[id]; if (!g) return;
  if (pruneSetup(g)) commit(null, { render: false });
  UI.gameId = id;
  if (g.status === 'playing') navigate('play');
  else if (g.status === 'finished') navigate('results');
  else navigate('setup', { step: g.playerIds.length >= 2 ? (setupRounds(g).length ? 'rounds' : 'players') : 'players' });
}

// ===================== Actions =====================
function findQ(qid) {
  const g = G(); if (!g) return {};
  for (const r of g.rounds) { const i = r.questions.findIndex((q) => q.id === qid); if (i >= 0) return { g, r, q: r.questions[i], i }; }
  return { g };
}
// A round counts as started once anything in it has been revealed or scored, or the host is past its intro.
const roundStarted = (g, r) => !!g.done[r.id] || (g.pos.roundId === r.id && g.pos.stage !== 'intro')
  || r.questions.some((q) => g.revealed[q.id] || (g.marks[q.id] || []).some((id) => id !== r.masterId));
const curEditRound = () => { const g = G(); return g ? g.rounds.find((x) => x.id === UI.roundId) : null; };
// Edits to the round being played must not move the host off the question they're on.
function keepPlace(g, r, mutate) {
  const live = g && g.status !== 'setup' && g.pos.roundId === r.id && (g.pos.stage === 'q' || g.pos.stage === 'a');
  const curId = live && r.questions[g.pos.q] ? r.questions[g.pos.q].id : null;
  mutate();
  if (!live) return;
  const k = curId ? r.questions.findIndex((x) => x.id === curId) : -1;
  g.pos.q = k >= 0 ? k : clamp(g.pos.q, 0, Math.max(0, r.questions.length - 1));
  touchPos(g);
}

async function savePlayer(ov, name) {
  const now = Date.now();
  const isNew = !ov.id;
  let p = ov.id ? S.players[ov.id] : null;
  if (!p) { p = { id: uid('p'), name, createdAt: now, updatedAt: now, hasPhoto: false }; S.players[p.id] = p; ov.id = p.id; }
  p.name = name; touchPlayer(p);
  const g = G();
  if (isNew && ov.from === 'setup' && g && g.status === 'setup' && !g.playerIds.includes(p.id)) { g.playerIds.push(p.id); touchGame(g); }
  const late = isNew && ov.from === 'game' && g && g.status === 'playing' && !g.playerIds.includes(p.id);
  if (late) { g.playerIds.push(p.id); touchGame(g); }
  if (ov.photo !== undefined) {
    if (ov.photo) { await Photos.set(p.id, ov.photo, now); p.hasPhoto = true; p.photoAt = now; }
    else { await Photos.remove(p.id); p.hasPhoto = false; p.photoAt = now; Cloud.dropAsset(p.photoAsset); p.photoAsset = null; p.photoAssetAt = null; }
  }
  if (topOverlay('player') === ov) popOverlay();
  else { const i = overlays.indexOf(ov); if (i >= 0) { overlays.splice(i, 1); ov.el.remove(); } }
  commit(null, { immediate: true });
  if (ov.photo) Cloud.uploadPhoto(p);
  toast(late ? `${name} joins on 0 points` : isNew ? `${name} added` : 'Saved');
}
function openPlayerSheet(id, from) {
  const p = id ? S.players[id] : null;
  pushOverlay({ type: 'player', id: id || null, tmpId: uid('t'), name: p ? p.name : '', photo: undefined, crop: null, from, after: (ov) => { if (ov.crop) setupCropper(ov); } });
}

const ACT = {
  route(el) { navigate(el.dataset.to); },
  'new-game'() { const g = newGame(); S.games[g.id] = g; UI.gameId = g.id; commit(null, { render: false }); navigate('setup', { step: 'players' }); },
  'open-game'(el) { openGame(el.dataset.g); },
  'load-demo'() {
    const g = loadDemo(); UI.gameId = g.id;
    commit(null, { render: false });
    navigate('setup', { step: 'review' });
    toast('Demo loaded. Press Start to try it out.');
  },
  async 'remove-demo'() {
    const isDemo = (id) => S.players[id] && S.players[id].demo;
    const busy = Object.values(S.games).filter((g) => !g.demo && g.status === 'playing' && g.playerIds.some(isDemo));
    if (busy.length) { toast(`Demo players are in “${gameName(busy[0])}”, which is being played. End that game first.`, 'bad'); return; }
    if (!(await askConfirm({ title: 'Remove the demo?', body: 'Deletes the demo players and the demo game, and takes the demo players out of any game being set up.', ok: 'Remove demo', danger: true }))) return;
    const now = Date.now();
    for (const p of Object.values(S.players)) if (p.demo && !p.deleted) { p.deleted = true; touchPlayer(p); }
    for (const g of Object.values(S.games)) {
      if (g.demo) { S.deletedGames[g.id] = bump(Math.max(now, g.updatedAt || 0)); delete S.games[g.id]; } else pruneSetup(g);
    }
    if (UI.gameId && !S.games[UI.gameId]) UI.gameId = null;
    commit(); toast('Demo removed');
  },
  // players
  'add-player'(el) { openPlayerSheet(null, el.dataset.from || UI.route); },
  'edit-player'(el) { openPlayerSheet(el.dataset.p, UI.route); },
  'ov-close'() { popOverlay(); },
  'photo-remove'() { const ov = topOverlay('player'); if (!ov) return; ov.photo = null; renderOverlay(ov); },
  'crop-cancel'() { const ov = topOverlay('player'); if (!ov) return; ov.crop = null; renderOverlay(ov); },
  'crop-use'() {
    const ov = topOverlay('player'); if (!ov || !ov.crop) return;
    try {
      const data = cropToDataURL(ov.crop);
      if (ov.guide) { ov.photos.push({ data, at: Date.now() }); ov.sel = ov.photos.length - 1; } else ov.photo = data;
    } catch (e) { console.error(e); toast("Couldn't use that photo. Try another.", 'bad'); }
    ov.crop = null; renderOverlay(ov);
  },
  async 'player-save'() {
    const ov = topOverlay('player'); if (!ov || ov.saving) return;
    if (ov.guide) { ACT['guide-save'](); return; }
    const name = String(ov.name || '').trim();
    if (!name) { const inp = $('#pl-name', ov.el); if (inp) { inp.classList.add('invalid'); inp.focus(); } toast('Add a name first'); return; }
    ov.saving = true;
    try {
      const existing = ov.id ? S.players[ov.id] : null;
      const renamed = !existing || existing.name.trim().toLowerCase() !== name.toLowerCase();
      const clash = renamed && rosterList().find((x) => x.id !== ov.id && x.name.trim().toLowerCase() === name.toLowerCase());
      if (clash && !(await askConfirm({ title: `There's already a ${clash.name}`, body: `${existing ? 'Save' : 'Add'} this player anyway? Adding a surname or initial makes them easier to tell apart on the answer screen.`, ok: existing ? 'Save anyway' : 'Add anyway' }))) { ov.saving = false; return; }
      await savePlayer(ov, name);
    } finally { ov.saving = false; }
  },

  async 'player-delete'() {
    const ov = topOverlay('player'); if (!ov || !ov.id) return;
    const p = S.players[ov.id];
    const live = Object.values(S.games).filter((g) => g.status === 'playing' && g.playerIds.includes(p.id));
    if (live.length) { toast(`${p.name} is in a game that's being played. End that game first.`, 'bad'); return; }
    if (!(await askConfirm({ title: `Delete ${p.name}?`, body: 'They come off the guest list and out of any game still being set up. Past results keep their name and photo.', ok: 'Delete player', danger: true }))) return;
    p.deleted = true; touchPlayer(p);
    for (const g of Object.values(S.games)) if (g.status === 'setup' && g.playerIds.includes(p.id)) { g.playerIds = g.playerIds.filter((x) => x !== p.id); touchGame(g); }
    if (!inAnyGame(p.id)) { await Photos.remove(p.id); Cloud.dropAsset(p.photoAsset); p.photoAsset = null; p.photoAssetAt = null; p.hasPhoto = false; p.photoAt = Date.now(); }
    popOverlay();
    commit(); toast(`${p.name} deleted`);
  },
  // setup
  step(el) { const g = G(); pruneSetup(g); if (el.dataset.s !== 'players' && g.playerIds.length < 2) return; if (el.dataset.s !== 'players') { ensureRounds(g); touchGame(g); commit(null, { render: false }); } navigate('setup', { step: el.dataset.s }); },
  'toggle-player'(el) {
    const g = G(); const id = el.dataset.p; const on = !g.playerIds.includes(id);
    g.playerIds = on ? [...g.playerIds, id] : g.playerIds.filter((x) => x !== id);
    touchGame(g); Sound.play('tap'); commit();
  },
  'select-all'() {
    const g = G(); pruneSetup(g); const roster = rosterList().map((p) => p.id);
    g.playerIds = roster.every((id) => g.playerIds.includes(id)) ? [] : [...g.playerIds, ...roster.filter((id) => !g.playerIds.includes(id))];
    touchGame(g); commit();
  },
  'round-move'(el) {
    const g = G(); const vis = setupRounds(g); const r = vis.find((x) => x.id === el.dataset.r); const dir = +el.dataset.dir;
    const i = vis.indexOf(r); const other = vis[i + dir]; if (!other) return;
    const a = g.rounds.indexOf(r); const b = g.rounds.indexOf(other);
    [g.rounds[a], g.rounds[b]] = [g.rounds[b], g.rounds[a]];
    touchGame(g); commit();
  },
  'shuffle-rounds'() {
    const g = G(); const vis = setupRounds(g); const slots = vis.map((r) => g.rounds.indexOf(r));
    const shuffled = vis.slice();
    for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
    slots.forEach((slot, k) => { g.rounds[slot] = shuffled[k]; });
    touchGame(g); commit(); toast('Running order shuffled');
  },
  'edit-round'(el) { navigate('round', { roundId: el.dataset.r, returnTo: 'setup' }); },
  'edit-round-live'(el) { navigate('round', { roundId: el.dataset.r, returnTo: 'play' }); },
  'round-done'() { const back = UI.returnTo === 'play' ? 'play' : 'setup'; navigate(back, back === 'setup' ? { step: 'rounds' } : {}); },
  async 'r-skip'() {
    const g = G(); const r = curEditRound(); if (!r) return;
    if (!r.skip && g.status !== 'setup') {
      if (roundStarted(g, r)) { toast('This round is under way, so it stays in the game.', 'bad'); return; }
      if (!(await askConfirm({ title: 'Take this round out?', body: `${nameOf(r.masterId)} keeps playing in everyone else's rounds. You can put it back from Jump to a round.`, ok: 'Take it out' }))) return;
    }
    r.skip = !r.skip; touchRound(r); touchGame(g); commit();
  },
  unskip(el) {
    const g = G(); const r = g && g.rounds.find((x) => x.id === el.dataset.r); if (!r) return;
    r.skip = false; touchRound(r); touchGame(g); commit(null, { render: false, immediate: true });
    const ov = topOverlay('jump'); if (ov) renderOverlay(ov);
    render(); toast(`${r.category || 'The round'} is back in the game`);
  },
  'pick-theme'(el) { const g = G(); const r = curEditRound(); r.themeId = el.dataset.t; r.themeAuto = false; touchRound(r); touchGame(g); commit(null, { render: false }); refreshRoundSide(r); Sound.play('tap'); },
  'theme-auto'() { const g = G(); const r = curEditRound(); r.themeAuto = true; r.themeId = suggestTheme(r.category); touchRound(r); touchGame(g); commit(null, { render: false }); refreshRoundSide(r); },
  'q-add'() {
    const g = G(); const r = curEditRound();
    const last = r.questions[r.questions.length - 1];
    const q = { id: uid('q'), text: '', answer: '', wrong: ['', '', ''], seed: newSeed(), diff: last ? last.diff : 1, at: bump(0) };
    r.questions.push(q); touchGame(g); commit();
    const t = $('#qt-' + q.id); if (t) { t.focus(); t.scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' }); }
  },
  'q-wrong-add'(el) {
    const { g, q } = findQ(el.dataset.q); if (!q || q.wrong.length >= 5) return;
    q.wrong.push(''); touchQ(q); touchGame(g); commit(null, { render: false });
    rerenderQCard(q, `#qw-${q.id}-${q.wrong.length - 1}`);
  },
  'q-wrong-del'(el) {
    const { g, q } = findQ(el.dataset.q); const k = +el.dataset.i; if (!q || q.wrong.length <= 1) return;
    q.wrong.splice(k, 1); touchQ(q); touchGame(g); commit(null, { render: false });
    rerenderQCard(q);
  },
  'q-make-right'(el) {
    const { g, q } = findQ(el.dataset.q); const k = +el.dataset.i; if (!q) return;
    const was = q.answer; q.answer = q.wrong[k] || ''; q.wrong[k] = was;
    touchQ(q); touchGame(g); commit(null, { render: false });
    rerenderQCard(q); Sound.play('tap');
  },
  'q-shuffle'(el) {
    const { g, q } = findQ(el.dataset.q); if (!q) return;
    const before = choiceList(q).map((c) => c.t).join('|');
    for (let n = 0; n < 6; n++) { q.seed = newSeed(); if (choiceList(q).map((c) => c.t).join('|') !== before) break; }
    touchQ(q); touchGame(g); commit(null, { render: false }); refreshQPreview(q); Sound.play('tap');
  },
  'q-diff'(el) {
    const { g, q } = findQ(el.dataset.q); if (!q) return;
    q.diff = +el.dataset.d; touchQ(q); touchGame(g); commit(null, { render: false });
    for (const b of $$(`[data-act="q-diff"][data-q="${q.id}"]`)) b.setAttribute('aria-pressed', String(+b.dataset.d === q.diff));
    const r = curEditRound(); const h = $('#q-hint'); if (h && r) h.textContent = qHint(r);
  },
  'q-move'(el) {
    const { g, r, i } = findQ(el.dataset.q); if (!r) return;
    const j = i + +el.dataset.dir; if (j < 0 || j >= r.questions.length) return;
    keepPlace(g, r, () => { [r.questions[i], r.questions[j]] = [r.questions[j], r.questions[i]]; });
    touchGame(g); commit();
  },
  async 'q-del'(el) {
    const { g, r, q } = findQ(el.dataset.q); if (!q) return;
    const scored = (g.marks[q.id] || []).filter((id) => id !== r.masterId).length;
    const body = (q.text.trim() || q.answer.trim()) + (scored ? ` ${plural(scored, 'player')} already got points for this; deleting it takes them away.` : '');
    if ((q.text.trim() || q.answer.trim() || scored) && !(await askConfirm({ title: 'Delete this question?', body, ok: 'Delete', danger: true }))) return;
    keepPlace(g, r, () => { r.questions = r.questions.filter((x) => x.id !== q.id); });
    g.delQ[q.id] = bump(q.at);
    delete g.marks[q.id]; delete g.revealed[q.id]; delete g.tickAt[q.id];
    touchGame(g); commit();
  },
  'q-sort'() { const g = G(); const r = curEditRound(); keepPlace(g, r, () => { r.questions = r.questions.map((q, i) => [q, i]).sort((a, b) => a[0].diff - b[0].diff || a[1] - b[1]).map((x) => x[0]); }); touchGame(g); commit(); toast('Sorted easy to hard'); },
  'open-paste'() { pushOverlay({ type: 'paste', text: '', defDiff: 1 }); },
  'paste-def'(el) { const ov = topOverlay('paste'); ov.defDiff = +el.dataset.d; const pos = $('#paste-text', ov.el).selectionStart; renderOverlay(ov); const t = $('#paste-text', ov.el); if (t) { t.focus(); try { t.setSelectionRange(pos, pos); } catch { /* ignore */ } } },
  'copy-template'() {
    const done = () => toast('Template copied. Paste it into a message to your guests.');
    const fallback = () => {
      // execCommand still works on a tap in Safari when the async clipboard is refused.
      const ta = document.createElement('textarea');
      ta.value = TEMPLATE; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove();
      if (ok) { done(); return; }
      const ov = topOverlay('paste'); if (!ov) return;
      ov.showTemplate = true; renderOverlay(ov);
      const t = $('#paste-template', ov.el); if (t) { t.focus(); t.select(); }
      toast('Copy the template from the box below');
    };
    try { const p = navigator.clipboard && navigator.clipboard.writeText(TEMPLATE); if (!p) { fallback(); return; } p.then(done, fallback); } catch { fallback(); }
  },
  'paste-add'() {
    const ov = topOverlay('paste'); const g = G(); const r = curEditRound(); if (!ov || !r) return;
    const parsed = parseQuestions(ov.text, ov.defDiff);
    if (!parsed.questions.length) return;
    for (const q of parsed.questions) r.questions.push({ id: uid('q'), text: q.text, answer: q.answer, wrong: q.wrong.length ? q.wrong : ['', '', ''], seed: newSeed(), diff: q.diff, at: bump(0) });
    if (parsed.category && !r.category.trim()) { r.category = parsed.category; if (r.themeAuto !== false) r.themeId = suggestTheme(r.category); }
    touchGame(g); popOverlay(); commit(); toast(`Added ${plural(parsed.questions.length, 'question')}`);
  },
  async 'start-game'() {
    const g = G(); pruneSetup(g); const pr = playable(g);
    warmFonts(pr);
    if (!pr.length || g.playerIds.length < 2) return;
    const notMC = pr.reduce((n, r) => n + r.questions.filter((q) => mcProblem(q)).length, 0);
    if (notMC && !(await askConfirm({ title: `${plural(notMC, 'question')} ${notMC === 1 ? "isn't" : "aren't"} multiple choice yet`, body: `${notMC === 1 ? "It's" : "They're"} missing a right answer or wrong answers, so ${notMC === 1 ? 'it shows' : 'they show'} without choices. You can fix ${notMC === 1 ? 'it' : 'them'} now, or from the game menu mid-game.`, ok: 'Start anyway' }))) return;
    g.status = 'playing'; g.startedAt = g.startedAt || Date.now();
    setPos(g, 'intro', pr[0].id, 0);
    commit(null, { render: false, immediate: true });
    Sound.play('fanfare');
    navigate('play');
  },
  // play
  fwd() {
    const g = G(); if (!g) return;
    stepForward(g);
    commit(null, { render: false, immediate: true });
    // Round and answer intros get a spooky sting, unless Meeko is about to speak.
    if (g.pos.stage === 'intro' || g.pos.stage === 'aintro') { if (!guide().bark) Sound.play(guide().voice && Voice.ok() ? 'next' : 'spooky'); }
    else if (g.pos.stage !== 'board' && g.pos.stage !== 'final') Sound.play('next');
    render();
  },
  back() { const g = G(); if (!g) return; stepBack(g); Sound.play('back'); commit(null, { immediate: true }); },
  reveal(el) { const g = G(); g.revealed[el.dataset.q] = true; touchGame(g); Sound.play('reveal'); commit(null, { immediate: true }); },
  mark(el) {
    const g = G(); const qid = el.dataset.q; const pid = el.dataset.p;
    const arr = g.marks[qid] || (g.marks[qid] = []);
    const i = arr.indexOf(pid); const on = i < 0;
    if (on) arr.push(pid); else arr.splice(i, 1);
    // First per-tick edit on an older question: the ticks it already had keep the question's stamp.
    if (!isObj(g.tickAt[qid])) { g.tickAt[qid] = {}; for (const x of arr) if (x !== pid) g.tickAt[qid][x] = g.markAt[qid] || 0; }
    g.tickAt[qid][pid] = bump(Math.max(g.tickAt[qid][pid] || 0, g.markAt[qid] || 0));
    g.markAt[qid] = bump(g.markAt[qid]);
    touchGame(g); commit(null, { render: false, immediate: true });
    el.setAttribute('aria-pressed', String(on));
    Sound.play(on ? 'correct' : 'undo');
    const r = curRound(g); const cands = g.playerIds.filter((id) => id !== r.masterId && S.players[id]);
    const wc = $('#who-count'); if (wc) wc.textContent = whoCount(arr.filter((x) => cands.includes(x)).length, cands.length);
  },
  menu() { pushOverlay({ type: 'menu' }); },
  'open-standings'() { popOverlay(); pushOverlay({ type: 'standings' }); },
  'open-jump'() { popOverlay(); pushOverlay({ type: 'jump' }); },
  'open-late'() { popOverlay(); pushOverlay({ type: 'late' }); },
  'late-new'() { popOverlay(); openPlayerSheet(null, 'game'); },
  'join-late'(el) {
    const g = G(); const id = el.dataset.p; if (!g || !S.players[id] || g.playerIds.includes(id)) return;
    g.playerIds.push(id); touchGame(g); commit(null, { immediate: true });
    popOverlay(); toast(`${nameOf(id)} joins on 0 points`);
  },
  'open-adjust'() { popOverlay(); pushOverlay({ type: 'adjust', onClose() { render(); } }); },
  adj(el) {
    const g = G(); const id = el.dataset.p; const d = Number(el.dataset.d);
    const pr = playable(g);
    const r = g.pos.stage === 'final'
      ? ((g.endedFrom && pr.find((x) => x.id === g.endedFrom.roundId)) || pr.slice().reverse().find((x) => g.done[x.id]) || pr[pr.length - 1])
      : curRound(g);
    const rid = r ? r.id : null;
    const e = g.adjustLog.find((a) => a.pid === id && a.r === rid);
    if (e) { e.d += d; e.at = bump(e.at); } else g.adjustLog.push({ pid: id, d, r: rid, at: bump(0) });
    const v = adjustTotal(g, id);
    touchGame(g); commit(null, { render: false, immediate: true });
    const out = $('#adj-' + id); if (out) out.textContent = (v > 0 ? '+' : '') + v;
    Sound.play('tap');
  },
  jump(el) {
    const g = G(); const s = el.dataset.s; const r = g.rounds.find((x) => x.id === el.dataset.r);
    if (!r) return;
    const target = { roundId: r.id, stage: s, q: 0 };
    if (!samePos(target, g.pos) && !g.resume) g.resume = { pos: { ...g.pos }, status: g.status };
    if (s === 'board') UI.boardAnimated[`${g.id}:${r.id}`] = true;
    delete g.endedFrom;
    if (g.status === 'finished' && s !== 'board') g.status = 'playing';
    setPos(g, s, r.id, 0); closeAllOverlays(); commit(null, { immediate: true });
  },
  resume() {
    const g = G(); if (!g || !g.resume) return;
    const { pos, status } = g.resume; delete g.resume;
    g.pos = { ...pos }; g.status = status; touchPos(g); touchGame(g);
    if (pos.stage === 'board') UI.boardAnimated[`${g.id}:${pos.roundId}`] = true;
    commit(null, { immediate: true });
  },
  'to-setup'() { const g = G(); if (!g) return; g.status = 'setup'; touchPos(g); touchGame(g); commit(null, { render: false, immediate: true }); navigate('setup', { step: 'rounds' }); },
  'exit-game'() { navigate('home'); },
  async 'end-game'() {
    popOverlay();
    if (!(await askConfirm({ title: 'End the game now?', body: 'Skips the rounds still to play and goes to the winner using the scores so far. You can jump back to a round afterwards.', ok: 'End game', danger: true }))) return;
    const g = G();
    finishGame(g, true); commit(null, { immediate: true });
  },
  'edit-guide'() {
    const gd = guide();
    const photos = gd.photos.map((ph) => ({ ...ph, data: Photos.src(guidePhotoRec(ph)) }));
    pushOverlay({ type: 'player', guide: true, id: null, tmpId: GUIDE_ID, name: gd.name, mode: gd.mode, orig: { name: gd.name, mode: gd.mode }, origIds: gd.photos.map((ph) => ph.id), photos, sel: 0, photo: undefined, crop: null, after: (ov) => { if (ov.crop) setupCropper(ov); } });
  },
  'gp-sel'(el) { const ov = topOverlay('player'); if (!ov || !ov.guide) return; ov.sel = +el.dataset.i; renderOverlay(ov); },
  'gp-del'(el) { const ov = topOverlay('player'); if (!ov || !ov.guide) return; ov.photos.splice(+el.dataset.i, 1); ov.sel = Math.min(ov.sel || 0, Math.max(0, ov.photos.length - 1)); renderOverlay(ov); },
  'gp-mode'(el) { const ov = topOverlay('player'); if (!ov || !ov.guide) return; ov.mode = el.dataset.m === 'round' ? 'round' : 'each'; renderOverlay(ov); },
  async 'guide-save'() {
    const ov = topOverlay('player'); if (!ov || !ov.guide || ov.saving) return;
    ov.saving = true;
    try {
      const cur = guide(); const keep = []; const orig = new Set(ov.origIds || []);
      for (const ph of ov.photos) {
        // Kept photos take their current record, in case an upload finished while the sheet was open
        // (and one removed on another device meanwhile stays removed).
        if (ph.id) { const c = cur.photos.find((x) => x.id === ph.id); if (c) keep.push({ id: c.id, at: c.at, asset: c.asset || null, assetAt: c.assetAt || 0 }); continue; }
        const id = uid('mk'); const at = Date.now();
        guideSaving.add(id);
        await Photos.set(id, ph.data, at);
        keep.push({ id, at, asset: null, assetAt: 0 });
      }
      // Photos another device added while the sheet was open are kept too.
      for (const c of cur.photos) if (!orig.has(c.id) && !keep.some((k) => k.id === c.id)) keep.push({ id: c.id, at: c.at, asset: c.asset || null, assetAt: c.assetAt || 0 });
      // Removed photos are remembered (stamped after they were added, whatever this device's clock says),
      // so a device that still has them doesn't bring them back.
      const raw = isObj(S.settings.guide) ? S.settings.guide : {};
      const removed = { ...(isObj(raw.removed) ? raw.removed : {}) };
      for (const old of cur.photos) if (orig.has(old.id) && !keep.some((k) => k.id === old.id)) { removed[old.id] = bump(Math.max(old.at || 0, removed[old.id] || 0)); await Photos.remove(old.id); Cloud.dropAsset(old.asset); }
      const patch = { photos: keep, removed, hasPhoto: keep.length > 0, photoAt: null, photoAsset: null, photoAssetAt: null };
      const name = String(ov.name || '').trim().slice(0, 30) || 'Meeko'; const mode = ov.mode === 'round' ? 'round' : 'each';
      const o = ov.orig || {};
      if (name !== o.name) patch.name = name;
      if (mode !== o.mode) patch.mode = mode;
      setGuide(patch);
      guideSaving.clear();
      popOverlay();
      commit(null, { immediate: true });
      Cloud.uploadGuidePhoto();
      toast('Saved');
    } finally { ov.saving = false; }
  },
  'open-voice'() {
    const gd = guide(); const v = Voice.find(gd.voiceURI, gd.voiceName);
    const orig = { uri: v ? v.voiceURI : gd.voiceURI, name: gd.voiceName, rate: gd.rate, pitch: gd.pitch, voice: gd.voice, bark: gd.bark };
    pushOverlay({ type: 'voice', ...orig, orig });
  },
  'vp-pick'(el) {
    const ov = topOverlay('voice'); if (!ov) return;
    const v = Voice.find(el.dataset.uri, null);
    ov.uri = el.dataset.uri; ov.name = v ? v.name : '';
    renderOverlay(ov); ACT['vp-play'](el);
  },
  'vp-play'(el) {
    const ov = topOverlay('voice'); if (!ov) return;
    const v = el.dataset.uri ? Voice.find(el.dataset.uri, null) : Voice.autoPick();
    Voice.preview(VOICE_SAMPLE(guide().name), v, ov.rate, ov.pitch);
  },
  'vp-voice'() { const ov = topOverlay('voice'); if (!ov) return; ov.voice = !ov.voice; if (!ov.voice) Voice.stop(); renderOverlay(ov); },
  'vp-bark'() { const ov = topOverlay('voice'); if (!ov) return; ov.bark = !ov.bark; renderOverlay(ov); if (ov.bark) Sound.sample('woofwoof'); },
  'vp-woof'() { const ov = topOverlay('voice'); const was = S.settings.sound; S.settings.sound = true; Sound.sample(ov && ov.n % 2 ? 'howl' : 'woofwoof', 0.8); S.settings.sound = was; if (ov) ov.n = (ov.n || 0) + 1; },
  'vp-save'() {
    const ov = topOverlay('voice'); if (!ov) return;
    const v = ov.uri ? Voice.find(ov.uri, ov.name) : null;
    const o = ov.orig || {}; const patch = {};
    if ((ov.uri || '') !== (o.uri || '')) { patch.voiceURI = ov.uri || ''; patch.voiceName = ov.uri ? (v ? v.name : ov.name || '') : ''; }
    if (ov.rate !== o.rate) patch.rate = ov.rate;
    if (ov.pitch !== o.pitch) patch.pitch = ov.pitch;
    if (ov.voice !== o.voice) patch.voice = ov.voice;
    if (ov.bark !== o.bark) patch.bark = ov.bark;
    if (Object.keys(patch).length) setGuide(patch);
    Voice.stop(); popOverlay(); commit(); toast('Saved');
  },
  'toggle-voice'() {
    setGuide({ voice: !guide().voice });
    commit();
    if (guide().voice) Voice.say(`Hello! I'm Game Master ${guide().name}.`); else Voice.stop();
  },
  'meeko-replay'() {
    const el = $('.meeko-line[data-say-key]', appRoot) || $('.meeko-line', appRoot);
    if (!el) return;
    if (!S.settings.sound || !guide().voice) { toast(S.settings.sound ? `${guide().name}'s voice is off in Settings` : 'Sound is off'); return; }
    Voice.say(el.getAttribute('aria-label') || ''); UI.meekoTalking = true;
  },
  async 'cloud-connect'(el) {
    const inp = document.getElementById(el.dataset.input);
    const key = inp ? inp.value : '';
    if (!key.trim()) { if (inp) inp.focus(); toast('Type the event code first'); return; }
    el.disabled = true; const label = el.innerHTML; el.textContent = 'Connecting…';
    try {
      await Cloud.connect(key); toast(Cloud.status === 'on' ? 'Cloud backup is on' : 'Event code saved. Backing up as soon as the cloud answers.'); render();
      const gov = topOverlay('player'); if (gov && gov.guide) { refreshGuideSheet(); renderOverlay(gov); }
    }
    catch (e) { el.disabled = false; el.innerHTML = label; toast(e && e.code === 'revoked' ? "That event code isn't right" : "Couldn't reach the cloud. Check the internet and try again.", 'bad'); }
  },
  async 'cloud-disconnect'() {
    if (!(await askConfirm({ title: 'Disconnect this device?', body: 'This device stops backing up to the cloud. Everything stays saved on it, and the cloud copy stays for your other devices.', ok: 'Disconnect' }))) return;
    Cloud.disconnect(); render();
  },
  'cloud-skip'() { lsSet('td:cloudskip', true); render(); },
  'toggle-sound'() {
    S.settings.sound = !S.settings.sound; S.metaAt = bump(S.metaAt);
    commit(null, { render: false });
    if (S.settings.sound) Sound.play('tap'); else { Voice.stop(); UI.meekoTalking = false; }
    for (const b of $$('.meeko-replay', appRoot)) b.innerHTML = ic(S.settings.sound && guide().voice ? 'soundOn' : 'soundOff');
    for (const ov of overlays) renderOverlay(ov);
    if (UI.route === 'play') {
      for (const b of $$('[data-act="toggle-sound"]', appRoot)) { b.innerHTML = ic(S.settings.sound ? 'soundOn' : 'soundOff'); b.setAttribute('aria-label', S.settings.sound ? 'Mute sound effects' : 'Turn sound effects on'); }
    } else render();
  },
  fullscreen() { toggleFullscreen(); },
  'open-results'(el) { UI.gameId = el.dataset.g; navigate('results'); },
  'open-final'(el) { UI.gameId = el.dataset.g; const g = G(); const pr = playable(g); delete g.endedFrom; if (pr.length) setPos(g, 'final', pr[pr.length - 1].id); UI.finalShown[g.id] = true; commit(null, { render: false }); navigate('play'); },
  'finish-game'() { const g = G(); if (g && g.endedFrom) { delete g.endedFrom; touchGame(g); commit(null, { render: false, immediate: true }); } navigate('home'); },
  async 'delete-game'(el) {
    const g = S.games[el.dataset.g]; if (!g) return;
    if (!(await askConfirm({ title: `Delete “${gameName(g)}”?`, body: 'Its rounds, questions and scores are deleted. Players stay on the guest list.', ok: 'Delete game', danger: true }))) return;
    S.deletedGames[g.id] = bump(g.updatedAt); delete S.games[g.id];
    if (UI.gameId === g.id) UI.gameId = null;
    commit(); toast('Game deleted');
  },
  // settings
  async export() {
    if (Cloud.db) { toast('Preparing backup…'); await Promise.race([Cloud.cacheRemotePhotos(), sleep(5000)]); }
    const photos = {};
    for (const [id, v] of Object.entries(Photos.map)) { const p = S.players[id]; if ((p && (!p.deleted || inAnyGame(id))) || guide().photos.some((ph) => ph.id === id)) photos[id] = v; }
    const data = JSON.stringify({ kind: 'trivia-day-backup', v: STATE_V, exportedAt: new Date().toISOString(), state: S, photos });
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `trivia-day-backup-${stamp}.json`;
    if (Cloud.downloads) {
      try { await Cloud.downloads.save({ filename, data }); toast('Backup saved'); } catch (e) { if (!e || e.code !== 'declined') toast("Couldn't save the backup here", 'bad'); }
      return;
    }
    if (window.claude) { toast('Saving files is not available in this view', 'bad'); return; }
    // iPad: the share sheet lets them Save to Files or AirDrop it.
    try {
      const file = new File([data], filename, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Trivia Day backup' }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = filename;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 40000);
    toast('Backup ready. Check your Downloads.');
  },
  async 'erase-all'() {
    if (!(await askConfirm({ title: 'Erase everything?', body: 'Deletes every player, photo and game in this app. Save a backup first if you might want them back.', ok: 'Erase everything', danger: true }))) return;
    const now = Date.now();
    for (const p of Object.values(S.players)) {
      p.deleted = true; Cloud.dropAsset(p.photoAsset);
      p.photoAsset = null; p.photoAssetAt = null; p.hasPhoto = false; p.photoAt = bump(Math.max(now, p.photoAt || 0)); touchPlayer(p);
    }
    for (const [id, g] of Object.entries(S.games)) { S.deletedGames[id] = bump(Math.max(now, g.updatedAt || 0)); delete S.games[id]; }
    for (const id of Object.keys(Photos.map)) if (!isGuidePhotoId(id)) await Photos.remove(id); // Meeko stays
    UI.gameId = null;
    commit(null, { immediate: true, render: false }); navigate('home'); toast('Everything erased');
  },
  // dialogs
  'cf-yes'() { const ov = topOverlay('confirm'); if (!ov) return; const res = ov.resolve; ov.onClose = null; popOverlay(); res(true); },
  'cf-no'() { popOverlay(); },
};

const BIND = {
  'vp-rate'(el) { const ov = topOverlay('voice'); if (!ov) return; ov.rate = numIn(el.value, 0.5, 2, 1.02); const b = $('#vp-rate-v', ov.el); if (b) b.textContent = ov.rate.toFixed(2) + '×'; },
  'vp-pitch'(el) { const ov = topOverlay('voice'); if (!ov) return; ov.pitch = numIn(el.value, 0.1, 2, 1.12); const b = $('#vp-pitch-v', ov.el); if (b) b.textContent = ov.pitch.toFixed(2); },
  'g-name'(el) { const g = G(); g.name = el.value; touchGame(g); commit(null, { render: false }); const h = $('.page-head h1'); if (h) h.textContent = gameName(g); },
  title(el) { S.title = el.value; S.metaAt = bump(S.metaAt); commit(null, { render: false }); },
  'pl-name'(el) { const ov = topOverlay('player'); if (ov) { ov.name = el.value; el.classList.remove('invalid'); } },
  'r-cat'(el) {
    const g = G(); const r = curEditRound(); if (!r) return;
    r.category = el.value; touchRound(r);
    if (r.themeAuto !== false) r.themeId = suggestTheme(r.category);
    touchGame(g); commit(null, { render: false }); refreshRoundSide(r);
  },
  'r-emoji'(el) { const g = G(); const r = curEditRound(); if (!r) return; r.emoji = el.value.trim(); touchRound(r); touchGame(g); commit(null, { render: false }); refreshRoundSide(r); },
  'q-text'(el) { const { g, q } = findQ(el.dataset.q); if (!q) return; q.text = el.value; touchQ(q); touchGame(g); commit(null, { render: false }); autosize(el); },
  'q-ans'(el) {
    const { g, q } = findQ(el.dataset.q); if (!q) return;
    const v = el.value.replace(/[\r\n]+/g, ' ');
    if (v !== el.value) el.value = v;
    q.answer = v; touchQ(q); touchGame(g); commit(null, { render: false }); autosize(el); refreshQPreview(q);
  },
  'q-wrong'(el) {
    const { g, q } = findQ(el.dataset.q); const k = +el.dataset.i; if (!q || k >= q.wrong.length) return;
    q.wrong[k] = el.value.replace(/[\r\n]+/g, ' ');
    touchQ(q); touchGame(g); commit(null, { render: false }); refreshQPreview(q);
  },
  paste(el) {
    const ov = topOverlay('paste'); if (!ov) return;
    ov.text = el.value;
    const parsed = parseQuestions(ov.text, ov.defDiff);
    const pv = $('#paste-preview', ov.el); if (pv) pv.innerHTML = pastePreview(parsed);
    const b = $('#paste-add', ov.el); if (b) { b.disabled = !parsed.questions.length; b.textContent = `Add ${plural(parsed.questions.length, 'question')}`; }
  },
};

async function onPhotoPicked(input) {
  const files = input.files ? Array.from(input.files) : [];
  input.value = '';
  const ov = topOverlay('player'); if (!files.length || !ov) return;
  const file = files[0];
  if (ov.guide) {
    const room = GUIDE_MAX - ov.photos.length;
    if (room <= 0) { toast(`${GUIDE_MAX} photos is the most. Remove one to add another.`); return; }
    // Several at once: frame each automatically and add them all.
    if (files.length > 1) {
      const take = files.slice(0, room); let added = 0;
      toast(`Adding ${plural(take.length, 'photo')}…`);
      for (const f of take) {
        try { const canvas = await loadImageFile(f); ov.photos.push({ data: autoCropDataURL(canvas), at: Date.now() }); added++; } catch (e) { console.error(e); }
      }
      if (topOverlay('player') !== ov) return;
      ov.sel = Math.max(0, ov.photos.length - added);
      renderOverlay(ov);
      toast(`Added ${plural(added, 'photo')}${files.length > room ? ` (${GUIDE_MAX} is the most)` : ''}${added < take.length ? `. ${take.length - added} couldn't be read` : ''}`);
      return;
    }
  }
  try {
    const canvas = await loadImageFile(file);
    ov.crop = { canvas, reset: true };
    renderOverlay(ov);
  } catch (e) {
    console.error(e);
    toast("Couldn't read that photo. Try taking it again.", 'bad');
  }
}
async function onRestorePicked(input) {
  const file = input.files && input.files[0];
  input.value = '';
  if (!file) return;
  let data;
  try { data = JSON.parse(await file.text()); } catch { toast("That file isn't a Trivia Day backup", 'bad'); return; }
  if (!isObj(data) || data.kind !== 'trivia-day-backup' || !isObj(data.state)) { toast("That file isn't a Trivia Day backup", 'bad'); return; }
  let incoming;
  try { incoming = migrate(clone(data.state)); } catch (e) { console.error(e); toast('That backup file is damaged', 'bad'); return; }
  const photosIn = isObj(data.photos) ? data.photos : {};
  const nP = Object.values(incoming.players).filter((p) => !p.deleted).length; const nG = Object.keys(incoming.games).length;
  if (!nP && !nG) { toast('That backup has no players or games in it', 'bad'); return; }
  if (!(await askConfirm({ title: 'Restore this backup?', body: `It has ${plural(nP, 'player')} and ${plural(nG, 'game')}. It replaces what's in the app now.`, ok: 'Restore', danger: true }))) return;
  const now = Date.now();
  // Mark restored records as newest so cloud copies don't overrule them.
  for (const [id, p] of Object.entries(incoming.players)) {
    p.updatedAt = now;
    const file = photosIn[id];
    if (file && typeof file.data === 'string' && file.data.startsWith('data:image/')) { p.photoAsset = null; p.photoAssetAt = null; }
  }
  for (const g of Object.values(incoming.games)) g.updatedAt = now;
  for (const id of Object.keys(S.games)) if (!incoming.games[id]) incoming.deletedGames[id] = now;
  for (const id of Object.keys(incoming.games)) delete incoming.deletedGames[id];
  for (const [id, p] of Object.entries(S.players)) if (!incoming.players[id]) incoming.players[id] = Object.assign({}, p, { deleted: true, updatedAt: now });
  incoming.metaAt = now;
  // A backup from before Game Master Meeko existed keeps the current one.
  const keepGuide = !isObj(incoming.settings.guide) && isObj(S.settings.guide)
    ? { settings: S.settings.guide, photos: guide().photos.map((ph) => [ph.id, Photos.map[ph.id]]).filter((x) => x[1]) } : null;
  if (keepGuide) incoming.settings.guide = keepGuide.settings;
  const inGuide = isObj(incoming.settings.guide) ? incoming.settings.guide : null;
  if (inGuide && !keepGuide) {
    // Meeko from the backup replaces the current one on every device: current photos it doesn't have are
    // marked removed (or the cloud would merge them back in), and its settings are stamped as newest.
    const ids = new Set(guidePhotoList(inGuide).map((ph) => ph.id));
    const removed = isObj(inGuide.removed) ? { ...inGuide.removed } : {};
    for (const ph of guide().photos) if (!ids.has(ph.id)) removed[ph.id] = bump(Math.max(ph.at || 0, removed[ph.id] || 0, now));
    inGuide.removed = removed;
    inGuide.at = bump(Math.max(now, Number(isObj(S.settings.guide) && S.settings.guide.at) || 0));
    inGuide.stamps = Object.fromEntries(GUIDE_FIELDS.map((k) => [k, inGuide.at]));
  }
  const inFile = (id) => isObj(photosIn[id]) && String(photosIn[id].data || '').startsWith('data:image/');
  // Cloud photos the restored data no longer points at are deleted (photos in the file are uploaded afresh).
  const inGuidePhotos = inGuide && Array.isArray(inGuide.photos) ? inGuide.photos.filter(isObj) : [];
  const used = new Set([...Object.values(incoming.players).map((p) => p.photoAsset), ...inGuidePhotos.filter((ph) => !inFile(ph.id)).map((ph) => ph.asset),
    inGuide && !Array.isArray(inGuide.photos) && !inFile(GUIDE_ID) ? inGuide.photoAsset : null].filter(Boolean));
  for (const a of [...Object.values(S.players).map((p) => p.photoAsset), ...guide().photos.map((ph) => ph.asset)]) if (a && !used.has(a)) Cloud.dropAsset(a);
  await Photos.clearAll();
  if (keepGuide) for (const [id, v] of keepGuide.photos) await Photos.set(id, v.data, v.at);
  for (const [id, v] of Object.entries(photosIn)) {
    if (!okId(id) || !isObj(v) || typeof v.data !== 'string' || !v.data.startsWith('data:image/')) continue;
    await Photos.set(id, v.data, now); if (incoming.players[id]) incoming.players[id].photoAt = now;
    const gp = inGuidePhotos.find((ph) => ph.id === id);
    if (gp) Object.assign(gp, { at: now, asset: null, assetAt: 0 });
    else if (id === GUIDE_ID && inGuide && !Array.isArray(inGuide.photos)) Object.assign(inGuide, { hasPhoto: true, photoAt: now, photoAsset: null, photoAssetAt: null });
  }
  S = incoming;
  UI.gameId = null;
  commit(null, { immediate: true, render: false });
  Cloud.uploadPendingPhotos();
  navigate('home'); toast('Backup restored');
}

function bindEvents() {
  document.addEventListener('pointerdown', () => Voice.unlock(), { once: true, capture: true });
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) {
      const scrim = e.target.closest('[data-dismiss]');
      if (scrim && e.target === scrim) popOverlay();
      return;
    }
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') return;
    if (UI.route === 'play' && !overlays.length && !['mark', 'reveal'].includes(el.dataset.act) && performance.now() - (UI.renderedAt || 0) < 450) { e.preventDefault(); return; }
    const fn = ACT[el.dataset.act];
    if (fn) { e.preventDefault(); Promise.resolve().then(() => fn(el, e)).catch((err) => { console.error(err); toast('That did not work. Try again.', 'bad'); }); }
  });
  document.addEventListener('input', (e) => { const b = e.target.dataset && e.target.dataset.bind; if (b && BIND[b]) BIND[b](e.target); });
  document.addEventListener('change', (e) => {
    if (e.target.matches('[data-photo-input]')) onPhotoPicked(e.target);
    else if (e.target.matches('[data-restore-input]')) onRestorePicked(e.target).catch((err) => { console.error(err); toast('That backup file is damaged', 'bad'); });
  });
  document.addEventListener('keydown', (e) => {
    const typing = e.target.closest && e.target.closest('input, textarea, [contenteditable]');
    if (e.key === 'Escape' && overlays.length) {
      const top = overlays[overlays.length - 1];
      if (top.type === 'player' && top.crop) ACT['crop-cancel'](); else popOverlay();
      e.preventDefault(); return;
    }
    if (e.key === 'Enter' && e.target.id === 'pl-name') { e.preventDefault(); ACT['player-save'](); return; }
    if (e.key === 'Enter' && e.target.closest && e.target.closest('[data-cloud-form]')) {
      e.preventDefault();
      const b = e.target.closest('[data-cloud-form]').querySelector('[data-act="cloud-connect"]');
      if (b && !b.disabled) ACT['cloud-connect'](b);
      return;
    }
    if (e.key === 'Enter' && e.target.matches && e.target.matches('[data-bind="q-ans"], [data-bind="q-wrong"]')) {
      e.preventDefault();
      const card = e.target.closest('[data-qcard]');
      const fields = card ? $$('[data-bind="q-ans"], [data-bind="q-wrong"]', card) : [];
      const nextField = fields[fields.indexOf(e.target) + 1];
      if (nextField) nextField.focus(); else e.target.blur();
      return;
    }
    if (typing || overlays.length || UI.route !== 'play') return;
    if ((e.key === ' ' || e.key === 'Enter') && e.target.closest && e.target.closest('button, a, label')) return;
    const g = G(); if (!g) return;
    if (performance.now() - (UI.renderedAt || 0) < 450) { if ([' ', 'ArrowRight', 'ArrowLeft', 'PageDown', 'PageUp'].includes(e.key)) e.preventDefault(); return; }
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); ACT.fwd(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); ACT.back(); }
    else if ((e.key === 'r' || e.key === 'R') && g.pos.stage === 'a') { const btn = $('[data-act="reveal"]'); if (btn) ACT.reveal(btn); }
  });
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      for (const el of $$('[data-fit]', appRoot)) fitText(el);
      fitIntro(); fitPodium();
      layoutPickGrid();
      if ($('#lb')) animateBoard(true);
      autosizeAll();
      const ov = topOverlay('player'); if (ov && ov.crop) { ov.crop.reset = true; renderOverlay(ov); }
    }, 150);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { mirrorNow(); Saver.flush(); Cloud.flush(); }
    else { if (UI.route === 'play') keepAwake(true); Cloud.refresh(); }
  });
  document.addEventListener('focusout', () => {
    if (!UI.renderPending) return;
    setTimeout(() => { const a = document.activeElement; if (!(a && a.matches && a.matches('input, textarea'))) softRender(); }, 0);
  });
  window.addEventListener('pagehide', () => { mirrorNow(); Saver.flush(); });
  const refit = () => { for (const el of $$('[data-fit]', appRoot)) fitText(el); fitIntro(); autosizeAll(); layoutPickGrid(); if ($('#lb')) animateBoard(true); };
  if (document.fonts) {
    if (document.fonts.ready) document.fonts.ready.then(refit);
    if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', refit);
  }
}

// ===================== Boot =====================
async function readAll() {
  let saved;
  try { saved = await Local.get('state'); }
  catch (e) { console.warn('first read failed, retrying', e); Local.reset(); saved = await Local.get('state'); }
  // The localStorage fallback copy and the pagehide mirror may hold newer records than IndexedDB.
  let state = saved && saved.v ? migrate(saved) : null;
  let extra = false;
  for (const k of ['td:state', 'td:mirror']) {
    const c = lsGet(k);
    if (!c || !c.v || c === saved) continue;
    const m = migrate(c);
    if (!state) { state = m; extra = true; } else if (mergeInto(state, m)) extra = true;
  }
  return { state, extra };
}
async function loadSaved() {
  const { state, extra } = await readAll();
  if (state) S = state;
  await Photos.loadAll();
  if (extra) { Saver.pending = true; setTimeout(() => Saver.flush(), 0); }
}
function showLoadFailed() {
  Saver.blocked = true;
  return new Promise((resolve) => {
  appRoot.innerHTML = `<main class="page"><div class="panel stack"><h2>Your saved games didn't load</h2>
    <p class="muted">This browser had trouble reading the app's saved data. Nothing has been changed or lost. Reloading usually fixes it.</p>
    <div class="row"><button class="btn btn-primary" id="reload-btn">Reload</button><button class="btn btn-ghost" id="start-fresh-btn">Use the app without saved data</button></div>
    <p class="hint">If you choose to continue without it, anything you add is kept separately and merged back in once loading works again.</p></div></main>`;
  $('#reload-btn').addEventListener('click', () => location.reload());
  $('#start-fresh-btn').addEventListener('click', () => {
    // Keep writes away from the unreadable store; they merge back in on a later successful load.
    Saver.blocked = false; Local.forceFallback();
    const saved = lsGet('td:state');
    if (saved && saved.v) S = migrate(saved);
    resolve();
  });
  });
}
// Another tab saved: fold its records in.
async function onTabMessage(e) {
  const m = e.data || {};
  if (m.tab === TAB_ID) return;
  if (m.type === 'photo' && okId(m.id)) { await Photos.reload(m.id); softRender(); return; }
  if (m.type !== 'saved') return;
  let stored = null;
  try { stored = await Local.get('state'); } catch { return; }
  if (!stored || !stored.v) return;
  Saver.lastSeen = Math.max(Saver.lastSeen, stored.updatedAt || 0);
  if (mergeInto(S, migrate(stored))) softRender();
}
// IndexedDB opened late after we fell back to localStorage: merge both and save to IndexedDB again.
async function onStorageRecovered() {
  try {
    const { state } = await readAll();
    if (state) mergeInto(S, state);
    await Photos.loadAll();
    S.updatedAt = Date.now();
    Saver.pending = true; await Saver.flush();
    updateSyncNote(); softRender();
  } catch (e) { console.warn('recovery merge failed', e); }
}
// Cobwebs and bats over the whole app (decoration only; never takes taps).
function addSpookyLayer() {
  if (document.querySelector('.spooky') || typeof HART === 'undefined') return;
  const el = document.createElement('div');
  el.className = 'spooky'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<div class="web tl">${art('web', 'tl')}</div><div class="web tr">${art('web', 'tr')}</div>`
    + ['b1', 'b2', 'b3'].map((c) => `<div class="bat ${c}">${art('bat')}</div>`).join('');
  document.body.appendChild(el);
}
async function start(hot) {
  appRoot = document.getElementById('app');
  ovRoot = document.getElementById('overlays');
  bindEvents();
  addSpookyLayer();
  try { await loadSaved(); } catch (e) {
    console.error('load failed', e);
    await showLoadFailed();
  }
  Saver.lastSeen = S.updatedAt || 0;
  if (chan) chan.onmessage = onTabMessage;
  Local.onRecovered = onStorageRecovered;
  restoreUI(hot && hot.ui);
  UI.booted = true;
  render();
  try { window.claude && window.claude.hot && window.claude.hot.snapshot && window.claude.hot.snapshot(() => ({ ui: { route: UI.route, gameId: UI.gameId, roundId: UI.roundId, step: UI.step, returnTo: UI.returnTo } })); } catch { /* optional */ }
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch { /* optional */ }
  Cloud.init();
  window.__trivia = { get S() { return S; }, UI, Cloud, Local, Photos, computeStandings, playable, parseQuestions, suggestTheme };
}
(function boot() {
  const hot = window.claude && window.claude.hot;
  const go = (data) => start(data || {});
  if (hot && typeof hot.ready === 'function') { try { hot.ready(go); return; } catch { /* fall through */ } }
  go(hot && hot.data);
})();
