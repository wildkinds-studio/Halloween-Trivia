import { handleDb, handleAsset, handleLogin, handlePing } from '../lib/core.js';
import { createMockBlob } from '../lib/mockblob.js';
let pass = 0, failN = 0;
const ok = (c, m) => { if (c) pass++; else { failN++; console.log('FAIL', m); } };
const env = { TRIVIA_KEY: 'Meeko-Pumpkin-Ghost-4821', BLOB_READ_WRITE_TOKEN: 'x', TRIVIA_MONTHLY_WRITES: '5' };
const H = (k) => (k === undefined ? {} : { 'x-trivia-key': k });
const req = (m, p, body, headers = {}) => new Request('http://x' + p, { method: m, headers: { 'content-type': 'application/json', ...headers }, body: body === undefined ? undefined : typeof body === 'string' || body instanceof Uint8Array ? body : JSON.stringify(body) });
const blob = createMockBlob();
const ctx = { blob, env };

// ping, login
let r = await handlePing(req('GET', '/api/ping'), ctx); ok((await r.json()).cloud === true, 'ping cloud');
r = await handlePing(req('GET', '/api/ping'), { env: {} }); ok((await r.json()).cloud === false, 'ping unconfigured');
r = await handleLogin(req('POST', '/api/login', { key: 'meeko pumpkin ghost 4821' }), ctx); ok(r.status === 200 && /tk=[a-f0-9]{64}/.test(r.headers.get('set-cookie')), 'login normalises key + cookie');
const cookie = r.headers.get('set-cookie').split(';')[0];
r = await handleLogin(req('POST', '/api/login', { key: 'nope' }), ctx); ok(r.status === 401, 'bad login 401');
// auth
r = await handleDb(req('GET', '/api/db'), ctx); ok(r.status === 401, 'no key 401');
r = await handleDb(req('GET', '/api/db', undefined, H('wrong')), ctx); ok(r.status === 401, 'wrong key 401');
r = await handleDb(req('GET', '/api/db', undefined, { cookie }), ctx); ok(r.status === 200, 'cookie auth');
r = await handleDb(req('GET', '/api/db', undefined, { cookie: 'tk=' + 'a'.repeat(64) }), ctx); ok(r.status === 401, 'bad cookie 401');
r = await handleDb(req('GET', '/api/db', undefined, H('MEEKO-PUMPKIN-GHOST-4821')), ctx); ok(r.status === 200 && Object.keys((await r.json()).docs).length === 0, 'empty state');
// writes
r = await handleDb(req('POST', '/api/db', { set: [{ path: 'players/p1', data: { id: 'p1', name: 'Bea', updatedAt: 1 } }, { path: 'trivia/meta', data: { title: 'T', metaAt: 1 } }] }, H(env.TRIVIA_KEY)), ctx);
ok(r.status === 200, 'first write ' + r.status);
r = await handleDb(req('GET', '/api/db', undefined, H(env.TRIVIA_KEY)), ctx); let d = await r.json(); ok(d.docs['players/p1'].name === 'Bea' && d.docs['trivia/meta'].title === 'T', 'read back');
// validation
for (const bad of [{ set: [] }, { set: [{ path: '../x', data: {} }] }, { set: [{ path: 'players/p1', data: [] }] }, { set: [{ path: 'games/g', data: { big: 'x'.repeat(300 * 1024) } }] }, {}]) {
  r = await handleDb(req('POST', '/api/db', bad, H(env.TRIVIA_KEY)), ctx); ok(r.status >= 400 && r.status < 500, 'reject ' + JSON.stringify(bad).slice(0, 40));
}
r = await handleDb(req('POST', '/api/db', 'not json', H(env.TRIVIA_KEY)), ctx); ok(r.status === 400, 'non-json');
// race: two concurrent writers both land (ETag retry)
const w = (id) => handleDb(req('POST', '/api/db', { set: [{ path: 'games/' + id, data: { id, updatedAt: 2 } }] }, H(env.TRIVIA_KEY)), ctx);
const [a, b] = await Promise.all([w('g1'), w('g2')]);
ok(a.status === 200 && b.status === 200, 'both racers ok ' + a.status + ' ' + b.status);
r = await handleDb(req('GET', '/api/db', undefined, H(env.TRIVIA_KEY)), ctx); d = await r.json();
ok(d.docs['games/g1'] && d.docs['games/g2'] && d.docs['players/p1'], 'no lost update');
// first-write race on an empty store
const blob2 = createMockBlob(); const ctx2 = { blob: blob2, env };
const w2 = (id) => handleDb(req('POST', '/api/db', { set: [{ path: 'players/' + id, data: { id } }] }, H(env.TRIVIA_KEY)), ctx2);
const rs = await Promise.all([w2('a'), w2('b'), w2('c')]);
ok(rs.every((x) => x.status === 200), 'first-write race ok');
r = await handleDb(req('GET', '/api/db', undefined, H(env.TRIVIA_KEY)), ctx2); d = await r.json(); ok(['players/a', 'players/b', 'players/c'].every((k) => d.docs[k]), 'first-write race keeps all');
// quota: limit 5 writes this month (3 done on ctx)
r = await w('g3'); ok(r.status === 200, 'write 4');
r = await w('g4'); ok(r.status === 200, 'write 5');
r = await w('g5'); ok(r.status === 429 && (await r.json()).code === 'quota_exceeded', 'quota hit');
// month rollover resets
r = await handleDb(req('POST', '/api/db', { set: [{ path: 'games/g6', data: { id: 'g6' } }] }, H(env.TRIVIA_KEY)), { ...ctx, now: () => Date.UTC(2099, 0, 5) }); ok(r.status === 200, 'new month resets quota');
// storage outage -> 503 unavailable
blob.faults.push({ op: 'get', times: 1, error: 'down' });
r = await handleDb(req('GET', '/api/db', undefined, H(env.TRIVIA_KEY)), ctx); ok(r.status === 503 && (await r.json()).code === 'unavailable', 'outage 503');
// photos
const png = new Uint8Array([137, 80, 78, 71, 1, 2, 3]);
r = await handleAsset(new Request('http://x/api/asset', { method: 'POST', headers: { 'content-type': 'image/png', ...H(env.TRIVIA_KEY) }, body: png }), ctx);
const up = await r.json(); ok(r.status === 200 && /^[a-f0-9]{32}$/.test(up.id), 'upload');
r = await handleAsset(new Request('http://x/api/asset?id=' + up.id, { headers: { cookie } }), ctx);
ok(r.status === 200 && r.headers.get('content-type') === 'image/png' && (await r.arrayBuffer()).byteLength === 7, 'download via cookie');
r = await handleAsset(new Request('http://x/api/asset?id=' + up.id), ctx); ok(r.status === 401, 'download needs auth');
r = await handleAsset(new Request('http://x/api/asset', { method: 'POST', headers: { 'content-type': 'text/html', ...H(env.TRIVIA_KEY) }, body: 'x' }), ctx); ok(r.status === 415, 'html rejected');
r = await handleAsset(new Request('http://x/api/asset?id=../../data/state.json', { headers: H(env.TRIVIA_KEY) }), ctx); ok(r.status === 400, 'path traversal rejected');
r = await handleAsset(new Request('http://x/api/asset?id=' + up.id, { method: 'DELETE', headers: H(env.TRIVIA_KEY) }), ctx); ok(r.status === 200, 'delete');
r = await handleAsset(new Request('http://x/api/asset?id=' + up.id, { headers: H(env.TRIVIA_KEY) }), ctx); ok(r.status === 404, 'gone after delete');
// unconfigured server refuses everything
r = await handleDb(req('GET', '/api/db', undefined, H('anything')), { blob, env: { TRIVIA_KEY: '' } }); ok(r.status === 503, 'unconfigured 503');
// non-hex cookie -> 401 not 500; empty header doesn't fall back to cookie
r = await handleDb(req('GET', '/api/db', undefined, { cookie: 'tk=zz' + 'a'.repeat(62) }), ctx); ok(r.status === 401, 'non-hex cookie 401 ' + r.status);
r = await handleDb(req('GET', '/api/db', undefined, { cookie, 'x-trivia-key': '' }), ctx); ok(r.status === 401, 'empty header + cookie 401');
// short codes refused
r = await handleDb(req('GET', '/api/db', undefined, H('abc123')), { blob, env: { TRIVIA_KEY: 'abc123' } }); ok(r.status === 503, 'short code refused');
// logout clears the cookie
r = await handleLogin(req('POST', '/api/login?out=1'), ctx); ok(/tk=;.*Max-Age=0/.test(r.headers.get('set-cookie')), 'logout clears cookie');
// compare-and-set
const blob3 = createMockBlob(); const ctx3 = { blob: blob3, env: { ...env, TRIVIA_MONTHLY_WRITES: '99' } };
const post3 = (set) => handleDb(req('POST', '/api/db', { set }, H(env.TRIVIA_KEY)), ctx3);
r = await post3([{ path: 'games/x', data: { id: 'x', updatedAt: 10 }, base: null }]); ok(r.status === 200, 'cas create');
r = await post3([{ path: 'games/x', data: { id: 'x', updatedAt: 11 }, base: null }]); ok(r.status === 409, 'cas expects absent but exists');
r = await post3([{ path: 'games/x', data: { id: 'x', updatedAt: 12 }, base: 10 }]); ok(r.status === 200, 'cas matching base');
r = await post3([{ path: 'games/x', data: { id: 'x', updatedAt: 13 }, base: 10 }, { path: 'players/q', data: { id: 'q', updatedAt: 1 }, base: null }]); ok(r.status === 409 && (await r.json()).code === 'conflict', 'cas stale base 409');
r = await handleDb(req('GET', '/api/db', undefined, H(env.TRIVIA_KEY)), ctx3); d = await r.json(); ok(d.docs['games/x'].updatedAt === 12 && !d.docs['players/q'], 'conflict writes nothing');
ok(d.usage.limit === 99, 'GET reports the limit');
r = await post3([{ path: 'trivia/meta', data: { title: 'a', metaAt: 5 }, base: null }]); ok(r.status === 200, 'meta create');
r = await post3([{ path: 'trivia/meta', data: { title: 'b', metaAt: 6 }, base: 5 }]); ok(r.status === 200, 'meta cas by metaAt');
r = await post3([{ path: 'games/y', data: { id: 'y' } }]); ok(r.status === 200, 'no base = no check');
console.log(pass, 'passed,', failN, 'failed');
process.exit(failN ? 1 : 0);
