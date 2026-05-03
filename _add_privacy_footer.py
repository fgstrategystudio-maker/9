#!/usr/bin/env python3
"""Add privacy link to footer on all pages and update cookie banner."""
import os, glob

def process(fpath, privacy_href, privacy_label):
    with open(fpath, 'r', encoding='utf-8') as f:
        c = f.read()

    if 'footer-privacy' in c:
        return False  # already done

    old = 'class="footer-linkedin">'
    new = (
        '<a href="' + privacy_href + '" class="footer-privacy">' + privacy_label + '</a>\n    '
        + old
    )
    if old not in c:
        return False

    c = c.replace(old, new, 1)
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(c)
    return True

changed = 0
skip_names = {'privacy.html', 'preview-concept-a.html', 'preview-concept-b.html', 'preview-concept-c.html', 'google643280b504548f64.html'}

# IT root
for fpath in glob.glob('/home/user/9/*.html'):
    if os.path.basename(fpath) in skip_names:
        continue
    if process(fpath, '/privacy', 'Privacy'):
        changed += 1
        print('IT:', fpath)

# EN
for fpath in glob.glob('/home/user/9/en/*.html'):
    if os.path.basename(fpath) in skip_names:
        continue
    if process(fpath, '/en/privacy', 'Privacy'):
        changed += 1
        print('EN:', fpath)

# PT
for fpath in glob.glob('/home/user/9/pt/*.html'):
    if os.path.basename(fpath) in skip_names:
        continue
    if process(fpath, '/pt/privacy', 'Privacidade'):
        changed += 1
        print('PT:', fpath)

print(f'\nDone: {changed} files updated')
