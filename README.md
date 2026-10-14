# Clankers helped me! 🎮🤖

A tiny, zero-build **AI-disclosure thumbnail generator** for game jams (made with
[Ludum Dare](https://ldjam.com/) in mind).

It produces a playful banner that says **"Clankers helped me!"** and honestly
discloses *how* AI helped you make your jam game. Configure it in the admin page,
export a PNG, and share a self-contained URL.

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

1. **A robot / AI thumbnail at the top** (the default clanker, or your own upload).
2. **"Clankers helped me!"** headline with an *AI DISCLOSURE* tag.
3. **A short description** — defaults to `Clankers helped me build my game!`.
4. Optional **game title** ribbon.
5. Optional **category chips** — Fun, Innovation, Theme, Graphics, Audio, Humor,
   Mood — each with an optional note about how AI helped there.
6. Optional **AI tools** list.
7. Optional **Level of AI used** badge (the dark-software-factory scale, 0–5).
8. Optional **footer comment**.
9. A **playful, procedural background** seeded by the share-link hash.

## Admin controls

| Control | Notes |
| --- | --- |
| Short description | Free text, wrapped automatically. |
| Game title | Optional; drawn as a big ribbon. |
| Robot thumbnail | Optional image override (PNG/JPG/SVG/GIF). |
| Categories | Checkbox + optional note for each of the 7 categories. |
| AI tools | Add with the **＋** button (or Enter); remove with **✕**. |
| Level of AI used | Dropdown, Level 0–5 with descriptions. |
| Footer comment | Optional one-liner. |
| Image size | Square / wide / large square / portrait. |
| Playful background | Toggle on/off. |

Buttons: **✨ Generate**, **🔗 Copy Share URL**, **⬇️ Download PNG**, plus
**🎲 Surprise me** and **↺ Reset**.

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

## Project layout

```
index.html            admin page
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
