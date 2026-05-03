#!/usr/bin/env python3
"""Fix broken footer privacy link insertion."""
import os, glob, re

PATTERN = re.compile(
    r'<a href="https://www\.linkedin\.com/in/francescogizzi/" target="_blank" rel="noopener" '
    r'<a href="([^"]+)" class="footer-privacy">([^<]+)</a>\s*\n\s*class="footer-linkedin">'
)

def fix(fpath):
    with open(fpath, 'r', encoding='utf-8') as f:
        c = f.read()

    if not PATTERN.search(c):
        return False

    def repl(m):
        priv_href = m.group(1)
        priv_label = m.group(2)
        return (
            '<div style="display:flex;align-items:center;gap:20px">\n'
            '    <a href="' + priv_href + '" class="footer-privacy">' + priv_label + '</a>\n'
            '    <a href="https://www.linkedin.com/in/francescogizzi/" target="_blank" rel="noopener" class="footer-linkedin">'
        )

    c2 = PATTERN.sub(repl, c)

    # Add closing </div> before </div></footer>
    c2 = c2.replace(
        'LinkedIn\n  </a>\n</div></footer>',
        'LinkedIn\n    </a>\n  </div>\n</div></footer>'
    )
    # Alternative single-line footer closing
    c2 = c2.replace(
        'LinkedIn\n    </a>\n</div></footer>',
        'LinkedIn\n    </a>\n  </div>\n</div></footer>'
    )

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(c2)
    return True

changed = 0
for fpath in (
    glob.glob('/home/user/9/*.html') +
    glob.glob('/home/user/9/en/*.html') +
    glob.glob('/home/user/9/pt/*.html')
):
    if fix(fpath):
        changed += 1
        print('Fixed:', fpath)

print(f'\nDone: {changed} fixed')
