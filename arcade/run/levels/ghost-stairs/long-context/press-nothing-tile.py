# press nothing tile: a grey slab with one long space bar on it, never pressed, the purple glow still waiting round its edge. Playtester, Downstairs Neighbours
from PIL import Image
C = {'#': (18,10,5,255), 's': (84,84,92,255), 'S': (58,58,66,255), 't': (34,34,40,255), 'k': (120,120,130,255), 'K': (150,150,160,255), 'd': (64,64,72,255), 'p': (123,60,242,255)}
im = Image.new('RGBA', (32, 32), (0,0,0,0))
def box(x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1): im.putpixel((x, y), C[c])
box(4, 4, 27, 4, '#'); box(3, 5, 28, 26, '#'); box(4, 5, 27, 26, 's'); box(5, 6, 26, 25, 'S')   # the slab
box(2, 27, 29, 29, '#'); box(3, 28, 28, 28, 't')                                                # its foot
box(6, 14, 25, 23, 'p'); box(7, 15, 24, 22, '#'); box(8, 16, 23, 20, 'k'); box(9, 17, 22, 19, 'K'); box(8, 21, 23, 21, 'd')   # the bar, the glow round it
for c in [(6, 14), (25, 14), (6, 23), (25, 23)]: im.putpixel(c, C['S'])
im.save('press-nothing-tile-32.png'); im.resize((384, 384), Image.NEAREST).save('press-nothing-tile-x12.png')
