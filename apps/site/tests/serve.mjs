/**
 * Serves the prerendered build the way Vercel serves static files, for the
 * Playwright suite and for Lighthouse: the exact file, else `<path>/index.html`,
 * else the 404 page, with text compressed as Vercel compresses it (brotli, else
 * gzip). Uncompressed, Lighthouse measured 683 KiB more than a visitor gets.
 *
 * Not `vite preview`. Its SPA fallback answers /plates with the Home page's
 * HTML, React then hydrates /plates over Home's markup, and the page renders
 * twice with no error. The tests would have been checking a page no visitor
 * sees.
 *
 *   node tests/serve.mjs <dir> <port>
 */
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { extname, join, normalize, resolve } from 'node:path';

const [dir = 'build/client', port = '8100'] = process.argv.slice(2);
const root = resolve(dir);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const isFile = (path) => existsSync(path) && statSync(path).isFile();

// Fonts and images are compressed already; text is what Vercel compresses.
const compressible = new Set(['.html', '.js', '.css', '.json', '.svg', '.xml', '.txt', '.data']);

// Each file is compressed once, at full quality, and kept, as Vercel serves a
// stored copy: compressing per request took the suite from 30s to 90s.
const compressed = new Map();

function send(req, res, status, file) {
  const type = types[extname(file)] ?? 'application/octet-stream';
  const accepts = String(req.headers['accept-encoding'] ?? '');
  const encoding = !compressible.has(extname(file))
    ? null
    : /\bbr\b/.test(accepts)
      ? 'br'
      : /\bgzip\b/.test(accepts)
        ? 'gzip'
        : null;
  if (!encoding) {
    res.writeHead(status, { 'content-type': type });
    createReadStream(file).pipe(res);
    return;
  }
  const key = `${encoding} ${file}`;
  if (!compressed.has(key)) {
    const body = readFileSync(file);
    compressed.set(key, encoding === 'br' ? brotliCompressSync(body) : gzipSync(body));
  }
  res.writeHead(status, { 'content-type': type, 'content-encoding': encoding, vary: 'accept-encoding' });
  res.end(compressed.get(key));
}

createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname));
  const target = join(root, path);
  if (!target.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  const file = [target, join(target, 'index.html')].find(isFile);
  if (!file) {
    // Vercel serves the root 404.html, with a 404 status, for any path it has no file for.
    const notFound = join(root, '404.html');
    if (isFile(notFound)) send(req, res, 404, notFound);
    else res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
    return;
  }
  send(req, res, 200, file);
}).listen(Number(port), () => console.log(`Serving ${root} on http://localhost:${port}`));
