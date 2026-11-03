"""Firefox check: hero, mid-dive, build, menu; JS errors; rAF timing through the dive (headless SWGL, indicative)."""
import sys, time
sys.path.insert(0, sys.path[0])
from ff import Firefox
out = sys.argv[1]
with Firefox(1440, 900) as ff:
    ff.go('http://127.0.0.1:8766/')
    time.sleep(2.5)
    print('motion', ff.js("return document.documentElement.className"), 'errors', ff.js("return window.__errs || []"))
    for name, y in (('hero', 0), ('dive', 0.75), ('build', 1.45 + 6.7 * .62), ('reveal', 1.45 + 8.8 * .62)):
        ff.js(f"window.lenis.scrollTo(innerHeight*{y}, {{immediate:true, force:true}}); return 1")
        time.sleep(1.2)
        ff.shot(f'{out}/ff-{name}.png')
    ff.js("window.lenis.scrollTo(0,{immediate:true,force:true}); return 1"); time.sleep(.6)
    ff.js("window.__f=[]; let t0=performance.now(); const f=t=>{window.__f.push(t-t0); t0=t; if(window.__f.length<400) requestAnimationFrame(f)}; requestAnimationFrame(f); "
          "let y=0; const iv=setInterval(()=>{y+=14; window.lenis.scrollTo(y,{immediate:true,force:true}); if(y>innerHeight*1.4) clearInterval(iv)},16); return 1")
    time.sleep(3)
    f = sorted(ff.js("return window.__f.slice(2)"))
    print('firefox frames', len(f), 'median', round(f[len(f)//2], 1), 'p95', round(f[int(len(f)*.95)], 1))
