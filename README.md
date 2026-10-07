# Janify

> Listen to songs by former Johnny's artists, album by album.

[🔗 Live Site](https://janify.kkweb.io/)

## ✨ Features

- 💿 Browse 43 artists and 412 albums by artist, by album or by decade, with each artist's YouTube channel icon
- ▶️ Play a whole album in order, with shuffle and repeat
- 🎬 One player for the whole site, so playback continues while you browse
- 📲 A full-screen player view on phones; pull the title down to shrink the player to a corner
- ⌨️ Keyboard shortcuts (space, arrows, M, S, R), listed on the settings page
- 🔆 Keeps the phone screen awake while playing
- ❤️ Favorite songs, albums and artists; favorite songs form a playlist you can reorder
- 🔍 Search across every artist, album and song (`/search`)
- 🌗 Dark and light themes
- 📱 PWA-ready, installable to the home screen, with an optional edge swipe to go back on iOS

## 🛠 Tech Stack

- Next.js (App Router, fully static) + React + TypeScript
- Tailwind CSS
- YouTube IFrame Player API
- Vercel

## 🚀 Development

```bash
pnpm install
pnpm dev
```

The site reads only `src/data/catalog.json`, so no environment variables are needed to run it.

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm knip
pnpm test       # Vitest
pnpm test:e2e   # Playwright, on a production build, at desktop and mobile widths
```

lefthook runs formatting, lint, type and secret checks on commit. GitHub Actions runs the same checks, the build and the E2E tests on every push to `main` and on pull requests.

## 🎵 Playback

All audio is embedded from YouTube; the site stores no audio or video files. For each song it prefers a full-length official music video, then the official audio from the artist's Topic channel, and falls back to an unofficial upload only when neither exists.

The player follows the YouTube API terms: it stays at least 200×200 and visible, nothing is drawn over it, and thumbnails are shown unaltered.

## 🕸 Data

Notion is the source of truth: three databases for artists, albums and songs. The build never calls Notion; the data is exported to JSON and committed.

```bash
pnpm notion:export                        # Notion → src/data/catalog.json
pnpm notion:videos && pnpm notion:export  # add newly found unofficial videos, then export
pnpm youtube:icons                        # write each artist's channel icon to Notion
pnpm youtube:check                        # check that every listed video can still be embedded
```

Track lists come from Wikipedia; videos come from the YouTube Data API. A GitHub Actions run checks every Monday that each listed video can still be embedded, and fails if any cannot.

The scripts need two keys in `.env.local`:

| name              | value                                           |
| ----------------- | ----------------------------------------------- |
| `NOTION_TOKEN`    | the Notion integration token                    |
| `YOUTUBE_API_KEY` | the YouTube Data API key for the Janify project |

How the first data set was built, the YouTube terms the site works within, and why things are the way they are: see [CLAUDE.md](CLAUDE.md) (in Japanese).
