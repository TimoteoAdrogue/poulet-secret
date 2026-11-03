// Repro: at a small window, switch a menu tab, then scroll into the story; is the story pinned when its top reaches the top?
import { chromium } from '/Users/adroguetimoteo/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const [url, w, h, tab] = [process.argv[2], +process.argv[3], +process.argv[4], process.argv[5]];
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: w, height: h } });
await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
await p.evaluate(() => window.lenis.scrollTo(document.querySelector('#menu'), { immediate: true, force: true })); await p.waitForTimeout(800);
if (tab) { await p.click('#' + tab); await p.waitForTimeout(900); }
const st = await p.evaluate(() => { const t = ScrollTrigger.getAll().find(t => t.pin && t.trigger.classList.contains('story-pin')); return { start: Math.round(t.start), end: Math.round(t.end) }; });
// the truth: where the story-pin's top really is in the page now
const realTop = await p.evaluate(() => { const el = document.querySelector('.story-pin').parentElement; return Math.round(el.getBoundingClientRect().top + scrollY); });
console.log(JSON.stringify({ tab: tab || 'none', triggerStart: st.start, realTop, drift: realTop - st.start }));
for (const [n, dy] of [['a', -120], ['b', 60], ['c', 260]]) {
  await p.evaluate(y => window.lenis.scrollTo(y, { immediate: true, force: true }), realTop + dy); await p.waitForTimeout(500);
  await p.screenshot({ path: `review/story-${tab || 'none'}-${n}.png` });
  console.log(n, await p.evaluate(() => Math.round(document.querySelector('.panel-text').getBoundingClientRect().top)));
}
await b.close();
