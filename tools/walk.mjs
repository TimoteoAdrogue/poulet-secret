// Scroll walk: screenshots at given scroll fractions of each pinned scene, plus console errors.
// node tools/walk.mjs <url> <outdir> <w> <h> [mobile]
import { chromium } from '/Users/adroguetimoteo/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const [url, out, w, h, mob] = process.argv.slice(2);
const b = await chromium.launch({ channel: 'chrome', args: ['--use-mock-keychain', '--password-store=basic'] });
const c = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, isMobile: !!mob, hasTouch: !!mob });
const p = await c.newPage();
const errs = [];
p.on('console', m => m.type() === 'error' && errs.push(m.text()));
p.on('pageerror', e => errs.push(String(e)));
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForTimeout(1800);
const marks = await p.evaluate(() => ScrollTrigger.getAll().map(t => ({ id: t.trigger && (t.trigger.className || t.trigger.id), start: Math.round(t.start), end: Math.round(t.end) })));
console.log(JSON.stringify(marks));
const H = await p.evaluate(() => document.documentElement.scrollHeight);
const shots = JSON.parse(process.env.SHOTS || '[]');
const tag = mob ? 'm' : 'd';
for (const [name, y] of shots) {
  const target = typeof y === 'string' ? await p.evaluate(e => eval(e), y) : y;
  await p.evaluate(t => window.lenis ? window.lenis.scrollTo(t, { immediate: true, force: true }) : window.scrollTo(0, t), target);
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${out}/${tag}-${name}.png` });
}
console.log('height', H, 'errors', JSON.stringify(errs));
await b.close();
