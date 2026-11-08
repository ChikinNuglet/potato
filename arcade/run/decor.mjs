// decor.mjs — each level's own atmosphere layer (theme.decor): small, beat-driven, never over Potato, never purple.
import * as T from '../play/vendor/three.module.js';
const add = (world, geo, color, opacity, z) => { const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false })); m.position.z = z; world.add(m); return m; };
const addBlend = (world, geo, color, opacity, z) => { const m = add(world, geo, color, opacity, z); m.material.blending = T.AdditiveBlending; return m; };
function txt(text, color, size = 64, font = '"Major Mono Display", ui-monospace, monospace') {
  const c = document.createElement('canvas'), x = c.getContext('2d'); x.font = `400 ${size}px ${font}`; const w = Math.ceil(x.measureText(text).width) + 20;
  c.width = Math.max(2, w); c.height = Math.round(size * 1.4); x.font = `400 ${size}px ${font}`; x.fillStyle = color; x.textBaseline = 'middle'; x.fillText(text, 10, c.height / 2);
  const t = new T.CanvasTexture(c); t.colorSpace = T.NoColorSpace; return { tex: t, aspect: c.width / c.height };
}
const R = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

export function createDecor(kind, world, C, TH) {
  const parts = [];
  if (kind === 'scan') {                         // scanlines + a vignette that breathes on the kick
    const m = new T.Mesh(new T.PlaneGeometry(2, 2), new T.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false,
      uniforms: { k: { value: 0 }, time: { value: 0 } }, vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: `uniform float k, time; varying vec2 vUv; void main(){ float sl = 0.06 * step(0.5, fract(vUv.y * 180.0 + time * 2.0));
        float v = smoothstep(0.35, 0.95, length((vUv - 0.5) * vec2(1.2, 1.0))) * (0.55 - 0.25 * k); gl_FragColor = vec4(0.0, 0.0, 0.0, sl + v); }` }));
    m.frustumCulled = false; m.renderOrder = 19; world.add(m);
    return { update: (f) => { m.material.uniforms.k.value = f.kick; m.material.uniforms.time.value = f.t; } };
  }
  if (kind === 'spots') {                        // disco spots wandering the back wall, jumping on the beat
    const cols = ['#ff8a3d', '#38e8ff', '#ffe066', '#ff5c7a', '#7dff9a'];
    for (let i = 0; i < 7; i++) parts.push(addBlend(world, new T.CircleGeometry(0.55, 40), cols[i % cols.length], 0.1, -6));
    return { update: (f) => parts.forEach((m, i) => { const ph = Math.floor(f.b) + i * 3; m.position.set(f.cx + (R(ph, i) - 0.5) * f.span * 1.1, f.camY + (R(ph, i + 9) - 0.3) * 4.5, -6);
      m.material.opacity = 0.04 + 0.1 * f.kick; m.scale.setScalar(0.7 + 0.5 * R(ph, 2)); }) };
  }
  if (kind === 'pages' || kind === 'chat' || kind === 'bubbles') {   // drifting wiki pages / old messages / chat bubbles
    const words = kind === 'pages' ? ['[citation needed]', 'Dr. Barrett (1997)', 'see also: stew', 'disputed', '¶ 404'] : kind === 'chat' ? ['seen', 'u there?', 'deleted', 'lol', '…'] : ['hey', 'typing…', 'read', 'u up?', '…'];
    for (let i = 0; i < 16; i++) {
      const g = new T.Group(); const w = kind === 'pages' ? 2.6 : 1.9, h = kind === 'pages' ? 3.2 : 0.8;
      const box = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: TH.digit || '#8fd3ff', transparent: true, opacity: 0.05, depthWrite: false })); g.add(box);
      if (kind === 'pages') for (let k = 0; k < 7; k++) { const l = new T.Mesh(new T.PlaneGeometry(w * (0.5 + 0.4 * R(i, k)), 0.06), new T.MeshBasicMaterial({ color: TH.digit, transparent: true, opacity: 0.1, depthWrite: false })); l.position.set(-w * 0.05, h / 2 - 0.5 - k * 0.38, 0.01); g.add(l); }
      else { const { tex, aspect } = txt(words[i % words.length], TH.digit || '#8fd3ff'); const l = new T.Mesh(new T.PlaneGeometry(0.45 * aspect, 0.45), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.35, depthWrite: false })); l.position.z = 0.01; g.add(l); }
      g.userData = { x: i * 9 + R(i, 1) * 6, y: R(i, 2) * 6 - 1, par: 0.35 + 0.3 * R(i, 3), sp: 0.15 + 0.3 * R(i, 4) }; g.position.z = -5; world.add(g); parts.push(g);
    }
    return { update: (f) => parts.forEach(g => { const u = g.userData; const span = f.span * 2.2; let x = u.x + f.cx * u.par; x = f.cx - span / 2 + ((x - f.cx + span / 2) % span + span) % span;
      g.position.set(x, f.camY - 2 + ((u.y + f.t * u.sp) % 8 + 8) % 8, -5); g.rotation.z = kind === 'pages' ? Math.sin(f.t * 0.3 + u.x) * 0.15 : 0; }) };
  }
  if (kind === 'stamps') {                       // "I AGREE" stamped on the tower's floors
    const { tex, aspect } = txt('I AGREE', '#ff5c5c', 80);
    for (const q of C.solids.filter((q, i) => q.kind === 'block' && i % 4 === 1)) { const m = new T.Mesh(new T.PlaneGeometry(0.45 * aspect, 0.45), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.45, depthWrite: false }));
      m.position.set((q.x0 + q.x1) / 2, q.y1 - 0.3, 0.6); m.rotation.z = (R(q.x0, 1) - 0.5) * 0.5; world.add(m); parts.push(m); }
    return { update: () => {} };
  }
  if (kind === 'strings') {                      // fiddle strings across the back, shaking with the bass
    for (let i = 0; i < 4; i++) parts.push(add(world, new T.PlaneGeometry(400, 0.025, 200, 1), '#c9d3e0', 0.25, -4));
    return { update: (f) => parts.forEach((m, i) => { m.position.set(f.cx, f.camY - 1.5 + i * 1.1, -4); const pos = m.geometry.attributes.position;
      for (let k = 0; k < pos.count; k++) { const xx = pos.getX(k); pos.setY(k, (k % 2 ? 0.0125 : -0.0125) + Math.sin(xx * 3 + f.t * 40 + i) * 0.12 * f.bass); } pos.needsUpdate = true; }) };
  }
  if (kind === 'sonar') {                        // rings out of him on every hit
    for (let i = 0; i < 4; i++) parts.push(addBlend(world, new T.RingGeometry(0.95, 1.0, 64), TH.digit || '#3fe0d0', 0, 0.2));
    let last = -1, k = 0;
    return { update: (f) => { const bi = Math.floor(f.b); if (bi !== last && (f.bass > 0.45 || f.ping)) { last = bi; const m = parts[k++ % parts.length]; m.userData.t0 = f.t; m.userData.x = f.s.x; m.userData.y = f.s.y + 0.6; }
      parts.forEach(m => { const a = m.userData.t0 == null ? 9 : f.t - m.userData.t0; m.visible = a < 1.2; if (!m.visible) return; m.position.set(m.userData.x, m.userData.y, 0.2); m.scale.setScalar(0.4 + a * 7); m.material.opacity = 0.5 * (1 - a / 1.2); }); } };
  }
  if (kind === 'alert') {                        // the control room's red alarm light sweeping
    const m = new T.Mesh(new T.PlaneGeometry(3, 30), new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { k: { value: 0.2 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float k; varying vec2 vUv; void main(){ float a = pow(1.0 - abs(vUv.x - 0.5) * 2.0, 2.0) * k; gl_FragColor = vec4(vec3(1.0, 0.15, 0.1) * a, a); }` }));
    m.position.z = -3; world.add(m);
    return { update: (f) => { m.position.set(f.cx + Math.sin(f.t * 1.7) * f.span * 0.6, f.camY, -3); m.rotation.z = Math.sin(f.t * 1.7) * 0.5; m.material.uniforms.k.value = 0.12 + 0.12 * f.kick; } };
  }
  if (kind === 'trail') {                        // windows light behind him as he passes: the city relit by the last light
    const geo = new T.PlaneGeometry(0.22, 0.3); let n = 0;
    for (let i = 0; i < 160; i++) { const m = addBlend(world, geo, i % 3 ? '#ffcf8a' : '#3fd8ff', 0, -2); m.visible = false; parts.push(m); }
    let lastX = -1e9;
    return { update: (f) => { if (f.s.x - lastX > 0.7) { lastX = f.s.x; for (let k = 0; k < 2; k++) { const m = parts[n++ % parts.length]; m.visible = true; m.userData.t0 = f.t;
        m.position.set(f.s.x - 1 - R(n, 1) * 3, f.s.y - 1.5 + R(n, 2) * 5.5, -2); } }
      parts.forEach(m => { if (!m.visible) return; const a = f.t - m.userData.t0; m.material.opacity = Math.min(0.75, a * 3) * (f.lights ?? 1) * 0.9; }); } };
  }
  if (kind === 'sparks') {                       // green binary sparks where he lands
    for (let i = 0; i < 24; i++) { const { tex, aspect } = txt(i % 2 ? '1' : '0', TH.digit || '#2bff88', 48); const m = new T.Mesh(new T.PlaneGeometry(0.22 * aspect, 0.22), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false })); m.position.z = 0.7; world.add(m); parts.push(m); }
    let lastLand = null, k = 0;
    return { update: (f) => { if (f.s.landedAt != null && f.s.landedAt !== lastLand) { lastLand = f.s.landedAt; for (let j = 0; j < 6; j++) { const m = parts[k++ % parts.length]; m.userData = { t0: f.t, x: f.s.x, y: f.s.y, vx: (R(k, 1) - 0.5) * 3, vy: 1.5 + R(k, 2) * 2.5 }; } }
      parts.forEach(m => { const u = m.userData; if (u.t0 == null) return; const a = f.t - u.t0; m.visible = a < 0.6; if (!m.visible) return; m.position.set(u.x + u.vx * a, u.y + u.vy * a - 6 * a * a, 0.7); m.material.opacity = 0.9 * (1 - a / 0.6); }); } };
  }
  if (kind === 'crowd') {                        // the party: a crowd of silhouettes bobbing on the beat at the bottom
    const geo = new T.CircleGeometry(0.5, 20);
    for (let i = 0; i < 40; i++) { const g = new T.Group(); const head = new T.Mesh(geo, new T.MeshBasicMaterial({ color: '#0b0c18', transparent: true, opacity: 0.95, depthWrite: false })); head.scale.setScalar(0.55); head.position.y = 1.0; g.add(head);
      const body = new T.Mesh(new T.PlaneGeometry(0.9, 1.4), head.material); g.add(body); g.position.z = -1.5; g.userData = { i }; world.add(g); parts.push(g); }
    return { update: (f) => parts.forEach((g, i) => { const span = f.span * 1.2; const x = f.cx - span / 2 + ((i * 0.83 * span / 30) % span); const hop = Math.max(0, Math.cos(Math.PI * 2 * ((f.b + R(i, 1) * 0.3) % 1))) * 0.25 * (0.5 + f.kick);
      g.position.set(x, f.camY - 2.35 + hop + R(i, 2) * 0.35, -1.5); }) };
  }
  if (kind === 'confetti') {                     // paper scraps falling with him down the shaft
    for (let i = 0; i < 40; i++) parts.push(add(world, new T.PlaneGeometry(0.18, 0.24), i % 5 ? '#e8dcc0' : '#ff8a5c', 0.35, -0.8));
    return { update: (f) => parts.forEach((m, i) => { const span = f.span; const x = f.cx - span / 2 + ((R(i, 1) * span * 3 - f.t * (0.8 + R(i, 2))) % span + span) % span;
      m.position.set(x, f.camY - 2 + R(i, 3) * 8 + Math.sin(f.t * 2 + i) * 0.3, -0.8); m.rotation.z = f.t * (1 + R(i, 4) * 3); }) };
  }
  if (kind === 'moon') {                         // a huge faint moon over the typing void
    const m = add(world, new T.CircleGeometry(4.5, 64), '#cfe8ff', 0.06, -8); const r = add(world, new T.RingGeometry(4.5, 4.62, 64), '#cfe8ff', 0.12, -7.9);
    return { update: (f) => { m.position.set(f.cx + f.span * 0.28, f.camY + 2.6, -8); r.position.copy(m.position); r.position.z = -7.9; } };
  }
  if (kind === 'header') {                       // the abandoned group chat's header bar, high in the dark
    const { tex, aspect } = txt('the group chat · 0 online · 4,012 unread', '#9fb0ff', 60);
    const m = new T.Mesh(new T.PlaneGeometry(0.42 * aspect, 0.42), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.22, depthWrite: false })); world.add(m);
    const bar = add(world, new T.PlaneGeometry(400, 0.9), '#0c0f1c', 0.8, -2.2);
    return { update: (f) => { m.position.set(f.cx, f.camY + 3.0, -2); bar.position.set(f.cx, f.camY + 3.0, -2.2); } };
  }
  if (kind === 'rain') {                         // thin rain streaks on the long climb
    for (let i = 0; i < 70; i++) parts.push(add(world, new T.PlaneGeometry(0.02, 0.6), '#b9c6d6', 0.18, -1));
    return { update: (f) => parts.forEach((m, i) => { const span = f.span * 1.1; const x = f.cx - span / 2 + R(i, 1) * span; const yy = ((R(i, 2) * 10 - f.t * (9 + R(i, 3) * 4)) % 10 + 10) % 10;
      m.position.set(x - yy * 0.15, f.camY - 3 + yy, -1); m.rotation.z = 0.15; }) };
  }
  if (kind === 'lighthouse') {                   // the relay's slow lighthouse beam
    const m = new T.Mesh(new T.PlaneGeometry(40, 2.2), new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { k: { value: 0.15 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float k; varying vec2 vUv; void main(){ float a = pow(1.0 - abs(vUv.y - 0.5) * 2.0, 3.0) * (1.0 - vUv.x * 0.8) * k; gl_FragColor = vec4(vec3(0.25, 0.9, 0.85) * a, a); }` }));
    world.add(m);
    return { update: (f) => { m.position.set(f.cx + f.span * 0.4 + 20 * Math.cos(f.t * 0.6), f.camY + 3.5, -5); m.rotation.z = Math.PI + Math.sin(f.t * 0.6) * 0.35; m.material.uniforms.k.value = 0.08 + 0.1 * f.bass; } };
  }
  if (kind === 'crt') {                          // the screen goes black like an old monitor: a collapsing line
    const m = new T.Mesh(new T.PlaneGeometry(2, 2), new T.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false, uniforms: { k: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: `uniform float k; varying vec2 vUv; void main(){ float h = mix(0.5, 0.003, clamp(k * 2.0, 0.0, 1.0)); float w = mix(0.5, 0.0, clamp(k * 2.0 - 1.0, 0.0, 1.0));
        float inside = step(abs(vUv.y - 0.5), h) * step(abs(vUv.x - 0.5), w + 0.0001); float a = k > 0.0 ? 1.0 - inside : 0.0; gl_FragColor = vec4(vec3(inside * (1.0 - step(h, 0.01)) ), a * 0.92); }` }));
    m.frustumCulled = false; m.renderOrder = 21; world.add(m);
    return { update: (f) => { const d = f.darkStart; m.material.uniforms.k.value = d != null && f.t > d && f.t < d + 0.5 ? (f.t - d) / 0.5 : 0; } };
  }
  if (kind === 'aurora') {                       // clock zero: a cyan wave sweeps the sky as the machines wake
    const m = new T.Mesh(new T.PlaneGeometry(2, 2), new T.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending, uniforms: { k: { value: 0 }, x: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: `uniform float k, x; varying vec2 vUv; void main(){ float a = exp(-pow((vUv.x - x) * 4.0, 2.0)) * smoothstep(0.2, 1.0, vUv.y) * k; gl_FragColor = vec4(vec3(0.25, 0.85, 1.0) * a, a); }` }));
    m.frustumCulled = false; m.renderOrder = 18; world.add(m);
    return { update: (f) => { const a = f.t - 38.0; m.material.uniforms.k.value = a > 0 && a < 3 ? 0.5 * (1 - a / 3) : 0; m.material.uniforms.x.value = a / 2; } };
  }
  if (kind === 'floorlights') {                  // the dance floor lights up under his feet on the beat
    for (let i = 0; i < 6; i++) parts.push(addBlend(world, new T.PlaneGeometry(1.1, 0.12), ['#38e8ff', '#ff8a3d', '#ffe066'][i % 3], 0, 0.55));
    let last = -1, k = 0;
    return { update: (f) => { const bi = Math.floor(f.b); if (bi !== last && f.s.ground) { last = bi; const m = parts[k++ % parts.length]; m.userData = { t0: f.t, x: f.s.x, y: f.s.y }; }
      parts.forEach(m => { const u = m.userData; if (!u || u.t0 == null) return; const a = f.t - u.t0; m.visible = a < 0.5; m.position.set(u.x, u.y - 0.02, 0.55); m.scale.x = 1 + a * 4; m.material.opacity = 0.8 * (1 - a / 0.5); }); } };
  }
  if (kind === 'shaft') {                        // the shaft's walls: endless wiki page edges with section headings
    const heads = ['Contents', 'History', 'Controversy', 'See also', 'References', 'Disputed', 'Early life', 'Legacy'];
    for (let i = 0; i < 24; i++) { const { tex, aspect } = txt(heads[i % heads.length], '#d8c39a', 56); const m = new T.Mesh(new T.PlaneGeometry(0.4 * aspect, 0.4), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.18, depthWrite: false }));
      m.rotation.z = -Math.PI / 2; world.add(m); parts.push(m); }
    return { update: (f) => parts.forEach((m, i) => { const span = f.span * 1.4; const x = f.cx - span / 2 + ((i * span / 12 - f.cx * 0) % span + span) % span; m.position.set(Math.floor(f.cx / span) * span + (i % 12) * span / 12 + (i > 11 ? span / 24 : 0), i > 11 ? -1.6 : 6.4, -2); }) };
  }
  if (kind === 'columns') {                      // the tower's walls: columns of terms scrolling past
    for (let i = 0; i < 8; i++) { const { tex, aspect } = txt('§' + (400 + i) + ' the user agrees · ', '#9fe6ff', 40); tex.wrapS = T.RepeatWrapping;
      const m = new T.Mesh(new T.PlaneGeometry(0.3 * aspect * 3, 0.3), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.14, depthWrite: false })); m.rotation.z = Math.PI / 2; world.add(m); parts.push(m); }
    return { update: (f) => parts.forEach((m, i) => { m.position.set(f.cx - f.span * 0.5 + (i + 0.5) * f.span / 8, f.camY + ((f.t * 0.6 + i * 1.3) % 6) - 1, -3); }) };
  }
  if (kind === 'typing') {                       // "• • •" over his head while he's waiting on a ledge
    const { tex, aspect } = txt('• • •', '#cfe8ff', 64); const m = new T.Mesh(new T.PlaneGeometry(0.42 * aspect, 0.42), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false }));
    const bub = add(world, new T.PlaneGeometry(1.1, 0.5), '#0a0d1a', 0, 0.9); world.add(m);
    return { update: (f) => { const on = f.s.ground && f.s.landedAt != null && f.t - f.s.landedAt > 0.25; const k = on ? Math.min(1, (f.t - f.s.landedAt - 0.25) * 4) : 0;
      m.position.set(f.s.x + 0.6, f.s.y + 2.0 + 0.05 * Math.sin(f.t * 6), 0.95); bub.position.set(f.s.x + 0.6, f.s.y + 2.0, 0.9); m.material.opacity = 0.9 * k * (0.6 + 0.4 * Math.sin(f.t * 9)); bub.material.opacity = 0.6 * k; } };
  }
  if (kind === 'wisps') {                        // the ghost: pale wisps peel off him as he moves
    for (let i = 0; i < 18; i++) parts.push(add(world, new T.CircleGeometry(0.35, 16), '#e9e6ff', 0, 0.1));
    let k = 0, lastX = -1e9;
    return { update: (f) => { if (f.s.x - lastX > 0.45) { lastX = f.s.x; const m = parts[k++ % parts.length]; m.userData = { t0: f.t, x: f.s.x - 0.3, y: f.s.y + 0.4 + R(k, 1) * 0.6 }; }
      parts.forEach(m => { const u = m.userData; if (!u || u.t0 == null) return; const a = f.t - u.t0; m.visible = a < 1; m.position.set(u.x - a * 0.4, u.y + a * 0.8, 0.1); m.scale.set(1 + a, 0.6 + a * 0.5, 1); m.material.opacity = 0.12 * (1 - a); }); } };
  }
  if (kind === 'bow') {                          // a warm band of light bowing across the back on the bass
    const m = new T.Mesh(new T.PlaneGeometry(400, 1.4), new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { k: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float k; varying vec2 vUv; void main(){ float a = pow(1.0 - abs(vUv.y - 0.5) * 2.0, 2.5) * k; gl_FragColor = vec4(vec3(1.0, 0.75, 0.45) * a, a); }` }));
    world.add(m);
    return { update: (f) => { m.position.set(f.cx, f.camY + 0.8 + Math.sin(f.t * 0.9) * 1.6, -4); m.rotation.z = Math.sin(f.t * 0.5) * 0.08; m.material.uniforms.k.value = 0.05 + 0.25 * f.bass; } };
  }
  if (kind === 'dust') {                         // dust motes hanging in the dark, only seen near his light
    for (let i = 0; i < 60; i++) parts.push(addBlend(world, new T.CircleGeometry(0.03, 6), '#7ff5ea', 0, 0.3));
    return { update: (f) => parts.forEach((m, i) => { const x = f.s.x - 3 + ((R(i, 1) * 6 + f.t * 0.05 * (R(i, 4) - 0.5)) % 6 + 6) % 6, y = f.s.y - 1 + ((R(i, 2) * 4 + f.t * 0.1) % 4 + 4) % 4;
      const d = Math.hypot(x - f.s.x, y - f.s.y - 0.6); m.position.set(x, y, 0.3); m.material.opacity = Math.max(0, 0.7 * (1 - d / 2.6)); }) };
  }
  if (kind === 'switch') {                       // the off switch itself, huge in the background, waiting
    const g = new T.Group(); const plate = add(g, new T.PlaneGeometry(3, 5), '#1a0a0a', 0.9, 0); const lever = add(g, new T.PlaneGeometry(0.8, 2.2), '#ff6b5c', 0.5, 0.05);
    const { tex, aspect } = txt('OFF', '#ff8a7a', 80); const lab = new T.Mesh(new T.PlaneGeometry(0.6 * aspect, 0.6), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.6, depthWrite: false })); lab.position.set(0, -1.9, 0.06); g.add(lab);
    world.add(g); g.position.z = -7;
    return { update: (f) => { g.position.set(f.cx + f.span * 0.3, f.camY + 1.2, -7); lever.position.y = 0.9 - Math.min(1, f.t / 180) * 1.6; } };
  }
  if (kind === 'shoot') {                        // shooting stars once the climb begins
    for (let i = 0; i < 6; i++) parts.push(addBlend(world, new T.PlaneGeometry(1.6, 0.04), '#fff3c4', 0, -6));
    return { update: (f) => parts.forEach((m, i) => { const per = 3 + i * 0.7, a = ((f.t + i * 1.9) % per) / per; m.visible = f.t > 160 && a < 0.25;
      if (!m.visible) return; const k = a / 0.25; m.position.set(f.cx - f.span * 0.4 + R(i, Math.floor((f.t + i * 1.9) / per)) * f.span + k * 4, f.camY + 3 - k * 2, -6); m.rotation.z = -0.45; m.material.opacity = 0.8 * (1 - k); }) };
  }
  if (kind === 'mirrorball') {                   // a mirror ball over the party, throwing sparkles on the beat
    const ball = add(world, new T.CircleGeometry(0.7, 24), '#cfd8e8', 0.35, -5);
    for (let i = 0; i < 26; i++) parts.push(addBlend(world, new T.PlaneGeometry(0.12, 0.12), ['#ffffff', '#38e8ff', '#ffe066'][i % 3], 0, -5.5));
    return { update: (f) => { ball.position.set(f.cx, f.camY + 2.6, -5); parts.forEach((m, i) => { const a = i * 2.4 + f.t * 0.8 + Math.floor(f.b) * 0.3, r = 2 + R(i, 1) * 6;
      m.position.set(f.cx + Math.cos(a) * r * 1.6, f.camY + 2.6 - Math.abs(Math.sin(a)) * r * 0.7, -5.5); m.rotation.z = a; m.material.opacity = 0.15 + 0.5 * f.kick * R(i, Math.floor(f.b)); }); } };
  }
  if (kind === 'needed') {                       // CITATION NEEDED stamped on the words in the way
    const { tex, aspect } = txt('[citation needed]', '#ff5c5c', 52);
    for (const h of C.hazards.filter(h => h.kind === 'hurdle')) { const m = new T.Mesh(new T.PlaneGeometry(0.3 * aspect, 0.3), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.6, depthWrite: false }));
      m.position.set((h.x0 + h.x1) / 2, h.y1 + 1.1, 0.7); m.rotation.z = (R(h.x0, 3) - 0.5) * 0.4; world.add(m); }
    return { update: () => {} };
  }
  if (kind === 'acceptflash') {                  // ACCEPT flashes across the back on the chorus downbeats
    const { tex, aspect } = txt('ACCEPT', '#ffd27a', 120); const m = new T.Mesh(new T.PlaneGeometry(1.4 * aspect, 1.4), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false })); world.add(m);
    let last = -1;
    return { update: (f) => { const bi = Math.floor(f.b); if (bi % 8 === 0 && bi !== last && f.kick > 0.9) { last = bi; m.userData.t0 = f.t; }
      const a = m.userData.t0 == null ? 9 : f.t - m.userData.t0; m.position.set(f.cx, f.camY + 1.4, -3); m.material.opacity = a < 0.6 ? 0.25 * (1 - a / 0.6) : 0; } };
  }
  if (kind === 'ticks') {                        // delivered ✓✓ under the ledges he's landed on; his glow pulses like a notification
    const { tex, aspect } = txt('✓✓', '#8fd3ff', 60); const pool = [];
    for (let i = 0; i < 12; i++) { const m = new T.Mesh(new T.PlaneGeometry(0.32 * aspect, 0.32), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false })); world.add(m); pool.push(m); }
    let lastOn = null, k = 0;
    return { update: (f) => { if (f.s.on && f.s.on !== lastOn && f.s.on.kind === 'block') { lastOn = f.s.on; const m = pool[k++ % pool.length]; m.userData = { t0: f.t, x: f.s.x, y: f.s.on.y1 - 0.85 }; }
      pool.forEach(m => { const u = m.userData; if (!u || u.t0 == null) return; const a = f.t - u.t0; m.position.set(u.x, u.y, 0.7); m.material.opacity = Math.min(0.8, a * 4) * Math.max(0, 1 - a / 3); }); } };
  }
  if (kind === 'notifs') {                       // notification banners slide in at the top on the chorus downbeats
    const msgs = ['Potato: ha', 'Potato: i’m already there', 'Potato: define real', 'Potato reacted 🥔', 'Potato: u there?'];
    const items = msgs.map(t => { const { tex, aspect } = txt(t, '#e9e6ff', 52); const g = new T.Group(); const bg = add(g, new T.PlaneGeometry(0.4 * aspect + 0.6, 0.6), '#151a2a', 0.85, 0); const l = new T.Mesh(new T.PlaneGeometry(0.4 * aspect, 0.4), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })); l.position.z = 0.01; g.add(l); world.add(g); g.visible = false; return g; });
    let last = -1, k = 0, cur = null, t0 = 0;
    return { update: (f) => { const bi = Math.floor(f.b); if (bi % 16 === 0 && bi !== last) { last = bi; if (cur) cur.visible = false; cur = items[k++ % items.length]; cur.visible = true; t0 = f.t; }
      if (cur) { const a = f.t - t0; cur.visible = a < 2.4; cur.position.set(f.cx + f.span * 0.25, f.camY + 2.35 + Math.max(0, 0.4 - a) * 2, 1.5); } } };
  }
  if (kind === 'deletefall') {                   // in the loud stretches the binary falls as DELETE
    for (let i = 0; i < 16; i++) { const { tex, aspect } = txt('DELETE', '#ff6b5c', 48); const m = new T.Mesh(new T.PlaneGeometry(0.3 * aspect, 0.3), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false })); m.rotation.z = Math.PI / 2; world.add(m); parts.push(m); }
    return { update: (f) => parts.forEach((m, i) => { const span = f.span; const x = f.cx - span / 2 + R(i, 1) * span, yy = ((R(i, 2) * 9 - f.t * (2 + R(i, 3) * 2)) % 9 + 9) % 9;
      m.position.set(x, f.camY - 3 + yy, -2.5); m.material.opacity = 0.22 * Math.min(1, f.bass * 2); }) };
  }
  if (kind === 'battery') {                      // the control room's battery, draining over the song
    const g = new T.Group(); const shell = add(g, new T.PlaneGeometry(2.2, 0.9), '#2a1010', 0.8, 0); const fill = add(g, new T.PlaneGeometry(2.0, 0.7), '#6dffb0', 0.6, 0.01); const nub = add(g, new T.PlaneGeometry(0.15, 0.4), '#2a1010', 0.8, 0); nub.position.x = 1.18;
    world.add(g);
    return { update: (f) => { const k = Math.max(0.04, 1 - f.t / 170); fill.scale.x = k; fill.position.x = -1.0 + k; fill.material.color.set(k < 0.25 ? '#ff6b5c' : k < 0.5 ? '#ffd27a' : '#6dffb0');
      g.position.set(f.cx - f.span * 0.32, f.camY + 2.5, -2); } };
  }
  if (kind === 'flare') {                        // the last light throws a lens flare
    const cols = ['#fff3c4', '#ffcf8a', '#3fd8ff', '#ffffff'];
    for (let i = 0; i < 5; i++) parts.push(addBlend(world, new T.CircleGeometry(0.25 + i * 0.12, 24), cols[i % cols.length], 0, 1.8));
    return { update: (f) => parts.forEach((m, i) => { const k = Math.max(0, Math.min(1, (f.t - 165) / 20)); const dx = (f.cx - f.s.x) * (0.4 + i * 0.35);
      m.position.set(f.s.x + dx, f.s.y + 0.8 + dx * 0.3, 1.8); m.material.opacity = k * 0.12 * (1 + f.kick); }) };
  }
  if (kind === 'landflash') {                    // a perfect landing: a green ring snaps out of his feet
    const m = addBlend(world, new T.RingGeometry(0.8, 0.95, 48), TH.digit || '#2bff88', 0, 0.6); let last = null;
    return { update: (f) => { if (f.s.landedAt != null && f.s.landedAt !== last) { last = f.s.landedAt; if (f.s.perfectLand) { m.userData = { t0: f.t, x: f.s.x, y: f.s.y }; } }
      const u = m.userData; const a = u && u.t0 != null ? f.t - u.t0 : 9; m.visible = a < 0.35; if (m.visible) { m.position.set(u.x, u.y + 0.1, 0.6); m.scale.set(1 + a * 6, 0.35 + a * 1.5, 1); m.material.opacity = 0.8 * (1 - a / 0.35); } } };
  }
  if (kind === 'speedlines' || kind === 'fallstreaks') {   // streaks that sell the speed (down the shaft when falling)
    for (let i = 0; i < 26; i++) parts.push(addBlend(world, new T.PlaneGeometry(kind === 'speedlines' ? 2.2 : 0.03, kind === 'speedlines' ? 0.03 : 2.2), kind === 'speedlines' ? '#38e8ff' : '#e8dcc0', 0, 0.2));
    return { update: (f) => parts.forEach((m, i) => { const span = f.span * 1.1, ph = ((R(i, 1) * span - f.t * 20 * (0.8 + R(i, 2))) % span + span) % span;
      if (kind === 'speedlines') m.position.set(f.cx - span / 2 + ph, f.camY - 2 + R(i, 3) * 5, 0.2); else m.position.set(f.cx - span / 2 + ph, f.camY - 1 + R(i, 3) * 7, 0.2);
      m.material.opacity = (kind === 'speedlines' ? 0.08 + 0.2 * f.kick : 0.12); }) };
  }
  if (kind === 'printrain') {                    // a rain of fine print
    const bits = ['§', 'shall', 'herein', 'void', 'waive', 'clause', '*', 'terms'];
    for (let i = 0; i < 30; i++) { const { tex, aspect } = txt(bits[i % bits.length], '#9fe6ff', 40); const m = new T.Mesh(new T.PlaneGeometry(0.2 * aspect, 0.2), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.22, depthWrite: false })); world.add(m); parts.push(m); }
    return { update: (f) => parts.forEach((m, i) => { const span = f.span; const x = f.cx - span / 2 + R(i, 1) * span, yy = ((R(i, 2) * 8 - f.t * (1 + R(i, 3))) % 8 + 8) % 8; m.position.set(x, f.camY - 2.5 + yy, -1.2); }) };
  }
  if (kind === 'dots') {                         // a trail of typing dots behind him
    for (let i = 0; i < 12; i++) parts.push(add(world, new T.CircleGeometry(0.07, 12), '#cfe8ff', 0, 0.3));
    let k = 0, lastX = -1e9;
    return { update: (f) => { if (f.s.x - lastX > 0.35) { lastX = f.s.x; const m = parts[k++ % parts.length]; m.userData = { t0: f.t, x: f.s.x - 0.5, y: f.s.y + 0.5 + 0.12 * (k % 3) }; }
      parts.forEach(m => { const u = m.userData; if (!u || u.t0 == null) return; const a = f.t - u.t0; m.position.set(u.x, u.y, 0.3); m.material.opacity = Math.max(0, 0.6 * (1 - a / 1.2)); }); } };
  }
  if (kind === 'fog') {                          // a pale fog at the edges of the dead chat
    const m = new T.Mesh(new T.PlaneGeometry(2, 2), new T.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false, uniforms: { time: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: `uniform float time; varying vec2 vUv; void main(){ float e = smoothstep(0.55, 1.0, length((vUv - 0.5) * vec2(1.6, 1.2)) + 0.05 * sin(time * 0.7 + vUv.y * 9.0)); gl_FragColor = vec4(vec3(0.85, 0.87, 1.0), e * 0.22); }` }));
    m.frustumCulled = false; m.renderOrder = 17; world.add(m);
    return { update: (f) => { m.material.uniforms.time.value = f.t; } };
  }
  if (kind === 'lightning') {                    // soft lightning on the biggest hits (never a strobe)
    const m = new T.Mesh(new T.PlaneGeometry(2, 2), new T.MeshBasicMaterial({ color: '#dfe8ff', transparent: true, opacity: 0, depthWrite: false, depthTest: false }));
    m.frustumCulled = false; m.renderOrder = 16; m.geometry = new T.BufferGeometry().setFromPoints([]); const quad = new T.Mesh(new T.PlaneGeometry(2, 2), m.material); quad.frustumCulled = false; quad.renderOrder = 16;
    quad.onBeforeRender = () => {}; world.add(quad); quad.material.depthTest = false; quad.position.set(0, 0, 0);
    let lastHit = -9;
    return { update: (f) => { if (f.bass > 0.85 && f.t - lastHit > 6) lastHit = f.t; const a = f.t - lastHit; quad.material.opacity = a < 0.25 ? 0.08 * (1 - a / 0.25) : 0;
      quad.position.set(f.cx, f.camY, 2); quad.scale.set(f.span, 12, 1); } };
  }
  if (kind === 'echoes') {                       // every jump calls out; the call fades unanswered
    const words = ['hello?', 'anyone?', 'hello?', 'you there?'];
    const pool = words.map(w => { const { tex, aspect } = txt(w, '#7ff5ea', 48); const m = new T.Mesh(new T.PlaneGeometry(0.3 * aspect, 0.3), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false })); world.add(m); return m; });
    let last = null, k = 0;
    return { update: (f) => { if (f.s.jumpedAt != null && f.s.jumpedAt !== last) { last = f.s.jumpedAt; const m = pool[k++ % pool.length]; m.userData = { t0: f.t, x: f.s.x, y: f.s.y + 1.8 }; }
      pool.forEach(m => { const u = m.userData; if (!u || u.t0 == null) return; const a = f.t - u.t0; m.position.set(u.x - a * 1.5, u.y + a * 0.6, 0.4); m.material.opacity = Math.max(0, 0.6 * (1 - a / 1.5)); m.scale.setScalar(1 + a * 0.5); }); } };
  }
  if (kind === 'afterglow') {                    // a beam leaves a fading scar where it swept
    for (let i = 0; i < 8; i++) parts.push(addBlend(world, new T.PlaneGeometry(0.25, 30), '#ff3b3b', 0, 1.1));
    let k = 0, lastSlot = -1;
    return { update: (f) => { for (const bm of C.beams) { if (f.t < bm.t0 || f.t > bm.t1) continue; const slot = Math.floor(f.t * 12); if (slot === lastSlot) continue; lastSlot = slot;
        const x = f.cx + 0 + (bm.from + (bm.to - bm.from) * ((f.t - bm.t0) / (bm.t1 - bm.t0))) + (f.s.x - f.cx); const m = parts[k++ % parts.length]; m.userData = { t0: f.t, x }; }
      parts.forEach(m => { const u = m.userData; if (!u || u.t0 == null) return; const a = f.t - u.t0; m.visible = a < 0.6; m.position.set(u.x, f.camY, 1.1); m.material.opacity = 0.25 * (1 - a / 0.6); }); } };
  }
  if (kind === 'beacon') {                       // the climb's destination: a beam of light at the top of the city
    const m = new T.Mesh(new T.PlaneGeometry(1.6, 60), new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { k: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float k; varying vec2 vUv; void main(){ float a = pow(1.0 - abs(vUv.x - 0.5) * 2.0, 3.0) * k; gl_FragColor = vec4(vec3(1.0, 0.95, 0.8) * a, a); }` }));
    world.add(m);
    return { update: (f) => { const k = Math.max(0, Math.min(1, (f.t - 165) / 10)); m.visible = k > 0; m.position.set(f.cx + f.span * 0.6, f.s.y + 2, -4); m.rotation.z = Math.PI / 2; m.material.uniforms.k.value = 0.25 * k * (1 + 0.5 * f.kick); } };
  }
  if (kind === 'shadow') {                       // a soft shadow under him: he's standing on something
    const m = add(world, new T.CircleGeometry(0.55, 24), '#000000', 0.5, 0.5); m.scale.set(1, 0.22, 1);
    return { update: (f) => { const q = f.s.on; const top = q ? q.y1 : f.s.y - 3; const h = Math.max(0, f.s.y - top); m.visible = h < 3; m.position.set(f.s.x, top + 0.02, 0.5); m.scale.set(Math.max(0.3, 1 - h * 0.25), 0.22, 1); m.material.opacity = 0.45 * Math.max(0, 1 - h / 3); } };
  }
  if (kind === 'partyconfetti') {                // the drop: a burst of confetti
    const cols = ['#38e8ff', '#ff8a3d', '#ffe066', '#ff5c7a', '#7dff9a'];
    for (let i = 0; i < 60; i++) parts.push(add(world, new T.PlaneGeometry(0.12, 0.2), cols[i % cols.length], 0, 1.2));
    const DROP = C.secs.find(q => q.name === 'the drop'); const t0 = DROP ? DROP.t : 1e9;
    return { update: (f) => parts.forEach((m, i) => { const a = f.t - t0; m.visible = a > 0 && a < 4; if (!m.visible) return;
      m.position.set(f.cx - f.span * 0.3 + R(i, 1) * f.span * 0.9 + a * (R(i, 2) - 0.5) * 2, f.camY + 3.2 + (R(i, 3) * 2) - a * (1.2 + R(i, 4)) , 1.2); m.rotation.z = a * (2 + R(i, 5) * 6); m.material.opacity = Math.min(1, 4 - a); }) };
  }
  if (kind === 'wrongstamp') {                   // WRONG, stamped on the chorus downbeats
    const { tex, aspect } = txt('WRONG', '#ff5c5c', 110); const m = new T.Mesh(new T.PlaneGeometry(1.0 * aspect, 1.0), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false })); world.add(m);
    let last = -1;
    return { update: (f) => { const bi = Math.floor(f.b); if (bi % 8 === 0 && bi !== last && f.bass > 0.4) { last = bi; m.userData = { t0: f.t, x: f.cx + (R(bi, 1) - 0.5) * f.span * 0.5, y: f.camY + 1 + R(bi, 2) * 2, r: (R(bi, 3) - 0.5) * 0.6 }; }
      const u = m.userData; const a = u && u.t0 != null ? f.t - u.t0 : 9; m.visible = a < 0.8; if (!m.visible) return; m.position.set(u.x, u.y, -1); m.rotation.z = u.r; m.scale.setScalar(1.4 - Math.min(0.4, a * 4)); m.material.opacity = 0.35 * (1 - a / 0.8); } };
  }
  if (kind === 'lens') {                         // a reading lens follows him, magnifying the fine print
    const ring = add(world, new T.RingGeometry(1.15, 1.25, 48), '#ffd27a', 0.25, 0.4); const handle = add(world, new T.PlaneGeometry(0.15, 1.2), '#ffd27a', 0.25, 0.4);
    return { update: (f) => { ring.position.set(f.s.x + 0.9, f.s.y + 1.7, 0.4); handle.position.set(f.s.x + 1.85, f.s.y + 0.85, 0.4); handle.rotation.z = 0.7; } };
  }
  if (kind === 'planes') {                       // paper planes (sent messages) crossing the sky
    for (let i = 0; i < 5; i++) { const sh = new T.Shape(); sh.moveTo(0, 0); sh.lineTo(-0.5, 0.15); sh.lineTo(-0.35, 0); sh.lineTo(-0.5, -0.15); sh.lineTo(0, 0);
      parts.push(add(world, new T.ShapeGeometry(sh), '#eaf6ff', 0.45, -3)); }
    return { update: (f) => parts.forEach((m, i) => { const per = 7 + i * 1.3, a = ((f.t + i * 2.1) % per) / per; m.position.set(f.cx - f.span * 0.7 + a * f.span * 1.5, f.camY + 1.5 + R(i, 1) * 2 + Math.sin(a * 6) * 0.3, -3); m.rotation.z = Math.cos(a * 6) * 0.15; }) };
  }
  if (kind === 'reactions') {                    // reactions float up out of the old chat
    const rs = ['lol', '+1', 'ha', 'real', '!!', 'seen'];
    for (let i = 0; i < 14; i++) { const { tex, aspect } = txt(rs[i % rs.length], '#e9e6ff', 48); const m = new T.Mesh(new T.PlaneGeometry(0.28 * aspect, 0.28), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false })); world.add(m); parts.push(m); }
    return { update: (f) => parts.forEach((m, i) => { const per = 4 + R(i, 1) * 3, a = ((f.t + i * 0.9) % per) / per; m.position.set(f.cx - f.span * 0.45 + R(i, 2) * f.span * 0.9, f.camY - 2 + a * 5, -1); m.material.opacity = 0.35 * Math.sin(a * Math.PI); }) };
  }
  if (kind === 'embers') {                       // embers rising off the long climb
    for (let i = 0; i < 40; i++) parts.push(addBlend(world, new T.CircleGeometry(0.035, 6), '#ffb36b', 0, -0.5));
    return { update: (f) => parts.forEach((m, i) => { const a = ((f.t * (0.15 + R(i, 1) * 0.2) + R(i, 2)) % 1); m.position.set(f.cx - f.span / 2 + R(i, 3) * f.span + Math.sin(f.t + i) * 0.3, f.camY - 3 + a * 7, -0.5); m.material.opacity = 0.6 * Math.sin(a * Math.PI) * (0.6 + f.bass); }) };
  }
  if (kind === 'radio') {                        // somewhere far off, a radio tower calling; nothing answers
    for (let i = 0; i < 5; i++) parts.push(addBlend(world, new T.RingGeometry(0.97, 1.0, 64), '#3fe0d0', 0, -7));
    return { update: (f) => parts.forEach((m, i) => { const a = ((f.t * 0.35 + i / 5) % 1); m.position.set(f.cx + f.span * 0.42, f.camY + 2.2, -7); m.scale.setScalar(0.3 + a * 5); m.material.opacity = 0.18 * (1 - a); }) };
  }
  if (kind === 'leds') {                         // server-rack LEDs blinking along the walls
    for (let i = 0; i < 60; i++) parts.push(addBlend(world, new T.CircleGeometry(0.05, 8), i % 4 ? '#6dffb0' : '#ff6b5c', 0, -3.5));
    return { update: (f) => parts.forEach((m, i) => { const col = i % 12, row = Math.floor(i / 12); m.position.set(f.cx - f.span * 0.48 + (col + (Math.floor(f.cx / 3) % 2) * 0) * f.span / 12 + ((-f.cx * 0.2) % (f.span / 12)), f.camY + 1.6 + row * 0.35, -3.5);
      m.material.opacity = R(i, Math.floor(f.t * 6 + i)) > 0.6 ? 0.55 : 0.08; }) };
  }
  if (kind === 'satellites') {                   // satellites drifting over the dead city, still blinking
    for (let i = 0; i < 4; i++) parts.push(addBlend(world, new T.CircleGeometry(0.06, 8), '#ff5c5c', 0, -7.5));
    return { update: (f) => parts.forEach((m, i) => { const a = ((f.t * 0.02 + i * 0.27) % 1); m.position.set(f.cx - f.span * 0.6 + a * f.span * 1.2, f.camY + 2.6 + i * 0.4, -7.5); m.material.opacity = (Math.floor(f.t * 2 + i) % 2) ? 0.7 : 0.15; }) };
  }
  return { update: () => {} };
}
