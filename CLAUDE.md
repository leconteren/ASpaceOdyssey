# CLAUDE.md

## Project Overview

Monolith 饭否 & Prediction Market — a React web app for sharing ideas (microblog feed) and making predictions (binary prediction market with points). Dark cosmic-themed UI with Chinese language support.

## Build & Run

```bash
npm install          # Install dependencies
npm run dev          # Dev server on http://localhost:3000
npm run build        # Production build to dist/
npm run preview      # Preview production build
```

Requires `GEMINI_API_KEY` set in `.env.local` for API features.

No test suite is configured.

## Tech Stack

- **React 19** with TypeScript (~5.8), built with **Vite 6**
- **Tailwind CSS v3** (loaded via CDN in index.html)
- **Lucide React** for icons
- **localStorage** for persistence (no backend/database)
- ES modules (`"type": "module"` in package.json)

## Project Structure

Flat layout — all source files live at the root:

- `App.tsx` — Main app component with all views (FeedView, MarketView, ProfileView) and state logic
- `index.tsx` — React entry point
- `index.html` — HTML template, Tailwind CDN, import maps, Google Fonts
- `types.ts` — TypeScript interfaces (User, Post, PredictionEvent, Vote, ViewType)
- `constants.tsx` — Initial data constants and date-parsing utilities
- `vite.config.ts` — Vite config (port 3000, `@` path alias to root, GEMINI_API_KEY env)
- `tsconfig.json` — Targets ES2022, bundler module resolution, `@/*` path alias
- `metadata.json` — AI Studio app metadata

## Conventions

- **Components**: PascalCase (`FeedView`, `MarketView`, `ProfileView`) — defined inline in `App.tsx`
- **Functions**: camelCase, event handlers prefixed with `handle` (`handleLogin`, `handleVote`)
- **Types/Interfaces**: PascalCase in `types.ts`
- **Constants**: UPPER_SNAKE_CASE (`INITIAL_USER`, `INITIAL_POSTS_RAW`)
- **IDs**: Prefixed by type (`post_`, `user_`, `event_`) + unique suffix
- **Timestamps**: Milliseconds via `Date.now()`
- **Styling**: Tailwind utility classes inline, dark-mode cosmic theme (black bg, cyan/purple accents, glass-morphism cards)
- **State**: React hooks (useState) + localStorage for persistence
- **Fonts**: Inter (English), Noto Sans SC (Chinese)
