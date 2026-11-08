// powers.mjs — what each downloaded costume lets him do (V = use). Mario rules: get hit and the costume glitches off.
// Glitch through walls is NOT here: that's plain Potato's base power (space), he always has it.
export const POWERS = {
  king: { name: 'King', outfit: 'royal-king', hint: 'V: decree — Spam bows and freezes', cooldown: 4,
    use(ctx, L, t) { const n = L.freezeInView(t, 8); L.ring.visible = true; L.ring.userData.t = t; ctx.flash(n ? 'by royal decree' : 'nobody to boss around'); } },
  disco: { name: 'Disco Legend', outfit: 'disco-legend', hint: 'jump in mid-air: a spin jump (once per bar)', airJump: true },
  detective: { name: 'Noir Detective', outfit: 'noir-detective', hint: 'V: fact check — shows which platforms are real', cooldown: 8,
    use(ctx, L, t) { L.L.reveal = t + 16 * L.BEAT; ctx.flash('fact check'); } },
  construction: { name: 'Construction Crew', outfit: 'construction-crew', hint: 'V: drop a girder bridge · hard hat stops falling fine print', cooldown: 4, hardhat: true,
    use(ctx, L, t) { L.addGirder(t); } },
  astronaut: { name: 'Orbital Astronaut', outfit: 'orbital-astronaut', hint: 'hold V: float (low gravity)', gravity: P => (P.hold ? 0.32 : 0.75), fallCap: 1.6 },
  ghost: { name: 'Sheet Ghost', outfit: 'sheet-ghost', hint: 'enemies pass through you · hold V: hover', ghost: true, fallCap: 0.7 },
  knight: { name: 'Castle Knight', outfit: 'castle-knight', hint: 'hold V: plant — nothing pushes you, one hit blocked', plant: true,
    shield(ctx, P, L, t, kind) { if (P.hold && !P.shieldUsed) { P.shieldUsed = true; P.inv = 0.8; ctx.flash('blocked'); return true; } return false; } },
  diver: { name: 'Deep-Sea Diver', outfit: 'deep-sea-diver', hint: 'V: lamp — lights the way ahead', cooldown: 8,
    use(ctx, L, t) { L.L.lampUntil = t + 8 * L.BEAT; ctx.flash('lamp on'); } },
  cyborg: { name: 'Circuit Cyborg', outfit: 'circuit-cyborg', hint: 'V: hijack the cursor', cooldown: 8,
    use(ctx, L, t) { L.L.overrideUntil = t + 8 * L.BEAT; ctx.flash('override'); } },
  chef: { name: 'Kitchen Chef', outfit: 'kitchen-chef', hint: 'hold V: glide (the toque puffs up like rising dough)', fallCap: 1.0 },
  // the finale: every power at once
  singularity: { name: 'The Last Light', outfit: 'royal-king', hint: 'everything at once', airJump: true, ghost: true, hardhat: true, fallCap: 1.2, cooldown: 2,
    use(ctx, L, t) { L.freezeInView(t, 8); L.L.reveal = t + 8 * L.BEAT; L.L.lampUntil = t + 8 * L.BEAT; L.L.overrideUntil = t + 8 * L.BEAT; L.ring.visible = true; L.ring.userData.t = t; } },
};
export const RANDOM_POOL = ['king', 'disco', 'detective', 'construction', 'astronaut', 'ghost', 'knight', 'diver', 'cyborg', 'chef'];
