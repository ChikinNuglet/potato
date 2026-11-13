// mind.mjs — ONE Potato's head: moods that drift, two slow drives, the picker (what he does next and never the same way
// twice), and which answer he gives to a thing done to him. No rig, no physics, no clock of its own: time comes in as seconds.
// Everything here is read from data/behaviour.json. Ported from Last Five's reference picker (tools/behaviour_check.py simulate)
// and then extended with what the board asked for: two clocks (eyes / body), smug needs a cause, no two travels in a minute,
// the first minute, personalities and their wont, ladders / variants / rings, THE NO.
// Behaviour Designer (seat 4), Build round, team Not A Screensaver.
// Round 3 (the director's notes): pick() takes { tag, must } so the brain can ask for a place, his own glitch, or SOMETHING when the
// body gap is at its cap. The no-repeat rules (last five, pairs, triples) are never relaxed; only quota, share cap, travel gap, cooldown.

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

export function whenOk(when, info) {          // a row's "when": speed_min / dist_max_px / hover_min_s ... or plain equality
  if (!when) return true;
  for (const k in when) { const v = when[k], m = /^(.*)_(min|max)(_px|_s)?$/.exec(k);
    if (m) { const x = info[m[1] + (m[3] || '')]; if (x == null) return false; if (m[2] === 'min' ? x < v : x > v) return false; }
    else if ((info[k] == null ? false : info[k]) !== v) return false; }
  return true;
}

export function createMind(D, { id, rnd, personality = null, real = false, gags = null }) {
  const M = D.moods, ML = M.list, names = Object.keys(ML), H = D.picker.history, PK = D.picker, idles = D.idles, by = Object.fromEntries(idles.map(b => [b.id, b]));
  const dial = personality ? (D.personalities.dials[personality.change.dial] || {}) : {}, dk = personality ? Math.abs(personality.change.move) / 2 : 0;
  const wont = personality ? ((D.personalities.wont_rules || {})[personality.id] || {}) : {};
  const never = new Set(wont.never_play || []);
  const R = (a, b) => a + (b - a) * rnd(), draw = v => (Array.isArray(v) ? R(v[0], v[1]) : v);
  const pickW = (items, ws) => { let tot = 0; for (const w of ws) tot += w; let r = rnd() * tot; for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; } return items[items.length - 1]; };
  const rest = {}; for (const m of names) rest[m] = ML[m].rest + ((dial.mood_rest || {})[m] || 0) * dk;
  const P = { ...rest }, FM = D.first_minute || { on: false }, RF = (gags && gags.refusal) || { chance: 0.083, not_before_seen: 3, not_in_first_s: 600, mood_bias: { fed_up: 2, rattled: 0 } };
  const refusalsOn = !gags || gags.refusals !== false;
  const mind = {
    id, personality, real, dial, wont, P, by,
    dom: M.home, domSince: 0, boredom: D.drives.boredom.start, energy: dial.energy_start != null ? dial.energy_start : D.drives.energy.start,
    asleep: false, offHome: false, cdScale: R(0.8, 1.25), born: null, touched: false, smugCauseT: -1e9, lastTravelT: -1e9, lastBigT: -1e9,
    nextWhim: null, hist: [], pairs: [], triples: [], lastPlay: {}, units: [], onmood: [], holds: 0, w: null,
    ladders: {}, lastVariant: {}, seen: {}, lastEventT: {}, repeats: {}, lastRefusal: null, wonLast: false, startedLast: false, lastFoe: null, protectedUntil: -1e9,
    prefer: [], preferBoost: 3,
  };

  mind.weights = () => { let e = M.sharpen; for (;;) { const w = {}; let s = 0; for (const m of names) { w[m] = Math.pow(Math.max(P[m], 0), e); s += w[m]; } let top = 0; for (const m of names) { w[m] /= s; if (w[m] > top) top = w[m]; }
    if (top >= M.readable.floor || e > 6) return (mind.w = w); e += 0.3; } };

  /** mood pushes, energy and boredom. A smug push over 0 is a CAUSE (smug idles only run inside 120 s of one). */
  mind.push = (push, t, scale = 1) => { if (!push) return; for (const m in push) { const v = push[m] * scale;
    if (m === 'energy') mind.energy = clamp(mind.energy + v, 0, 1); else if (m === 'boredom') mind.boredom = clamp(mind.boredom + v, 0, 1);
    else if (m in P) { P[m] = Math.max(0, P[m] + v); if (m === 'smug' && v > 0 && t != null) mind.smugCauseT = t; } } };
  mind.named = (name, t) => mind.push(Object.fromEntries(Object.entries(M.pushes[name] || {}).filter(([k, v]) => typeof v === 'number')), t);
  mind.direct = t => { mind.touched = true; mind.boredom = Math.max(0, mind.boredom - 0.5); mind.quietSince = t; };

  /** one second of life */
  mind.second = (t, env) => {
    if (mind.born == null) { mind.born = t; mind.quietSince = t; mind.nextWhim = t + R(M.whim.every_s[0], M.whim.every_s[1]); }
    for (const m of names) { const k = Math.pow(0.5, 1 / ML[m].half_life_s), lost = (P[m] - rest[m]) * (1 - k); P[m] -= lost;
      if (lost > 0) for (const s of (M.settles_into[m] || [])) { const wn = s.when || {}; if ('watched' in wn && wn.watched !== env.watched) continue; if ('last_reaction_in' in wn && !wn.last_reaction_in.includes(mind.lastReaction)) continue; if (wn.not_caught && mind.caughtT > t - 60) continue; P[s.to] += lost * s.share; } }
    mind.boredom = Math.min(1, mind.boredom + D.drives.boredom.rises_per_s);
    mind.energy = clamp(mind.energy + (mind.asleep ? D.drives.energy.restores.asleep_per_s : -D.drives.energy.drains_per_s), 0, 1);
    if (mind.energy < 0.3) P.low_power += 0.02;
    if (t >= mind.nextWhim) { const ch = M.whim.chance, m = pickW(Object.keys(ch), Object.values(ch)); P[m] += R(M.whim.push[0], M.whim.push[1]); mind.nextWhim = t + R(M.whim.every_s[0], M.whim.every_s[1]); mind.lastWhim = m; }
    const w = mind.weights(); let top = names[0]; for (const m of names) if (w[m] > w[top]) top = m;
    if (top !== mind.dom && w[top] > w[mind.dom] + M.dominant.switch_margin && t - mind.domSince >= M.dominant.min_hold_s) { mind.dom = top; mind.domSince = t; return true; }
    return false;
  };

  /** how long he holds before the next thing. kind 'micro' = the eyes clock, 'body' = the body clock (ruling 11). */
  mind.gap = kind => { const g = ML[mind.dom][kind === 'body' ? 'body_gap_s' : 'gap_s'] || ML[mind.dom].gap_s, sc = dial.gap_scale ? 1 + (dial.gap_scale - 1) * dk : 1;
    if (kind === 'body' && M.pace && mind.dom === M.home && rnd() < M.pace.quiet_stretch_chance) return R(M.pace.quiet_stretch_s[0], M.pace.quiet_stretch_s[1]) * sc;   // some minutes of only breath, blink, eyes
    return R(g[0], g[1]) * sc; };
  mind.firstMinute = t => FM.on && !mind.touched && mind.born != null && t - mind.born < FM.seconds;

  function needsOk(b, t, env) { const n = b.needs || {};
    const watched = D.flags.witness.value === false ? true : env.watched;
    if ('watched' in n && n.watched !== watched && !(b.tags.includes('self_glitch') && dial.extra && /try_the_glitch may run while watched/.test(dial.extra) && b.id === 'try_the_glitch')) return false;
    if (n.cursor_moving && !env.cursorMoving) return false;
    if ('cursor_within_px' in n && !(env.cursorPx != null && env.cursorPx <= n.cursor_within_px)) return false;
    if (n.cursor_far && !(env.cursorPx == null || env.cursorPx > 260)) return false;
    if (n.off_home_spot && !mind.offHome) return false;
    if (n.asleep && !mind.asleep) return false;
    if ('boredom_min' in n && mind.boredom < n.boredom_min) return false;
    if ('energy_max' in n && mind.energy > n.energy_max) return false;
    if ('smug_cause_within_s' in n && t - mind.smugCauseT > n.smug_cause_within_s) return false;
    return true; }
  mind.needsOk = needsOk;
  const NONE = {}, TAGGED = [{ travel: 1 }, { travel: 1, cool: 1 }, { travel: 1, share: 1 }, { travel: 1, cool: 1, share: 1 }], MUST = [{ travel: 1 }, { travel: 1, cool: 1 }, { travel: 1, cool: 1, share: 1 }];   // the order the soft rules give way in
  const cooled = (b, t, k = 1) => !(b.id in mind.lastPlay) || t - mind.lastPlay[b.id] >= b.cooldown_s * k * mind.cdScale * (b.tags.includes('sleep') && dial.sleep_cooldown_scale ? dial.sleep_cooldown_scale : 1);
  mind.cooled = cooled;

  function eligible(b, t, env, tier, rx = NONE) { const i = b.id, h = mind.hist;   // rx: which soft rules give way { travel, cool, share }. Never the no-repeat rules.
    if (tier !== 'any' && (tier === 'micro' ? b.tier !== 'micro' : b.tier === 'micro')) return false;
    if (never.has(i) || !needsOk(b, t, env) || !cooled(b, t, rx.cool ? 0.5 : 1)) return false;
    if (h.slice(-H.no_repeat_last).includes(i)) return false;
    if (h.length && mind.pairs.includes(h[h.length - 1] + '>' + i)) return false;
    if (h.length > 1 && mind.triples.includes(h[h.length - 2] + '>' + h[h.length - 1] + '>' + i)) return false;
    if (b.tier === 'big' && (t - mind.lastBigT < 20 || env.stageFree === false || (wont.never_bids_stage && env.crowd > 1))) return false;
    if (b.tags.includes('travel') && !rx.travel && t - mind.lastTravelT < (PK.travel_min_gap_s || 0)) return false;
    if (b.tags.includes('private') && D.flags.witness.value === false) return false;
    let n = 0, all = 0; for (const u of mind.units) if (u.t > t - 600) { all++; if (u.id === i) n++; }
    if (!rx.share && (n + 1) / Math.max(25, all + 1) > 0.08) return false;
    return true; }

  /** the pick. tier 'micro' or 'body'. Returns a behaviour from behaviour.json idles, or null (he holds: a hold is not a behaviour). */
  mind.pick = (t, env, tier, opt = {}) => {
    const w = mind.w || mind.weights(); let cands = []; if (opt.tag) { for (const rx of TAGGED) { cands = idles.filter(b => b.tags.includes(opt.tag) && eligible(b, t, env, tier, rx)); if (cands.length) break; } }   // asked for by tag: the travel gap does not apply; cooldowns, then the share cap, give way only if nothing else is left
    else cands = idles.filter(b => eligible(b, t, env, tier));
    const q = PK.mood_quota, recent = mind.onmood.slice(-q.over_last);
    if (!opt.tag && recent.filter(x => !x).length >= q.off_mood_at_most) cands = cands.filter(b => (b.moods[mind.dom] || 0) >= 0.5);
    if (opt.must && !cands.length) { for (const rx of MUST) { cands = idles.filter(b => eligible(b, t, env, tier, rx)); if (cands.length) break; } mind.relaxed = (mind.relaxed || 0) + 1; }
    const prev = mind.hist.length ? by[mind.hist[mind.hist.length - 1]] : null, follow = {}; if (prev) for (const x of prev.then) follow[x.to] = x.w;
    const privK = env.watched ? 1 : Math.min(1, D.private.ramp_start + (1 - D.private.ramp_start) * (env.goneFor || 0) / D.private.ramp_s);
    const sc = cands.map(b => { let aff = 0; for (const m in b.moods) aff += (w[m] || 0) * b.moods[m]; aff *= aff; if (opt.tag || opt.must) aff = Math.max(aff, 0.02);
      const nov = !(b.id in mind.lastPlay) ? 1 : Math.min(1, (t - mind.lastPlay[b.id]) / (3 * b.cooldown_s));
      let drv = mind.boredom > 0.5 && b.tags.some(g => g === 'travel' || g === 'inspect' || g === 'edge' || g === 'prop') ? 1 + mind.boredom : 1;
      if (mind.prefer.includes(b.id)) drv *= mind.preferBoost;
      let per = 1; if (dial.tags) for (const g of b.tags) if (dial.tags[g]) per *= 1 + (dial.tags[g] - 1) * dk;
      return b.w * aff * nov * (1 + 2 * (follow[b.id] || 0)) * drv * (b.tags.includes('private') ? privK : 1) * per; });
    let tot = 0; for (const s of sc) tot += s;
    if (!cands.length || tot <= 0) { mind.holds++; return null; }
    return pickW(cands, sc);
  };
  /** may he play this one right now if somebody ASKS (the real brain's request)? Same rules as the picker. */
  mind.allowed = (bid, t, env) => { const b = by[bid]; return !!b && eligible(b, t, env, b.tier === 'micro' ? 'micro' : 'body'); };

  /** write a pick into his history (a chained behaviour is the same sentence: it does not count again) */
  mind.commit = (b, t, chained = false) => { const h = mind.hist;
    if (!chained) { if (h.length) { mind.pairs.push(h[h.length - 1] + '>' + b.id); if (mind.pairs.length > H.no_repeat_pair_within) mind.pairs.shift(); }
      if (h.length > 1) { mind.triples.push(h[h.length - 2] + '>' + h[h.length - 1] + '>' + b.id); if (mind.triples.length > H.no_repeat_triple_within) mind.triples.shift(); }
      h.push(b.id); mind.onmood.push((b.moods[mind.dom] || 0) >= 0.5); mind.units.push({ id: b.id, dom: mind.dom, t, tier: b.tier }); }
    mind.lastPlay[b.id] = t;
    if (b.tier === 'big') { mind.lastBigT = t; mind.boredom = Math.max(0, mind.boredom - 0.4); mind.energy = Math.max(0, mind.energy - D.drives.energy.costs.big_behaviour); }
    if (b.tags.includes('travel')) { mind.lastTravelT = t; mind.offHome = b.id !== 'return_to_spot'; } };
  mind.chainAfter = (b, t, env) => { const c = b.then.find(x => x.chain); if (!c || rnd() > c.w) return null; const nb = by[c.to]; return nb && (nb.id === 'wake_self_glitch' || (needsOk(nb, t, env) && cooled(nb, t))) ? nb : null; };

  // ---------- things done TO him: ladders, variants, rings ----------
  const rows = r => r.rungs || r.variants || r.rings || [];
  /** THE NO (the comedian's bold choice): about one gag trigger in twelve he declines, with the same three beats. */
  function refuse(key, t, w) { if (!refusalsOn) return false; const seen = mind.seen[key] || 0;
    if (seen < RF.not_before_seen || t - (mind.born || 0) < RF.not_in_first_s || mind.lastRefusal === key) return false;
    const bias = 1 + (w.fed_up || 0) * ((RF.mood_bias.fed_up || 1) - 1) - (w.rattled || 0) * (1 - (RF.mood_bias.rattled || 0));
    return rnd() < RF.chance * Math.max(0, bias); }
  mind.NO = { id: 'the_no', see: 'He looks at it. He looks at you. He turns away.', beats: [{ look: 'thing', t: 10 / 60 }, { look: 'cursor', hold: 1, t: 50 / 60 }, { turn: { to: 'away', speed: 'slow' }, look: 'away', t: 36 / 60 }, { hold: 1, t: [1, 2] }, { turn: { to: 'home', speed: 'slow' }, t: [0.6, 1] }] };

  /** which answer he gives. Returns { key, row, rung?, refused? } or null (nothing in the file answers, or a ring did not change). */
  mind.react = (key, info, t) => {
    const r = D.reactions[key]; if (!r) return null; const w = mind.w || mind.weights(); info = { ...info, asleep: mind.asleep };
    if (r.when && !whenOk(r.when, info)) return null;
    mind.seen[key] = (mind.seen[key] || 0) + 1; const lastT = mind.lastEventT[key]; mind.lastEventT[key] = t; let row = null, rung;
    if (r.mode === 'ladder') { const L = mind.ladders[key + (info.pair != null ? ':' + info.pair : '')] || (mind.ladders[key + (info.pair != null ? ':' + info.pair : '')] = { i: -1, t: -1e9, start: 0 });
      const quiet = r.reset_after_quiet_s || r.forgive_s; if (quiet && t - L.t > quiet) L.i = L.start - 1;
      L.i++; if (L.i >= r.rungs.length) { if (r.after_top_start_at) { L.start = r.after_top_start_at - 1; L.i = L.start; } else { L.t = t; return { key, past_top: true }; } }
      L.t = t; row = r.rungs[L.i]; rung = L.i + 1;
      if (r.gag && rung >= 4 && refuse(key, t, w)) { mind.lastRefusal = key; mind.push(D.refusal.push, t); return { key, row: mind.NO, rung, refused: true }; } }
    else if (r.mode === 'rings') { for (const x of r.rings) if (whenOk(x.when, info)) row = x; if (!row) return null;
      if (mind.lastVariant[key] === row.id && !info.force) { if (row.push_per_s && info.dt) mind.push(row.push, t, info.dt); return null; } }
    else { if ((r.gag || '').length && !info.physics && refuse(key, t, w)) { mind.lastRefusal = key; mind.lastVariant[key] = 'the_no'; mind.push(D.refusal.push, t); return { key, row: mind.NO, refused: true }; }
      const win = r.repeat_window_s, again = win && lastT != null && t - lastT < win; mind.repeats[key] = again ? (mind.repeats[key] || 0) + 1 : 0;
      let pool = r.variants.filter(x => whenOk(x.when, info) && !never.has(x.id) && (!x.only_in_escalation || (again && mind.repeats[key] >= 1)));
      const sure = pool.filter(x => x.when && Object.keys(x.when).length && !x.chance); if (sure.length) pool = sure.concat(pool.filter(x => x.chance));   // a variant written for exactly this case wins over the general ones
      if (again && r.escalate) { const e = r.escalate[Math.min(mind.repeats[key], r.escalate.length - 1)], x = pool.find(v => v.id === e); if (x && x.id !== mind.lastVariant[key]) row = x; }
      if (!row) { const lucky = pool.filter(x => x.chance && x.id !== mind.lastVariant[key] && rnd() < x.chance); if (lucky.length) row = lucky[0]; }
      if (!row) { let c = pool.filter(x => !x.chance && !x.only_in_escalation && x.id !== mind.lastVariant[key]); if (!c.length) c = pool.filter(x => !x.chance); if (!c.length) return null;
        row = pickW(c, c.map(x => { if (!x.moods) return 0.5; let a = 0.05; for (const m in x.moods) a += (w[m] || 0) * x.moods[m]; return a; })); }
      mind.lastRefusal = null; }
    mind.lastVariant[key] = row.id; mind.lastReaction = row.id; mind.push(row.push, t);
    return { key, row, rung };
  };

  /** numbers for the dump */
  mind.stats = () => { const ids = mind.units.map(u => u.id), n = ids.length, cnt = {}; let back = 0; for (let i = 0; i < n; i++) { cnt[ids[i]] = (cnt[ids[i]] || 0) + 1; if (i && ids[i] === ids[i - 1]) back++; }
    const tri = {}; let triRep = 0; for (let i = 2; i < n; i++) { const k = ids[i - 2] + '>' + ids[i - 1] + '>' + ids[i]; tri[k] = (tri[k] || 0) + 1; } for (const k in tri) if (tri[k] > 1) triRep++;
    let match = 0; for (const u of mind.units) if ((by[u.id].moods[u.dom] || 0) >= 0.5) match++;
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
    return { picks: n, body_picks: mind.units.filter(u => u.tier !== 'micro').length, back_to_back: back, triple_repeats: triRep, max_share: n ? top[0][1] / n : 0, distinct: top.length, mood_match: n ? match / n : 1, holds_instead: mind.holds, top: top.slice(0, 3) }; };
  return mind;
}

/** the longest run of consecutive ids that appears twice in a sequence (non-overlapping). O(n^2), fine for a few hundred. */
export function longestRepeatedRun(seq) { const n = seq.length; let best = 0, at = [-1, -1]; const L = new Uint16Array((n + 1) * (n + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = n - 1; j > i; j--) if (seq[i] === seq[j]) { const v = Math.min(L[(i + 1) * (n + 1) + j + 1] + 1, j - i); L[i * (n + 1) + j] = v; if (v > best) { best = v; at = [i, j]; } }
  return { length: best, first_at: at[0], again_at: at[1], run: best ? seq.slice(at[0], at[0] + best) : [] }; }
