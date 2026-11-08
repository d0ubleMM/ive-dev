# ive.dev

Static source for the IVE product site: a local control room for parallel coding work. There is no build step or framework.

## Preview

From this folder, run:

```sh
python3 -m http.server
```

Then open `http://localhost:8000/`. The marketing pages can also be opened from `file://`.

## File map

- `index.html`: homepage with a short zoom out of the V into IVE and the full-name reveal, then the workspace hero, three selectable dark product views (parallel terminals, terminal, review), an attention example, three progressive light workflow views, local/account facts, iPhone, install paths, FAQ and the maker strip
- `workspace.css`, `workspace.js`: homepage composition and accessible preview tabs; all product scenes continue to use the existing generated IVE demo runtimes
- `github-star.css`, `github-star.js`: the five-piece star animation and GitHub invitation after the install paths on Home and Download. Plays once in view, with a Replay control; reduced motion and no-JS show the finished star.
- `updates.css`, `updates.js`: email-only interest list on Home and Download. The Cloudflare Worker in `worker/` saves the email and explicit consent; it sends no emails and does not verify addresses.
- `story.html`: the same letter zoom and word reveal as a standalone page; the tunnel and agent swarm are no longer used
- `product.html`: every view and every loop of the app, one row each, as generated demos of the interface in the app's light theme; the first row is the Terminal, the Board row shows ten terminal tiles
- `download.html`: Mac app, terminal install (`#terminal`), source install, requirements, removal and five questions
- `architecture.html`: engineering architecture page
- `imprint.html` and `privacy.html`: legal provider information and site-specific privacy notice (their `<main>` is unchanged by the redesign)
- `404.html`: self-contained not-found page (own hashed style and script, root-absolute URLs)
- `site.css`, `site.js`: shared design system and behaviour for every page (tokens, header, footer, buttons, frames, theme, download logic, copy buttons, the still viewer)
- `cursor-intro.css`, `cursor-intro.js`: the prologue before the name on Home (one canvas: a typed prompt, the board filling to twelve sessions, the cursors running together into one block cursor, turning pink as they arrive, that types "Meet IVE" small; the line grows and its IVE dissolves into the name's letters, which grow with it to full size; while the page still loads, a small "Loading" status in the markup stands where the prompt will appear, gone with the canvas's first drawn frame)
- `name-intro.css`, `name-intro.js`: the original letter zoom and measured word-unfold effect on Home and Story (on Home, after the prologue, without the zoom), with visible navigation and the made-by signature; `opening.css` and `opening.js` are retained legacy source, no longer loaded
- `home.css`: retained phone, install and maker styles; `home.js`: the previous Why IVE/reel behaviour, no longer loaded by the homepage
- `demo.css`, `demo.js`: the app previews in the page frames (iframes of `assets/demo/r5/frame.html`): sharp automatic scenes that always play in view, one Pause/Play next to each, the reel's chapters; loaded by `index.html` and `product.html`
- `try.html`, `try.js`: "Try it yourself": the IVE app built into the site at window size under a slim strip (brand, the introduction's Skip/Again, Back to ive.dev), opened from the header of every page, the hero, the Try band, the Product and Download heads and the footer; `assets/demo/r7/frame.html?mode=app&tour=1`
- `madeby.js`: the AIFOREU logo film in the maker strip
- `assets/phone/`: the iPhone mockup's device frame (from the mehrmal site), used by the IVE for iPhone section on Home, Product and Download. The iPhone app is not released: the site says "Coming soon to the App Store" and carries no install or build instructions (owner, 2026-10-24).
- `assets/demo/`: the app demos (rounds 4 to 7, 23/24 Oct 2026). Two versioned runtime folders, because the CDN caches these files for hours and a release that changes a module graph gets a new folder: `r5/` is the previews' runtime (unchanged since round 5), `r9/` the app's (round 7: the Board opens as terminals, every control works locally: `lib/mod-ui.js`, `mod-session.js`, `mod-settings.js`, Codex's review/pipelines/flow modules; r9 differs from r8 only in the Phone view's copy; `r6/` and `r7/` are frozen copies of earlier nights, kept while cached `try.js` copies still point there; remove them after 2026-10-24) (`mode=app`, with the introduction `lib/mod-tour.js`): `app.css` is the IVE 1.0.17 frontend's compiled stylesheet (only the font URLs rewritten), `fonts/` its Inter and JetBrains Mono, `frame.html` + `frame.js` the demo document (one preview scene or the app per iframe, `?scene=…&theme=light|dark[&mode=app][&tour=1][&chip=parent][&variant=hero][&minScale=0.8][&at=seconds]`), `lib/` the markup components copied from the app's DOM (`ui.js` shell, sidebar, header, session screen; `board.js`, `home.js`, `taskflow.js`, `pipeline.js`, `review.js`), the DOM terminal (`term.js`), the timeline of the previews (`timeline.js`), the DOM morph (`dom.js`), and the interactive app (`app.js` core over `data.js`, the modules `mod-review.js`, `mod-pipelines.js`, `mod-flow.js`): Home, Board, sessions, terminals you can type into, canned agent replies, Review, Pipelines, the guided task; `scenes/` one deterministic script per preview scene (`board`, `attention`, `terminal`, `terminals`, `start`, `autofix`, `pipelines`, `loopdetect`, `review`); `posters/` the generated poster images (`scripts/demos/posters.mjs`). No recording plays anywhere; the Orbit project, its sessions and the CLI-style terminal text are labelled demo data
- `assets/app/`: the three dark stills of the Product page (`still-model@2x.webp`, `still-mode@2x.webp`, `still-palette@2x.webp`); the recordings that lived here until round 3 are gone (git history keeps them)
- `assets/aiforeu/`: the AIFOREU logo film and its poster
- `scripts/demos/`: tooling around the real IVE frontend on its isolated test transport: `snapshot.mjs` writes DOM dumps and screenshots of every state of a story (the references the generated scenes copy their markup from), `posters.mjs` renders the generated scenes to poster images, `record.mjs` + `lib/recorder.mjs` is the former frame-by-frame recorder (kept; its `clips/` are the storyboards of the scenes)
- `design/`: redesign brief, research and shared partials (`design/partials/USAGE.md`); not published
- `install.sh`: the one-line installer, published at `https://ive.dev/install.sh` (not excluded in `_config.yml`)
- `assets/og.html`: 1200×630 Open Graph image source
- `assets/fonts.css` and `assets/fonts/`: self-hosted Archivo, Source Sans 3 and IBM Plex Mono, including OFL license texts
- `DESIGN.md`: binding visual and interaction contract
- `_reference-old-site-copy.txt`: product capability truth source

## Open Graph image

Serve the folder, open `assets/og.html` in a browser at exactly 1200×630, and capture the viewport to `assets/og.png`. The HTML is the editable source; do not hand-edit the PNG.

## Product truth

- IVE is open source under the Apache 2.0 license. The public repository is `https://github.com/michaelAGI/ive`.
- The primary homepage action opens the browser demo. The secondary Mac action links to the Mac app: https://github.com/michaelAGI/ive/releases/latest/download/IVE-macOS-arm64.dmg (latest GitHub release of michaelAGI/ive, Apple silicon, macOS 13.5 or newer, signed by AIFOREU GmbH and notarized by Apple). The one-line installer `curl -fsSL https://ive.dev/install.sh | bash` installs that Mac app on Apple silicon (downloads the latest release, checks the SHA-256 and the notarization, puts IVE into Applications, opens it; running it again updates) and builds from source on Linux and Intel Macs (code in `~/.ive`, `ive` command in `~/.local/bin`; `ive` then runs IVE in the background). From a clone: `git clone https://github.com/michaelAGI/ive.git`, `cd ive`, `bash install.sh` (the Mac app on Apple silicon; elsewhere it builds the clone, started with `bin/ive`).
- Requirements for the source build (Linux, Intel Macs, `IVE_INSTALL=source`): Python 3.11+, Node.js 22.12+ with npm, Git, and at least one supported coding CLI. The Mac app, also when the one-line installer installs it, needs none of the first three: Apple silicon (M1 or newer), macOS 13.5 or newer, and at least one coding CLI you are signed in to. It opens in its own window, so no terminal or browser tab is needed. Telemetry is off by default.
- Do not promise Windows support, an Intel Mac app, a community, stars, or contributors. Show no version number or file size for the Mac app.
- Supported agents are Claude Code, Codex and Gemini (Antigravity CLI). The active CLI profiles in IVE 1.0.17 are Claude Code, Codex CLI and Antigravity CLI, Google's agent CLI with Gemini models (`backend/cli_profiles.py`, checked 2026-10-22). The standalone Gemini CLI profile is inactive in 1.0.17, so write "Claude Code, Codex and Gemini (Antigravity CLI)" in full lists, "Claude Code · Codex · Gemini" in short lists and chips, and never "Gemini CLI" alone. Models depend on the installed CLI and account; illustrations name only Haiku, Sonnet, Opus and the Gemini Pro and Flash models (`gemini-3.1-pro`, `gemini-3.5-flash`).
- The app demos are generated on the page: the IVE 1.0.17 interface rendered live from the app's own stylesheet and DOM markup (copied from the real frontend on its isolated test transport), driven by deterministic scripts, scrollable and selectable. The Orbit project, its sessions, conversations and the CLI-style terminal text are a clearly labelled demonstration; no provider ran and no live execution success is claimed. The opening scene elsewhere on the page is an illustration. Owner decision 2026-10-23: no recordings of the app anywhere on the site.
- Reverify compatibility against the app before changing provider claims.
- Use only documented totals: 140+ API routes, 40+ shortcuts, 35+ MCP tools, 30+ event types, 20 RALPH iterations maximum, 8,000+ skills, a 6-column board, a 9-step package scan, 3 access modes, and 4 memory types. The package scan (AVCP) is off by default since IVE 1.0.17; always call it optional.
- Do not add social proof, customer claims, star counts, integrations, models, metrics, or capabilities that are absent from the product-truth source.

## Installer distribution

The only installer published from this repository is the shell script `install.sh` at the site root. On Apple silicon it installs the Mac app from the latest GitHub release of michaelAGI/ive, elsewhere it builds IVE from the public source repository, and it must stay byte-identical to `get.sh` on the main branch of michaelAGI/ive. The Mac app is a release asset of michaelAGI/ive; the site only links it. Do not commit application bundles, DMG/PKG/IPA installers, release ZIP archives, or private app source here.

## Beta waitlist (removed)

Until 2026-10-22 the homepage collected beta signups through a Cloudflare Worker
(`ive-beta-waitlist`) with a D1 database of the same name. IVE is open source now
and the homepage offers the install instead. On 2026-10-22 the stored entries, the
D1 database and the Worker were deleted, and the signup code was removed from this
repository; the privacy notice no longer mentions the waitlist. Its last state is
in the git history before that removal. Do not bring back a signup form without a
new backend and a matching privacy notice.

## IVE interest list: double opt-in, 2026-11-08

The owner requested double opt-in on 2026-11-08, superseding the earlier save-only
choice. Home and Download still offer the app without requiring any signup.

- Forms: `https://ive.dev/#updates` and `download.html#updates`.
- API: `https://ive-updates.intertrans-vorschau.workers.dev/api/subscribe`.
- Worker and EU D1 database: `ive-updates` in the existing Maxi Cloudflare account.
- Each explicit signup sends a neutral confirmation email from `IVE <beta@ive.dev>`
  through Cloudflare Email Service. Replies go to `contact@aiforgov.eu`.
- The link opens `/confirm` on the Worker. GET only shows a form; an explicit POST
  confirms, so ordinary email link scanners do not opt anyone in. No JS is required.
- Tokens use 32 random bytes; only SHA-256 hashes are stored. Pending requests and
  tokens expire seven days after signup. Resending preserves still-valid links.
- Confirmation records the server timestamp and `confirmation_method=email-link`.
  The original consent text/version/time and form source are retained. No names,
  IP addresses, raw tokens, mail-open tracking or marketing campaigns are stored.
- The text version remains `2026-11-01-beta-news-v1`: the consent scope is unchanged.
- Duplicate confirmed signups do not change consent or send email. Pending attempts
  are limited to one every 10 minutes, three per address per day, and 500 globally
  per UTC day, including failed attempts. The existing IP / IPv6 /64 limit remains.
- The scheduler only deletes expired data. It never contacts legacy entries or sends
  reminders. Existing unverified rows remain unverified until a fresh explicit signup
  and confirmation. `initial_verification` is historical; `confirmed_at` together with
  `confirmation_method` determines current eligibility.
- Confirmed subscriptions and legacy submissions expire twelve months after signup.

### Export and removal

[Open the private subscriber database](https://dash.cloudflare.com/09e664eee5ea251d91f207aba07c29bf/workers/d1/databases/ab8dcb7d-4eaa-4786-84e7-dc686e6f5d95).

`npm run subscribers:export` exports **only confirmed** subscriptions with the current
consent scope, confirmation evidence and a signup less than twelve months ago. CSVs
are formula-safe and written privately to the ignored `subscriber-exports/` directory.
Existing old exports are not proof of double opt-in and must not be used for sending.

Remove withdrawn addresses through the private database, including their token rows
and any saved exports. Foreign keys cascade token removal. The contact address for
withdrawal is `contact@aiforgov.eu`. No public list or export endpoint exists.

### Validate and activate

1. Run `npm test`. Tests use real in-memory SQLite and a stub mail provider; they do
   not send email. Browser verification: `node scripts/qa-double-opt-in.mjs` with
   Playwright available (or `PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs`).
   It intercepts all requests and covers Chromium/WebKit, phone/desktop, and no-JS. For an existing DB, apply the additive migration with
   `wrangler d1 migrations apply ive-updates --remote`. For a fresh DB, use
   `worker/schema.sql` instead. Never apply both to the same database.
2. In the Cloudflare account that owns `ive.dev` (`michaelsaccount`), verify that
   Email Service → Email Sending is enabled for the domain. Disable Email preview
   to avoid storing confirmation mail bodies/links. Use a dedicated API token with
   **Email Sending: Edit**, restricted to that account. Do not reuse the developer's
   Wrangler OAuth token as a Worker secret.
3. Set `EMAIL_ACCOUNT_ID` and `EMAIL_API_TOKEN` as Worker secrets using
   `wrangler secret put`. Neither belongs in Git, client code, logs or chat.
4. Deploy the Worker and check `/health`. Missing mail credentials or the old schema
   make the new Worker fail closed. Configuration readiness is not a delivery test.
5. With an owner-controlled mailbox, verify one signup, actual inbox delivery,
   GET without confirmation, the explicit confirmation, and confirmed-only export.
6. Publish the site and privacy notice to GitHub Pages after the backend works.
   Frontend and Worker are separate deployments. Verify both live.

Production activation remains pending until the mail account is configured and the
inbox test passes. Do not replace the live service with an unconfigured Worker.
No mass confirmation send, newsletter or welcome email is part of this change.

## Website review, 2026-10-25

The workspace-first homepage combines a review of Herdr, tmux, Zellij, cmux,
Warp, Solo, Conductor, Emdash and Superset. It changes the marketing website,
not the IVE application. No competitor assets or product claims were imported.
The three additional poster files in `assets/workspace/` are rendered from the
existing IVE demo interface. They are scripted examples, not provider runs.

Browser acceptance: `node scripts/qa-workspace.mjs` with Playwright available
(or set `PLAYWRIGHT_MODULE` to its installation directory). Start the local
static server on port 4187, or set `PREVIEW_URL`. This verifies responsive
layouts, local resources, tabs, keyboard controls, reduced motion, copying the
install command, no-JS fallbacks, and Chromium/WebKit rendering. Reports and
screenshots go to the ignored `review/` folder.

## Mac release acceptance

For each Mac release, complete the app release, installation and website checks
together. A source push alone does not update the Mac download.

1. Build the clean public app commit; keep private iPhone/Watch source and private
   builds out of the public repository, release and site.
2. Verify the terminal/session workflow, bundle and native runtime. Sign all
   embedded code with Developer ID, submit to Apple, wait for acceptance, export
   the notarized app, and validate its ticket, signature and Gatekeeper verdict.
3. Package that app as `IVE-macOS-arm64.dmg`, publish its SHA-256 alongside it,
   then publish the matching GitHub release as latest. Do not replace an existing
   release silently or point latest at an unsigned development build.
4. Download the asset through the site's latest-release link. Verify its hash,
   embedded source revision, app ticket and Gatekeeper verdict independently.
5. Compare the served `install.sh` byte for byte with public `main:get.sh`, check
   the download page and deployment, and update any affected install instructions.
6. When updating the owner's Mac, verify the installed app at `/Applications/IVE.app`,
   preserve projects/chats and hooks, and remove duplicate application copies.

Record concrete evidence and any failed or excluded checks. There is no
automatic Mac publisher or desktop updater attached to every Git push.
