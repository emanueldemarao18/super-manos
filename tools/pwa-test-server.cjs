'use strict';
// Local fixture for testing service-worker updates without editing release files.
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..');
let release = 1;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.webmanifest': 'application/manifest+json' };
http.createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost');
  if (url.pathname === '/__release' && request.method === 'POST') {
    release = url.searchParams.get('version') === '2' ? 2 : 1;
    response.end(String(release)); return;
  }
  if (!url.pathname.startsWith('/super-manos/')) { response.writeHead(404); response.end(); return; }
  const relative = decodeURIComponent(url.pathname.slice('/super-manos/'.length)) || 'index.html';
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep)) { response.writeHead(403); response.end(); return; }
  fs.readFile(file, (error, bytes) => {
    if (error) { response.writeHead(404); response.end(); return; }
    if (relative === 'sw.js') bytes = Buffer.from(bytes.toString().replace("const VERSION = 'pwa-1';", "const VERSION = 'pwa-test-" + release + "';"));
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(bytes);
  });
}).listen(8767, '127.0.0.1', () => console.log('PWA fixture: http://127.0.0.1:8767/super-manos/'));
