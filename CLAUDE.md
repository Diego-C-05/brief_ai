# BreafAI Project Guide

**BreafAI** is a personalized news and content feed platform with user authentication, interest-based filtering, and subscription tiers (Free/Pro).

## Architecture Overview

### Frontend (`frontend-BriefAI/`)
- **Framework:** React 19 + TypeScript + Vite
- **Key packages:** React Router 7, React Compiler enabled
- **Dev commands:**
  - `npm run dev` — Start dev server (http://localhost:5173)
  - `npm run build` — Build with `tsc` type-check + Vite bundle
  - `npm run lint` — Run ESLint
  - `npm run preview` — Preview built output

### Backend (`digital-twin-news-feature-nicol-ai-frontend/backend/`)
- **Framework:** Express.js with MongoDB Atlas
- **Key features:**
  - User authentication (JWT-based)
  - Subscription management (free/pro)
  - Feed/article endpoints
  - Integration with n8n webhooks for feedback/article saving
  - Link stripping from processed articles

## Project Structure

### Frontend (`frontend-BriefAI/src/`)
```
pages/
  - LoginPage, RegisterPage, HomePage
  - FeedPage (main content feed)
  - OnboardingPage (first-time setup)
  - SettingsPage (user preferences & subscription)

components/
  - MagicCard (article card component with save/feedback buttons)
  - FeedContent (feed container & list)
  - FeedTopbar, FeedSidebar (layout)
  - AccountSettings (subscription/account section)
  - InterestPreferences, TrackedKeywords (personalization)
  - ProtectedRoute (auth guard)

services/
  - apiService.ts (base HTTP client with auth headers)
  - authService.ts (login, register, token mgmt)
  - feedService.ts (fetch articles, handles token fallback)
  - feedbackService.ts (send user feedback, save articles via n8n)

types/
  - Shared TypeScript interfaces

assets/
  - Static images/icons
```

## Key Features & Current Status

### 1. User Authentication
- JWT token stored in localStorage
- Protected routes via `ProtectedRoute` component
- Email validation (server + client-side)
- Token fallback in feedService: if token can't be decoded locally, calls `getMe()` endpoint

### 2. Subscription Management
- **Models:** `subscriptionPlan` (free|pro), `subscriptionExpiresAt` (Date)
- **Pro tier:** 30-day expiry from purchase
- **Persistence:** Stored in User model + UserProfile (MongoDB)
- **Handlers:** `handleUpgrade()` and `handleCancelSubscription()` in SettingsPage sync state with backend & localStorage

### 3. Article Feed
- **Display:** MagicCard component (article title, summary, source)
- **Actions:**
  - **Feedback:** Send rating/votes via feedbackService → n8n webhook
  - **Save:** Bookmark articles via `saveArticle()` → n8n webhook
  - **Save state:** Tracked in `savedByArticle` map in FeedContent
- **Link stripping:** Processed articles have links removed (HTML anchors, markdown, plain URLs)

### 4. Personalization
- Interest preferences (InterestPreferences component)
- Tracked keywords (TrackedKeywords component)
- Settings persisted to backend

## Development Workflow

### Running the Project
```bash
# Frontend dev
cd frontend-BriefAI
npm install
npm run dev

# Backend (if needed, runs on separate port)
cd digital-twin-news-feature-nicol-ai-frontend/backend
npm install
npm run start
```

### Environment Setup
- **Frontend:** `.env` and `.env.local` in `frontend-BriefAI/`
  - `VITE_API_URL` (backend endpoint, defaults to localhost:5000)
- **Backend:** `.env` in backend folder
  - `MONGODB_URI` (Atlas connection)
  - `JWT_SECRET` (token signing)
  - `CORS_ORIGIN` (frontend URL)

### Build & Type Safety
- ESLint with React & TypeScript rules
- TypeScript strict mode (tsconfig.app.json)
- React Compiler enabled (performance optimization)

## Testing & Debugging

### Frontend
- Check browser console for API errors
- Redux DevTools can be used if state management is added
- Network tab shows API calls to backend

### Backend (if modifying)
- MongoDB Atlas connection via `.env`
- JWT tokens signed with `JWT_SECRET`
- n8n webhooks configured for feedback/save operations

## Common Patterns

### Calling the Backend API
```typescript
// In services/apiService.ts
const response = await apiService.get('/api/endpoint');
const response = await apiService.post('/api/endpoint', data);
// Auth header (Bearer token) is auto-added
```

### Feedback & Article Saving
- Both use n8n webhooks (async, non-blocking)
- Timeouts & retry logic in feedbackService
- UI shows loading state while pending

### State Management
- Currently using React component state (useState)
- No global state manager (Redux) in use yet
- Props passed down via component tree

## Git Workflow

- **Main branch:** `main` (production-ready)
- **Current branch:** `problem-solving` (feature/fix work)
- Commit messages: `feat:`, `fix:`, `refactor:` prefixes
- Recent fixes: subscription persistence, link stripping, token handling

## Known Constraints

1. **No global state:** Consider adding Redux/Zustand if app grows
2. **Link stripping:** Done server-side via regex; update if content format changes
3. **Token fallback:** feedService calls `getMe()` if token decode fails—ensure endpoint is always available
4. **n8n integration:** Feedback & saves are async; no guaranteed delivery (but retries on timeout)
5. **CORS:** Frontend CORS_ORIGIN must match frontend URL in backend `.env`

## References

- [React Compiler](https://react.dev/learn/react-compiler)
- [React Router](https://reactrouter.com/)
- [Vite](https://vitejs.dev/)
- Recent fixes documented in `Fix.md`
