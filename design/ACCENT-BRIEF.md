# Accent brief: one unexpected colour (2026-10-31)

Owner's ask: apply the idea from a design reel ("the secret to a memorable UI: one accent colour
that catches you off guard") to ive.dev and turn it into a UI redesign, colours first. The owner
added: "I also think pink is a cool accent colour in general." No push without the owner's word.

Decision (2026-10-31): pink `#FF4F9B`, with the mint accent family kept for kickers, links,
focus and the petrol ground ("join"). Three hues (pink, rose `#F28BB2`, tangerine `#FF8A3D`) and
two extents (mint kept vs mint replaced everywhere) were built behind `html[data-pop]` attributes,
rendered on every page in both themes and judged by three independent lenses (brand and
surprise, craft and accessibility, system and consistency). Pink with mint kept won on all three
(8/8/8). Replacing mint lost because the pop stopped being rare (five placements in the first
view), the petrol section got a pink kicker, the light theme split into two pinks, the
architecture diagram gained a fourth "status" colour and the focus ring vanished on the pink
button. Tangerine sits next to the amber waiting state; rose reads near-disabled as a button.
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

| token | value | role |
|---|---|---|
| `--pop` | `#FF4F9B` (both themes) | the fill: buttons, dot, cursor, selection, the intro link's hover |
| `--pop-ink` | `#17191C` | text on the fill, 5.74:1 (white would be 3.07:1) |
| `--pop-hover` | `color-mix(in srgb, var(--pop) 86%, white)` = `#FF68A9` | filled button hover, ink 6.55:1, both themes |
| `--pop-glow` | `rgba(255,64,118,.24)` dark, `.18` light | the hero light's peak; a touch warmer than the fill so the falloff on cool graphite does not drift violet |

No pop as text on light grounds (the fill is 2.86:1 on `#F6F7F8`); the only pop text is the
hover of the intro's "Explore IVE" on the dark intro ground (6.2:1). The light theme's filled
button carries a 1px hairline in `color-mix(in srgb, var(--pop) 78%, black)` so its shape stays
above 3:1 against the page. The bright fill is never used on the petrol ground (4.10:1).

## Where the pop goes

1. The wordmark dot: `.wordmark-dot` (site.css), `.try-brand .wordmark-dot` (demo.css), the 404
   page's own `.wordmark-dot` (404.html; its CSS is inline and hashed in its CSP, so any change
   there means recomputing the sha256 of the `<style>` content), `assets/og.html` `.mark i`
   (regenerate `assets/og.png` from it at 1200×630). The footer dot inherits.
2. The filled button `.btn-fill`: background `var(--pop)`, colour `var(--pop-ink)`, hover
   `var(--pop-hover)`; it does not depend on `--accent-fill`/`--on-accent`. Outline and quiet
   buttons stay neutral. The pop is bound to one action site-wide: "Try it yourself" (the hero,
   the install section, the product page's head and closer, the download page's head, the
   header). Download for Mac, Install IVE and Get IVE stay neutral.
   Header rule: one coloured call to action per view, on every page. The header's `.nav-cta`
   is quiet (the old neutral fill) until the page's first filled button has scrolled above the
   viewport, and quiet again whenever a filled button of the page is on screen (the prologue and
   the hero are the first pop moments, not the nav button; the install section and the product
   page's head and closer never show two pop buttons at once). Implementation (site.js, so it
   covers every page): `main .btn-fill` observed with an IntersectionObserver, `html.cta-quiet`
   toggled; pages that have such buttons (index, product, download, story) carry `cta-quiet`
   statically in their `<html>` class so the first paint is right without waiting for the
   deferred script. CSS: `html.cta-quiet .nav-cta { background: var(--accent-fill); color:
   var(--on-accent); }` with the old hover; the switch rides on the existing `--t-fast`
   background transition. Without JS, pages with the static class keep the quiet header, the
   others show the pop.
3. The hero light (workspace.css): a soft radial light of `--pop-glow` behind the hero's explorer
   frame, its peak inside the frame's upper right so only a halo spills out along the frame's
   top right corner and right edge; the agent strip, the tab row, the caption and the hero copy
   sit on at most about .04 of tint; on phones nothing crosses the viewport edge (no gutter
   stripe) and the tab labels stay at or under .04. CSS only: `.ws-hero { position: relative;
   isolation: isolate }` plus a `::before` (`pointer-events: none; z-index: -1`), sized in px/vw
   so it never widens the document, with `.workspace-home main { overflow-x: clip }` as the
   safety net (clip, never hidden: the prologue's sticky pins must keep working). No `filter:
   blur()`; a radial-gradient falloff with enough stops to stay smooth in the light theme. A
   quieter echo (about 40 % of the hero light's visible strength) behind the big button in the
   install section (`.workspace-home .get`, a background-image radial-gradient over
   `var(--bg-inset)`), ending above the install paths (their 12 px labels have no contrast to
   spare). Reduced motion: unaffected (nothing moves).
4. The prologue (cursor-intro.js): the block cursors are `INK`; as the cursors run together
   (T.gather) each tints from INK to the pop with its own gather progress, so they are pop when
   they arrive; the one block cursor types "Meet IVE" in pop; the typed text stays INK; the
   cursor fades during the growth as before. The colour is read from CSS (`--pop`, fallback
   `#FF4F9B`) in `measure()`. Tiles, the count label, the prompt's first cursor and the loading
   status stay as they are.
5. `::selection` in the pop at 35 %: the one place the colour appears without being placed.
6. The hero's own kicker and the hero explorer's selected-tab underline are neutral (`--text-3`,
   `--text-2`) so the first view holds exactly one hue: dot, one filled button, the light. Mint
   kickers and tab bars stay everywhere else. The "Coming soon to the App Store" badge is a
   neutral status (line-strong frame, raised ground, grey dot), not a button; the maker strip's
   aiforgov.eu link is neutral because the footer's pink dot sits right below it.

Not pop, ever: the status colours (`--running`, `--done`, `--waiting`, `--attention`) and their
dots, the app demos and their posters, the petrol trust ground's surface and its pale mint
kicker, the "Waiting" badge of the phone mock, body text, headings, borders, dividers, the
focus ring (mint, so it stays visible around the pink button), the architecture diagram.

Rule of thumb for any viewport: the dot, one filled button, and the ambient light. If a view
would show more pop than that, do not add it.

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
