import { handlePing } from '../lib/core.js';
import { blob } from '../lib/blob.js';

export default {
  fetch(request) {
    return handlePing(request, { blob, env: process.env });
  },
};
