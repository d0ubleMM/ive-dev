# IVE.DEV design system (redesign 2026-10)

Internal reference for every page of ive.dev. The full specification is
`design/REDESIGN-BRIEF.md`; the shared markup and classes are in
`design/partials/USAGE.md`. Product truth comes from the Product truth block in
`README.md` and `design/research/04-inventory-and-constraints.md` (section 2) and
`design/research/05-loops-and-automation.md` (sections 2 and 6). Everything is
checked against IVE 1.0.17; the site shows no version number.

## Homepage update, 2026-10-25

The owner explicitly requested a substantial website redesign informed by a
review of nine competing websites. For `index.html`, this section supersedes
the earlier homepage composition map and pinned Why/Inside descriptions below.
Shared product truth, palette, fonts, legal content and demo provenance remain
applicable. This is a website change only.

- Open inside the white stroke of the V, with the navigation visible. A brief
  scroll-driven zoom reveals IVE, then the letters unfold into Integrated
  Vibecoding Environment. The tunnel and agent swarm are removed.
  This is a short 200svh sequence (180svh on phones), with a direct Explore IVE
  link. Then show the asymmetric product hero and its existing actions.
- The hero has three keyboard-accessible tabs: parallel terminals, terminal,
  code review. They show existing dark IVE DOM demos, with explicit Pause/Play.
- Show the moment a session needs attention using the existing light permission
  scene, then let visitors choose task, check or pipeline in a second explorer.
- One bounded trust surface for local execution, CLI accounts and review: since
  2026-10-31 a raised graphite band (`--bg-raised`, hairlines), no longer petrol.
  Retain the phone visual and its coming-soon status, followed by installation
  and short practical questions.
- Graphite stays the base palette, petrol/mint only for links, focus and selected
  tabs; since 2026-10-31 one pink accent sits on it (see Tokens). The petrol trust
  ground `#1D3835` is retired (owner: it clashed with the pink); the trust section
  sits on `--bg-raised`. Status colors keep their roles.
- The hero heading scales from 38–62px on phones to 88px on desktop. Existing
  Archivo, Source Sans 3 and IBM Plex Mono remain self-hosted.
- `name-intro.css` and `name-intro.js` retain the original measured font sizing,
  zoom out of the V and exponential word reveal. The first frame is a white
  letter surface below the visible navigation, including while fonts load.
  The zoom occupies only the first fifth of the short scroll sequence.
  `story.html` uses this same sequence; legacy `opening.*` is no longer loaded.
- On Home a prologue precedes the name (`cursor-intro.css`, `cursor-intro.js`, one
  canvas, 2026-10-31): a prompt is typed, the board fills with 1, 2, 4, 8, 12 sessions
  (8 on phones), the sessions fold into their cursors, the cursors run together into one
  block cursor and turn pink as they arrive (the pop, see Tokens; the typed text stays
  ink), and that cursor types "Meet IVE" small, in the prompt's mono. The typed
  line then grows: "Meet" goes, the mono IVE moves onto the name intro's own letters and
  dissolves into them, and they grow with the line to full size (the type itself is
  scaled, not a transform), then unfold as before. No zoom in either direction (owner:
  the in-and-out "bounce" was unclean; the ending should be typed like the start, small
  first, then big, then unfolding). The name intro starts under the canvas 70svh before
  the prologue ends (58svh on phones); with a prologue it skips its zoom and begins the unfold where the
  prologue's travel ends.
  While the page still loads (scripts, the prompt's mono), a small mono "Loading" status
  with three pulsing blocks stands in the markup where the prompt will appear, so the dark
  ground reads as loading, not as broken (owner, 2026-10-31). It is pure CSS, appears only
  after 0.4 s, and goes with the canvas's first drawn frame. The prompt's mono is preloaded.
  Reduced motion and no-JS: no prologue, the name as before.
  The linked "made by AIFOREU" signature appears as the name finishes unfolding.
  Reduced motion and no-JS show the full name and signature without a pinned scene.
- The product previews remain generated demonstrations of existing app UI.
  No live providers, new product capabilities, or competitor assets were added.
- Reduced motion prevents autoplay; explicit Play still works. Without JS all
  six tabbed scenes appear as static posters. New assets use content-hash keys.
- The pipeline has a smaller mobile stage scale so the complete loop is in view;
  the full browser demo remains available for detailed interaction.

## Idea

IVE is the local control room for parallel coding agents: several sessions run
side by side on your own machine, one board shows who runs, who waits and who is
done, and every change comes back to you for review. The homepage lands one idea:
more gets done because several agents work at once, and you can see each one
because they all live on one board.

Spirit: Cursor and Linear (owner request). Dark first, quiet chrome, real footage
of the app, very little text. The footage carries the message; text only frames it.

## Pages

| Page | Job |
|---|---|
| `index.html` | Opening scene, hero, Why IVE, Inside IVE, Get IVE, Maker |
| `product.html` | The catalogue: every view and every loop, one row each, the interface rendered live (generated demos); Terminal is the first row, Board shows ten terminal tiles |
| `download.html` | Mac app, terminal install, source, requirements, removal, five questions |
| `architecture.html` | Engineering page (old content, restyled) |
| `imprint.html`, `privacy.html` | Legal; `<main class="legal-main">` is byte-identical, only the chrome changes |
| `404.html` | Self-contained (own hashed style and script, root-absolute URLs) |

### Homepage composition map

No two neighbours share a composition, and none appears twice.

| Section | One job | Composition |
|---|---|---|
| Opening (`.cursor-intro` + `#mark`) | One prompt becomes many agents, the cursor types the name | Pinned scroll scene on a dark ground in both themes: a typed prompt, the board filling to twelve sessions, their cursors running together into one block cursor that types "Meet IVE" small; the line grows into the name, IVE unfolds into Integrated Vibecoding Environment |
| Hero `#hero` | Name the product and show it | Left headline block, then an 880px window into the dark board, rendered live (the two working sessions in view, the rest of the board by scrolling; the whole window on expand) |
| Why IVE `#why` | The four reasons | Viewport-wide question that docks, statement column plus sticky media panel (pinned at 720px and up, in flow on phones) |
| Inside IVE `#inside` | What IVE really does, as it happens; the terminal first | Chapter rail, one wide player, caption block; six generated scenes of the interface auto-advance, each scrubbable and scrollable: a session's terminal (typed into, then the same session as Overview), ten terminals on the board, start and queue, Auto-fix loop, Pipelines, loop detection |
| Get IVE `#install` | The action | Centred headline, two panels: Mac app and terminal |
| Maker `#aiforeu` | Who makes it | Signature strip: the approved logo film left, one line right |

Bento grids, icon walls, card stacks and repeated split sections are out.

## Navigation and footer

- Header on every page: fixed, 64px (56px below 720px), transparent until 8px of
  scroll, then glass with a hairline. Left the wordmark "IVE" at 22px with the pink
  dot, no by-line. Right, all in one button family (36px, 6px radius): the quiet
  links Product, Download, Architecture; the theme switch as an icon button
  (sun in dark, moon in light, the label names the action); the GitHub icon button;
  the primary action "Try it yourself". One coloured call to action per view: the
  header's button is quiet (outlined, the hairline family of the icon buttons beside
  it; `html.cta-quiet`, set in the markup of pages that have their own filled button
  and kept current by site.js on scroll) until the page's first filled button has
  scrolled above the viewport, and again whenever a filled button of the page is on
  screen; otherwise it is the pink fill. Below 720px: wordmark, primary action, Menu
  button with a panel.
- While the name intro is pinned, `html.name-intro-active` keeps the header dark
  and its wordmark, links and controls visible throughout the zoom and unfold.
- Footer: IVE and "from AIFOREU" (link to aiforgov.eu), the seven links (Try it yourself
  first, on every page), and the line
  "EU-based · Open source under the Apache 2.0 license". The 404 keeps only the
  line and the legal links.

## Tokens

Dark is the default (also without JS); `html[data-theme="light"]` overrides.
`.ink-dark` forces the dark set on any surface that is dark in both themes.

```text
                 dark                  light
--bg             #0E1014               #F6F7F8
--bg-raised      #15181D               #FFFFFF
--bg-inset       #0A0C0F               #EEF0F2
--line           rgba(255,255,255,.08) rgba(16,18,22,.10)
--line-strong    rgba(255,255,255,.16) rgba(16,18,22,.18)
--text-1         #F2F3F5               #15171A
--text-2         #C6CAD1               #3E434A
--text-3         #8B919B               #5A6069    (light lifted twice on 2026-10-31: 4.84:1 on the shadowed inset ground under the Inside IVE captions)
--text-4         #7C828C               #646A73    (lifted in QA round 1 and on 2026-10-31: 4.77:1 on --bg-inset)
--accent         #8EC6BC               #216C63    (links, focus, selected tabs, diagram lines; kickers are --text-3)
--accent-fill    #E7E9EC               #272A2E    (no longer used by a button since 2026-10-31; kept
--accent-fill-hover #FFFFFF            #17191C     for the pinned header block and the 404 page)
--on-accent      #17191C               #FFFFFF
--pop            #FF4F9B               #FF4F9B    (the one unexpected accent: filled buttons, the wordmark dot,
                                                   the prologue's merged cursor, the selection, the intro link's hover)
--pop-ink        #17191C               #17191C    (text on the pop: 5.74:1; white would be 3.07:1)
--pop-hover      pop 86% + white       same       (#FF68A9, ink 6.55:1)
--pop-glow       rgba(255,64,118,.24)  rgba(255,64,118,.18)  (the hero light; a touch warmer than the fill)
--running        #5B8CFF               #1647FF    (running and thinking states)
--done           #7DCE82               #087A4B
--waiting        #E0A54A               #B7791F
--attention      #F2545B               #C83B24
```

Owner-approved palette, 2026-10-24: graphite and petrol, running states keep
their blue, product demos retain the app's own colors. No purple, no neon.

Owner decision 2026-10-31 (from a design reel: "a calm two-colour palette plus one
accent colour that catches you off guard", and "pink is a cool accent colour"):
the pop above is that accent. It is the colour of the cursor at the moment it
matters and appears only where listed: the filled "Try it yourself" buttons (the
header's while no other filled button is in view), the wordmark dot (header,
footer, try bar, 404, Open Graph image), the prologue's cursors as they run
together and type "Meet IVE", a soft light behind the hero frame with a quieter
echo behind the install button (the one exception to "no glows", asked for by
the owner), the text selection, and the hover of the intro's "Explore IVE". Mint
stays the colour of links, focus and selected tabs; every kicker is quiet grey
(`--text-3`) and the trust section is a graphite band, so no green stands beside
the pink (owner, 2026-10-31); the hero's tab underline is neutral as well. Status colours keep their roles and the pop never stands for a state. Text
on the pop is dark in both themes; in the light theme the filled button carries
a hairline in a deeper pink so its shape stays above 3:1. Pink, rose and
tangerine were compared in a three-lens jury on 2026-10-31 (brand, craft,
system): pink won on all three; replacing mint everywhere lost to keeping it.
Details and the places list: `design/ACCENT-BRIEF.md`.

## Type

Archivo (display, 500 to 800, width 100 to 125%), Source Sans 3 (body),
IBM Plex Mono (labels, provenance, commands), all self-hosted in `assets/fonts`.

| Role | Setting |
|---|---|
| H1 | Archivo 700, 110%, 56px (40 on phones) |
| H2 | Archivo 700, 110%, 40px (30); subpage rows 32px (26) |
| Statement pair | Archivo 600, 32px (26): white line, grey line, same size |
| Lead | Source Sans 3, 20px (18), `--text-2` |
| Body | 16px, `--text-2`; captions `--text-3` |
| Mono | IBM Plex Mono 500, 11px kickers (uppercase, .12em, one setting on every page and width), 12px labels and provenance, 13px ledgers, 14px terminal boxes |

No faded second headline line. Lines at most 64ch. Arrows, chevrons and icons are
inline SVG, never font glyphs.

## Components

- Buttons, one family, 6px radius, no pills: the pink fill for "Try it yourself" (the
  hero, the install section, the page heads of Product and Download, the Product closer,
  and the header once no other filled button is in view), outlined for every other
  primary action (Download for Mac, Install IVE, the header's quiet state), icon button
  36×36, quiet (closers, links row). Status chip (`.soon`): not a button, no hairline.
- Product frame: `--bg-inset`, 8px radius, hairline ring, soft shadow. No title bar
  and no fake macOS chrome: the app's own sidebar and top bar are the chrome.
  Pause and Expand controls; Expand opens the shared `<dialog>` viewer.
- Panels: `--bg-raised`, hairline ring, 8px radius. Terminal box: `--bg-inset`,
  mono 14px, `$` prompt drawn by CSS, Copy button with its own live region.
- Captions: provenance in mono 12 `--text-4` ("IVE app · demo project · no provider
  ran"); chapter captions as title 18/600 plus one sentence.
- Product rows: hairlines between rows, text and frame alternate sides; the three
  stills of the Models row share hairlines on a dark ground in both themes.

## Status language

```text
○ queued   ◐ thinking   ● running   ◇ waiting   ✓ complete   ! attention
```

IBM Plex Mono, a symbol always paired with a word, readable without colour.
Status glyphs belong only to product states inside diagrams and the app demos.

## Motion and the app demos

- Budget: the opening scene, Why IVE, the app demos, and 120 to 220ms hover and
  crossfade transitions. No scroll reveals, no parallax, no blur on text.
- The app demos are generated, not recorded (owner decision 2026-10-23: "diese Videos
  haben total schlechte Qualität … generiert und keine Aufnahme aus IVE, jedes einzelne
  Video"). Each is the IVE interface rendered live inside a same-origin iframe
  (`assets/demo/r8/frame.html`) from the app's own stylesheet and DOM markup, so text is
  sharp at every size, selectable and scrollable; a deterministic script drives the
  scene, and a scrubber with markers lets a visitor move through it. A frame is
  created one viewport ahead and plays when at least half in view, always (owner,
  2026-10-23 night: no Play question, no click on the surface; a Pause/Play button next
  to it and nothing else); one demo plays at a time; off-screen, a hidden tab or the open
  dialog pauses it; the preview surface is inert (no pointer, no focus, the wheel
  scrolls the page). A
  scene never scales its text below 0.72 (0.6 for the board's establishing view):
  below that the app window itself gets narrower, like the app in a small window
  (sidebar hidden under 1000 stage px). Phones get a 3:4 window. Expand opens the
  same scene at window size in the `<dialog>` viewer, with the same controls. The
  Maker film is the one clip with sound.
- Try it yourself (owner, 2026-10-23 evening and night): the previews are what they are; the
  app is reached from two places only, the hero's CTA row and the Product lead, and opens as
  `try.html`: the IVE app built into the site (`assets/demo/r9`, `lib/app.js`) at window size
  and native scale under a slim strip (brand, the introduction's Skip/Again, Back to ive.dev),
  like a freshly started IVE, with normal browser Back. No dialog, no controls under the
  previews except Pause/Play.
- The introduction (owner: "wie die alte Einführung, aber präziser … Felder, die aufblinken …
  kein Text, den keiner liest … subtil"): `lib/mod-tour.js`. Six actions, each a real click:
  Start the example task (in the box, editable), the same session's terminal (⌘J), the Board
  (on phones the sidebar first), answer the waiting permission (allow or deny), Review, open a
  changed file. One quiet ring on the control that is next (three slow pulses, then still;
  none under reduced motion), a numbered beacon, two to four words; Skip and Again in the
  strip, never over the app; Again returns to Home with the example and keeps what the visitor
  made. The ring only ever marks a control a tap would really reach: a squeezed phone tile
  gets "Open the request" (the session, with the permission card in its conversation), a
  hidden sidebar "Open the sidebar", an open Review panel "Back to the session", an empty box
  "Describe a task". Done is one word. Codex's audit: review/CODEX-ONBOARDING-AUDIT.md.
- Round 7 (owner, 2026-10-23 22:39: "das Try it yourself ist viel zu subtil … an mehr Stellen …
  alle Knöpfe, die man anklicken kann, funktionieren … beim Board nicht den Overview zeigen,
  sondern alle Terminals, die cleanen Terminals, die man kennt"): "Try it yourself" is the
  primary action at page level and supersedes the exactly-two rule: the header CTA on every
  page, the hero's filled button (Download for Mac outlined beside it), the Try band before
  Get IVE, a line in Get IVE, the Product head and closer, the Download head, the footer;
  still never under a preview. The app's Board opens as terminal tiles (Overview is the
  per-tile toggle); the introduction's answer step says "Click in, press Enter" there. Every
  control in the app does something real, local to the browser, and says so where the app would
  talk to the Mac (Codex's control audit, review/CODEX-ROUND7-CONTROL-AUDIT.md, is the acceptance
  table): `lib/mod-ui.js` (⌘K palette, sidebar filter, session menus, merge, projects, sort/drag,
  Board scope/layout, menus/dialogs for every module), `lib/mod-session.js` (model/mode/options
  menus, Details, History, Copy, attachments read locally, dictation when the browser has it, Add
  context, the side chat that answers from the transcript, brief details, the permission card's
  controls, the queue), `lib/mod-settings.js` (Settings, Knowledge, Connectors, Phone, Cost & tokens),
  Codex's `mod-review.js`/`review.js`, `mod-pipelines.js`/`pipeline.js`, `mod-flow.js`/`taskflow.js`.
  No generic "not in the demo" toasts. Runtime `assets/demo/r8`; r5/r6/r7 stay immutable.
- IVE for iPhone (owner, 2026-10-24 04:15: "die iPhone App … 'control your agents from everywhere'
  … 'built-in terminal on your iPhone' … das Stärkste: ein Terminal immer und überall im Handy …
  das iPhone-Mockup von der mehrmal-Website nehmen"): Home section `#iphone` ("Your terminal,
  everywhere."), a Product row and a Download panel. The mockup is the mehrmal site's device frame
  (`assets/phone/iphone-frame.webp`, cropped to the phone in CSS) with IVE's phone terminal drawn
  in site CSS (`.ph*` in site.css). Claims come from the apps' own notes in the owner's private
  repository and from the Mac app's Phone panel (pairing with the Mac app, Face ID optional, the
  Watch app "built alongside", no release promised for it); the native apps are not public. Owner, 2026-10-24 00:13: "nimm den iPhone-Install unbedingt von der
  Website … die Anzeige ist sehr geil, aber nicht, dass man das schon installieren kann, sag
  einfach soon on App Store": the site shows the app and says "Coming soon to the App Store"
  (the `.soon` badge, never a link), with no install, build or pairing instructions anywhere,
  the demo's Phone view included. On phones the mockup comes right after the heading.
- No footnotes under the demos (owner, 2026-10-23 night: "diese Notizen unten dran … die will
  keiner sehen … alle dieser Art"): no provenance or sample-project notes under previews, in the
  Why panel, under Product figures or in the viewer header; the only text next to a preview is
  its feature caption and the "Try it yourself" button. The README and this file carry the
  honesty note instead (demo data, no provider).
- Theme of the demos: the Inside IVE reel and every Product row show the app's light
  theme; the hero and the Why panel show the dark theme (owner decision 2026-10-23,
  kept from the recordings: "der dunkle Hero war besser, aber die Clips sollten von dem
  hellen Dashboard sein"). A frame that shows a light scene carries `is-light`.
- Terminal first (owner, 2026-10-23): newcomers should see at once that their CLI runs
  in a normal terminal inside IVE and that ten of them fit on the board. So the hero
  lead names the terminals, the reel opens with the Terminal and the Ten-at-once
  chapters, and Product opens with a Terminal row. The terminal text in those scenes is
  scripted demo output in the style of the CLIs (`assets/demo/r8/lib/term.js`), rendered
  as DOM rows in the look of the app's xterm; typing and Enter are part of the script.
- `prefers-reduced-motion`: nothing starts by itself, the two scenes show their
  static states, transitions are instant. Without JS every page is a calm static
  page with posters, captions and plain navigation.

## Voice and copy

- English, short, concrete. No em or en dashes as punctuation, no emojis, no AI
  vocabulary (unlock, seamless, supercharge, revolutionize, elevate and their kin).
- Hard word budgets per section (brief 2.4). Measured on the rendered homepage
  after Gemini came back (2026-10-22): 274 marketing words (hero 17 of 17, Why 109,
  Inside 111, Get 31, Maker 6). Round 3 (2026-10-23, terminal first, owner request)
  adds 4 words to the hero lead and two chapters to Inside (about 50 words).
- One primary home per claim (brief 2.5). The homepage gives the short version,
  Product describes the view or mechanism in other words. Functional lines
  (commands, requirements, provenance, legal, buttons) may repeat where needed.
- Benefit first, mechanism second; deep implementation detail lives on Architecture.
- Buttons name the page or action they open.

## Honesty

- Only claims that are true for the current release. No speed or quality claims,
  no numbers as proof, no testimonials, customer logos, star counts or other
  social proof. Asking once for a GitHub star is fine.
- Never "your code stays on your machine": IVE runs on your computer, and the
  coding CLI sends prompts, context and code to the provider the user chose.
- CLIs: the site names Claude Code, Codex and Gemini (owner decision, 2026-10-22).
  In 1.0.17 Gemini runs through the Antigravity CLI profile, Google's agent CLI; the
  standalone Gemini CLI profile is inactive (`backend/cli_profiles.py`).
  Full lists: "Claude Code, Codex and Gemini (Antigravity CLI)".
  Short lists and chips: "Claude Code · Codex · Gemini". Never "Gemini CLI" alone.
  Models depend on the installed CLI and account; illustrations name only Haiku,
  Sonnet, Opus and the Gemini Pro and Flash models (`gemini-3.1-pro`,
  `gemini-3.5-flash`).
- The app demos are the IVE 1.0.17 interface, generated from the frontend's own
  stylesheet and DOM markup (DOM dumps of the real frontend on its isolated test
  transport, `scripts/demos/snapshot.mjs`), with the demo project Orbit; no provider
  ran. The opening scene and the Why ledger are the only illustrations. Never invent
  app UI the app does not have: every control, label and state comes from the dumps.
- Numeric totals (Architecture only) sit beside "Development snapshot ·
  capabilities may change during the beta.".
- No Windows support, no Intel Mac app, no version number or file size for the
  Mac app, no "EU-backed".

## Technical contract

- Static HTML, CSS and JS, no build step. Shared: `site.css`, `site.js`; homepage
  adds `home.css`, `workspace.css`, `workspace.js`, `cursor-intro.css`,
  `cursor-intro.js`, `name-intro.css`, `name-intro.js`, `madeby.js`; pages with
  app demos add `demo.css`, `demo.js` and `frame-src 'self'` to their CSP. The demo
  document (`assets/demo/r8/frame.html`) has its own CSP (`style-src 'unsafe-inline'`
  for the app's inline geometry; scripts `'self'` only).
- Every page: strict CSP meta (`default-src 'none'`, `'self'` only, inline scripts
  and styles by sha256 hash, `media-src 'self'` only on pages with video (the Maker film),
  `base-uri 'none'`, `form-action 'none'`). Recompute a hash after any change to
  an inline block. No external requests; fonts are local.
- `?v=` cache version on every CSS and JS reference; raise it with every change
  (GitHub Pages caches for 10 minutes).
- Theme: inline boot script, `localStorage['ive-theme']` only, dark by default.
- Download logic (`[data-mac-download]`): Apple silicon Mac keeps the DMG link;
  every other platform, touch Macs (iPad) and Intel Macs in Chromium
  (`userAgentData` architecture `x86`) get "Install IVE" to the terminal install.
  Plain DMG links never change.
- `install.sh` stays byte-identical; `CNAME` and `robots.txt` unchanged; legal
  `<main>` unchanged; `_config.yml` keeps `design`, `review` and `scripts` out of
  the published site.

## Hard bans

- Social proof of any kind, fake customers, fake numbers, fake code, fake chrome.
- Purple or violet, neon, glows, star fields, orbs, sparkle icons; matrix green,
  hacker cosplay, ASCII decoration.
- Bento grids, icon-grid feature walls, cards for everything, pill buttons.
- Robots, AI heads, characters, avatars, personalities, workforce metaphors.
- Custom cursors, WebGL, animation libraries.
- Retired lines: "Run agents. Keep control.", "Your code stays on your machine",
  "One brain. Infinite&#32;hands.", "agent&#32;army", "tmux wish&#101;s it could do
  this.", every GOAL → PLAN → WORK → CHECK → REVIEW strip, "Mission Control" as a
  label, "Ralph" as a product name (the UI says Auto-fix loop).
