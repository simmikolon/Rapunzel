import sys, json
from PIL import Image
# Put the pictures treasury_room.mjs took into one, floor to ceiling: python3 stitch.py <dir> <name> '<the list of camera heights it printed>'
d, out, ats = sys.argv[1], sys.argv[2], json.loads(sys.argv[3])
f = 432 / 768
ims = [Image.open(f'{d}/{out}_{i}.png') for i in range(len(ats))]
lo = ats[0]; top = ats[-1] + 1364
H = round((top - lo) * f)
img = Image.new('RGB', (432, H), (0, 0, 0))
# lower shots first, each higher one over it (so every HUD but the top one is covered)
for im, at in zip(ims, ats):
    y = H - round((at - lo) * f) - 768
    img.paste(im, (0, y))
img.save(f'{d}/{out}_full.png'); print(img.size)
