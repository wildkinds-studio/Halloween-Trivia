import { handleAsset } from '../lib/core.js';
import { blob } from '../lib/blob.js';

export default {
  fetch(request) {
    return handleAsset(request, { blob, env: process.env });
  },
};
