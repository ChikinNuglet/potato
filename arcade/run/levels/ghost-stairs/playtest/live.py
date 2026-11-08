"""live.py OUTDIR FROM t1 t2 ...: plays the solved run straight through in his real skin, no seeking between shots, so what's on screen is what a player gets. Playtester, Downstairs Neighbours.
Prints the real speed of the sim against the wall clock."""
import sys, os, time
from playwright.sync_api import sync_playwright
out = sys.argv[1]; t0 = float(sys.argv[2]); ts = [float(x) for x in sys.argv[3:]]; os.makedirs(out, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 1280, "height": 800}, device_scale_factor=1)
    pg.on("pageerror", lambda e: print("PAGEERR", str(e)[:300]))
    pg.goto("http://localhost:8793/run/?silent&ghost=stairs"); pg.wait_for_function("!!window.RUN", timeout=120000)
    pg.evaluate(f"RUN.video('ghost-stairs', {t0})"); w0 = time.time(); s0 = None
    for t in ts:
        pg.wait_for_function(f"RUN.sim && RUN.sim.s.t >= {t}", timeout=240000)
        now = pg.evaluate("RUN.sim.s.t"); s0 = s0 or (now, time.time())
        pg.screenshot(path=f"{out}/t{t:06.2f}.jpg", type="jpeg", quality=80, timeout=120000); print(f"t={t}: at {now:.2f}", flush=True)
    print("sim seconds per wall second", (pg.evaluate("RUN.sim.s.t") - s0[0]) / max(0.01, time.time() - s0[1]))
    b.close()
