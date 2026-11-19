# Critique + audit · v37 → v38

Method: screenshots at 390×844 (light and dark, demo data and an empty app), automated contrast checks on all 5 palettes × light/dark, tap-target and accessible-name checks, code reading. Identity unchanged: same tokens, same Manrope, same components.

## Critique (design)
| # | Problem (v37) | Severity | Fix in v38 |
|---|---|---|---|
| 1 | The no-key AI banner (4 lines) sat **above the ring** every day and pushed the first viewport down | high | Compact one-line hint **under** the quick bar, with "Configura" and × (remembers dismissal) |
| 2 | Nothing helped a new user set things up: the app started on 2000 kcal with default age, height and sex | high | "Benvenuto" card with 4 steps (profile, first weigh-in, AI key, first meal), progress bar, "Più tardi"; hidden for anyone who already has data |
| 3 | Meal chips cut off at the edge with no cue; the selected chip ("Spuntini") could sit off-screen | medium | Fade on the right edge + the selected chip is scrolled into view (quick bar and Add) |
| 4 | Add: Galleria/Codice a barre were white on a white panel, so their edges disappeared | medium | `--bg` background + hairline border inside the panel; drawn "+" icons instead of a "+" text glyph |
| 5 | Body: units stuck to the labels ("Peso kg · obiettivo 76") | low | Unit next to the value (`80,6 kg`), clean labels |
| 6 | Signs were mixed: "-2 kg" (hyphen) next to "−20.559 kcal" (minus) | low | `signed()` uses a real minus sign everywhere |
| 7 | "1 alimenti", "1 giorni registrati" | low | `plural()` helper |
| 8 | Panoramica showed a green "0 kcal" as if it were a result on an empty month | low | Neutral tile "registra i pasti per vederlo" |
| 9 | "Metabolismo basale" wrapped onto 2 lines in the segmented control | low | "Solo basale" (the text below explains it) |
| 10 | "Leggi resoconto" reminder shown even without an AI key (led to an error) | low | Only shown with a key or when a report already exists |

## Audit (accessibility, robustness)
- **Contrast** (4.5:1 for text, 3:1 for graphics) — before: oceano accent/soft 4.42, oliva muted/bg 4.20, artico kcal bar 2.90, white symbol on amber calendar dot 2.95. After: all pass (soft and muted tokens adjusted, symbol on amber dot made dark).
- **Panels**: `role=dialog`, `aria-modal`, title linked by `aria-labelledby`; focus moves in on open and back to the button that opened it; **Esc** closes the panel and the celebration.
- **Toast**: `role=status` + `aria-live=polite` (confirmations get read out).
- **Bottom bar**: `aria-current="page"` on the active tab, decorative SVGs `aria-hidden`.
- **Tap targets**: water 26×32 → 32×40 with `aria-pressed` and ml in the label; small buttons ≥ 38 px; date button 40 px.
- **Body history**: rows reachable by keyboard (Enter/Space).
- **Charts**: `role=img` with a text summary; labels 10 → 11 px.
- **Validation**: weight/body measurements and goals outside plausible ranges are refused with a message, `aria-invalid` and focus on the field (avoids "800 kg" from a typo).
- **Backup import**: checks the structure (entries = object of arrays, body = array), shows what it will import, handles full storage.
- **Service worker**: caches only `ok` responses (a 404/500 no longer overwrites the good copy); a non-page request offline no longer gets index.html back; when a new version arrives the app offers "Aggiorna".
- **Reduced motion**: a global rule disables any leftover animation (panel, celebration, bounce).

## Motion
Fade-up 220 ms when switching tabs too (same as the sections), check-mark "pop" on completed onboarding steps, progress bar filling up. All turned off with `prefers-reduced-motion`.

## Verdict
Shippable. Open for later: the profile form still uses native selects whose long text gets cut off; we could move it to sheets with options.
