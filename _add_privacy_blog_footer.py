#!/usr/bin/env python3
"""Add privacy link to simplified footers on blog/service pages."""
import os, glob

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
        if 'footer-privacy' in c:
            continue
        # Simple footer pattern used on blog/service pages
        old = '<footer class="footer"><div class="container">Francesco Gizzi'
        if old not in c:
            continue
        new = ('<footer class="footer"><div class="container footer-inner">'
               '<span>Francesco Gizzi')
        c = c.replace(old, new, 1)
        # Close the span and add privacy link before </div></footer>
        # The text ends with "strategy." or similar followed by </div></footer>
        import re
        c = re.sub(
            r'(<span>Francesco Gizzi[^<]*?(?:strategy|estratégia)\.</span>)(</div></footer>)',
            r'\1<a href="' + priv_href + r'" class="footer-privacy">' + priv_label + r'</a>\2',
            c
        )
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(c)
        changed += 1
        print('OK:', fpath)

print(f'\nDone: {changed} files')
