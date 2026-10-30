import { handleDb } from '../lib/core.js';
import { blob } from '../lib/blob.js';

export default {
  fetch(request) {
    return handleDb(request, { blob, env: process.env });
  },
};
