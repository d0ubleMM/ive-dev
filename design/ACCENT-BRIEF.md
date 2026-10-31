# Accent brief: one unexpected colour (2026-10-31)

Owner's ask: apply the idea from a design reel ("the secret to a memorable UI: one accent colour
that catches you off guard") to ive.dev and turn it into a UI redesign, colours first. The owner
added: "I also think pink is a cool accent colour in general." No push without the owner's word.

Decision (2026-10-31, afternoon): pink `#FF4F9B`, at first with the mint accent family kept for
links, focus and selected tabs ("join"). Three hues (pink, rose `#F28BB2`, tangerine `#FF8A3D`) and
two extents (mint kept vs mint replaced everywhere) were built behind `html[data-pop]` attributes,
rendered on every page in both themes and judged by three independent lenses (brand and
surprise, craft and accessibility, system and consistency). Pink won on all three. Tangerine sits
next to the amber waiting state; rose reads near-disabled as a button. An independent colour and
contrast concept (Codex, read-only) is in `/tmp/ive-dev-codex-color-concept-20261031.md`.

Update (2026-10-31, evening): the owner first said "the green does not fit at all" (the petrol
trust ground and mint kickers went), then asked for "a bit more accent colour, as explained in the
video". In the reel the accent does three things: a large soft light in the hero, the primary
button, and a few small highlights (a dot in the nav, a badge on the headline, one product card).
ive.dev had only the button and a halo nobody could see. So: mint is retired everywhere (`--accent`
is now the pop as text and lines), the hero light is a real light that rises from behind the app
frame, the closing call to action and the Product head get the same light at a lower level, and
four small marks carry the IVE story (the cursor, the dot). A three-lens jury (reel fidelity,
craft and accessibility, restraint and system) chose this over a light leaning towards the
button (it pushed a grey link below 4.5:1 and read as the stock corner glow) and over the same
page without the small marks (any SaaS page); it cut the cursor from the section kickers (16 pink
blocks read as bullets), the Download head light (no frame to light, a floating blob) and the
pink step numbers on Architecture, and asked for one pink family in the light theme.

## The principle

A calm two-colour base plus ONE unexpected accent. The base is graphite and white (dark theme)
or near-white and ink (light theme), nothing else: no mint, no petrol. The accent is the pop.

Story for IVE: the pop is the colour of the cursor at the moment it matters. The block cursors
of the prologue run together and turn pop as they type "Meet IVE"; the wordmark's dot is that
cursor; the hero's kicker ends in it and blinks when the hero takes over; the headline ends on
the dot; the one filled button is that colour; the app frame is the source of a pink light.

## Tokens (site.css)

| token | value | role |
|---|---|---|
| `--pop` | `#FF4F9B` (both themes) | the fill and every pink shape: buttons, dots, cursor, the headline's stop, selection, the intro link's hover |
| `--pop-ink` | `#17191C` | text on the fill, 5.74:1 (white would be 3.07:1) |
| `--pop-hover` | `color-mix(in srgb, var(--pop) 86%, white)` = `#FF68A9` | filled button hover, ink 6.55:1, both themes |
| `--pop-glow` | `rgba(255,79,155,.5)` dark, `.3` light | the lights' peak and inner half, in the fill's own hue (the warmer `rgba(255,64,118)` alone read as wine) |
| `--pop-glow-edge` | `rgba(255,64,118,.5)` dark, `.3` light | the outer stops (60 to 90 %) of every light: a touch warmer, so the faint fringe on cool graphite stays pink and does not drift to plum |
| `--accent` | `#FF4F9B` dark, `#BE2D6C` light | the pop as text and thin lines: links, hovers, focus ring, selected-tab bars, the architecture path. Light: 5.18:1 on `#F6F7F8`, 5.55:1 on white, 4.86:1 on `#EEF0F2` |

The light theme has two pinks with two jobs: `--pop` for every fill and shape, `--accent` for
text and lines (`#AD1A5E`, first chosen, read as raspberry beside the fill). The filled button's
1px light-theme hairline `color-mix(in srgb, var(--pop) 84%, black)` (= `#D64282`, 3.95:1 on
`#F6F7F8`) stays on the button's own border so its shape stays above 3:1. A selected label on the
fill keeps the ink (`.btn-fill::selection`, 10 % ink wash). The dark scopes (`.ink-dark`,
`[data-mark]`, `html.mark-dark .site-header`, and in name-intro.css the whole `.name-intro`,
the intro's link row and `html.name-intro-active .site-header`) carry the dark value `#FF4F9B`.

## Where the pop goes

1. The wordmark dot: `.wordmark-dot` (site.css), `.try-brand .wordmark-dot` (demo.css), the 404
   page's own `.wordmark-dot` (404.html; its CSS is inline and hashed in its CSP, so any change
   there means recomputing the sha256 of the `<style>` content), `assets/og.html` `.mark i`
   (regenerate `assets/og.png` from it at 1200×630). The footer dot inherits.
2. The filled button `.btn-fill`: background `var(--pop)`, colour `var(--pop-ink)`, hover
   `var(--pop-hover)`. Outline and quiet buttons stay neutral. The pop is bound to one action
   site-wide: "Try it yourself" (the hero, the install section, the product page's head and
   closer, the download page's head, the header). Download for Mac, Install IVE and Get IVE stay
   neutral. Header rule: one coloured call to action per view, on every page: the header's
   `.nav-cta` is quiet (outlined) until the page's first filled button has scrolled above the
   viewport, and quiet again whenever a filled button of the page is on screen (site.js,
   `html.cta-quiet`, static in the markup of index, product and download for the first paint;
   the switch is a cut, `is-switching`).
3. The hero light (workspace.css, on `.ws-hero-explorer .ws-tab-panel:not([hidden])::before`): it
   hangs on the visible tab panel, whose top edge is the explorer frame's top edge, so it follows
   the frame whatever the panel count, the frame's ratio or the scripts (without JS all three
   panels show and only the first carries it). A wide radial light of `--pop-glow` whose core sits
   56px under that edge, a little right of centre (6 % of the frame width; radii `min(800px, .66 of
   the frame width)` by 270px, both tied to the frame so the light stays centred on it and wraps
   both top corners alike on wide screens), so the frame hides the core and the light rises behind the tab row and fades through
   the agent strip before the headline; the box spans the viewport and wraps round the frame's top
   corners on wide screens. From 1100px a second, tight layer (the hot core: 280 by 80px, 230px
   right of centre, 60 % of the glow, `--core-peak`) sits on the frame's top edge in the empty
   stretch right of the tab labels, so the light reads as the button's pink and not as wine haze
   (jury). Phones: centred, `78vw` by 220px, no core. The unselected hero tabs read in `--text-2`
   on it and focus rings inside the hero explorer are `--text-1` (a pink ring on the light drops to
   about 2.8:1). Measured on the composited page (worst background pixel under every text, both
   themes, 320 to 2560px): nothing under 4.5:1. No `filter: blur()`; a ten-stop (1 - t^2)^2 falloff;
   the hero isolates, so the light paints under all of its content, and `main { overflow-x: clip }`
   keeps the box from widening the document.
4. The echo (workspace.css `.ws-install-primary::before`): the same light, centred on the closing
   "Try it yourself" button (the pseudo-element sits on the button's row, so it follows the
   layout) and hugging it, `min(440px, 60vw)` by 88px, 66 % of the glow in dark and 50 % in light,
   so it reads as the button's own glow and not as a cloud; it ends above the install paths' top
   rule. The note under the button sits near the core and reads in `--text-2`.
5. The Product head light (site.css `.page-head-lit::before`, only product.html carries the
   class): the hero light at 66 %, rising from the first app frame's top edge (which is the
   head's bottom edge), centred on that frame from 1024px (a sixth of the content width right of
   centre, ending before the head's text column), 210px tall; from 720 to 1023px centred behind
   the head's buttons (which stay at 8.8:1 or better); none on phones. Download has no frame to
   light and no light.
6. The prologue (cursor-intro.js): the block cursors tint from ink to the pop as they run
   together, the merged cursor types "Meet IVE" in pop, the typed text stays ink. The wordmark
   dot is ink until then and takes the pop as the cursor goes (`--dot-pop`); pages without the
   prologue, reduced motion and the restored-below case show the pink dot from the start.
7. The first kicker of a page ends in the cursor: a pop block one mono cell wide (`.62em` by
   `1.12em`), on the homepage hero (`.ws-hero .ws-kicker::after`), Architecture (`.arch-hero`) and
   the legal pages (`.legal-head`). Section kickers stay plain grey. On the homepage it blinks
   three times at the terminal rate (1.06 s, `steps(1)`) when the hero takes over from the intro
   (`html.name-intro-live:not(.name-intro-active)`, so it plays on arrival, again on a return,
   and on a deep link), never under reduced motion or without the live intro.
8. The hero headline ends on the dot: `One workspace<span class="pop-stop">.</span>`, the full
   stop in `--pop`; in the light theme a hair deeper (`--pop` with 10 % black, `#E6478C`, 3.48:1)
   because it is real punctuation and large text needs 3:1. Screen readers read "One workspace."
   (it was aria-hidden at first, which dropped the stop from the heading's name). Only the hero
   headline.
9. The current page in the nav: a 5px pop dot before its name (`.nav-link[aria-current]::before`,
   absolutely placed: in the link's left padding on the desktop row, in the gutter in the phone
   panel, so no label moves between pages), with the current page's ink and 600 weight, like the
   reel's nav dot.
10. `--accent` (the pop as text and lines): link and hover colour (`.link`, `.arrow-link`,
    `.ws-text-link`, FAQ summaries, the phone panel's links, legal links), the focus ring (2px,
    2px offset; on the filled button and on the hero light the ring is `--text-1`, a pink ring
    would read as part of the button or vanish on the light; the header's button keeps the pink
    ring while it is quiet), selected-tab bars (hero and workflow explorers), the demos' scrub
    bar, and the architecture path: the route from the interface to the backend and on to the
    SQLite store and the store's 1px ring (the event flow's step numbers and rule are neutral;
    a bar over step 01 read as a tab or a progress bar and was dropped).
11. `::selection` in the pop at 35 %.

Not pop, ever: the status colours (`--running`, `--done`, `--waiting`, `--attention`) and their
dots, the app demos and their posters, the trust band, the "Waiting" badge of the phone mock,
body text, headings (except the hero's stop), section kickers, numbers, card borders and dividers.

Budget per first view: Home 6 (wordmark dot, kicker cursor, headline stop, filled button, light,
selected-tab bar), Product 4 (dot, nav dot, button, light), Download, Architecture and the home
closer 3 or 4. A new pink placement needs to replace one of these, not join them.

## Hard constraints

- No `git commit`, `git stash`, `git checkout` by agents; cache versions (`?v=`) are bumped once
  at the end by the lead; texts and layout stay; the inline head scripts are hashed in every
  page's CSP and are not touched.
- Both themes work; the header stays dark over the intro (name-intro.css block) and turns light
  with the page once the intro has passed, also when a deep link lands on `#hero`.
- No purple, no neon haze over whole sections, no gradients on text.
- The site has no build step: plain CSS/JS. Mind Safari 16+ (`overflow: clip`, `color-mix` are
  fine; no `:has()` dependence for critical paths).
- Preview server: http://127.0.0.1:4182/ serves this worktree. Render checks with
  `/private/tmp/claude-501/-Users-maximilianschwarz/80d9f50a-51b7-40b3-b0ec-b7543ebf0b97/scratchpad/shots.mjs`
  (`node shots.mjs <outdir> <baseurl> <pages> <themes>`, env `PHONE=1` for phone renders of every
  page). Headless only, never open a visible browser on this Mac.
- Write all docs in English; the owner's texts stay short, no em dashes, no marketing tone.
