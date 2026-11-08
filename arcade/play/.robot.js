// test robot for game/play: reads the level's course and presses keys like a careful player (not shipped)
(() => {
  const log = []; window.__log = log; let lastDying = 0, lastSec = '';
  setInterval(() => {
    const Lv = window.GAME && GAME.level; if (!Lv) return;
    const P = Lv.P, t = GAME.now(), X = Lv.X, C = Lv.C, b = Lv.beatOf(t);
    const ahead = (a, z) => C.filter(p => X(p.e) + p.n > P.x + a && X(p.e) < P.x + z);
    window.__hold('D', false); window.__hold('R', false); window.__hold('V', false); window.__hold('L', false);
    if (P.dying) { if (!lastDying) log.push(['died', +t.toFixed(1), +P.x.toFixed(1), Math.round(b), P.power || '-', (Lv.spams || []).map(sp => +Lv.spamX(sp, t).toFixed(1)).filter(x => Math.abs(x - P.x) < 2)]); lastDying = 1; return; } lastDying = 0;
    // jump like a player: at the edge of whatever he's standing on, and over blocks a little early
    const front = P.x + 0.39, Bx = Lv.boxesAt(t);
    const support = x => Bx.some(q => q.x0 < x && q.x1 > x && q.y1 <= P.y + 0.08 && q.y1 > P.y - 0.3);
    const under = x => Bx.some(q => q.x0 < x && q.x1 > x && q.y1 <= P.y + 0.08 && q.y1 > -0.2 && !['dots', 'blink'].includes(q.kind));   // (never trust a blinking one)   // something to step down onto
    // don't run off ahead of the song: drift back toward his usual spot
    if (P.ground && P.x - (Lv.camX(t) + 4.5) > 2.2 && support(P.x + 0.9)) window.__hold('L', true);   // (never while lining up a jump: left kills the carry)
    // ...but only if there'll be something to land on (blinking/dropping platforms), else wait at the edge
    const landing = dt => { const xl = P.x + (1 / Lv.BEAT + 1.9) * dt; return Lv.boxesAt(t + dt).some(q => q.y1 <= P.y + 1.2 && q.y1 > -0.2 && q.x0 < xl + 0.6 && q.x1 > xl - 0.3); };
    if (P.ground && !support(P.x + 0.3) && !under(P.x + 0.6)) {
      if (landing(0.62) || landing(0.75) || landing(0.85) || P.x - Lv.edgeX(t) < 1.2) window.__press('J'); else window.__hold('L', true); }
    for (const p of C) {
      const d = X(p.e) - front, far = X(p.e) + p.n - front;
      if (far < 0 || d > 1.6) continue;
      if (P.ground && ['low', 'step'].includes(p.k) && d > 0.1 && d < 0.6) window.__press('J');
      if ((p.k === 'wall' || p.k === 'gate') && d < 0.45 && d > -0.3 && P.charge) { window.__hold('R', true); window.__hold('L', false); window.__press('G'); }
      if (p.k === 'duck' && d < 0.5) window.__hold('D', true);
    }
    // sinking into a pit: try an air jump (only powers that have one will do anything)
    if (!P.ground && P.vy < -1 && P.y < 0.3 && !Bx.some(q => q.x0 < P.x + 0.4 && q.x1 > P.x - 0.4 && q.y1 <= P.y + 0.05)) window.__press('J');
    // hover powers: hold V while there's nothing under him
    if (!P.ground && P.vy < 0 && ['astronaut', 'ghost', 'singularity'].includes(P.power) && !Bx.some(q => q.x0 < P.x + 0.6 && q.x1 > P.x && q.y1 <= P.y)) window.__hold('V', true);
    // falling clauses: hang back if he'd be under one when it lands
    for (const f of (Lv.falls || [])) { const tl = Lv.tOf(f.e), dt = tl - t; if (dt < -0.2 || dt > 1.6) continue;
      const ahead = P.x + (1 / Lv.BEAT) * Math.max(0, dt); if (ahead > f.x - 1.25 && P.x < f.x + 0.6) window.__hold('L', true); }
    // Spam walks at him: jump it (or use the power) by where it really is, not where it started
    for (const sp of (Lv.spams || [])) { if (t < sp.frozenUntil) continue; const d = Lv.spamX(sp, t) - 0.3 - front;
      if (d > -0.2 && d < 1.0) { if (P.power && ['king', 'singularity'].includes(P.power)) window.__press('V'); else if (P.ground && d > 0.25) window.__press('J'); } }
    // delete waves: lean into them
    for (const w of (Lv.waves || [])) if (b >= w.e && b < w.e + w.beats) window.__hold('R', true);
    for (const bm of (Lv.beams || [])) { const k = b - bm.e; if (k >= 0 && k < bm.beats && Math.abs(Lv.beamX(bm, t + 0.12) - P.x) < 0.5 && P.charge) window.__press('G'); }
    for (const p of ahead(-0.5, 0.6)) if (p.k === 'duck') window.__hold('D', true);
    if (window.__trace && b > __trace[0] && b < __trace[1]) log.push(['tr', +b.toFixed(2), +P.x.toFixed(2), +P.y.toFixed(2), +P.vx.toFixed(2), +P.vy.toFixed(2), P.ground ? 1 : 0]);
    const sec = document.getElementById('section').textContent; if (sec && sec !== lastSec) { log.push(['section', sec, +t.toFixed(1)]); lastSec = sec; }
    if (P.power && !log.some(l => l[0] === 'power' && l[1] === P.power)) log.push(['power', P.power, +t.toFixed(1)]);
    if (P.won && !log.some(l => l[0] === 'won')) log.push(['won', +t.toFixed(1)]);
  }, 16);
})();
