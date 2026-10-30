import { handleLogin } from '../lib/core.js';
import { blob } from '../lib/blob.js';

export default {
  fetch(request) {
    return handleLogin(request, { blob, env: process.env });
  },
};
