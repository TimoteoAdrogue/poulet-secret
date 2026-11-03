import { chromium } from '/Users/adroguetimoteo/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(process.argv[2] + '#lieu', { waitUntil: 'load' }); await p.waitForTimeout(2500);
console.log('lieu top', await p.evaluate(() => Math.round(document.querySelector('#lieu').getBoundingClientRect().top)), 'y', await p.evaluate(() => Math.round(scrollY)));
await b.close();
