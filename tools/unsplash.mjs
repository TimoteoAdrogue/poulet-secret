// List Unsplash search results (free-licence photos only, Unsplash+ skipped): node tools/unsplash.mjs <query> <outdir>
import { chromium } from '/Users/adroguetimoteo/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const [q, out] = process.argv.slice(2);
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1400, height: 1200 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' });
await p.goto('https://unsplash.com/s/photos/' + encodeURIComponent(q) + '?license=free', { waitUntil: 'domcontentloaded', timeout: 45000 });
await p.waitForTimeout(3500);
const items = await p.evaluate(() => [...document.querySelectorAll('figure a[href^="/photos/"]')].map(a => {
  const img = a.querySelector('img[srcset]') || a.querySelector('img');
  return { page: 'https://unsplash.com' + a.getAttribute('href'), src: img && (img.currentSrc || img.src), alt: img && img.alt };
}).filter(x => x.src && x.src.includes('images.unsplash.com/photo-')));
const seen = new Set(), uniq = items.filter(x => !seen.has(x.page) && seen.add(x.page)).slice(0, 12);
const fs = await import('fs');
fs.writeFileSync(`${out}/${q.replace(/\W+/g, '-')}.json`, JSON.stringify(uniq, null, 1));
for (const [i, x] of uniq.entries()) {
  const u = x.src.replace(/w=\d+/, 'w=400').replace(/&h=\d+/, '');
  const r = await fetch(u); fs.writeFileSync(`${out}/${q.replace(/\W+/g, '-')}-${i}.jpg`, Buffer.from(await r.arrayBuffer()));
}
console.log(q, uniq.length);
await b.close();
