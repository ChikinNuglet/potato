// judge.mjs — direction.json "judge" run over a trace. "Blends, never snaps" as numbers that can be failed.
// Between two consecutive 60 Hz frames of the same Potato:
//   keyed modes (ground, clip, down):  position step <= max_position_step_body_heights (0.04)
//   free (physics owns him):           CHANGE of velocity <= max_free_dv_bh_s_per_frame (0.6)      [build plan ruling 1]
//   held:                              position is the user's hand, so only roll, scale and yaw are judged   [argued on the board]
//   always:                            scale step <= 0.03 (sy and both world stretches), yaw <= 0.15 rad, roll <= 0.2 rad
// Exempt: the frame tagged contact / release / takeoff / grab and the one after (2 per contact), glitch_step frames,
// approach frames (their own rule), and a teleport only in mode gone.
// Same code in bench.html (bench.judge()) and in tools/bench.py (it calls this in the page).
// Game-feel and physics engineer (seat 3), for the director.
import { COLS, TAG } from './trace.mjs';
const C = Object.fromEntries(COLS.map((n, i) => [n, i]));
const MODE_NAME = ['ground', 'held', 'free', 'clip', 'down', 'gone'];

export function judge(rows, J) {
  const lim = { pos: J.max_position_step_body_heights, scale: J.max_scale_step, yaw: J.max_yaw_step_rad, roll: J.max_roll_step_rad, dv: J.max_free_dv_bh_s_per_frame || 0.6 };
  const exemptN = J.impact_frames_exempt_per_contact || 2, CONTACT = TAG.contact | TAG.release | TAG.takeoff | TAG.grab;
  const last = new Map(), exempt = new Map(), fails = [], worst = { pos: 0, scale: 0, yaw: 0, roll: 0, dv: 0 }; let checked = 0;
  for (const r of rows) {
    const id = r[C.id], p = last.get(id), tags = r[C.tags], mode = r[C.mode];
    if (tags & CONTACT) exempt.set(id, exemptN);
    const ex = exempt.get(id) || 0; if (ex > 0) exempt.set(id, ex - 1);
    last.set(id, r);
    if (!p || r[C.k] !== p[C.k] + 1) continue;
    if (mode === 5 || p[C.mode] === 5) { continue; }                 // in the 404: nothing to see
    if (tags & TAG.teleport) { fails.push({ k: r[C.k], id, channel: 'teleport', step: 0, limit: 0, mode: MODE_NAME[mode] }); continue; }
    checked++;
    const glitch = tags & TAG.glitch_step, free = ex > 0 || glitch;
    const test = (name, step, limit, w) => { if (!free && step > worst[w]) worst[w] = step; if (!free && step > limit + 1e-9) fails.push({ k: r[C.k], id, channel: name, step: +step.toFixed(4), limit, mode: MODE_NAME[mode] }); };
    if (mode === 2 && p[C.mode] === 2) test('dv', Math.hypot(r[C.vx] - p[C.vx], r[C.vy] - p[C.vy]), lim.dv, 'dv');
    else if (mode !== 1 && p[C.mode] !== 1) test('position', Math.hypot(r[C.x] + r[C.dx] - p[C.x] - p[C.dx], r[C.y] + r[C.dy] - p[C.y] - p[C.dy]), lim.pos, 'pos');
    if (!(tags & TAG.approach)) { test('sy', Math.abs(r[C.sy] - p[C.sy]), lim.scale, 'scale'); test('s1', Math.abs(r[C.s1] - p[C.s1]), lim.scale, 'scale'); test('s2', Math.abs(r[C.s2] - p[C.s2]), lim.scale, 'scale'); }
    test('yaw', Math.abs(r[C.m_yaw] - p[C.m_yaw]), lim.yaw, 'yaw');
    let dr = (r[C.roll] - p[C.roll]) % (2 * Math.PI); if (dr > Math.PI) dr -= 2 * Math.PI; else if (dr < -Math.PI) dr += 2 * Math.PI;   // a whole turn is the same pose (the rig unwinds a tumble)
    test('roll', Math.abs(dr), lim.roll, 'roll');
  }
  for (const k in worst) worst[k] = +worst[k].toFixed(4);
  const face = judgeFace(rows, J); for (const f of face.fails) fails.push(f);
  return { pass: fails.length === 0, frames_checked: checked, fails, worst_outside_exempt_frames: worst, limits: lim, face: face.report };
}

// ---- final round: the FACE rule (Potato seat: "the judge cannot see a face, and all five of tonight's breaks are faces").
// THE WINK: one lid fully shut while the other is open, for longer than 2 frames, is a fail (a late lid may pass through it).
// Read off the face as painted (trace columns lidL .. expr). Not judged in the 404, in a whole-face swap (expr > 0: a drawn
// face of Vega's), or while he is asleep on purpose (both lids high). BLANK EYES cannot be told from these numbers alone
// (the painter counts pupil pixels and gives way itself: engine/moves/face.mjs pupilShown), so it is reported as the
// furthest the gaze got, not failed.
export function judgeFace(rows, J) {
  const maxWink = (J && J.max_wink_frames) || 2, run = new Map(), fails = [], rep = { has_face: false, longest_one_lid_shut_f: 0, furthest_gaze: 0, frames_with_a_drawn_face: 0, frames: 0 };
  if (C.lidL == null) return { fails, report: rep };
  for (const r of rows) { const id = r[C.id]; if (r[C.expr] < 0) continue; rep.has_face = true; if (r[C.mode] === 5) { run.set(id, 0); continue; }
    rep.frames++; if (r[C.expr] > 0) { rep.frames_with_a_drawn_face++; run.set(id, 0); continue; }
    const a = r[C.lidL], b = r[C.lidR], wink = (a >= 0.9 && b <= 0.3) || (b >= 0.9 && a <= 0.3), n = wink ? (run.get(id) || 0) + 1 : 0; run.set(id, n);
    if (n > rep.longest_one_lid_shut_f) rep.longest_one_lid_shut_f = n;
    if (n === maxWink + 1) fails.push({ k: r[C.k], id, channel: 'wink', step: n, limit: maxWink, mode: MODE_NAME[r[C.mode]] });
    const g = Math.hypot(r[C.gx], r[C.gy]); if (g > rep.furthest_gaze) rep.furthest_gaze = +g.toFixed(3); }
  return { fails, report: rep };
}

// ---- final round (director E3): teach the judge "ALIVE". A snap can be failed; a statue could not. Over a life run, per Potato:
// share of frames he is travelling, the longest stretch his BODY does nothing (no travel, no turn, height inside +-2.5%: breathing
// only), how many different places he stood in (0.5 bh bins, held 2 s), share of frames that are breathing only.
// Marks: direction.json judge.round3_alive. Reported with a verdict per mark; it does NOT fail the snap judge.
export function judgeAlive(rows, marks = {}) {
  const by = new Map(); for (const r of rows) { if (!by.has(r[C.id])) by.set(r[C.id], []); by.get(r[C.id]).push(r); }
  const out = [];
  for (const [id, R] of by) { let travel = 0, still = 0, longest = 0, breath = 0, n = 0, air = 0; const places = new Map(); let bin = null, binF = 0; const y0 = R[0][C.m_yaw];
    let lastYaw = y0;
    for (let i = 1; i < R.length; i++) { const r = R[i], p = R[i - 1]; if (r[C.mode] === 5) continue; n++;
      const moving = Math.abs(r[C.x] - p[C.x]) > 0.0012 || r[C.mode] === 1 || r[C.mode] === 2, turning = Math.abs(r[C.m_yaw] - p[C.m_yaw]) > 0.004 || Math.abs(r[C.roll] - p[C.roll]) > 0.004, tall = Math.abs(r[C.sy] - 1) > 0.025 || Math.abs(r[C.dy]) > 0.02;
      if (moving) travel++; if (r[C.mode] === 2) air++;
      if (moving || turning || tall) still = 0; else { still++; breath++; if (still > longest) longest = still; }
      const b = Math.round(r[C.x] / 0.5); if (b === bin && !moving) { binF++; if (binF === 120) places.set(b, (places.get(b) || 0) + 1); } else if (b !== bin) { bin = b; binF = 0; }
      lastYaw = r[C.m_yaw]; }
    void lastYaw;
    out.push({ id, frames: n, travel_share: +(travel / Math.max(1, n)).toFixed(3), breathing_only_share: +(breath / Math.max(1, n)).toFixed(3), longest_body_still_s: +(longest / 60).toFixed(1), places_stood_in: places.size, air_frames: air }); }
  return { per_potato: out, marks };
}
