# DESIGN.md · Dieta (incumbent world, documented after v36)

Mode: Operate. Standard mobile health-tracker shell, played straight; distinction lives in precision, not ornament.

## Tokens (style.css :root, per palette × light/dark)
- Ground `--bg`, surface `--card`, text `--text`, secondary `--muted`, hairline `--line`.
- One accent per palette `--accent` / `--accent-soft` / `--on-accent`. Palettes: salvia (default), oceano, artico, oliva, grafite; schemes light, dark, auto.
- Macro roles: `--kcal`, `--prot`, `--carb`, `--fat`, `--fib`, `--water`. State: `--ok` (fills), `--ok-text` / `--warn-text` (text), `--warn`, `--danger`.
- Radius 16 (cards), 12 (buttons, inputs), 99 (chips). Shadow `--shadow` (none in dark).

## Type
Manrope variable 200–800, self-hosted. Title 24/800, card heading 17/700, body 16, secondary 13. Numbers tabular.

## Components
- Card: the only container. No nested cards.
- Sub-navigation `.subnav` (sticky under the topbar) splits a tab into sections; one section visible.
- Segmented `.seg` for exclusive settings; small pills `.range-seg` for a period filter.
- Buttons: `.btn` primary, `.btn.secondary`, `.btn.ghost`, `.btn.danger`; `.icon-act` 40px round; `.edit-meal` pill for secondary row actions.
- Icons: stroke SVG (`ico()`), 2px, round caps; emoji only as food/meal content.
- Sheets (`openSheet`) for focused edits; toasts for confirmation.

- Onboarding `.onboard` (first run only, 4 steps, dismissible); AI hint `.ai-hint` one line under the quick bar, dismissible.
- Horizontal chip rows fade at the right edge; the selected chip is always scrolled into view.
- Sheets are dialogs: labelled by their h3, focus in/out, Esc closes. Toast is a live region.
- Forms refuse implausible values with `aria-invalid` + toast + focus.
- Signs use the true minus (−); counts use `plural()`.

## Motion
150–250 ms state transitions; section switch fade-up 220 ms; celebration (confetti) only for achievements. All respect prefers-reduced-motion.
