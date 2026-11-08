#!/usr/bin/env python3
# stepscheck.py: reads SCRIPT.md, lays each step's thread out with the numbers in STEPS.md, and checks the times.
# Prints the stair table + flags, writes steps-table.json and stairs-blueprint.png. Run from anywhere. Level designer, Downstairs Neighbours.
import re, json, os, sys
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
GAME = os.path.abspath(os.path.join(ROOT, '..', '..', '..'))
# world units. View 32 x 18. One phone 7 x 15, one step along 9. Floor = top of the input bar, 9.9 under the phone's top (dim keyboard below it).
VW, VH, PW, PH, DX = 32.0, 18.0, 7.0, 15.0, 9.0
HEAD, FLOOR, GUTTER = 1.5, 9.9, 1.5    # phone top -> thread top | phone top -> floor | the clear strip he stands in, under the newest text
CH, ROW1, ROWL, GAP, NAME, PHOTO, GREY, EMOJI = 20, 1.0, 0.66, 0.14, 0.3, 2.0, 0.5, 1.0
GRAV, FALLMAX = 46.0, 20.0
#        step: (drop into next step, along to next step)
DY = {'S1':4.5,'S2':4.5,'S3':4.5,'S4':6.0,'S5':4.5,'S6':4.5,'S7':3.0,'S8':4.5,'S9':4.5,'S10':6.0,'S11':4.5,'S12':4.5,'S13':22.5}
AL = {'S13':18.0}
LAND = {'S1':9.36,'S2':18.48,'S3':26.36,'S4':34.88,'S5':43.2,'S6':53.3,'S7':60.48,'S8':70.16,'S9':80.3,'S10':89.7,'S11':92.6,'S12':99.31,'S13':108.68,'S14':117.72}
RIDE = {'S4':1.0, 'S13':1.26}   # steps that leave on a set piece, not a plain drop (seconds in the air)
txt = open(os.path.join(ROOT, 'SCRIPT.md'), encoding='utf8').read()
secs = re.split(r'^### (S\d+) · ', txt, flags=re.M)
steps = {}
for i in range(1, len(secs), 2):
    sid, body = secs[i], secs[i+1]
    m = re.match(r"(.+?) · (\d+\.\d)-(\d+\.\d)", body)
    rows = []
    for l in body.split('\n'):
        c = [x.strip() for x in l.strip().strip('|').split('|')]
        if len(c) >= 3 and re.match(r'^\d+\.\d+$', c[0]):
            who, text = c[1], c[2]; rew = c[3] if len(c) > 4 else ''
            g = re.search(r'GLOW, (\d+\.\d+)', l)
            rows.append(dict(t=float(c[0]), who=who, text=text, rew=rew.replace('*',''), glow=float(g.group(1)) if g else None, kev='**K.' in l))
    steps[sid] = dict(id=sid, phone=m.group(1) if m else '', t0=float(m.group(2)) if m else 0, t1=float(m.group(3)) if m else 0, rows=rows)
ord_ = sorted(steps, key=lambda s: int(s[1:]))
def lines(s):
    n, c = 1, 0
    for w in s.split():
        if c and c + 1 + len(w) > CH: n += 1; c = len(w)
        else: c += (1 if c else 0) + len(w)
    return n
def rowh(r, prev):
    t = r['text']
    if not r['who'] or r['who'] == 'notification' or '❤' in t: return 0
    if 'photo' in t: h = PHOTO
    elif 'three dots' in t: h = ROW1
    elif re.fullmatch(r'[^\w]+', t.replace(' ', '')): h = EMOJI
    else:
        n = max(lines(t), lines(r['rew'].split('/')[0]) + (1 if '/' in r['rew'] else 0))
        h = ROW1 + (n - 1) * ROWL
    if prev != r['who'] and r['who'] not in ('James', 'Sheila'): h += NAME
    return h + GAP
BAND = FLOOR - GUTTER - HEAD
out, top, x, flags = [], 0.0, 1.0, []
for sid in ord_[1:]:
    S = steps[sid]; prev = None; stack = 0
    for r in S['rows']: stack += rowh(r, prev); prev = r['who'] or prev
    S.update(stack=round(stack, 2), top=round(top, 2), x=round(x, 1), land=LAND[sid], floor=round(top - FLOOR, 2))
    dy = DY.get(sid)
    if dy:
        ft = RIDE.get(sid) or (2 * dy / GRAV) ** .5
        S.update(dy=dy, fall=round(ft, 2), leave=round(LAND[f'S{int(sid[1:])+1}'] - ft, 2))
        top -= dy; x += AL.get(sid, DX)
    out.append(S)
print('step  phone            land   first  stack scrolls  floor  drop  air  leaves')
for S in out:
    fr = [r for r in S['rows'] if r['who']]
    f = (fr[0]['t'] - S['land']) if fr else 0
    print(f"{S['id']:4} {S['phone'][:16]:16} {S['land']:6.2f} {f:5.2f} {S['stack']:6.2f} {'yes' if S['stack'] > BAND else '':5} {S['floor']:7.1f} {S.get('dy',0):5.1f} {S.get('fall',0):5.2f} {S.get('leave',0):7.2f}")
print('total down', -out[-1]['floor'], 'total along', out[-1]['x'] - 1, 'thread band', BAND)
for S in out:
    rows = S['rows']; lv = S.get('leave')
    for r in rows:
        if r['glow']: print(f"glow {S['id']:4} lands {r['t']:6.2f} locks {r['glow']:6.2f} window {r['glow']-r['t']:.2f}  {r['text'][:30]}")
        if lv and r['t'] > lv and S['id'] != 'S13': flags.append(f"{S['id']}: {r['t']} {r['text'][:24]!r} lands after he leaves ({lv})")
        if lv and r['glow'] and r['glow'] > lv: flags.append(f"{S['id']}: glow {r['glow']} ends after he leaves ({lv})")
    n = steps.get(f"S{int(S['id'][1:])+1}")
    if n:
        fr = [r for r in n['rows'] if r['who']]
        if fr and fr[0]['t'] - LAND[n['id']] < 0.6: flags.append(f"{n['id']}: first text {fr[0]['t'] - LAND[n['id']]:.2f} s after he lands")
print('FLAGS'); [print(' ', f) for f in flags] or print('  none')
json.dump([{k: S.get(k) for k in ('id','phone','land','leave','dy','fall','top','x','floor','stack')} for S in out], open(os.path.join(HERE,'steps-table.json'),'w'), indent=1)
# the blueprint: phones to scale, the camera's view while he's on S3, his line, stairs
Z = 12
W = int((out[-1]['x'] + PW + 2) * Z); H = int((-out[-1]['top'] + PH + 3) * Z)
im = Image.new('RGB', (W, H), (14, 12, 26)); d = ImageDraw.Draw(im)
def P(x, y): return (x * Z, (1.5 - y) * Z)
pts = []
for S in out:
    x0, y0 = S['x'], S['top']
    d.rectangle([P(x0, y0), P(x0 + PW, y0 - PH)], outline=(120, 110, 160), width=2, fill=(26, 24, 42))
    d.rectangle([P(x0, y0 - FLOOR), P(x0 + PW, y0 - PH)], fill=(18, 16, 30))
    d.rectangle([P(x0 + .4, y0 - HEAD), P(x0 + PW - .4, y0 - FLOOR + GUTTER)], fill=(52, 50, 80))
    d.text(P(x0 + .3, y0 - .35), S['id'], fill=(201, 167, 255))
    pts += [P(x0 + 1.2, y0 - FLOOR), P(x0 + PW + .3, y0 - FLOOR)]
a, b = out[-2], out[-1]
for i in range(1, 5):      # the four dark phones of the last fall
    k = i / 5; x0, y0 = a['x'] + (b['x'] - a['x']) * k, a['top'] + (b['top'] - a['top']) * k
    d.rectangle([P(x0, y0), P(x0 + PW, y0 - PH)], outline=(50, 46, 70), width=2, fill=(10, 9, 18))
d.line(pts, fill=(154, 82, 255), width=4)
s3 = out[2]; vx, vy = s3['x'] - 6, s3['top'] + 1
d.rectangle([P(vx, vy), P(vx + VW, vy - VH)], outline=(255, 226, 160), width=3)
im.save(os.path.join(HERE, 'stairs-blueprint.png'))
print('png', im.size)
