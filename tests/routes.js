// The studio's addresses: runs worker.mjs in a small local server, with public/ as the assets and
// stand-ins for the tool Workers, and checks the home page, the tool paths and redirects.
//   node tests/routes.js
const http = require('http'), fs = require('fs'), path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node-tools/node_modules/playwright'); }
const PUB = path.join(__dirname, '..', 'public'), OUT = path.join(__dirname, '.out');
fs.mkdirSync(OUT, { recursive: true });
let failed = 0;
const ok = (cond, label) => { if (!cond) failed++; console.log((cond ? 'ok   ' : 'FAIL ') + label); };
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };

// Workers static assets, roughly: a folder serves its index.html, /dir without a slash redirects to /dir/
const ASSETS = { async fetch(req) {
  const u = new URL(req.url); let f = path.join(PUB, decodeURIComponent(u.pathname));
  if (!f.startsWith(PUB)) return new Response('no', { status: 404 });
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) {
    if (!u.pathname.endsWith('/')) return new Response(null, { status: 307, headers: { location: u.pathname + '/' } });
    f = path.join(f, 'index.html');
  }
  if (!fs.existsSync(f)) return new Response('not found', { status: 404 });
  return new Response(fs.readFileSync(f), { headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
} };
// the vsm Worker serves from its root, loads a script by a relative path, and redirects /index.html to /
const VSM = { async fetch(req) {
  const p = new URL(req.url).pathname;
  if (p === '/') return new Response('<!doctype html><title>Viable System Explorer</title><script src="vendor/x.js"></script>', { headers: { 'content-type': 'text/html' } });
  if (p === '/vendor/x.js') return new Response('document.title += " ready"', { headers: { 'content-type': 'text/javascript' } });
  if (p === '/index.html') return new Response(null, { status: 307, headers: { location: '/' } });
  return new Response('not found', { status: 404 });
} };
// the fbc Worker serves Business Model under /model/ itself
const MODEL = { async fetch(req) {
  const p = new URL(req.url).pathname;
  if (p === '/model/' || p === '/model/purpose') return new Response('<!doctype html><title>Business Model</title><p id="at">' + p + '</p>', { headers: { 'content-type': 'text/html' } });
  return new Response('not found', { status: 404 });
} };

(async () => {
  const worker = (await import(path.join(__dirname, '..', 'worker.mjs'))).default;
  const conf = fs.readFileSync(path.join(__dirname, '..', 'wrangler.jsonc'), 'utf8');
  const first = JSON.parse(conf.match(/"run_worker_first":\s*(\[[^\]]*\])/)[1]).map(s => new RegExp('^' + s.replace('*', '.*') + '$'));
  const env = { ASSETS, VSM, MODEL };
  const server = http.createServer(async (q, s) => {
    const req = new Request('http://' + q.headers.host + q.url, { method: q.method });
    const p = new URL(req.url).pathname;
    const res = first.some(r => r.test(p)) ? await worker.fetch(req, env) : await ASSETS.fetch(req);
    const h = {}; res.headers.forEach((v, k) => { h[k] = v; });
    s.writeHead(res.status, h); s.end(Buffer.from(await res.arrayBuffer()));
  }).listen(0);
  const base = 'http://localhost:' + server.address().port;
  const raw = async p => { const r = await worker.fetch(new Request(base + p), env); return [r.status, r.headers.get('location')]; };

  ok((await raw('/vsm'))[1] === base + '/vsm/', '/vsm redirects to /vsm/');
  ok((await raw('/model'))[1] === base + '/model/', '/model redirects to /model/');
  ok((await raw('/vsm?x=1'))[1] === base + '/vsm/?x=1', 'the redirect keeps the query');
  ok((await raw('/vsm/index.html'))[1] === '/vsm/', 'a redirect from vsm stays under /vsm');
  ok((await raw('/model/purpose'))[0] === 200, '/model/purpose reaches Business Model with its path');
  ok((await worker.fetch(new Request(base + '/vsm/'), { ASSETS }) ).status === 503, 'a tool without its binding answers 503');

  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined;
  const browser = await pw.chromium.launch({ proxy });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(String(e.message)));

  await page.goto(base + '/');
  ok(await page.title() === 'Close the Loop Studio', 'the home page is Close the Loop Studio');
  ok(await page.locator('a.tool[href="/model/"]').count() === 1 && await page.locator('a.tool[href="/vsm/"]').count() === 1, 'it links to both tools');
  ok(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ctl-navy').trim() === '#141b38'), 'shared/studio.css loads its tokens');
  ok(await page.evaluate(() => getComputedStyle(document.querySelector('.hero')).backgroundColor === 'rgb(20, 27, 56)'), 'the hero is CTL navy through the shared tokens');
  ok(/AGPL/.test(await page.locator('footer').innerText()), 'the footer names each tool\'s licence');
  await page.screenshot({ path: path.join(OUT, 'home.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(100);
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'home on a phone: no horizontal scroll');
  await page.screenshot({ path: path.join(OUT, 'home-phone.png'), fullPage: true });
  await page.emulateMedia({ colorScheme: 'dark' }); await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: path.join(OUT, 'home-dark.png'), fullPage: true });

  await page.goto(base + '/vsm/'); await page.waitForFunction(() => /ready/.test(document.title));
  ok(true, '/vsm/ loads the explorer with its relative files');
  await page.goto(base + '/#purpose'); await page.waitForURL(/\/model\/purpose/);
  ok(new URL(page.url()).pathname === '/model/purpose', 'an old root link with #purpose lands on /model/purpose');
  const r = await page.goto(base + '/shared/icons.svg');
  ok(r.status() === 200 && /i-plus/.test(await r.text()), 'shared/icons.svg is served');

  ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close(); server.close();
  console.log(failed ? '\n' + failed + ' failed' : '\nall checks passed');
  process.exit(failed ? 1 : 0);
})();
