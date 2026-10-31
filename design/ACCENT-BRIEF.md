# Accent brief: one unexpected colour (2026-10-31)

Owner's ask: apply the idea from a design reel ("the secret to a memorable UI: one accent colour
that catches you off guard") to ive.dev and turn it into a UI redesign, colours first. The owner
added: "I also think pink is a cool accent colour in general." No push without the owner's word.
An independent colour and contrast concept (Codex, read-only) is in
`/tmp/ive-dev-codex-color-concept-20261031.md`; its numbers are folded in below.

## The principle

A calm two-colour base plus ONE unexpected accent, used in very few places so it stays a surprise.
The base stays what it is: graphite surfaces (`--bg` family), the petrol/mint `--accent` family
for small typographic accents, and the petrol trust ground. The new colour is the "pop".

Story for IVE: the pop is the colour of the cursor at the moment it matters. The block cursors
of the prologue run together and turn pop as they type "Meet IVE"; the wordmark's dot is that
cursor; the one filled button is that colour; a soft light of it sits behind the hero.

## Tokens (site.css, next to the existing tokens)

Comparison phase: three hues and two extents, selected with attributes on `<html>` that only the
render script sets (`data-pop="pink|rose|tangerine"`, `data-pop-extent="join|replace"`; no
attribute = pink + join). There is NO switch in the site itself (the inline head scripts are
hashed in every page's CSP; do not touch them). After the owner decides, the losing hues and the
attribute rules are removed and the winner becomes the plain tokens.

| token | role | pink | rose | tangerine |
|---|---|---|---|---|
| `--pop` | the fill: buttons, dot, cursor, glow base (same in both themes) | `#FF4F9B` | `#F28BB2` | `#FF8A3D` |
| `--pop-ink` | text on the fill (dark in both themes; white fails on all three) | `#17191C` (5.74:1) | `#17191C` (7.64:1) | `#17191C` (7.51:1) |
| `--pop-text-dark` | the pop as text or line on dark grounds (`#0E1014`, `#15181D`, petrol `#1D3835`) | `#FF6FB0` | `#F28BB2` | `#FF9A5C` |
| `--pop-text-light` | the pop as text or line on light grounds (`#F6F7F8`, `#EEF0F2`) | `#9E255C` (6.81:1) | `#A12B5A` (6.51:1) | `#9C450B` (5.99:1) |
| `--pop-text` | per theme: dark → `--pop-text-dark`, light → `--pop-text-light` | | | |
| `--pop-glow` | the hero light, peak alpha: dark `.24`, light `.12` of `--pop` (the first build used .14/.07 and the light was all but invisible; the peak sits behind the opaque frame, the visible spill around it is far lower) | | | |
| `--pop-hover` | filled button hover: dark `color-mix(in srgb, var(--pop) 86%, white)`, light `color-mix(in srgb, var(--pop) 90%, black)` | | | |

Verify every contrast with the WCAG formula and write the numbers into your report. Adjust a value
if it misses 4.5:1 (text) or 3:1 (focus ring against its background), and say so. The bright fill
is never used as small text on light grounds (pink on `#F6F7F8` is 2.86:1).

Extent `join` (the restrained version): the pop appears ONLY at the places listed under "Where".
Everything that is mint today stays mint.
Extent `replace`: additionally `--accent` is remapped to `var(--pop-text)` (both themes), which
moves the kickers, link hover, focus ring, selected-tab bar, selection, the architecture diagram
lines, the "soon" chip and the FAQ links onto the pop. The petrol trust ground `.ws-ownership`
then uses `--pop-text-dark` as its local `--accent` (its pale mint `#C2E1D8` in `join`); the
bright fill on petrol is only 4.10:1 and must not be used for text there. The header block in
name-intro.css (`html.name-intro-active .site-header`, lines 91–108) pins `--accent: #8EC6BC`;
in `replace` it needs the same remap (keep the header dark there in both themes as today).

## Where the pop goes (extent join)

1. The wordmark dot: `.wordmark-dot` (site.css ~411), `.try-brand .wordmark-dot` (demo.css 169),
   the 404 page's own `.wordmark-dot` (404.html ~218; its CSS is inline and hashed in its CSP:
   define `--pop` in its own `:root`, recompute the sha256 of the changed `<style>` content and
   update the CSP meta, then load 404.html headless and confirm there is no CSP error),
   `assets/og.html` `.mark i` (line 14). The footer dot inherits.
2. The filled button `.btn-fill` (site.css ~324): background `var(--pop)`, colour `var(--pop-ink)`,
   hover `var(--pop-hover)`. It must no longer depend on `--accent-fill`/`--on-accent` (the
   name-intro.css header block overrides those). Outline and quiet buttons stay neutral.
   Header CTA rule: one coloured call to action per view. The header's `.nav-cta` is pop on every
   page EXCEPT while the hero's own buttons are still ahead of or inside the viewport on the
   homepage (the prologue and the hero should be the first pop moments, not the nav button).
   Implementation: workspace.js adds `hero-cta-ahead` to `<html>` when `.ws-actions` exists and
   its bottom edge is below the viewport's top (IntersectionObserver or a scroll check, cheap),
   removes it once the hero actions have scrolled above the viewport, adds it again when scrolling
   back. CSS: `html.hero-cta-ahead .nav-cta { background: var(--accent-fill); color: var(--on-accent); }`
   with the old hover; the switch between the two states transitions with the existing
   `--t-fast` background transition. Without JS the header CTA is pop.
3. The hero light: a soft radial light of the pop behind the hero's explorer frame, inside the
   frame's area (its upper right third), so the visible halo spills around the frame and the
   small grey texts (agent strip above, caption below, the hero copy) sit on effectively ≤ .04
   alpha. Peak alpha `.14` dark, `.07` light. Size about 900×560 px on desktop, scaled down on
   phones. CSS only: `.ws-hero { position: relative; isolation: isolate }` plus a `::before`
   pseudo-element (`pointer-events: none; z-index: -1`) sized in px/vw so it never crosses the
   viewport's edge on phones (no negative horizontal insets that widen the document); as a safety
   net `main { overflow-x: clip }` (clip, never hidden: the prologue's sticky pins must keep
   working). No `filter: blur()` on big elements; a radial-gradient falloff is enough. A quieter
   echo (about half the alpha) behind the big button in the install section (`.workspace-home
   .get`, a full-width section: a background-image radial-gradient is fine). Light theme: same
   geometry with the light alpha. Reduced motion: unaffected (nothing moves). After building,
   measure the composed background under the agent strip text and the caption and report the
   effective contrast of `--text-3`/`--text-4` there (≥ 4.5:1 for the 11–12 px mono).
4. The prologue (cursor-intro.js): the block cursors are `INK` today. As the cursors run together
   (T.gather) they tint from INK to the pop, fully pop when merged; the one block cursor types
   "Meet IVE" in pop; the typed text stays INK; the cursor fades during the growth as today. Add a
   dedicated colour (do not replace INK), read once from CSS
   (`getComputedStyle(document.documentElement).getPropertyValue('--pop')`, fallback `#FF4F9B`;
   the scripts are deferred, so the stylesheet is applied), re-read in `measure()`. Nothing else
   in the prologue changes (tiles, count label, prompt cursor, loading status).
5. Selection `::selection` and the focus ring `:focus-visible`: join keeps mint; replace uses the
   pop via the `--accent` remap (no extra rule).

Not pop, ever: the status colours (`--running`, `--done`, `--waiting`, `--attention`) and their
dots, the app demos and their posters, the petrol trust ground's surface, the "Waiting" badge of
the phone mock, body text, headings, borders, dividers.

Rule of thumb for any viewport: the dot, one filled button, and the ambient light. If a view
would show more pop than that, do not add it; write it into your report instead.

## Hard constraints

- Only the files assigned to you (see the task). No `git commit`, `git stash`, `git checkout`,
  no version bumps of `?v=` (done once at the end), no edits to texts or layout, no new sections,
  no changes to the inline head scripts (CSP hashes).
- Keep both themes working; the header stays dark over the intro (name-intro.css block).
- No purple, no neon haze over whole sections, no gradients on text.
- The site has no build step: plain CSS/JS, no preprocessors. Mind Safari 16+ (`overflow: clip`,
  `color-mix` are fine; no `:has()` dependence for critical paths).
- Preview server: http://127.0.0.1:4182/ serves this worktree. Render checks:
  `node /private/tmp/claude-501/-Users-maximilianschwarz/80d9f50a-51b7-40b3-b0ec-b7543ebf0b97/scratchpad/shots.mjs <outdir> http://127.0.0.1:4182/ index dark,light`
  with env `POP=pink|rose|tangerine EXTENT=join|replace` (the script sets the html attributes);
  "before" renders for comparison in
  `/private/tmp/claude-501/-Users-maximilianschwarz/80d9f50a-51b7-40b3-b0ec-b7543ebf0b97/scratchpad/before/`.
  Write your own renders to a new folder in that scratchpad directory. Headless only, never open
  a visible browser on this Mac.
- Write all docs in English; the owner's texts stay short, no em dashes, no marketing tone.
