# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A wedding live display system ("歲月敬好 × 共度玗生") — a React SPA designed for projection at a wedding venue. It provides four modes: a media wall with guest messages, interactive voting, a lucky draw, and a control panel for the event operator.

The frontend expects a backend server (not in this repo) providing REST APIs and WebSocket events.

## Commands

- `npm run dev` — Start Vite dev server on port 3000 (binds 0.0.0.0)
- `npm run build` — Production build
- `npm run preview` — Preview production build

No test framework or linter is configured.

## Architecture

**Single-page React app** with Vite + TypeScript. No router — mode switching is handled via `AppMode` enum state in `App.tsx`.

### Four App Modes (`types.ts: AppMode`)
- **WEDDING_WALL** — Full-screen media slideshow (images/videos) with a scrolling guest message wall overlay. Supports pinning a specific media item and configurable slideshow/scroll speeds.
- **VOTING** — Three-phase voting flow (SETUP → ACTIVE → RESULTS). Guests vote via QR code on their phones; votes arrive via WebSocket.
- **LUCKY_DRAW** — Draws 2 winners from voting participants. Locked until voting ends.
- **CONTROL** — Operator panel for managing media schemes (groups of media assets), upload, drag-to-reorder, visibility toggle, pin, slideshow/scroll speed, and message wall toggle.

### Key Data Concepts
- **Scheme** (`SchemeId`): A named group of `MediaItem[]`. Multiple schemes can be prepared; one is "live" on the wedding wall at a time. Managed in `ControlPanel.tsx`.
- **MediaItem**: `{ id, url, type: 'image'|'video', visible }` — visibility controls whether it appears in the slideshow rotation.

### Services (`services/`)
- **`apiService.ts`** — REST client. Base URL from `VITE_API_URL` env var (default `http://localhost:8080/api`). Endpoints: `/messages`, `/media/schemes`, `/votes/options`, `/votes/results`, `/guests`.
- **`wsService.ts`** — Singleton WebSocket client with auto-reconnect. URL from `VITE_WS_URL` env var (default `ws://localhost:8080/ws`). Event types: `message:new`, `vote:cast`, `vote:reset`, `control:sync`, `media:update`. Uses a pub/sub pattern (`on`/`off`/`dispatch`).

### Styling
- Tailwind CSS loaded via CDN (`<script src="https://cdn.tailwindcss.com">` in `index.html`), not as a build dependency.
- Custom CSS classes defined in `index.html`: `.glass-card`, `.rose-gold-glow`, `.animate-scroll`, `.danmu-item`, `.animate-shimmer`, `.mask-linear-gradient`.
- Brand accent color: `#E11D48` (rose/red), exported as `ROSE_GOLD` from `constants.ts`.
- Custom font: `CustomWeddingFont` (expects `wedding-font.woff2` in project root), falls back to Google Fonts "Klee One".

### Environment Variables
- `VITE_API_URL` — Backend REST API base URL
- `VITE_WS_URL` — Backend WebSocket URL

## Language

UI text is primarily in Traditional Chinese (zh-TW). Comments in the codebase are also in Chinese.