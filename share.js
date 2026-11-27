// Draws the link-preview images (Open Graph, 1200 x 630) into public/share/. Needs Playwright:
//   node share.js
// Run it again only when the cards' wording or look changes; the PNGs are committed.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');

const MARK = '<svg class="mk" viewBox="0 0 800 800" aria-hidden="true"><circle class="arc" cx="400" cy="400" r="297" pathLength="360" transform="rotate(-36 400 400)"/><circle class="arc-c" cx="395" cy="399" r="75.6" pathLength="360" transform="rotate(25.4 395 399)"/><circle class="dot" cx="573" cy="168" r="16"/></svg>';
const FBC = '<svg viewBox="0 0 30 30"><rect x="1" y="1" width="28" height="28" rx="1.5" fill="#046656" stroke="#f5f4f0" stroke-width=".9"/><rect x="7" y="6" width="20" height="23" fill="#8da93f"/><rect x="12" y="11" width="12" height="18" fill="#d8b73c"/></svg>';
const VSM = '<svg viewBox="0 0 120 100" fill="none" stroke-width="3.2"><ellipse cx="34" cy="56" rx="30" ry="40" stroke="#aab3cf" stroke-dasharray="5 6"/><rect x="54" y="8" width="44" height="30" rx="3" stroke="#eeba2b"/><circle cx="76" cy="58" r="11" stroke="#f5f4f0"/><circle cx="76" cy="84" r="11" stroke="#f5f4f0"/><path d="M76 38v9M98 23h14v61H87" stroke="#aab3cf"/></svg>';

const CARDS = {
  studio: {
    kicker: 'Tools for flourishing enterprises', title: 'Close the Loop<br>Studio',
    lede: 'Business Model, on the Flourishing Business Canvas, and the Viable System Explorer.',
    url: 'studio.closetheloop.gr', art: `<div class="tile fbc">${FBC}</div><div class="tile vsm">${VSM}</div>`
  },
  model: {
    kicker: 'Close the Loop Studio', title: 'Business<br>Model',
    lede: 'Design and test a business model on the Flourishing Business Canvas, or start from the Business Model Canvas.',
    url: 'studio.closetheloop.gr/model', art: `<div class="tile fbc big">${FBC}</div>`
  }
};

const page = c => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;500&family=Fira+Sans+Condensed:wght@600&family=Raleway:wght@700;800&family=Comfortaa:wght@500&display=block">
<style>
* { box-sizing: border-box; } html, body { margin: 0; }
.card { width: 1200px; height: 630px; background: #141b38; color: #f5f4f0; position: relative; overflow: hidden; border-bottom: 10px solid #eeba2b; font-family: 'Fira Sans', sans-serif; }
.card::after { content: ''; position: absolute; right: -230px; top: -280px; width: 820px; height: 820px; border-radius: 50%; border: 84px solid rgba(255, 255, 255, .035); }
.ctl { position: absolute; left: 72px; top: 60px; display: flex; align-items: center; gap: 14px; }
.mk { width: 44px; height: 44px; } .arc, .arc-c { fill: none; stroke: #fff; stroke-linecap: round; }
.arc { stroke-width: 29; stroke-dasharray: 325.6 34.4; } .arc-c { stroke-width: 37.4; stroke-dasharray: 304.7 55.3; } .dot { fill: #eeba2b; }
.wm { font: 500 25px/1 Comfortaa, sans-serif; letter-spacing: .02em; }
.text { position: absolute; left: 72px; top: 160px; width: 690px; z-index: 1; }
.kicker { font: 700 17px/1 Raleway, sans-serif; letter-spacing: .24em; text-transform: uppercase; color: #eeba2b; margin: 0 0 22px; }
h1 { margin: 0; font: 800 92px/.96 Raleway, sans-serif; letter-spacing: -.025em; color: #fff; }
.lede { margin: 26px 0 0; font-size: 25px; line-height: 1.45; color: #c8cedf; }
.url { position: absolute; left: 72px; bottom: 50px; font: 600 18px/1 'Fira Sans Condensed', sans-serif; letter-spacing: .14em; text-transform: uppercase; color: #aab3cf; }
.art { position: absolute; right: 72px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 26px; z-index: 1; }
.tile { width: 300px; height: 176px; border-radius: 18px; display: grid; place-items: center; box-shadow: 0 24px 50px -24px rgba(0, 0, 0, .7); }
.tile.fbc { background: #046656; } .tile.vsm { background: #222b52; }
.tile svg { height: 124px; width: auto; overflow: visible; }
.tile.big { width: 340px; height: 380px; } .tile.big svg { height: 220px; }
</style></head><body><div class="card">
<div class="ctl">${MARK}<span class="wm">close the loop</span></div>
<div class="text"><p class="kicker">${c.kicker}</p><h1>${c.title}</h1><p class="lede">${c.lede}</p></div>
<div class="art">${c.art}</div><div class="url">${c.url}</div>
</div></body></html>`;

(async () => {
  const out = path.join(__dirname, 'public', 'share');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const [name, c] of Object.entries(CARDS)) {
    await p.setContent(page(c), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.locator('.card').screenshot({ path: path.join(out, name + '.png') });
    console.log('wrote public/share/' + name + '.png');
  }
  await browser.close();
})();
