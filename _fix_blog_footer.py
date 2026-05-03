#!/usr/bin/env python3
"""Fix blog/service page footers: close span tag and add privacy link."""
import os, glob, re

DIRS = [
    ('/home/user/9', '/privacy', 'Privacy'),
    ('/home/user/9/en', '/en/privacy', 'Privacy'),
    ('/home/user/9/pt', '/pt/privacy', 'Privacidade'),
]

SKIP = {'privacy.html','grazie.html','index.html','404.html','institutional.html',
        'preview-concept-a.html','preview-concept-b.html','preview-concept-c.html',
        'google643280b504548f64.html'}

changed = 0
for directory, priv_href, priv_label in DIRS:
    for fpath in glob.glob(os.path.join(directory, '*.html')):
        name = os.path.basename(fpath)
        if name in SKIP:
            continue
        with open(fpath, 'r', encoding='utf-8') as f:
            c = f.read()

        # Fix: <span>...text...</div></footer> → <span>...text...</span><a>Privacy</a></div></footer>
        pattern = re.compile(
            r'(<span>Francesco Gizzi[^<]+?\.)(</div></footer>)'
        )
        if not pattern.search(c):
            continue

        new_footer = (r'\1</span>'
                      '<a href="' + priv_href + '" class="footer-privacy">' + priv_label + r'</a>'
                      r'\2')
        c2 = pattern.sub(new_footer, c)
        if c2 == c:
            continue

        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(c2)
        changed += 1

print(f'Fixed: {changed} files')
