// _ciship.mjs: the alien ships of Confidently Incorrect, copied from run/view.mjs (SHIP) as plain canvases for the music video. Scratch (play/_*).
export function shipArt() {
    const INK = '#0b0d12', ACID = '#9dff3a', CW = 1280, CH = 720, W = 6.4, H = W * CH / CW;
    const mk = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.lineJoin = 'round'; x.lineCap = 'round'; draw(x); return c; };
    const PORTS = [[520, 330], [660, 300], [800, 300], [940, 320], [1080, 350]];
    // the five ships of the campaign (one crazy alien race per section — Matt: "it needs to feel like you are progressing"):
    // the acid manta · the crimson crab · the abyss squid · the gold wasp · the bone mothership
    const PAL = [
      { hull: ['#3a4430', '#1c2218', '#0c0f0a'], spike: '#1b2016', rib: '#0a0d08', glow: 'rgba(157,255,58,.55)', port: '#2d3524', acid: '#9dff3a', jaw: '#20271b', tent: '#1f2719', fang: '#e9f0d8', eye: '#ff2a2a', throat: '#ff5a1f', crew: ['#7cff4a', '#4affc9', '#d6ff4a', '#ff8a3d', '#ff4a7a'] },
      { hull: ['#6a2018', '#33100c', '#160604'], spike: '#3e110d', rib: '#1c0705', glow: 'rgba(255,150,70,.6)', port: '#4d1913', acid: '#ff8a3d', jaw: '#3c130e', tent: '#3c130e', fang: '#fff1d6', eye: '#ffe14d', throat: '#ffb02e', crew: ['#ff8a3d', '#ffd23d', '#ff5a4a', '#ffb6a0', '#ffe14d'] },
      { hull: ['#22445e', '#0f2232', '#060e16'], spike: '#14293b', rib: '#08131d', glow: 'rgba(61,214,255,.6)', port: '#1d3446', acid: '#3dd6ff', jaw: '#112a3c', tent: '#14344c', fang: '#e6fbff', eye: '#ff3d8b', throat: '#3dd6ff', crew: ['#3dd6ff', '#7cffd6', '#ff6aa8', '#b8f0ff', '#4affc9'] },
      { hull: ['#6a5616', '#2e2508', '#110d02'], spike: '#1d1806', rib: '#0d0a02', glow: 'rgba(255,214,61,.65)', port: '#3c3110', acid: '#ffd23d', jaw: '#2d2508', tent: '#2d2508', fang: '#fffbe6', eye: '#57ff7a', throat: '#ffd23d', crew: ['#ffd23d', '#fff4c0', '#ff8a3d', '#d6ff4a', '#ffe14d'] },
      { hull: ['#e2dccd', '#928c7e', '#3e3c36'], spike: '#b0aa9c', rib: '#5e5a50', glow: 'rgba(255,42,42,.6)', port: '#6e6a60', acid: '#ff2a2a', jaw: '#928c7e', tent: '#928c7e', fang: '#ffffff', eye: '#ff2a2a', throat: '#ff2a2a', crew: ['#ff4a7a', '#7cff4a', '#4affc9', '#ffd23d', '#ff8a3d'] }];
    const skin = Q => ({ hull: hullT(Q), jaw: jawT(Q), tent: tentT(Q), crew: PORTS.map((_, k) => alienTex(k * 7 + 3 + Q.hull[0].length + PAL.indexOf(Q) * 31, Q)) });
    const hullT = Q => mk(CW, CH, x => {
      const hull = () => { x.beginPath(); x.moveTo(150, 300); x.bezierCurveTo(330, 170, 520, 120, 720, 110); x.bezierCurveTo(930, 100, 1120, 150, 1280, 140);
        x.lineTo(1280, 600); x.bezierCurveTo(1100, 610, 900, 640, 700, 600); x.bezierCurveTo(500, 560, 330, 520, 150, 430); x.closePath(); };
      // spikes along the crest and the keel
      x.fillStyle = Q.spike; for (let k = 0; k < 9; k++) { const px = 300 + k * 110, top = 150 - 30 * Math.sin(k * 0.9) + (k < 4 ? 40 - k * 10 : 0);
        x.beginPath(); x.moveTo(px - 34, top + 40); x.lineTo(px + 10, top - 70 - 25 * (k % 2)); x.lineTo(px + 40, top + 40); x.closePath(); x.fill(); x.lineWidth = 9; x.strokeStyle = INK; x.stroke();
        x.beginPath(); x.moveTo(px - 30, 570 + k * 3); x.lineTo(px + 6, 670 + 20 * (k % 2)); x.lineTo(px + 34, 575 + k * 3); x.closePath(); x.fill(); x.stroke(); }
      const g = x.createLinearGradient(0, 110, 0, 620); g.addColorStop(0, Q.hull[0]); g.addColorStop(0.45, Q.hull[1]); g.addColorStop(1, Q.hull[2]);
      hull(); x.fillStyle = g; x.fill();
      x.save(); hull(); x.clip();
      for (let k = 0; k < 11; k++) { const px = 260 + k * 95; x.beginPath(); x.moveTo(px, 120); x.quadraticCurveTo(px - 60, 360, px + 10, 620); x.lineWidth = 14; x.strokeStyle = Q.rib; x.stroke();   // ribs
        x.lineWidth = 4; x.strokeStyle = Q.glow; x.beginPath(); x.moveTo(px + 22, 140); x.quadraticCurveTo(px - 36, 360, px + 30, 600); x.stroke(); }   // acid light between them
      x.restore();
      hull(); x.lineWidth = 12; x.strokeStyle = INK; x.stroke();
      // the portholes: holes, so the crew shows through
      for (const [px, py] of PORTS) { x.save(); x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(px, py, 50, 0, 7); x.fill(); x.restore();
        x.beginPath(); x.arc(px, py, 54, 0, 7); x.lineWidth = 12; x.strokeStyle = Q.port; x.stroke(); x.lineWidth = 6; x.strokeStyle = INK; x.stroke(); x.beginPath(); x.arc(px, py, 47, 0, 7); x.lineWidth = 3; x.strokeStyle = Q.acid; x.stroke(); }
      // the upper jaw: fangs down over the maw
      x.fillStyle = Q.fang; for (let k = 0; k < 6; k++) { const px = 175 + k * 34; x.beginPath(); x.moveTo(px, 318 + k * 6); x.lineTo(px + 14, 372 + k * 4); x.lineTo(px + 28, 320 + k * 6); x.closePath(); x.fill(); x.lineWidth = 5; x.strokeStyle = INK; x.stroke(); }
      // the eye socket
      x.beginPath(); x.ellipse(330, 240, 78, 52, -0.2, 0, 7); x.fillStyle = '#060805'; x.fill(); x.lineWidth = 10; x.strokeStyle = INK; x.stroke(); });
    const jawT = Q => mk(520, 220, x => {     // the lower jaw (its hinge is the right end)
      x.beginPath(); x.moveTo(500, 40); x.bezierCurveTo(360, 30, 140, 40, 20, 70); x.lineTo(60, 120); x.bezierCurveTo(200, 170, 380, 180, 510, 150); x.closePath();
      x.fillStyle = Q.jaw; x.fill(); x.lineWidth = 10; x.strokeStyle = INK; x.stroke();
      x.fillStyle = Q.fang; for (let k = 0; k < 7; k++) { const px = 50 + k * 40; x.beginPath(); x.moveTo(px, 72 - k * 3); x.lineTo(px + 15, 20 - k * 2); x.lineTo(px + 30, 70 - k * 3); x.closePath(); x.fill(); x.lineWidth = 5; x.strokeStyle = INK; x.stroke(); } });
    const alienTex = (seed, Q) => mk(200, 200, x => {   // the crew: many-eyed, grinning, antennae — a different one in every porthole
      const r = k => { const v = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); }, hue = Q.crew[Math.floor(r(1) * Q.crew.length)];
      for (let k = 0; k < 2; k++) { const ax = 70 + k * 60; x.beginPath(); x.moveTo(ax, 70); x.quadraticCurveTo(ax + (k ? 30 : -30), 20, ax + (k ? 20 : -20), 10); x.lineWidth = 7; x.strokeStyle = INK; x.stroke(); x.beginPath(); x.arc(ax + (k ? 20 : -20), 10, 10, 0, 7); x.fillStyle = hue; x.fill(); x.lineWidth = 4; x.stroke(); }
      x.beginPath(); x.ellipse(100, 115, 70, 66, 0, 0, 7); x.fillStyle = hue; x.fill(); x.lineWidth = 8; x.strokeStyle = INK; x.stroke();
      const n = 3 + Math.floor(r(2) * 3); for (let k = 0; k < n; k++) { const ex = 50 + r(10 + k) * 100, ey = 80 + r(20 + k) * 40, er = 10 + r(30 + k) * 14;
        x.beginPath(); x.arc(ex, ey, er, 0, 7); x.fillStyle = '#fff'; x.fill(); x.lineWidth = 4; x.strokeStyle = INK; x.stroke(); x.beginPath(); x.arc(ex + er * 0.25, ey + er * 0.1, er * 0.45, 0, 7); x.fillStyle = INK; x.fill(); }
      x.beginPath(); x.moveTo(52, 140); x.quadraticCurveTo(100, 185, 150, 138); x.closePath(); x.fillStyle = '#2a0b0b'; x.fill(); x.lineWidth = 5; x.strokeStyle = INK; x.stroke();
      x.fillStyle = '#fff'; for (let k = 0; k < 6; k++) { const px = 58 + k * 15; x.beginPath(); x.moveTo(px, 142 + (k === 0 || k === 5 ? -2 : 3)); x.lineTo(px + 7, 156); x.lineTo(px + 13, 143 + (k === 5 ? -2 : 3)); x.fill(); } });
    const tentT = Q => mk(120, 420, x => { x.beginPath(); x.moveTo(30, 0); x.bezierCurveTo(10, 140, 100, 220, 50, 330); x.quadraticCurveTo(40, 380, 70, 410); x.quadraticCurveTo(90, 360, 80, 320); x.bezierCurveTo(120, 220, 60, 140, 90, 0); x.closePath();
      x.fillStyle = Q.tent; x.fill(); x.lineWidth = 8; x.strokeStyle = '#0b0d12'; x.stroke(); x.fillStyle = Q.glow; for (let k = 0; k < 6; k++) { x.beginPath(); x.arc(52 + Math.sin(k) * 10, 60 + k * 50, 6, 0, 7); x.fill(); } });
    const SKINS = PAL.map(skin), hullTex = SKINS[0].hull, jawTex = SKINS[0].jaw, tentTex = SKINS[0].tent;
  return { PAL, PORTS, SKINS, CW, CH, INK };
}
