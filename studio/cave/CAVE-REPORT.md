# The Potato Cave — report (crew: Couch Crumbs, Nov 7)

Built by Family Size (Builder), reviewed and fixed by the Reviewer. Nothing is committed or pushed. The live site hasn't been touched.

## What it is
A little cinema dug into the soil under the first kitchen (Thursday Potato). It has a burgundy couch, a cable-spool table with a family-size bag of chips on it, a big screen, and a VCR whose clock blinks 4:04. A cabinet below holds his tapes, each with a poster. There are warm bulbs and roots, and "404" is scratched into the dirt. There are no signs. Potato is his real game model. He watches whatever you play, reacts when the picture jumps, and gets sleepy when nothing is on.

**The chips gag.** It starts when you tap the bag or press E. It also runs once on its own, 16 s into a tape.
- He leans toward the bag slowly with a smirk, then a sneaky smile.
- He snaps to look right at you and holds the stare.
- He raises his brows and drops them, once. This is a real brow lift on his sneaky face now, not a face swap.
- Another beat, then he hops onto the spool and takes three crunching bites out of the top and side of the bag, with crumbs flying.
- The rest of the bag spins into his mouth. He gulps and wobbles, and a purple glitch-word burp comes out.
- He hops back to the couch, content. About 9 s later a new bag drops from the ceiling.

## How to get in
In the first kitchen, a trapdoor sits in the floor just left of the table. Coloured light flickers through its cracks, as if a screen is on down there. Every 5.5 s the lid bumps up a little and light spills out. Walk to it and tap it, or press E. He steps on, crouches and drops through.
- **Way back up:** tap the ladder, or press Esc or ↑.
- **Tapes:** tap one, or use ← →.
- **Pause:** tap the screen, or press Space.

## How to add a video
1. Make a web copy, around 720p H.264 with faststart and under ~25 MB, plus a poster JPG. Put both in `studio/cave/videos/`. The Builder's encode settings are in `scratchpad/cavejob/encode.sh`.
2. Add a line to `studio/cave/playlist.json`:
   `{ "title": "Name", "file": "cave/videos/name.mp4", "poster": "cave/videos/name.jpg" }`
3. That's all. The cabinet holds 8 tapes in two rows of 4. If you add more, phones stack them in 2 columns. On desktop they get smaller in the same grid. Past about 12 tapes the desktop cabinet will feel cramped.

## What the Reviewer changed
- **Brow waggle (`cave.mjs`, new `cave/face-sneaky-brows1.png` and `brows2.png`):** two copies of Vega/Chat's sneaky face with the brows lifted 22 and 46 px, cut straight from the original strokes. No new drawing.
- **One-line hook (`kitchen/face.mjs`):** `addFace(name, img)` lets a room bring extra faces. It's marked CAVE and doesn't change anything else.
- **Gag timing:** the stare is held before and after the waggle, and everything after it runs 0.6 s later.
- **Bites:** they used to come out of the side of the bag that he stands in front of, so you couldn't see them. They now come out of the top and the visible side, and the crumbs fly from the bite.
- **Phones:**
  - Portrait: the room sits at the top and the tapes are 2 big columns under it with readable labels. The page scrolls if it's short.
  - Landscape: the tapes sit in a column beside the room.
  - Labels no longer break mid-word ("confidentl / y").
- **Sound button:** the room's sound button comes down into the cave with him and goes back when he leaves. Before this, the cave covered it, so you couldn't mute.
- **Trapdoor bump (`kitchen/kitchens.mjs`, inside the cave block):** so a first-timer notices that something's down there.

## Checked
A playthrough as a first-timer on desktop (1280×760), phone portrait (390×844) and phone landscape (844×390). I opened the trapdoor by clicking it, played a tape, ran every beat of the gag in slow motion, climbed back up by the ladder, then moved to the next room (Get Down), which was fine. There were no console errors.
- Stills: `scratchpad/cave-stills/r*.png`
- Test script: `scratchpad/cavereview/review.py PORT`

## What's left
- **Burp and glitch tear:** both still go by fast. Judge them live.
- **Gag on a real phone:** the timing and the iOS edge cases weren't tried on a device. These are tapes auto-advancing and mute inside the cave.
- **Trapdoor bump:** checked in code only. Stills couldn't catch it reliably against the flicker.
- **Kitchen faces leaking into the cave:** for example the pot boiling over. Still untested. Nothing showed up in this pass.
- **Seeking:** Python's test server can't seek. The live host should be fine.
- **Posters:** they're frames grabbed 20–40 s in. Better poster frames could be picked by hand.

## Open question for Chikin: where do the videos live?
The 8 web copies plus posters are **184 MB**. Committed to the site repo, the repo grows by that much, and by ~24 MB for every video added later. GitHub warns at 50 MB per file and gets slow with big binary history. Options:
- (a) Commit them as they are. This is the simplest, and each file is under the limit.
- (b) Put them on free storage, such as a Cloudflare R2 bucket next to the site (it's already on Cloudflare), and point `file` and `poster` in playlist.json at those URLs. Nothing else changes.
- (c) Use YouTube embeds. That's not recommended: they break the in-cave screen and the colour the screen throws on the room.

The Reviewer leans toward (b). Your call.
