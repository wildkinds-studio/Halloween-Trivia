// In-memory stand-in for @vercel/blob (get/put/del with ETags), for local testing only.
import { createHash } from 'node:crypto';
export function createMockBlob() {
  const files = new Map(); // pathname -> {buf, type, etag}
  const ops = { get: 0, put: 0, del: 0 };
  const faults = []; // {op, times, error?, delay?}
  const fault = async (op) => {
    const f = faults.find((x) => (x.op === op || x.op === '*') && x.times > 0);
    if (!f) return;
    f.times--;
    if (f.delay) await new Promise((r) => setTimeout(r, f.delay));
    if (f.error) throw Object.assign(new Error(f.error), { name: f.name || 'BlobServiceNotAvailable' });
  };
  return {
    files, ops, faults,
    async get(pathname, opts = {}) {
      ops.get++; await fault('get');
      const f = files.get(pathname);
      if (!f) return null;
      return { statusCode: 200, stream: new Blob([f.buf]).stream(), headers: new Headers(), blob: { pathname, etag: f.etag, contentType: f.type, size: f.buf.length, url: 'mock://' + pathname, uploadedAt: new Date() } };
    },
    async put(pathname, body, opts = {}) {
      ops.put++; await fault('put');
      const cur = files.get(pathname);
      if (opts.ifMatch !== undefined) {
        if (!cur || cur.etag !== opts.ifMatch) throw Object.assign(new Error('Precondition failed: ETag mismatch'), { name: 'BlobPreconditionFailedError' });
      } else if (cur && !opts.allowOverwrite) {
        throw Object.assign(new Error('Vercel Blob: This blob already exists, use `allowOverwrite: true` if you want to overwrite it.'), { name: 'BlobError' });
      }
      const buf = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
      const etag = '"' + createHash('md5').update(buf).update(String(Math.random())).digest('hex') + '"';
      files.set(pathname, { buf, type: opts.contentType || 'application/octet-stream', etag });
      return { pathname, etag, url: 'mock://' + pathname };
    },
    async del(pathname) { ops.del++; files.delete(pathname); },
  };
}
