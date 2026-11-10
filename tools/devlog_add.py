#!/usr/bin/env python3
"""Add a devlog episode to the landing page (site/devlog/episodes.json).

    python3 tools/devlog_add.py <youtube-url-or-id> "Title" "One or two sentences."
    python3 tools/devlog_add.py <url> "Title" "Text" --date 2026-11-20
    python3 tools/devlog_add.py --channel https://www.youtube.com/@yourchannel

The video's picture is downloaded once, here, and saved as
site/devlog/thumbs/<id>.jpg, so visitors load nothing from YouTube until they
click a video (the privacy policy relies on that). The episode goes in
newest first; adding the same video again replaces its entry. Commit
episodes.json and the picture, push, and the landing page shows the newest
three, /devlog/ shows them all, the footer gets its Devlog link.
"""
import argparse
import datetime
import io
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site', 'devlog')
DATA = os.path.join(ROOT, 'episodes.json')
THUMBS = os.path.join(ROOT, 'thumbs')


def video_id(s):
    for pat in (r'(?:v=|youtu\.be/|/shorts/|/embed/|/live/)([A-Za-z0-9_-]{11})', r'^([A-Za-z0-9_-]{11})$'):
        m = re.search(pat, s.strip())
        if m:
            return m.group(1)
    sys.exit(f'no YouTube video id in {s!r}')


def fetch_thumb(vid):
    for name in ('maxresdefault.jpg', 'sddefault.jpg', 'hqdefault.jpg'):
        try:
            with urllib.request.urlopen(f'https://i.ytimg.com/vi/{vid}/{name}', timeout=20) as r:
                data = r.read()
            if len(data) > 2000:              # YouTube answers a missing size with a tiny grey image
                return data
        except Exception:
            continue
    sys.exit(f'could not download a picture for {vid}')


def save_thumb(vid, data):
    os.makedirs(THUMBS, exist_ok=True)
    path = os.path.join(THUMBS, f'{vid}.jpg')
    try:
        from PIL import Image
        im = Image.open(io.BytesIO(data)).convert('RGB')
        w, h = im.size                         # crop to 16:9 (sd/hq pictures have black bars)
        th = round(w * 9 / 16)
        if th < h:
            top = (h - th) // 2
            im = im.crop((0, top, w, top + th))
        im.resize((640, 360), Image.LANCZOS).save(path, 'JPEG', quality=82, optimize=True, progressive=True)
    except ImportError:
        with open(path, 'wb') as f:
            f.write(data)
    return path


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('video', nargs='?', help='YouTube URL or video id')
    ap.add_argument('title', nargs='?')
    ap.add_argument('text', nargs='?', default='')
    ap.add_argument('--date', default=datetime.date.today().isoformat(), help='YYYY-MM-DD (default: today)')
    ap.add_argument('--channel', help='the YouTube channel URL, shown with the episodes')
    a = ap.parse_args()

    with open(DATA, encoding='utf-8') as f:
        data = json.load(f)
    if a.channel:
        data['channel'] = a.channel
        print('channel:', a.channel)
    if a.video:
        if not a.title:
            ap.error('a title is needed with the video')
        datetime.date.fromisoformat(a.date)
        vid = video_id(a.video)
        print('picture:', os.path.relpath(save_thumb(vid, fetch_thumb(vid))))
        eps = [e for e in data.get('episodes', []) if e.get('id') != vid]
        eps.append({'id': vid, 'date': a.date, 'title': a.title, 'text': a.text})
        data['episodes'] = sorted(eps, key=lambda e: e.get('date', ''), reverse=True)
        print(f'episode: {a.date} {a.title} ({len(data["episodes"])} in all)')
    elif not a.channel:
        ap.error('give a video, or --channel')
    with open(DATA, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')


if __name__ == '__main__':
    main()
