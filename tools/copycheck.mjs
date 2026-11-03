// Every visible line of the page must appear in source/SOURCE.md (case/space-insensitive); prints the ones that don't.
import { chromium } from '/Users/adroguetimoteo/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
import fs from 'fs';
const norm = s => s.toLowerCase().normalize('NFC').replace(/[*_]/g, '').replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();
const src = norm(fs.readFileSync('source/SOURCE.md', 'utf8'));
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
await p.goto(process.argv[2], { waitUntil: 'networkidle' });
const lines = await p.evaluate(() => { document.querySelectorAll('[hidden]').forEach(e => e.hidden = false);
  return [...new Set(document.body.innerText.split('\n').map(s => s.trim()).filter(Boolean))]; });
const miss = lines.filter(l => !src.includes(norm(l)));
console.log(lines.length, 'lines,', miss.length, 'not found verbatim:'); miss.forEach(l => console.log('  · ' + l));
await b.close();
