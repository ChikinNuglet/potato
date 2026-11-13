// trace.mjs — one row per Potato per step, kept in a ring (60 s for five), dumped as CSV. Every move proves itself here.
// tags are a bit mask; names below. judge.mjs reads the rows; tools/bench.py writes them to strips/curves/.
// Game-feel and physics engineer (seat 3).
export const COLS = ['k', 'id', 'mode', 'x', 'y', 'vx', 'vy', 'roll', 'spin', 'yaw', 'sy', 's1', 's2', 'axis', 'pitch', 'shear', 'dx', 'dy',
  'm_squash', 'm_leanX', 'm_wob', 'm_yaw', 'glitch', 'lod', 'tags', 'strain', 'grudge',
  'lidL', 'lidR', 'gx', 'gy', 'browL', 'browR', 'flat', 'expr'];   // final round (Potato seat + animator asked): the face AS PAINTED, so the judge can see a wink. expr = index into face.mjs EXPRS, -1 = no face plug-in
export const TAG = { contact: 1, release: 2, takeoff: 4, glitch_step: 8, clip_start: 16, teleport: 32, held: 64, free: 128, approach: 256, grab: 512, blend: 1024, landed: 2048 };
export const TAG_NAMES = Object.keys(TAG);
const NC = COLS.length;

export function createTrace(capacityRows = 60 * 60 * 5) {
  const buf = new Float64Array(capacityRows * NC); let head = 0, count = 0;
  const trace = {
    COLS, header: {},
    push(row) { buf.set(row, head * NC); head = (head + 1) % capacityRows; if (count < capacityRows) count++; },
    clear() { head = 0; count = 0; },
    get length() { return count; },
    /** rows as arrays, oldest first; from step kFrom on */
    rows(kFrom = -Infinity) { const out = []; for (let n = 0; n < count; n++) { const i = ((head - count + n) % capacityRows + capacityRows) % capacityRows, o = i * NC; if (buf[o] >= kFrom) out.push(Array.from(buf.subarray(o, o + NC))); } return out; },
    tagNames(mask) { return TAG_NAMES.filter(n => mask & TAG[n]).join('|'); },
    dump(kFrom) {
      const L = Object.entries(trace.header).map(([k, v]) => '# ' + k + ': ' + (typeof v === 'string' ? v : JSON.stringify(v)));
      L.push(COLS.join(','));
      for (const r of trace.rows(kFrom)) L.push(r.map((v, i) => i === 24 ? trace.tagNames(v) : Number.isInteger(v) ? v : +v.toFixed(5)).join(','));
      return L.join('\n') + '\n';
    },
  };
  return trace;
}
