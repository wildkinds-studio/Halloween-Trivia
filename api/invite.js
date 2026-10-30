import { handleInvite } from '../lib/core.js';
import { blob } from '../lib/blob.js';

export default {
  fetch(request) {
    return handleInvite(request, { blob, env: process.env });
  },
};
