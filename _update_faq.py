#!/usr/bin/env python3
"""
Convert blog FAQ sections to H3 headings + add FAQPage JSON-LD schema.
Three source patterns:
  TYPE_A – <p><strong>Q?</strong> Answer.</p>          (Q+A same tag, possibly multiple strongs)
  TYPE_B – <p><strong>Q?</strong></p> + <p>Answer</p>  (separate tags)
  TYPE_C – <h3>Q?</h3> + <p>Answer</p>                 (already correct, only add schema)
"""

import re, json, os, glob

IT_FILES = sorted(glob.glob("/home/user/9/en/blog-*.html"))
IT_FILES = [f for f in IT_FILES if os.path.basename(f) != "blog.html"]


def strip_tags(s):
    return re.sub(r"<[^>]+>", "", s).strip()


def extract_faq_pairs(html_after_h2_faq):
    """
    Parse the raw HTML block after <h2>FAQ</h2>.
    Returns list of (question_text, answer_text).
    """
    # Keep only content before closing </div></main>
    content = re.sub(r"\s*</div>\s*</main>.*", "", html_after_h2_faq, flags=re.DOTALL).strip()

    # Collect all block elements (h3 or p) as (tag, inner_html)
    elements = re.findall(r"<(h3|p)(?:[^>]*)>(.*?)</\1>", content, re.DOTALL)

    pairs = []
    i = 0
    while i < len(elements):
        tag, inner = elements[i]
        inner = inner.strip()

        # ── TYPE_C: already an H3 ─────────────────────────────────────────
        if tag == "h3":
            q = strip_tags(inner)
            if i + 1 < len(elements) and elements[i + 1][0] == "p":
                a = strip_tags(elements[i + 1][1])
                if "<a href" not in elements[i + 1][1]:  # skip link-only paras
                    pairs.append((q, a))
                    i += 2
                    continue
            i += 1
            continue

        if tag == "p":
            # ── TYPE_B: <p> contains only <strong> tag(s) with a question ──
            # Strip <strong> tags; what's left should be empty → only question
            without_strong = re.sub(r"<strong>[^<]*</strong>", "", inner).strip()
            has_question = "?" in strip_tags(inner)
            only_strongs = re.match(r"^(?:<strong>[^<]*</strong>\s*)+$", inner)

            if only_strongs and has_question:
                q = strip_tags(inner)
                # Look for answer in next p (skip whitespace-only and link-only)
                j = i + 1
                while j < len(elements) and elements[j][0] == "p":
                    next_inner = elements[j][1].strip()
                    next_text = strip_tags(next_inner)
                    next_only_strongs = re.match(r"^(?:<strong>[^<]*</strong>\s*)+$", next_inner)
                    if next_only_strongs and "?" in next_text:
                        break  # next question reached
                    if "<a href" in next_inner and not re.search(r"<strong>.*\?.*</strong>", next_inner):
                        j += 1
                        break  # trailing link paragraph
                    if next_text:
                        pairs.append((q, next_text))
                        j += 1
                        break
                    j += 1
                i = j
                continue

            # ── TYPE_A: <p> starts with <strong>(s) then has answer text ──
            # Match leading consecutive <strong> blocks (no inner tags)
            m = re.match(r"^((?:<strong>[^<]*</strong>)+)(.*?)$", inner, re.DOTALL)
            if m:
                q_html = m.group(1)
                a_raw = m.group(2).strip()
                q = strip_tags(q_html)
                a = strip_tags(a_raw)
                if "?" in q and a:
                    pairs.append((q, a))
                    i += 1
                    continue

        i += 1

    return pairs


def build_faq_html(pairs):
    lines = []
    for q, a in pairs:
        lines.append(f"<h3>{q}</h3>")
        lines.append(f"<p>{a}</p>")
    return "\n".join(lines)


def build_faq_schema(pairs):
    entities = [
        {
            "@type": "Question",
            "name": q,
            "acceptedAnswer": {"@type": "Answer", "text": a},
        }
        for q, a in pairs
    ]
    return json.dumps(
        {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": entities},
        ensure_ascii=False,
        indent=2,
    )


def process_file(path):
    with open(path, "r", encoding="utf-8") as f:
        html = f.read()

    faq_marker = "<h2>FAQ</h2>"
    faq_start = html.find(faq_marker)
    if faq_start == -1:
        print(f"SKIP (no FAQ): {os.path.basename(path)}")
        return

    content_start = faq_start + len(faq_marker)
    main_end = html.find("</main>", content_start)
    div_before_main = html.rfind("</div>", content_start, main_end)

    faq_raw = html[content_start:div_before_main]

    pairs = extract_faq_pairs(faq_raw)
    if not pairs:
        print(f"WARN (no pairs): {os.path.basename(path)}")
        return

    # Build the new FAQ block (H3+P)
    new_faq = "\n" + build_faq_html(pairs) + "\n"

    # Preserve trailing "leggi anche" link paragraph if present
    link_para = re.search(
        r"(<p>[^<]*<a href=\"[^\"]*\">[^<]*</a>[^<]*</p>)\s*$", faq_raw.strip()
    )
    if link_para:
        new_faq += link_para.group(1) + "\n"

    # Replace FAQ content
    new_html = html[:content_start] + new_faq + html[div_before_main:]

    # Add FAQPage JSON-LD (only if not already present)
    if '"FAQPage"' not in new_html:
        schema_block = f'\n<script type="application/ld+json">\n{build_faq_schema(pairs)}\n</script>'
        last_script_end = new_html.rfind("</script>")
        new_html = new_html[:last_script_end + 9] + schema_block + new_html[last_script_end + 9:]

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_html)

    print(f"OK ({len(pairs)} FAQ): {os.path.basename(path)}")


for p in IT_FILES:
    process_file(p)

print("Done.")
