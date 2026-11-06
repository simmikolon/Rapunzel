#!/usr/bin/env python3
"""Make the App Store icon from the web icon.

    python3 tools/app_icon.py

web/icons/icon-512.png is the pixel-art icon the game ships for the home
screen; the App Store wants 1024 x 1024 without an alpha channel. A 2x
nearest-neighbour upscale keeps the pixels crisp. Needs Pillow.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'web' / 'icons' / 'icon-512.png'
DST = ROOT / 'ios' / 'App' / 'Assets.xcassets' / 'AppIcon.appiconset' / 'icon-1024.png'

img = Image.open(SRC).convert('RGB').resize((1024, 1024), Image.NEAREST)
img.save(DST, optimize=True)
print(f'{DST.relative_to(ROOT)}: {img.size[0]} x {img.size[1]} {img.mode}')
