/**
 * Serves the prerendered build the way Vercel serves static files, for the
 * Playwright suite: the exact file, else `<path>/index.html`, else 404.
 *
 * Not `vite preview`. Its SPA fallback answers /plates with the Home page's
 * HTML, React then hydrates /plates over Home's markup, and the page renders
 * twice with no error. The tests would have been checking a page no visitor
 * sees.
 *
 *   node tests/serve.mjs <dir> <port>
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const [dir = 'build/client', port = '8100'] = process.argv.slice(2);
const root = resolve(dir);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const isFile = (path) => existsSync(path) && statSync(path).isFile();

createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname));
  const target = join(root, path);
  if (!target.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  const file = [target, join(target, 'index.html')].find(isFile);
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
    return;
  }
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(Number(port), () => console.log(`Serving ${root} on http://localhost:${port}`));
