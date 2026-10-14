# Clankers helped me! 🎮🤖

A tiny, zero-build **AI-disclosure thumbnail generator** for game jams (made with
[Ludum Dare](https://ldjam.com/) in mind).

It produces a playful banner headlined **"Clankers helped me!"** (editable) that
honestly discloses *how* AI helped you make your jam game. Configure it in the
admin page, export a PNG, and share a self-contained URL.

## Run it

No build step, no dependencies, no server required:

```
open index.html
```

Everything runs client-side. (An internet connection is only used to load the
Fredoka / Nunito display fonts from Google Fonts — the tool falls back to system
fonts when offline.)

## What it generates

A single banner image containing:

1. **A gently animated robot / AI thumbnail at the top** (the default clanker, or
   your own upload) — it bobs and tilts in the live preview; downloads capture a
   clean, still pose.
2. An editable **headline** with an *AI DISCLOSURE* tag (defaults to
   "Clankers helped me!").
3. **A short description** — defaults to `Clankers helped me build my game!`.
4. Optional **game title** ribbon.
5. Optional **creator nickname** byline ("by …").
6. Optional **category chips** — Code generation / game logic, **Learning**,
   Testing, Fun, Innovation, Theme, Graphics, Audio, Humor, Mood — each with an
   optional note about how AI helped there.
7. Optional **AI tools**, each with how it helped and a price (API tokens,
   per month, or **Free (0$)**). Prices can be turned off for the banner.
8. Optional **Level of AI used** badge (the dark-software-factory scale, 0–5).
9. Optional **footer comment**.
10. A **playful, procedural background** seeded by the share-link hash.

## Admin controls

| Control | Notes |
| --- | --- |
| Headline | The big line; defaults to "Clankers helped me!". |
| Short description | Free text, wrapped automatically. |
| Game title | Optional; drawn as a big ribbon. |
| Creator nickname | Optional; signed just under the game title ribbon as "by …". |
| Robot thumbnail | Optional image override (PNG/JPG/SVG/GIF). |
| Categories | Checkbox + optional note for each category. |
| AI tools | Name + "how it helped" + price mode: **Free (0$)** / API tokens / per month. Add with **＋** (or Enter); remove with **✕**. |
| Show price for tool in banner | Toggle (**on by default**); turn off to hide prices from the banner. |
| Level of AI used | Dropdown, Level 0–5 with short descriptions, plus an admin-only **ⓘ Shapiro Scale** reference panel with the full text of Levels 0–5. |
| Footer comment | Optional one-liner (💡 idea-lamp icon, no quote marks, spans the full banner width). |
| Image size | Super compact (512², **default**) / square (1080²) / wide / large square / portrait / tiny (250²). |
| Playful background | Toggle on/off. |

Buttons: **✨ Generate**, **🔗 Copy Share URL**, **⬇️ Download PNG**, plus
**🎲 Surprise me** and **↺ Reset**.

The **Live preview** is 1:1 — it shows the selected banner at its true pixel
size (a small pill in the preview header reports the exact dimensions). Larger
sizes simply scroll inside the preview card, so what you see is the real thing.
The robot thumbnail is **gently animated** in the preview (a slow hover-bob and
tilt); PNG exports always capture a clean, still pose.

### Download filename

Exports are named from the content and the moment of download:

```
clankers-helped-me-build-<game-title>-by-<nickname>-<YYYY-MM-DD-HHMMSS>.png
```

Empty title / nickname segments are simply skipped.

## Sharing

**Copy Share URL** encodes the whole configuration as URL-safe base64:

```
index.html?d=<base64url-state>&h=<hash>
```

Opening that link restores the exact same banner. The **hash** (`h`) doubles as
the seed for the procedural background, so the same share link always draws the
same playful background. If a custom thumbnail is too large to fit in a share
link, it is dropped from the URL (you'll get a warning) but still appears in the
downloaded PNG.

### Read-only shared view

When a link is opened (i.e. the URL contains a `d` parameter), the page enters a
**read-only mode**: the whole editor is hidden and every form input is disabled,
so the link shows only the finished banner, headed by a **“Shared by
&lt;nickname&gt;”** line above the banner (or “Shared banner” when no nickname was
set). Below the banner sit three matching buttons on one row:

| Button | What it does |
| --- | --- |
| **⬇️ Download PNG** | Saves the banner (same naming scheme as above). |
| **🍴 Fork Banner** | *Forks* the shared banner back into the full editor so you can tweak and re-share it. The state is kept and the URL gains an `&e=1` flag, so reloads stay in edit mode. |
| **Fork me on GitHub** | Opens the project repository. |

To keep editing directly, open `index.html` with no parameters.

## Repository

The shared view links to the project with a **Fork me on GitHub** button:

```html
<a class="btn shared-only" id="repoBtn"
   href="https://github.com/AweSkyBear/LD-Jam-Clankers-Helped-Me-Banner-Generator">Fork me on GitHub</a>
```

Issues and forks are welcome — the whole thing is one folder of plain
HTML/CSS/JS with no build step, so it is easy to hack on.

## Project layout

```
index.html            admin page
LICENSE.md            MIT license
assets/
  styles.css          playful admin styling
  robot.svg           brand / favicon robot
src/
  robot.js            inline robot SVG + image/font loading helpers
  state.js            config (categories, levels, sizes) + default/normalized state
  url.js              base64 + hashing, compact payload, share URL build/read
  background.js       seeded RNG, palettes, procedural backgrounds
  render.js           the canvas renderer that draws the whole banner
  app.js              admin UI wiring (form ⇄ state ⇄ render)
```

Classic `<script>` tags are used deliberately so the page works straight from
`file://` without a dev server.

## License

MIT © 2026 **AweSkyBear**. See [LICENSE.md](LICENSE.md).
