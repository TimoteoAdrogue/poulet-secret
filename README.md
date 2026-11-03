# Poulet Secret — redesign pitch

Staging: https://timoteoadrogue.github.io/poulet-secret/ (noindex) · Audit: https://timoteoadrogue.github.io/poulet-secret/audit.html

A redesign of https://pouletsecret.ch/ (fried chicken, Grand-Rue 8, Neuchâtel). Every visible line is the client's own text,
word for word, from their site, their TV menu PDF and their opening-hours story (see `source/SOURCE.md`).

- `docs/` is the published site (GitHub Pages serves this folder). Edit `docs/index.src.html`, then `python3 tools/build.py`
  writes `docs/index.html` (it inlines the 100 KB traced logo path from `tools/chicken-path.d`).
- `docs/assets/main.js`: hero dive through the logo, the 7-step burger build, menu tabs and "Menu" prices, live opening status.
  `ORDER_URL` at the top re-enables every "Commander" button once the client gives a working ordering link.
- `tools/solid.py` + potrace turn the logo into the clean silhouette (lettering filled in); `tools/pole.py` finds the point the hero zooms through.
- Checks: `node tools/func.mjs <url>` (nav, deep links, rail, tabs, toggle, reveals, reduced motion),
  `node tools/copycheck.mjs <url>` (visible text vs `source/SOURCE.md`), `node tools/perf.mjs <url> 0 1.4` (frame times),
  `python3 tools/ff_check.py <dir>` (Firefox).

Photos: the client's own (from pouletsecret.ch), plus two free photos under the Unsplash License, used as stand-ins
until the client's own shots arrive:
- hero fried chicken and the crust texture: https://unsplash.com/photos/UgckYUoc0tM (@numpanglewat)
- brioche texture of the drawn buns: https://unsplash.com/photos/aBYnzw50vY0 (@mandimelanie)
The cheddar, bacon and pickle textures and the final burger are the client's Cheesy Bacon photo, cut out with Apple Vision
(`swift tools/cutout.swift in.jpg out.png`). Font: Mona Sans (GitHub, SIL OFL). Motion: GSAP 3.12.5, ScrollTrigger, Lenis 1.1.
No AI imagery.
