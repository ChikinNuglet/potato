"""stills.py OUTDIR t1 t2 ...: the demo at those song times, in ?ghost=stairs. Playtester, Downstairs Neighbours. Playwright's own Chromium, one browser, server on 8793.
--idle: the demo file is swapped in the browser for one that presses nothing (what a stranger who misses everything sees). --video: his real ghost skin, not the demo's green simulation skin."""
import sys, os, time
from playwright.sync_api import sync_playwright
a = sys.argv[1:]; idle = '--idle' in a; video = '--video' in a; a = [x for x in a if not x.startswith('--')]
out = a[0]; ts = [float(x) for x in a[1:]]; os.makedirs(out, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 1280, "height": 800}, device_scale_factor=1)
    pg.on("console", lambda m: m.type == "error" and print("ERR", m.text[:200]))
    pg.on("pageerror", lambda e: print("PAGEERR", str(e)[:300]))
    if idle: pg.route("**/ghost-stairs.demo.json", lambda r: r.fulfill(json={"level": "ghost-stairs", "presses": [], "won": True}))
    pg.goto("http://localhost:8793/run/?silent&ghost=stairs"); pg.wait_for_function("!!window.RUN", timeout=120000)
    for t in ts:
        pg.evaluate(f"RUN.{'video' if video else 'demo'}('ghost-stairs', {t})"); time.sleep(0.5)
        st = pg.evaluate("({t: RUN.sim.s.t, st: RUN.sim.s.st, take: Object.keys(RUN.sim.s.take||{}).length, won: !!RUN.sim.s.won})")
        pg.screenshot(path=f"{out}/t{t:06.2f}.jpg", type="jpeg", quality=80, timeout=120000)
        print(f"t={t}: sim {st['t']:.2f} step {st['st']} took {st['take']} won {st['won']}", flush=True)
    b.close()
