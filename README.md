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

Photos: the client's own (from pouletsecret.ch). Font: Mona Sans (GitHub, SIL OFL). Motion: GSAP 3.12.5, ScrollTrigger, Lenis 1.1.
No AI imagery.
