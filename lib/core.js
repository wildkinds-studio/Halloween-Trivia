// Cloud database for the home-screen version of Trivia Day.
// Everything except photos lives in ONE private blob (data/state.json) holding a map of documents
// ("trivia/meta", "players/<id>", "games/<id>"), so a pull is one read and a save is one read + one
// conditional write (ETag), which keeps two devices from overwriting each other and keeps the event
// well inside the free plan's monthly operation allowance. Photos are separate immutable blobs.
import { createHash, timingSafeEqual, randomBytes } from 'node:crypto';

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
  const limit = Number(env.TRIVIA_MONTHLY_WRITES) || 1500;
  for (let attempt = 0; attempt < 6; attempt++) {
    let cur;
    try { cur = await readState(blob); } catch (e) { return fail(503, 'unavailable', 'Could not read the cloud copy.'); }
    const { state, etag } = cur;
    const month = monthOf(now());
    const usage = state.usage && state.usage.month === month ? state.usage : { month, writes: 0 };
    if (usage.writes >= limit) return fail(429, 'quota_exceeded', 'Monthly cloud backup allowance used up.', g.headers);
    const docs = { ...(state.docs || {}) };
    // Compare-and-set per document: a device says which cloud copy it merged against ("base": that copy's
    // stamp, or null if it saw none). If someone else wrote since, nothing is written and the device
    // re-reads, merges and tries again, so two devices can't overwrite each other's changes.
    const stale = sets.filter((d) => 'base' in d && (d.base === null ? d.path in docs : stampOf(docs[d.path]) !== Number(d.base)));
    if (stale.length) return fail(409, 'conflict', 'Changed on another device: ' + stale.map((d) => d.path).join(', '), g.headers);
    for (const d of sets) docs[d.path] = d.data;
    const next = { v: 1, docs, usage: { month, writes: usage.writes + 1 }, updatedAt: now() };
    const text = JSON.stringify(next);
    if (Buffer.byteLength(text) > MAX_STATE) return fail(413, 'quota_exceeded', 'The cloud copy is full.', g.headers);
    try {
      await blob.put(STATE_PATH, text, {
        access: 'private', contentType: 'application/json', addRandomSuffix: false, cacheControlMaxAge: 60,
        ...(etag ? { ifMatch: etag } : { allowOverwrite: false }),
      });
      return json({ ok: true, writes: usage.writes + 1, limit }, 200, g.headers);
    } catch (e) {
      // Someone else wrote in between (ETag moved, or the first write raced another): read again and retry.
      const raced = e && (e.name === 'BlobPreconditionFailedError' || /precondition|already exists|etag/i.test(String(e.message)));
      if (!raced) return fail(503, 'unavailable', 'Could not save to the cloud.', g.headers);
      await sleep(80 + Math.random() * 220 * (attempt + 1));
    }
  }
  return fail(503, 'unavailable', 'The cloud copy is busy, try again.', g.headers);
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
