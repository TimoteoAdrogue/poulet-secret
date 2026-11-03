// Functional checks for the scroll-driven page.
import { chromium } from '/Users/adroguetimoteo/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const base = process.argv[2];
const b = await chromium.launch({ channel: 'chrome', args: ['--use-mock-keychain', '--password-store=basic'] });
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
const near = async (p, sel) => p.evaluate(s => Math.round(document.querySelector(s).getBoundingClientRect().top), sel);
let p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.goto(base, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
// a long jump goes behind the curtain and the curtain clears again
await p.click('.hero .ctas a[href="#menu"]'); await p.waitForTimeout(350);
ok(await p.evaluate(() => getComputedStyle(document.querySelector('.curtain')).clipPath !== 'inset(100% 0px 0px)'), 'long jump draws the curtain');
await p.waitForTimeout(1800);
ok(await p.evaluate(() => /100%/.test(getComputedStyle(document.querySelector('.curtain')).clipPath)), 'curtain clears after the jump');
ok(Math.abs(await near(p, '#menu')) < 4, 'hero "Le menu" lands on the menu');
for (const [link, sel] of [['.bar-links a[href="#menu"]', '#menu'], ['.bar-links a[href="#histoire"]', '#histoire'], ['.bar-links a[href="#lieu"]', '#lieu']]) {
  await p.click(link); await p.waitForTimeout(2200);
  const t = await near(p, sel); ok(Math.abs(t) < 4, `nav ${sel} lands at top (${t}px)`);
}
// step rail
await p.evaluate(() => window.lenis.scrollTo(innerHeight * 2, { immediate: true, force: true })); await p.waitForTimeout(600);
await p.click('.rail button[data-go="5"]'); await p.waitForTimeout(2200);
ok(await p.evaluate(() => document.querySelector('.step[data-step="5"]').classList.contains('is-on')), 'rail 05 shows Cornichons');
// menu tabs, keyboard, toggle
await p.evaluate(() => window.lenis.scrollTo(document.querySelector('#menu'), { immediate: true, force: true })); await p.waitForTimeout(500);
await p.click('#t-burgers'); await p.waitForTimeout(700);
ok(await p.evaluate(() => !document.querySelector('#c-burgers').hidden && document.querySelector('#c-chicken').hidden), 'tab Burgers opens its panel');
await p.keyboard.press('ArrowRight'); await p.waitForTimeout(700);
ok(await p.evaluate(() => document.activeElement.id === 't-legends' && !document.querySelector('#c-legends').hidden), 'arrow key moves to Legends');
await p.click('.switch'); await p.waitForTimeout(900);
ok(await p.evaluate(() => document.querySelector('#c-legends i').textContent.startsWith('CHF 25.50')), 'menu toggle: Special 20.00 + 5.50 = 25.50');
ok(await p.evaluate(() => document.querySelector('#c-kids i .v').textContent === 'CHF 13.00'), 'kids have no menu supplement');
ok(await p.evaluate(() => { const t = document.querySelector('#t-legends'), r = document.querySelector('.tab-pill').getBoundingClientRect(), b = t.getBoundingClientRect(); return Math.abs(r.left - b.left) < 2 && Math.abs(r.width - b.width) < 2; }), 'tab pill sits under the selected tab');
ok(await p.evaluate(() => getComputedStyle(document.querySelector('.panels')).height !== '0px' && !document.querySelector('.panels').getAnimations().length), 'panel height settles');
// jump straight to the bottom: one-shot reveals must still fire
await p.evaluate(() => window.lenis.scrollTo(document.documentElement.scrollHeight, { immediate: true, force: true })); await p.waitForTimeout(900);
ok(await p.evaluate(() => [...document.querySelectorAll('.star')].every(s => s.classList.contains('is-in'))), 'star icons drawn after a jump to the bottom');
ok(await p.evaluate(() => document.querySelector('.tv-inner').style.getPropertyValue('--scan') === '1.0000'), 'menu screen fully lit after a jump past it');
ok(await p.evaluate(() => [...document.querySelectorAll('[data-rise]')].filter(e => e.getBoundingClientRect().bottom < innerHeight * .64).every(e => getComputedStyle(e).opacity === '1')), 'risen blocks are fully shown after a jump');
ok(await p.evaluate(() => !!document.querySelector('.map iframe')), 'map iframe loaded');
ok(await p.evaluate(() => document.querySelectorAll('[data-order]:not([hidden])').length === 0), 'no dead Commander button shown');
// deep link
p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto(base + '#lieu', { waitUntil: 'load' }); await p.waitForTimeout(2500);
const t = await near(p, '#lieu'); ok(Math.abs(t) < 4, `deep link #lieu lands at top (${t}px)`);
// reduced motion: static page, everything readable
const rm = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })).newPage();
await rm.goto(base, { waitUntil: 'networkidle' }); await rm.waitForTimeout(800);
ok(await rm.evaluate(() => !document.documentElement.classList.contains('motion') && getComputedStyle(document.querySelector('.build-photo')).opacity === '1' && getComputedStyle(document.querySelector('.step')).visibility === 'visible'), 'reduced motion: static build with photo and all steps');
ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs));
await b.close();
