import { handleDb, handleAsset, handleLogin, handlePing, handleInvite, handleEntry } from '../lib/core.js';
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
// guest links
{
  const b4 = createMockBlob(); const c4 = { blob: b4, env: { ...env, TRIVIA_MONTHLY_WRITES: '999' } };
  const K = H(env.TRIVIA_KEY);
  const game = { id: 'g1', name: 'Halloween', status: 'setup', updatedAt: 5, playerIds: ['pa', 'pb'], rounds: [
    { id: 'ra', masterId: 'pa', category: 'Horror', themeId: 'haunt', questions: [{ id: 'q1', text: 'Secret A?', answer: 'A', wrong: ['x'], diff: 2, seed: 9, at: 3 }] },
    { id: 'rb', masterId: 'pb', category: 'Space', questions: [{ id: 'q2', text: 'Secret B?', answer: 'B', wrong: ['y'], diff: 1 }] },
    { id: 'rc', masterId: 'gone', category: '', questions: [] }] };
  await handleDb(req('POST', '/api/db', { set: [{ path: 'games/g1', data: game }, { path: 'players/pa', data: { id: 'pa', name: 'Ann', updatedAt: 1 } }, { path: 'players/pb', data: { id: 'pb', name: 'Bob', updatedAt: 1 } }] }, K), c4);
  r = await handleInvite(req('GET', '/api/invite?g=g1&r=ra'), c4); ok(r.status === 401, 'invite needs the event code');
  r = await handleInvite(req('GET', '/api/invite?g=g1&r=zz', undefined, K), c4); ok(r.status === 404, 'invite for a missing round 404');
  r = await handleInvite(req('GET', '/api/invite?g=g1&r=rc', undefined, K), c4); ok(r.status === 404, 'invite for a guest no longer playing 404');
  r = await handleInvite(req('GET', '/api/invite?g=g1&r=ra', undefined, K), c4); const ta = (await r.json()).token; ok(r.status === 200 && /^[a-f0-9]{32}$/.test(ta), 'invite token');
  r = await handleInvite(req('GET', '/api/invite?g=g1&r=rb', undefined, K), c4); const tb = (await r.json()).token; ok(tb !== ta, 'tokens differ per round');
  const E = (m, q, body) => handleEntry(req(m, '/api/entry?' + q, body), c4);
  r = await E('GET', 'g=g1&r=ra&t=' + ta); let e = await r.json(); const raw = JSON.stringify(e);
  ok(r.status === 200 && e.player.name === 'Ann' && e.round.category === 'Horror' && e.round.questions[0].text === 'Secret A?' && e.game.status === 'setup', 'guest reads own round');
  ok(!raw.includes('Secret B') && !raw.includes('Space') && !raw.includes('Bob') && !('at' in e.round.questions[0]) && !raw.includes('usage') && /^[a-f0-9]{20}$/.test(e.ver), 'guest sees nothing of other rounds');
  r = await E('GET', 'g=g1&r=rb&t=' + ta); ok(r.status === 401, "a link can't open another round");
  r = await E('GET', 'g=g1&r=ra&t=' + ta.replace(/^./, (c) => (c === '0' ? '1' : '0'))); ok(r.status === 401, 'tampered token 401');
  r = await E('GET', 'g=g1&r=ra'); ok(r.status === 401, 'no token 401');
  r = await handleDb(req('GET', '/api/db', undefined, { 'x-trivia-key': ta }), c4); ok(r.status === 401, 'a guest token is not the event code');
  const mine = { category: 'Horror films', emoji: '🎃', themeId: 'haunt', themeAuto: false, questions: [{ id: 'q1', text: 'New A?', answer: 'A2', wrong: ['w1', 'w2', 'w3'], diff: 3 }, { id: 'q3', text: 'Q3?', answer: 'C', wrong: ['z'], diff: 1, seed: 1, evil: '<x>' }] };
  r = await E('POST', 'g=g1&r=ra&t=' + ta, { round: mine }); e = await r.json(); ok(r.status === 200 && e.savedAt > 0 && !('writes' in e), 'guest saves');
  r = await E('GET', 'g=g1&r=ra&t=' + ta); e = await r.json(); ok(e.round.category === 'Horror films' && e.round.questions.length === 2 && !('evil' in e.round.questions[1]) && e.round.questions[1].seed === 1, 'guest reads their saved copy (seed kept)');
  r = await handleDb(req('GET', '/api/db', undefined, K), c4); d = await r.json();
  ok(d.docs['entries/g1.ra'] && d.docs['entries/g1.ra'].round.questions[0].text === 'New A?' && d.docs['games/g1'].rounds[0].questions[0].text === 'Secret A?', 'entry kept apart from the game');
  ok(d.usage.guest === 1, 'guest saves counted apart');
  ok(d.docs['entries/g1.ra'].base && d.docs['entries/g1.ra'].base.category === 'Horror' && d.docs['entries/g1.ra'].base.questions[0].text === 'Secret A?', 'entry keeps the copy it was made from');
  r = await E('POST', 'g=g1&r=ra&t=' + ta, { round: { questions: 'nope' } }); ok(r.status === 400, 'bad round 400');
  r = await E('POST', 'g=g1&r=ra&t=' + ta, { round: { questions: Array.from({ length: 41 }, (_, i) => ({ id: 'q' + i })) } }); ok(r.status === 400, 'too many questions 400');
  r = await E('POST', 'g=g1&r=ra&t=' + ta, { round: { questions: [{ id: '../x' }] } }); ok(r.status === 400, 'bad question id 400');
  r = await E('POST', 'g=g1&r=ra&t=' + ta, { round: { category: 'x'.repeat(500), questions: [{ id: 'q1', text: 'y'.repeat(5000) }] } }); e = await r.json();
  r = await handleDb(req('GET', '/api/db', undefined, K), c4); d = await r.json(); ok(d.docs['entries/g1.ra'].round.category.length === 60 && d.docs['entries/g1.ra'].round.questions[0].text.length === 600, 'long fields trimmed');
  r = await E('PUT', 'g=g1&r=ra&t=' + ta, { round: mine }); ok(r.status === 405, 'PUT refused');
  r = await E('GET', 'g=g1&r=ra&t=' + ta); e = await r.json();
  const v1 = e.ver; const cat1 = e.round.category;
  // a save from an out-of-date copy is turned back with the current one
  r = await E('POST', 'g=g1&r=ra&t=' + ta, { round: { ...mine, category: 'Stale' }, base: 'deadbeefdeadbeefdead' }); e = await r.json(); ok(r.status === 409 && e.code === 'changed' && e.round.category === cat1 && e.ver === v1, 'stale base 409 with the current copy');
  r = await E('POST', 'g=g1&r=ra&t=' + ta, { round: { ...mine, category: 'Horror films!' }, base: v1 }); e = await r.json(); ok(r.status === 200 && e.ver && e.ver !== v1, 'matching base saves');
  // once a host device has folded the entry in (and added a question on the iPad), the link serves the game's copy
  r = await handleDb(req('GET', '/api/db', undefined, K), c4); d = await r.json();
  const folded = JSON.parse(JSON.stringify(d.docs['games/g1'])); const ent = d.docs['entries/g1.ra'];
  folded.rounds[0] = { ...folded.rounds[0], category: ent.round.category, questions: [...ent.round.questions, { id: 'qi', text: 'Typed on the iPad', answer: 'I', wrong: ['j'], diff: 1, at: 5 }], entryAt: ent.updatedAt };
  folded.updatedAt = 50; await handleDb(req('POST', '/api/db', { set: [{ path: 'games/g1', data: folded }] }, K), c4);
  r = await E('GET', 'g=g1&r=ra&t=' + ta); e = await r.json(); ok(e.round.questions.some((q) => q.text === 'Typed on the iPad') && e.round.category === 'Horror films!', 'folded: phone opens the copy with the iPad question');
  r = await E('POST', 'g=g1&r=ra&t=' + ta, { round: { ...mine, category: 'Overwrite' }, base: v1 }); ok(r.status === 409, "an old phone copy can't wipe the iPad question");
  // control characters and size
  r = await E('POST', 'g=g1&r=ra&t=' + ta, { round: { category: 'A\u0001B\nC', questions: [{ id: 'q1', text: 'x\u0000y' }] } }); ok(r.status === 200, 'control chars accepted');
  r = await handleDb(req('GET', '/api/db', undefined, K), c4); d = await r.json(); ok(d.docs['entries/g1.ra'].round.category === 'AB\nC' && d.docs['entries/g1.ra'].round.questions[0].text === 'xy', 'control chars stripped');
  r = await E('POST', 'g=g1&r=ra&t=' + ta, { round: { questions: Array.from({ length: 40 }, (_, i) => ({ id: 'q' + i, text: 'é'.repeat(600), answer: 'é'.repeat(200), wrong: Array(5).fill('é'.repeat(200)) })) } }); ok(r.status === 413, 'oversized round 413 ' + r.status);
  // a new link for the round retires the old one
  const salted = JSON.parse(JSON.stringify(d.docs['games/g1'])); salted.rounds[0].linkSalt = 'abc123'; salted.updatedAt = 60;
  await handleDb(req('POST', '/api/db', { set: [{ path: 'games/g1', data: salted }] }, K), c4);
  r = await E('GET', 'g=g1&r=ra&t=' + ta); ok(r.status === 401, 'old link retired by a new salt');
  r = await handleInvite(req('GET', '/api/invite?g=g1&r=ra', undefined, K), c4); const ta2 = (await r.json()).token; ok(ta2 !== ta, 'new token after salt');
  r = await E('GET', 'g=g1&r=ra&t=' + ta2); ok(r.status === 200, 'new link works');
  r = await E('GET', 'g=g1&r=rb&t=' + tb); ok(r.status === 200, "other rounds' links unaffected");
  // the game starts: links lock
  await handleDb(req('POST', '/api/db', { set: [{ path: 'games/g1', data: { ...game, status: 'playing' } }] }, K), c4);
  r = await E('POST', 'g=g1&r=rb&t=' + tb, { round: mine }); ok(r.status === 409 && (await r.json()).code === 'locked', 'locked once playing');
  r = await E('GET', 'g=g1&r=rb&t=' + tb); e = await r.json(); ok(e.game.status === 'locked' && e.round.questions.length === 0 && !JSON.stringify(e).includes('Secret B'), 'locked: no questions handed out');
  // the game is deleted: link stops
  await handleDb(req('POST', '/api/db', { set: [{ path: 'games/g1', data: { id: 'g1', deleted: true, updatedAt: 9 } }] }, K), c4);
  r = await E('GET', 'g=g1&r=rb&t=' + tb); ok(r.status === 404 || r.status === 401, 'deleted game: link stops ' + r.status);
  // a new event code retires old links
  const c5 = { blob: b4, env: { ...c4.env, TRIVIA_KEY: 'another-event-code-2027' } };
  r = await handleEntry(req('GET', '/api/entry?g=g1&r=rb&t=' + tb), c5); ok(r.status === 401, 'new event code retires links');
  // guest saves have their own cap
  const b6 = createMockBlob(); const c6 = { blob: b6, env: { ...env, TRIVIA_MONTHLY_WRITES: '5000' } };
  await handleDb(req('POST', '/api/db', { set: [{ path: 'games/g1', data: game }] }, K), c6);
  const st = JSON.parse(b6.files.get('data/state.json').buf.toString()); st.usage.guest = 800; b6.files.get('data/state.json').buf = Buffer.from(JSON.stringify(st));
  r = await handleEntry(req('POST', '/api/entry?g=g1&r=ra&t=' + ta, { round: mine }), c6); ok(r.status === 429, 'guest cap ' + r.status);
  r = await handleDb(req('POST', '/api/db', { set: [{ path: 'players/z', data: { id: 'z' } }] }, K), c6); ok(r.status === 200, 'devices still save after the guest cap');
  // one link's own monthly cap
  const b7 = createMockBlob(); const c7 = { blob: b7, env: { ...env, TRIVIA_MONTHLY_WRITES: '5000' } };
  await handleDb(req('POST', '/api/db', { set: [{ path: 'games/g1', data: game }] }, K), c7);
  const st7 = JSON.parse(b7.files.get('data/state.json').buf.toString()); st7.docs['entries/g1.ra'] = { round: { questions: [] }, updatedAt: 1, month: new Date().toISOString().slice(0, 7), n: 150 }; b7.files.get('data/state.json').buf = Buffer.from(JSON.stringify(st7));
  r = await handleEntry(req('POST', '/api/entry?g=g1&r=ra&t=' + ta, { round: mine }), c7); ok(r.status === 429, 'per-link cap ' + r.status);
  r = await handleEntry(req('POST', '/api/entry?g=g1&r=rb&t=' + tb, { round: mine }), c7); ok(r.status === 200, 'other links still save ' + r.status);
}
console.log(pass, 'passed,', failN, 'failed');
process.exit(failN ? 1 : 0);
