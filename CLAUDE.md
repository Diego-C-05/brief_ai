# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BreafAI** is a fullstack news/article curation app with personalized topic filtering. It has two independent sub-projects with separate `node_modules` and `package.json` files:

- `frontend-BriefAI/` — React 19 + TypeScript + Vite SPA
- `backend/` — Express 5 + Node.js + MongoDB (CommonJS)

## Commands

### Frontend (`cd frontend-BriefAI`)
```bash
npm run dev       # Vite dev server at localhost:5173
npm run build     # tsc -b && vite build (type-check + bundle)
npm run lint      # ESLint 9
npm run preview   # Preview production build
```

### Backend (`cd backend`)
```bash
npm run dev       # Nodemon auto-restart dev server at localhost:5000
npm start         # Production server
```

There is no test suite configured. Run `npm run build` in the frontend to type-check.

## Architecture

### Frontend (`frontend-BriefAI/src/`)

**Routing** is defined in `App.tsx`. Routes are either public or wrapped in `ProtectedRoute` (checks `localStorage` for `briefai_token`):
- Public: `/`, `/login`, `/register`
- Protected: `/onboarding`, `/feed`, `/impostazioni`

**Layers:**
- `pages/` — page-level components, one per route
- `components/` — reusable UI pieces used inside pages
- `services/` — all API calls and auth logic
  - `authService.ts` — login/register, JWT decode, token management
  - `apiService.ts` — profile CRUD + triggers n8n webhook on profile update
  - `feedService.ts` — article feed fetching
  - `feedbackService.ts` — user engagement signals

**Auth flow:** Backend returns a JWT → stored as `briefai_token` in `localStorage` → every request adds `Authorization: Bearer <token>` via `getAuthHeader()` in the service files.

**State management:** Local `useState` only; no global state manager. Persistent state goes to `localStorage`.

**Styling:** Per-page CSS files (e.g. `HomePage.css`) co-located with the page component. No CSS framework.

### Backend (`backend/src/`)

**Middleware stack** (in order in `server.js`): Helmet → CORS → Morgan → JSON body parser → routes → global error handler.

**Routes:**
- `POST /api/auth/register` / `POST /api/auth/login` / `GET /api/auth/me` — `routes/auth.js`
- `GET /api/profile` / `PUT /api/profile` — `routes/profile.js` (requires `middleware/auth.js` JWT check)
- `GET /health` — inline in `server.js`

**Data models:**
- `models/User.js` — primary user document in `users` collection. Password hashed via bcrypt `pre-save` hook. Has a `post-save` hook that upserts a corresponding `UserProfile` document.
- `models/UserProfile.js` — mirror of user preferences in `user_profiles` collection, designed for n8n workflow consumption. `weights` stored as plain `Object` here (not `Map`) for JSON compatibility.

**Key detail — weights serialization:** In `User.js`, topic weights are a `Map<string, number>`. When sending to the frontend or syncing to `UserProfile`, the Map is converted to a plain object via `Object.fromEntries(user.weights)`.

### N8N Integration

When a profile is saved via `PUT /api/profile`, the frontend's `apiService.ts` also POSTs to the n8n webhook URL (`VITE_N8N_URL/briefai/profile/update`). The `UserProfile` collection is the backend's side of this sync. The feed content itself currently uses mock data pending full n8n integration.

## Environment Variables

**Backend `.env`:**
- `MONGO_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — secret for signing tokens (24h expiry)
- `PORT` — defaults to 5000
- `NODE_ENV` — `development` or `production`
- `CORS_ORIGIN` — allowed frontend origin in production

**Frontend `.env`:**
- `VITE_API_URL` — backend base URL (e.g. `http://localhost:5000`)
- `VITE_N8N_URL` — n8n webhook base URL

## Conventions

- **Backend code has Italian comments** — this is intentional for team context, not a bug.
- **CORS:** In dev, allows `localhost:5173`. In prod, reads `CORS_ORIGIN` env var. Requests without an `Origin` header (Postman/curl) are always allowed.
- **Onboarding** triggers when a user registers and has not yet set preferences. The `OnboardingPage` redirects to `/login` if no token is present.
- **No test framework is configured.** The `frontend-BriefAI/INFO.md` file documents the technical decisions and known gaps (no error boundaries, no automated tests, feed uses mock data).
