import { handleEntry } from '../lib/core.js';
import { blob } from '../lib/blob.js';

export default {
  fetch(request) {
    return handleEntry(request, { blob, env: process.env });
  },
};
