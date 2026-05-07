# Fixes Applied

Data: May 7, 2026

## Problemi Risolti

### 1. Persistenza Piano Abbonamento (Pro/Free)
**Problema:** La data del piano pro era statica e il piano non era registrato nel database.

**Fix:**
- `backend/src/models/User.js`: Aggiunto campo `subscriptionPlan` (enum: 'free'|'pro') e `subscriptionExpiresAt`
- `backend/src/models/UserProfile.js`: Aggiunto campo `subscriptionPlan` e `subscriptionExpiresAt` allo schema
- `backend/src/routes/profile.js`:
  - GET `/api/profile` ora restituisce `subscriptionPlan` e `subscriptionExpiresAt`
  - PUT `/api/profile` accetta `subscriptionState` per aggiornare piano (pro imposta expiry 30 giorni)
  - Sincronizzazione con `UserProfile` collection

---

### 2. Handlers Abbonamento Implementati
**Problema:** `onCancelSubscription` e `onUpgrade` in `AccountSettings.tsx` erano void (non facevano nulla).

**Fix:**
- `frontend-BriefAI/src/pages/SettingsPage.tsx`:
  - `handleUpgrade()` ora chiama `updateProfile({ subscriptionState: 'pro' })`
  - `handleCancelSubscription()` ora chiama `updateProfile({ subscriptionState: 'free' })`
  - Entrambi sincronizzano lo stato con localStorage e il backend
  - Aggiunto stato `subscriptionExpiresAt` locale
- `frontend-BriefAI/src/components/AccountSettings.tsx`:
  - Riceve `subscriptionExpiresAt` come prop
  - Mostra data reale di scadenza invece della data statica "12/12/2026"

---

### 3. Validazione Email Migliorata
**Problema:** Email veniva accettata a prescindere, anche se non aveva senso.

**Fix:**
- `backend/src/routes/auth.js`: Aggiunta validazione regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` in POST `/auth/register`
- `frontend-BriefAI/src/pages/RegisterPage.tsx`: Aggiunta validazione client-side pre-submit

---

### 4. Token Handling in FeedService
**Problema:** Incertezza se il token fosse quello impostato o random.

**Fix:**
- `frontend-BriefAI/src/services/feedService.ts`:
  - Importato `getMe` da authService
  - Se il token non è decodificabile localmente, fa fallback a `getMe()` per ottenere userId dal backend
  - Logging migliorato con messaggi di errore più chiari

---

### 5. Rimozione Link da Articoli Processed
**Problema:** Gli articoli processati contenevano link.

**Fix:**
- `backend/src/routes/articles.js`:
  - Aggiunta funzione `stripLinks()` che rimuove:
    - Anchor tag HTML `<a href="...">text</a>` → `text`
    - Markdown link `[text](url)` → `text`
    - Plain URL `https://...`
  - Per articoli con `status='processed'`, viene pulito `content` e `summary` prima di rispondere

---

### 6. Implementazione Salvataggio Articoli (Save/Bookmark)
**Problema:** Il bottone "Salva" era presente ma non faceva nulla (non aveva handler).

**Fix:**
- `frontend-BriefAI/src/services/feedbackService.ts`:
  - Aggiunta funzione `saveArticle(articleId)` che invia il salvataggio al webhook n8n
  - Utilizza stessa logica di timeout e error handling di `sendFeedback`
- `frontend-BriefAI/src/components/MagicCard.tsx`:
  - Aggiunto parametro `isSaved` per mostrare stato visivo
  - Aggiunto parametro `savePending` per disabilitare bottone durante il caricamento
  - Aggiunto parametro `onSave` callback
  - Bottone Salva ora ha handler `handleSave` e disabilitazione appropriata
- `frontend-BriefAI/src/components/FeedContent.tsx`:
  - Aggiunto stato `savedByArticle` per tracciare articoli salvati
  - Aggiunto stato `savePendingByArticle` per gestire loading
  - Aggiunto handler `handleSaveArticle` con error handling
  - Aggiunto messaggio di errore `saveError` visibile all'utente
  - Passa `isSaved`, `savePending`, `onSave` a cada MagicCard

---

## File Modificati

### Backend
- `/root/brief_ai/digital-twin-news-feature-nicol-ai-frontend/backend/src/models/User.js`
- `/root/brief_ai/digital-twin-news-feature-nicol-ai-frontend/backend/src/models/UserProfile.js`
- `/root/brief_ai/digital-twin-news-feature-nicol-ai-frontend/backend/src/routes/auth.js`
- `/root/brief_ai/digital-twin-news-feature-nicol-ai-frontend/backend/src/routes/profile.js`
- `/root/brief_ai/digital-twin-news-feature-nicol-ai-frontend/backend/src/routes/articles.js`
- `/root/brief_ai/digital-twin-news-feature-nicol-ai-frontend/backend/.env` (credenziali MongoDB Atlas aggiornate)

### Frontend
- `/root/brief_ai/frontend-BriefAI/src/components/AccountSettings.tsx`
- `/root/brief_ai/frontend-BriefAI/src/pages/SettingsPage.tsx`
- `/root/brief_ai/frontend-BriefAI/src/pages/RegisterPage.tsx`
- `/root/brief_ai/frontend-BriefAI/src/services/apiService.ts`
- `/root/brief_ai/frontend-BriefAI/src/services/feedService.ts`
- `/root/brief_ai/frontend-BriefAI/src/services/feedbackService.ts` (aggiunta funzione saveArticle)
- `/root/brief_ai/frontend-BriefAI/src/components/MagicCard.tsx` (implementato onSave handler)
- `/root/brief_ai/frontend-BriefAI/src/components/FeedContent.tsx` (gestione stato salvataggio)

---

## Credenziali Configurate

- **MongoDB**: Atlas cluster (briefai-cluster)
- **JWT_SECRET**: Configurato in `.env` backend
- **CORS_ORIGIN**: http://localhost:5173 (frontend)
- **Env**: development
