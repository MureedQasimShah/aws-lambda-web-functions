'use strict';

/**
 * Local-only entry. Starts a real HTTP server.
 * On AWS we do NOT use this file — Lambda calls handler.js instead.
 */

const app = require('./app');

const HOST = '127.0.0.1';
const PORT = 3001;

const server = app.listen(PORT, HOST, () => {
  console.log(`[lambda-old-demo] listening on http://${HOST}:${PORT} (local)`);
  console.log('[lambda-old-demo] On AWS this app uses handler.js + API Gateway instead.');
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`[lambda-old-demo] address already in use: ${HOST}:${PORT}`);
  } else {
    console.error('[lambda-old-demo] failed to start:', err);
  }
  process.exit(1);
});
