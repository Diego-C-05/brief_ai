# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BriefAI is a news intelligence platform that collects RSS feeds, analyzes them with AI, and serves a personalized dashboard. The repo contains two sibling projects that share a single Express backend:

- **`frontend-BriefAI/`** — The active frontend (Vite 8 + React 19 + TypeScript 6). This is the developed, production app.
- **`digital-twin-news-feature-nicol-ai-frontend/`** — Contains the shared Express backend (`backend/`) and an earlier CRA-based frontend scaffold with no `src/` code written.

The data pipeline (Node.js + RSS Parser) and AI analysis service (Python + Claude API) run externally and are not in this repo.

## Development Commands

### Frontend (`frontend-BriefAI/`)
```bash
cd frontend-BriefAI
npm install
npm run dev          # Vite dev server on :5173
npm run build        # tsc -b && vite build (output to dist/)
npm run lint         # eslint .
npm run preview      # Preview production build
```

### Backend (`digital-twin-news-feature-nicol-ai-frontend/backend/`)
```bash
cd digital-twin-news-feature-nicol-ai-frontend/backend
npm install
npm run dev          # nodemon on :5000
```

MongoDB Atlas must be reachable (connection string in `backend/.env`). No local MongoDB or Redis required — the database is cloud-hosted.

## Architecture

### Two-Backend Pattern

The frontend connects to **two separate backends**, not one:

```
[Express Backend :5000]          [n8n Workflow Engine (external)]
  /api/auth/*                      POST /briefai/feed
  /api/articles/*                  POST /briefai/feedback
  /api/profile/*                   POST /briefai/profile/update
  /api/stats/*
```

- **Express** handles auth (JWT 24h), article CRUD, profile management, and stat aggregations via MongoDB.
- **n8n** (hosted at `VITE_N8N_URL`) handles the personalized feed generation, user feedback/votes, and profile sync. The User model's Mongoose `post('save')` hook syncs to a `user_profiles` collection that n8n reads/writes independently.

### Frontend Service Layer

All four service files use raw `fetch()` — no Axios:

| Service | Target | Purpose |
|---------|--------|---------|
| `authService.ts` | Express | Login, register, getMe, JWT decode |
| `apiService.ts` | Express + n8n | Stats, profile CRUD (PUT also syncs to n8n webhook) |
| `feedService.ts` | n8n | Personalized feed via POST with userId |
| `feedbackService.ts` | n8n | Article upvote/downvote with 5s timeout |

### Auth Flow

JWT stored in `localStorage('briefai_token')`. The active route guard is an **inline `ProtectedRoute` function in `App.tsx`** that checks both the `isAuthenticated` React state and localStorage (fallback for race conditions after registration). A standalone `ProtectedRoute.tsx` component exists but is unused.

### State Management

No global store — entirely React `useState` + prop drilling + `localStorage` for persistence. Key localStorage keys:
- `briefai_token` — JWT
- `briefai-onboarding` — temporary wizard selections (topics + keywords), consumed during registration then stale
- `briefai-settings` — settings snapshot fallback when API is unavailable

### User Flow

Unauthenticated → Landing (`/`) → Onboarding wizard (`/onboarding`, 2 steps: topics then keywords, saved to localStorage) → Register (`/register`, reads onboarding data) → Protected area: Feed (`/feed`), Trends (`/tendenze`), Settings (`/impostazioni`).

Protected pages share a layout: `FeedSidebar` (left nav) + `FeedTopbar` (filter bar) + page content.

## Environment Variables

**Frontend** (`frontend-BriefAI/.env`):
- `VITE_API_URL` — Express backend URL (default: `http://localhost:5000`)
- `VITE_N8N_URL` — n8n webhook base URL

**Backend** (`digital-twin-news-feature-nicol-ai-frontend/backend/.env`):
- `MONGO_URI`, `JWT_SECRET`, `NODE_ENV`, `PORT`

## Key Conventions

- React Compiler is enabled via `@rolldown/plugin-babel` + `babel-plugin-react-compiler` in Vite config — this auto-memoizes components but can slow dev/build
- TypeScript strict-ish: `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `verbatimModuleSyntax`, `allowImportingTsExtensions`
- Article sentiment is a union type: `'Positive' | 'Negative' | 'Neutral'`
- FeedContent does **client-side filtering** by sentiment and topic after fetching from n8n
- Voting in FeedContent uses **optimistic updates** with rollback on error
- Profile updates go to both Express backend AND n8n webhook (dual-write)

## Known Issues

- Subscription plan (free/pro) is static UI — `onCancelSubscription` and `onUpgrade` are void stubs in `AccountSettings`
- Email validation is too permissive (accepts malformed emails)
- Links in processed article summaries should be stripped but aren't
- Several `apiService` functions (`fetchCategoryStats`, `fetchSourceStats`, `fetchOverview`) are defined but never consumed by any component
