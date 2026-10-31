// Production storage: the Vercel Blob store connected to this project (credentials come from the environment).
// Reads ask for the bytes as stored: a compressed response carries a weak ETag (W/"..."), which never matches on
// a conditional write, so every save would be turned away once the state grew big enough to be compressed.
import { get as rawGet, put as rawPut, del } from '@vercel/blob';

async function get(pathname, options = {}) {
  const r = await rawGet(pathname, { ...options, headers: { 'accept-encoding': 'identity', ...(options.headers || {}) } });
  if (r && r.blob && typeof r.blob.etag === 'string' && r.blob.etag.startsWith('W/')) {
    console.warn('blob: weak etag on read, using its strong form', pathname);
    r.blob.etag = r.blob.etag.slice(2);
  }
  return r;
}
async function put(pathname, body, options) {
  try { return await rawPut(pathname, body, options); } catch (e) {
    console.warn('blob: put failed', pathname, e && e.name, e && e.message);
    throw e;
  }
}
export const blob = { get, put, del };
