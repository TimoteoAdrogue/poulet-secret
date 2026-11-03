// Frame times while wheel-scrolling through a range (real wheel events, so Lenis runs as for a visitor).
import { chromium } from '/Users/adroguetimoteo/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const [url, from, to] = [process.argv[2], +process.argv[3], +process.argv[4]];
const b = await chromium.launch({ channel: 'chrome', args: ['--use-mock-keychain', '--password-store=basic'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
await p.evaluate(y => window.lenis.scrollTo(y, { immediate: true, force: true }), from * 900);
await p.waitForTimeout(500);
await p.evaluate(() => { window.__f = []; let t0 = performance.now(); const f = t => { window.__f.push(t - t0); t0 = t; if (window.__f.length < 2000) requestAnimationFrame(f); }; requestAnimationFrame(f); });
await p.mouse.move(700, 450);
const steps = Math.round((to - from) * 900 / 80);
for (let i = 0; i < steps; i++) { await p.mouse.wheel(0, 80); await p.waitForTimeout(16); }
await p.waitForTimeout(800);
const f = (await p.evaluate(() => window.__f)).slice(2).sort((a, b) => a - b);
const q = k => f[Math.floor(f.length * k)].toFixed(1);
console.log(`frames ${f.length}  median ${q(.5)}ms  p95 ${q(.95)}ms  worst ${f[f.length - 1].toFixed(1)}ms`);
await b.close();
