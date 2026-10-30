// Local stand-in for the Vercel deployment: static files + the same API handlers over an in-memory blob store.
// node server/dev.js <staticDir> <port> [key]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { handleDb, handleAsset, handleLogin, handlePing, handleInvite, handleEntry } from './lib/core.js';
import { createMockBlob } from './lib/mockblob.js';

const root = path.resolve(process.argv[2] || '.');
const port = Number(process.argv[3] || 8790);
const env = { TRIVIA_KEY: process.argv[4] || 'meeko-test-key-2026', BLOB_READ_WRITE_TOKEN: 'mock' };
export const blob = createMockBlob();
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
let apiDown = false; let latency = 0;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  // test controls
  if (url.pathname === '/__mock/state') { res.setHeader('content-type', 'application/json'); const f = blob.files.get('data/state.json'); res.end(JSON.stringify({ ops: blob.ops, state: f ? JSON.parse(f.buf.toString()) : null, photos: [...blob.files.keys()].filter((k) => k.startsWith('photos/')) })); return; }
  if (url.pathname === '/__mock/fault') { const b = JSON.parse(url.searchParams.get('f') || '{}'); if (b.clear) blob.faults.length = 0; else blob.faults.push(b); res.end('ok'); return; }
  if (url.pathname === '/__mock/down') { apiDown = url.searchParams.get('v') === '1'; res.end('ok'); return; }
  if (url.pathname === '/__mock/latency') { latency = Number(url.searchParams.get('ms') || 0); res.end('ok'); return; }
  if (url.pathname === '/__mock/env') { env[url.searchParams.get('k')] = url.searchParams.get('v'); res.end('ok'); return; }
  if (url.pathname === '/__mock/reset') { blob.files.clear(); for (const k of Object.keys(blob.ops)) blob.ops[k] = 0; blob.faults.length = 0; apiDown = false; latency = 0; res.end('ok'); return; }
  let route = null;
  if (url.pathname.startsWith('/_blob/')) { route = handleAsset; url.pathname = '/api/asset'; url.searchParams.set('id', req.url.split('/_blob/')[1].split(/[?#]/)[0]); }
  else route = { '/api/db': handleDb, '/api/asset': handleAsset, '/api/login': handleLogin, '/api/ping': handlePing, '/api/invite': handleInvite, '/api/entry': handleEntry }[url.pathname];
  if (route) {
    if (apiDown) { req.socket.destroy(); return; }
    req.on('error', () => {}); res.on('error', () => {});
    try {
      if (latency) await new Promise((r) => setTimeout(r, latency));
      const chunks = []; for await (const c of req) chunks.push(c);
      const body = chunks.length ? Buffer.concat(chunks) : undefined;
      const request = new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body });
      const r = await route(request, { blob, env });
      res.statusCode = r.status;
      r.headers.forEach((v, k) => res.setHeader(k, v));
      res.end(Buffer.from(await r.arrayBuffer()));
    } catch (e) { console.error(e); try { res.statusCode = 500; res.end('error'); } catch { /* client gone */ } }
    return;
  }
  let file = path.join(root, decodeURIComponent(url.pathname));
  if (!file.startsWith(root)) { res.statusCode = 403; res.end(); return; }
  if (url.pathname.endsWith('/')) file = path.join(file, 'index.html');
  fs.readFile(file, (err, data) => {
    if (err) { res.statusCode = 404; res.end('not found'); return; }
    res.setHeader('content-type', TYPES[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});
server.listen(port, () => console.log(`dev server on http://localhost:${port} serving ${root}`));
