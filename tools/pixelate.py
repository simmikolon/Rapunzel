#!/usr/bin/env python3
"""Bring an image onto the game's art grid.

    python3 tools/pixelate.py docs/art/title-source.png web/img/title.png --width 150 --colors 32

Trims transparent margins, scales the picture down so that one output pixel
is one art pixel (the game draws it at PX = 4 logical pixels per art pixel
with nearest-neighbour sampling), makes the alpha hard-edged and reduces the
colours to a small palette so it reads as pixel art next to the procedural
sprites. Needs Pillow (python3 -m pip install pillow).
"""
import argparse
from PIL import Image


def pixelate(src, width, colors, alpha_threshold, height=None):
    im = Image.open(src).convert('RGBA')
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    if height is None:
        height = max(1, round(im.height * width / im.width))
    # BOX averages the source pixels of each art pixel, which keeps the
    # picture's own blocky grid where it lines up and softens it where not.
    small = im.resize((width, height), Image.Resampling.BOX)
    rgb = small.convert('RGB')
    alpha = small.getchannel('A').point(lambda a: 255 if a >= alpha_threshold else 0)
    # quantize the colours only where the picture is opaque: transparent
    # pixels carry garbage colours that would waste palette entries
    opaque = Image.new('RGB', rgb.size, (0, 0, 0))
    opaque.paste(rgb, mask=alpha)
    pal = opaque.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    out = pal.copy()
    out.putalpha(alpha)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('src')
    ap.add_argument('dst')
    ap.add_argument('--width', type=int, default=140, help='output width in art pixels (default 140 = 560 logical px)')
    ap.add_argument('--height', type=int, default=None, help='output height in art pixels (default: keep the aspect ratio)')
    ap.add_argument('--colors', type=int, default=32, help='palette size (default 32)')
    ap.add_argument('--alpha', type=int, default=128, help='alpha threshold 0..255 (default 128)')
    ap.add_argument('--preview', default=None, help='also write a 4x nearest-neighbour preview on the game background to this path')
    a = ap.parse_args()
    out = pixelate(a.src, a.width, a.colors, a.alpha, a.height)
    out.save(a.dst, optimize=True)
    print(f'{a.dst}: {out.width} x {out.height} art px ({out.width * 4} x {out.height * 4} logical), {a.colors} colours')
    if a.preview:
        big = out.resize((out.width * 4, out.height * 4), Image.Resampling.NEAREST)
        bg = Image.new('RGBA', big.size, (30, 60, 63, 255))
        bg.alpha_composite(big)
        bg.save(a.preview)
        print(f'preview: {a.preview}')


if __name__ == '__main__':
    main()
