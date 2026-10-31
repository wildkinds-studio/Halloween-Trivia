// Cloud database for the home-screen version of Trivia Day.
// Everything except photos lives in ONE private blob (data/state.json) holding a map of documents
// ("trivia/meta", "players/<id>", "games/<id>"), so a pull is one read and a save is one read + one
// conditional write (ETag), which keeps two devices from overwriting each other and keeps the event
// well inside the free plan's monthly operation allowance. Photos are separate immutable blobs.
import { createHash, createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

export const STATE_PATH = 'data/state.json';
const DOC_RE = /^(trivia\/meta|players\/[A-Za-z0-9_-]{1,64}|games\/[A-Za-z0-9_-]{1,64})$/;
const ASSET_RE = /^[a-f0-9]{32}$/;
const PHOTO_TYPES = { 'image/jpeg': 1, 'image/png': 1, 'image/webp': 1, 'image/gif': 1 };
const MAX_DOC = 256 * 1024;
const MAX_STATE = 3.5 * 1024 * 1024;
const MAX_PHOTO = 4 * 1024 * 1024;
const COOKIE = 'tk';
const MIN_KEY = 12; // normalised characters; shorter codes are refused so they can't be guessed
const HEX64 = /^[0-9a-f]{64}$/;
const HEX32 = /^[0-9a-f]{32}$/;
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const GUEST_WRITES = 800; // a month's saves from all guest links, kept apart so guests can't use up the devices' allowance
const ENTRY_WRITES = 150; // a month's saves from one guest link
const MAX_ENTRY = 64 * 1024;
const MAX_QUESTIONS = 40;

export const normKey = (k) => String(k || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const sha = (s) => createHash('sha256').update(s).digest('hex');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const monthOf = (now) => new Date(now).toISOString().slice(0, 7);

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...extra } });
}
const fail = (status, code, message, extra) => json({ ok: false, code, message }, status, extra);

function cookieOf(request, name) {
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(/;\s*/)) { const i = part.indexOf('='); if (i > 0 && part.slice(0, i) === name) return part.slice(i + 1); }
  return '';
}
function sameHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !HEX64.test(a) || !HEX64.test(b)) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}
// The event code arrives as a header (raw, from the app) or a cookie (its hash, for <img> requests).
function authState(request, env) {
  const want = normKey(env.TRIVIA_KEY);
  if (want.length < MIN_KEY) return { ok: false, configured: false };
  const wantHash = sha(want);
  const header = request.headers.get('x-trivia-key');
  if (request.headers.has('x-trivia-key')) return { ok: sameHex(sha(normKey(header)), wantHash), configured: true, viaHeader: true, hash: wantHash };
  return { ok: sameHex(cookieOf(request, COOKIE), wantHash), configured: true, viaHeader: false, hash: wantHash };
}
const setCookie = (hash) => ({ 'set-cookie': `${COOKIE}=${hash}; Max-Age=31536000; Path=/; HttpOnly; Secure; SameSite=Strict` });
const clearCookie = { 'set-cookie': `${COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict` };
// A document's own stamp: players and games carry updatedAt, the meta record metaAt.
const stampOf = (d) => (isObj(d) ? Number(d.updatedAt != null ? d.updatedAt : d.metaAt) || 0 : null);
async function guard(request, env) {
  const a = authState(request, env);
  if (!a.configured) return { res: fail(503, 'unavailable', 'Cloud backup is not set up on this server yet.') };
  if (!a.ok) { await sleep(400); return { res: fail(401, 'revoked', 'That event code is not right.') }; }
  return { headers: a.viaHeader ? setCookie(a.hash) : {} };
}

async function readState(blob) {
  const r = await blob.get(STATE_PATH, { access: 'private', useCache: false });
  if (!r || r.statusCode !== 200 || !r.stream) return { state: { v: 1, docs: {}, usage: {} }, etag: null };
  const text = await new Response(r.stream).text();
  let state;
  try { state = JSON.parse(text); } catch { throw Object.assign(new Error('state unreadable'), { code: 'corrupt' }); }
  if (!state || typeof state !== 'object' || typeof state.docs !== 'object') state = { v: 1, docs: {}, usage: {} };
  return { state, etag: r.blob.etag };
}

const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);

export async function handleDb(request, { blob, env, now = Date.now }) {
  const g = await guard(request, env);
  if (g.res) return g.res;
  if (request.method === 'GET') {
    try {
      const { state } = await readState(blob);
      return json({ ok: true, docs: state.docs || {}, usage: { ...(state.usage || {}), limit: Number(env.TRIVIA_MONTHLY_WRITES) || 1500 } }, 200, g.headers);
    } catch (e) { return fail(503, 'unavailable', 'Could not read the cloud copy.'); }
  }
  if (request.method !== 'POST') return fail(405, 'invalid_argument', 'Use GET or POST.');
  let body;
  try { body = await request.json(); } catch { return fail(400, 'invalid_argument', 'Body must be JSON.'); }
  const sets = Array.isArray(body && body.set) ? body.set : null;
  if (!sets || !sets.length || sets.length > 200) return fail(400, 'invalid_argument', 'Send 1 to 200 documents in "set".');
  for (const d of sets) {
    if (!d || typeof d.path !== 'string' || !DOC_RE.test(d.path) || !isObj(d.data)) return fail(400, 'invalid_argument', 'Bad document: ' + String(d && d.path).slice(0, 80));
    if (Buffer.byteLength(JSON.stringify(d.data)) > MAX_DOC) return fail(413, 'invalid_argument', 'Document over 256 KB: ' + d.path);
  }
  const res = await commitState(blob, env, now, g.headers, (docs) => {
    // Compare-and-set per document: a device says which cloud copy it merged against ("base": that copy's
    // stamp, or null if it saw none). If someone else wrote since, nothing is written and the device
    // re-reads, merges and tries again, so two devices can't overwrite each other's changes.
    const stale = sets.filter((d) => 'base' in d && (d.base === null ? d.path in docs : stampOf(docs[d.path]) !== Number(d.base)));
    if (stale.length) return fail(409, 'conflict', 'Changed on another device: ' + stale.map((d) => d.path).join(', '), g.headers);
    for (const d of sets) docs[d.path] = d.data;
    return null;
  });
  return res instanceof Response ? res : json({ ok: true, writes: res.writes, limit: res.limit }, 200, g.headers);
}

// One read-modify-write of the state blob. change(docs) edits the documents in place, or returns a Response
// to stop without writing. If another write lands in between (the ETag moved), it reads again and retries.
async function commitState(blob, env, now, headers, change, { guest = false } = {}) {
  const limit = Number(env.TRIVIA_MONTHLY_WRITES) || 1500;
  for (let attempt = 0; attempt < 6; attempt++) {
    let cur;
    try { cur = await readState(blob); } catch (e) { return fail(503, 'unavailable', 'Could not read the cloud copy.', headers); }
    const { state, etag } = cur;
    const month = monthOf(now());
    const usage = state.usage && state.usage.month === month ? state.usage : { month, writes: 0 };
    if (usage.writes >= limit) return fail(429, 'quota_exceeded', 'Monthly cloud backup allowance used up.', headers);
    if (guest && (Number(usage.guest) || 0) >= GUEST_WRITES) return fail(429, 'quota_exceeded', 'Too many saves this month. Ask the host to type the rest in.', headers);
    const docs = { ...(state.docs || {}) };
    const stop = change(docs);
    if (stop) return stop;
    const nextUsage = { month, writes: usage.writes + 1, guest: (Number(usage.guest) || 0) + (guest ? 1 : 0) };
    const next = { v: 1, docs, usage: nextUsage, updatedAt: now() };
    const text = JSON.stringify(next);
    if (Buffer.byteLength(text) > MAX_STATE) return fail(413, 'quota_exceeded', 'The cloud copy is full.', headers);
    try {
      await blob.put(STATE_PATH, text, {
        access: 'private', contentType: 'application/json', addRandomSuffix: false, cacheControlMaxAge: 60,
        ...(etag ? { ifMatch: etag } : { allowOverwrite: false }),
      });
      return { writes: nextUsage.writes, limit };
    } catch (e) {
      // Someone else wrote in between (ETag moved, or the first write raced another): read again and retry.
      const raced = e && (e.name === 'BlobPreconditionFailedError' || /precondition|already exists|etag/i.test(String(e.message)));
      if (!raced) return fail(503, 'unavailable', 'Could not save to the cloud.', headers);
      await sleep(80 + Math.random() * 220 * (attempt + 1));
    }
  }
  return fail(503, 'unavailable', 'The cloud copy is busy, try again.', headers);
}

// ---------- Guest links ----------
// Each guest can be sent a link that opens their own round, and nothing else, so they can type their category
// and questions on their phone without the event code and without seeing anyone else's. The link carries a
// token made from the event code, the game and the round: it can't be guessed or pointed at another round,
// changing the event code retires every link, and so does the host making a new link for a round (a new
// linkSalt on the round). A guest's work is kept in its own document (entries/<game>.<round>), which the host's
// devices fold into the game; once the game starts it's locked and nothing is served any more.
const entryPath = (gid, rid) => `entries/${gid}.${rid}`;
function entryToken(env, gid, rid, salt) {
  return createHmac('sha256', sha('entry-link:' + normKey(env.TRIVIA_KEY))).update(`${gid}.${rid}.${typeof salt === 'string' ? salt : ''}`).digest('hex').slice(0, 32);
}
function sameToken(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !HEX32.test(a) || !HEX32.test(b)) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}
// The game and round a link points at, if they still exist (and that guest is still in the game).
function findRound(docs, gid, rid) {
  const game = docs['games/' + gid];
  if (!isObj(game) || game.deleted || !Array.isArray(game.rounds)) return null;
  const round = game.rounds.find((x) => isObj(x) && x.id === rid);
  if (!round || (Array.isArray(game.playerIds) && !game.playerIds.includes(round.masterId))) return null;
  return { game, round };
}
// Text from a link: control characters dropped (line breaks and tabs kept), then cut to length.
const str = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').slice(0, n);
// Only these fields of a round ever leave or enter through a link.
function cleanRound(x) {
  if (!isObj(x) || !Array.isArray(x.questions) || x.questions.length > MAX_QUESTIONS) return null;
  const questions = []; const seen = new Set();
  for (const q of x.questions) {
    if (!isObj(q) || typeof q.id !== 'string' || !ID_RE.test(q.id)) return null;
    if (seen.has(q.id)) continue;
    seen.add(q.id);
    questions.push({ id: q.id, text: str(q.text, 600), answer: str(q.answer, 200), wrong: (Array.isArray(q.wrong) ? q.wrong : []).slice(0, 5).map((w) => str(w, 200)), diff: [1, 2, 3].includes(q.diff) ? q.diff : 1, ...(Number.isInteger(q.seed) && q.seed >= 0 ? { seed: q.seed } : {}) });
  }
  return { category: str(x.category, 60), emoji: str(x.emoji, 16), themeId: typeof x.themeId === 'string' && /^[a-z0-9-]{1,30}$/.test(x.themeId) ? x.themeId : '', themeAuto: x.themeAuto !== false, questions };
}

const EMPTY_ROUND = { category: '', emoji: '', themeId: '', themeAuto: true, questions: [] };
// The copy of a round a guest should be working from: their own last save until a host device has folded it
// into the game, then the game's round (which also has anything added on the iPad since).
function currentCopy(docs, found, path) {
  const { game, round } = found; const entry = docs[path];
  if (isObj(entry) && isObj(entry.round) && (Number(round.entryAt) || 0) < (Number(entry.updatedAt) || 0)) return entry.round;
  const del = isObj(game.delQ) ? game.delQ : {};
  const qs = (Array.isArray(round.questions) ? round.questions : []).filter((q) => isObj(q) && typeof q.id === 'string' && ID_RE.test(q.id) && !(del[q.id] && del[q.id] >= (Number(q.at) || 0)));
  return cleanRound({ ...round, questions: qs.slice(0, MAX_QUESTIONS) }) || EMPTY_ROUND;
}
// A short fingerprint of a round's content, so a phone saving from an out-of-date copy can be told to catch up.
function versionOf(round) {
  const q = (round.questions || []).map((x) => [x.id, x.text, x.answer, (x.wrong || []).filter((w) => w.trim()), x.diff]);
  return sha(JSON.stringify([String(round.category || '').trim(), String(round.emoji || '').trim(), round.themeAuto === false ? round.themeId : '', q])).slice(0, 20);
}
const locked = (game) => !!game.status && game.status !== 'setup';
const badLink = async () => { await sleep(400); return fail(401, 'revoked', "This link doesn't work. Ask the host for a new one."); };

// The host asks for a guest's link (needs the event code).
export async function handleInvite(request, { blob, env }) {
  const g = await guard(request, env);
  if (g.res) return g.res;
  if (request.method !== 'GET') return fail(405, 'invalid_argument', 'Use GET.');
  const url = new URL(request.url);
  const gid = url.searchParams.get('g') || ''; const rid = url.searchParams.get('r') || '';
  if (!ID_RE.test(gid) || !ID_RE.test(rid)) return fail(400, 'invalid_argument', 'Bad game or round.', g.headers);
  let state;
  try { ({ state } = await readState(blob)); } catch { return fail(503, 'unavailable', 'Could not read the cloud copy.', g.headers); }
  const found = findRound(state.docs || {}, gid, rid);
  if (!found) return fail(404, 'not_found', 'That round is not in the cloud yet.', g.headers);
  return json({ ok: true, token: entryToken(env, gid, rid, found.round.linkSalt), salt: typeof found.round.linkSalt === 'string' ? found.round.linkSalt : '' }, 200, g.headers);
}

// A guest opens (GET) or saves (POST) their round through their link.
export async function handleEntry(request, { blob, env, now = Date.now }) {
  if (normKey(env.TRIVIA_KEY).length < MIN_KEY) return fail(503, 'unavailable', 'Cloud backup is not set up on this server yet.');
  const url = new URL(request.url);
  const gid = url.searchParams.get('g') || ''; const rid = url.searchParams.get('r') || ''; const t = url.searchParams.get('t') || '';
  if (!ID_RE.test(gid) || !ID_RE.test(rid) || !HEX32.test(t)) return badLink();
  const path = entryPath(gid, rid);
  const gone = () => fail(404, 'not_found', 'This round is no longer in the game. Ask the host for a new link.');
  if (request.method === 'GET') {
    let state;
    try { ({ state } = await readState(blob)); } catch { return fail(503, 'unavailable', 'Could not read the cloud copy.'); }
    const docs = state.docs || {};
    const found = findRound(docs, gid, rid);
    // Checked against the round's current salt, so a link the host has replaced stops working.
    if (!sameToken(t, entryToken(env, gid, rid, found ? found.round.linkSalt : ''))) return badLink();
    if (!found) return gone();
    const { game, round } = found;
    const player = docs['players/' + round.masterId];
    const base = { ok: true, game: { name: str(game.name, 80), status: locked(game) ? 'locked' : 'setup' }, player: { name: str(isObj(player) ? player.name : '', 40) || 'Guest' } };
    // Once the game is under way nothing more is handed out: a link must not show a round still to come.
    if (locked(game)) return json({ ...base, round: EMPTY_ROUND, ver: '' });
    const copy = currentCopy(docs, found, path);
    return json({ ...base, round: copy, ver: versionOf(copy) });
  }
  if (request.method !== 'POST') return fail(405, 'invalid_argument', 'Use GET or POST.');
  let body;
  try { body = await request.json(); } catch { return fail(400, 'invalid_argument', 'Body must be JSON.'); }
  const round = cleanRound(body && body.round);
  if (!round) return fail(400, 'invalid_argument', `That round could not be read (${MAX_QUESTIONS} questions at most).`);
  if (Buffer.byteLength(JSON.stringify(round)) > MAX_ENTRY) return fail(413, 'too_large', 'That round is too long to save.');
  const base = typeof (body && body.base) === 'string' ? body.base : null;
  let out = null;
  const res = await commitState(blob, env, now, {}, (docs) => {
    const found = findRound(docs, gid, rid);
    if (!sameToken(t, entryToken(env, gid, rid, found ? found.round.linkSalt : ''))) return fail(401, 'revoked', "This link doesn't work. Ask the host for a new one.");
    if (!found) return gone();
    if (locked(found.game)) return fail(409, 'locked', 'The game has started, so this round is locked.');
    // Saved from an out-of-date copy (changed on the iPad, or in another tab): send the current one back to merge.
    const cur = currentCopy(docs, found, path);
    if (base !== null && base !== versionOf(cur)) return json({ ok: false, code: 'changed', message: 'This round changed somewhere else.', round: cur, ver: versionOf(cur) }, 409);
    const month = monthOf(now());
    const prev = isObj(docs[path]) ? docs[path] : {};
    const n = prev.month === month ? Number(prev.n) || 0 : 0;
    if (n >= ENTRY_WRITES) return fail(429, 'quota_exceeded', 'This round has been saved a lot this month. Ask the host to type the rest in.');
    const savedAt = Math.max(now(), (Number(prev.updatedAt) || 0) + 1);
    // base: the copy this save was made from, so host devices apply only what the phone changed.
    docs[path] = { gameId: gid, roundId: rid, round, base: cur, updatedAt: savedAt, month, n: n + 1 };
    out = { ok: true, savedAt, ver: versionOf(round) };
    return null;
  }, { guest: true });
  return res instanceof Response ? res : json(out);
}

export async function handleAsset(request, { blob, env }) {
  const g = await guard(request, env);
  if (g.res) return g.res;
  const url = new URL(request.url);
  if (request.method === 'POST') {
    const type = String(request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!PHOTO_TYPES[type]) return fail(415, 'unsupported_type', 'Photos only.');
    const buf = Buffer.from(await request.arrayBuffer());
    if (!buf.length) return fail(400, 'invalid_request', 'Empty upload.');
    if (buf.length > MAX_PHOTO) return fail(413, 'too_large', 'Photo over 4 MB.');
    const id = randomBytes(16).toString('hex');
    try {
      await blob.put('photos/' + id, buf, { access: 'private', contentType: type, addRandomSuffix: false, cacheControlMaxAge: 31536000 });
    } catch (e) { return fail(503, 'unavailable', 'Could not store the photo.', g.headers); }
    return json({ ok: true, id, url: '/_blob/' + id, sizeBytes: buf.length, contentType: type }, 200, g.headers);
  }
  const id = url.searchParams.get('id') || '';
  if (!ASSET_RE.test(id)) return fail(400, 'invalid_argument', 'Bad photo id.');
  if (request.method === 'DELETE') {
    try { await blob.del('photos/' + id); } catch { /* already gone */ }
    return json({ ok: true, deleted: true }, 200, g.headers);
  }
  if (request.method !== 'GET') return fail(405, 'invalid_argument', 'Use GET, POST or DELETE.');
  let r;
  try { r = await blob.get('photos/' + id, { access: 'private' }); } catch { return fail(503, 'unavailable', 'Could not load the photo.'); }
  if (!r || r.statusCode !== 200 || !r.stream) return fail(404, 'not_found', 'No such photo.');
  return new Response(r.stream, { status: 200, headers: { 'content-type': r.blob.contentType || 'image/jpeg', 'cache-control': 'private, max-age=31536000, immutable', 'x-content-type-options': 'nosniff', ...g.headers } });
}

export async function handleLogin(request, { env }) {
  if (request.method !== 'POST') return fail(405, 'invalid_argument', 'Use POST.');
  const url = new URL(request.url);
  if (url.searchParams.get('out') === '1') return json({ ok: true }, 200, clearCookie);
  let key = '';
  try { key = String((await request.json()).key || ''); } catch { /* empty */ }
  const want = normKey(env.TRIVIA_KEY);
  if (want.length < MIN_KEY) return fail(503, 'unavailable', 'Cloud backup is not set up on this server yet.');
  if (!sameHex(sha(normKey(key)), sha(want))) { await sleep(600); return fail(401, 'revoked', 'That event code is not right.'); }
  return json({ ok: true }, 200, setCookie(sha(want)));
}

export function handlePing(request, { env }) {
  return json({ ok: true, app: 'trivia-day', cloud: normKey(env.TRIVIA_KEY).length >= MIN_KEY && !!(env.BLOB_READ_WRITE_TOKEN || env.BLOB_STORE_ID) });
}
