#!/usr/bin/env python3
"""Add preconnect, dns-prefetch, manifest link, and theme-color to all HTML files."""
import os, re, glob

PRECONNECT = (
    '<link rel="preconnect" href="https://www.googletagmanager.com" crossorigin />\n'
    '  <link rel="dns-prefetch" href="https://www.google-analytics.com" />\n'
    '  <link rel="manifest" href="/manifest.json" />\n'
    '  <meta name="theme-color" content="#c9a96e" />'
)

TARGET = '<link rel="stylesheet" href="'

dirs = ['', 'en', 'pt']
changed = 0
skipped = 0

for d in dirs:
    pattern = os.path.join('/home/user/9', d, '*.html') if d else '/home/user/9/*.html'
    for fpath in glob.glob(pattern):
        fname = os.path.basename(fpath)
        if fname in ('preview-concept-a.html', 'preview-concept-b.html', 'preview-concept-c.html'):
            skipped += 1
            continue

        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Skip if already added
        if 'manifest.json' in content:
            skipped += 1
            continue

        # Find the stylesheet link and insert preconnect before it
        # Handle both href="style.css" and href="../style.css"
        if TARGET not in content:
            print(f'SKIP (no stylesheet link): {fpath}')
            skipped += 1
            continue

        new_content = content.replace(TARGET, PRECONNECT + '\n  ' + TARGET, 1)

        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        changed += 1
        print(f'OK: {fpath}')

print(f'\nDone: {changed} changed, {skipped} skipped')
