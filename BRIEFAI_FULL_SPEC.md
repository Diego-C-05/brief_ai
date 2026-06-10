# BriefAI — Specifica Tecnica Completa

Questo documento descrive l'intera architettura, ogni file, ogni funzione e ogni flusso dati del progetto BriefAI. È pensato per consentire a un altro sviluppatore (o LLM) di comprendere e riscrivere il progetto da zero.

---

## Indice

1. [Panoramica del sistema](#1-panoramica-del-sistema)
2. [Architettura generale](#2-architettura-generale)
3. [Backend — Express + MongoDB](#3-backend--express--mongodb)
4. [Frontend — React + TypeScript](#4-frontend--react--typescript)
5. [Workflow n8n — Pipeline AI](#5-workflow-n8n--pipeline-ai)
6. [Flussi dati end-to-end](#6-flussi-dati-end-to-end)
7. [Schema MongoDB](#7-schema-mongodb)
8. [Schema localStorage](#8-schema-localstorage)
9. [Variabili d'ambiente](#9-variabili-dambiente)
10. [Costanti di dominio condivise](#10-costanti-di-dominio-condivise)

---

## 1. Panoramica del sistema

BriefAI è un aggregatore di notizie tecnologiche con personalizzazione AI. Raccoglie automaticamente articoli da 4 fonti, li analizza con un LLM per estrarne riassunto, sentiment ed entità, e li serve a ogni utente in un feed ordinato per rilevanza personale. Il sistema impara dai like/dislike dell'utente aggiustando i pesi dei topic nel profilo.

**Cosa fa il sistema in sintesi:**
- Ogni 15 minuti: raccoglie nuovi articoli da RSS/HTTP (TechCrunch, ANSA, Reuters, Hacker News)
- Ogni 20 minuti: arricchisce il testo degli articoli e li elabora con un LLM (riassunto, sentiment, macro-topic, entità)
- On demand: genera un feed personale con un algoritmo di ranking a 4 componenti
- On demand: riceve like/dislike e aggiorna i pesi del profilo utente

---

## 2. Architettura generale

Il progetto è composto da tre sistemi indipendenti che comunicano esclusivamente tramite MongoDB Atlas:

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│           React 19 + TypeScript + Vite (SPA)                    │
│  • Autenticazione con JWT (localStorage)                        │
│  • Feed personalizzato (chiama webhook n8n)                     │
│  • Preferenze utente (chiama backend Express)                   │
└──────────────┬───────────────────────────┬──────────────────────┘
               │ REST API                  │ Webhook POST
               ▼                           ▼
┌──────────────────────────┐  ┌─────────────────────────────────────┐
│     BACKEND EXPRESS      │  │          n8n AUTOMATION              │
│  Node.js + Express 5.x   │  │  4 workflow che girano autonomamente │
│  • Auth (JWT, bcrypt)    │  │  • W1: ingestion articoli            │
│  • Profilo utente        │  │  • W2: enrichment + LLM              │
│  • Articoli (read-only)  │  │  • W3: ranking feed + profilo        │
│  • Statistiche           │  │  • W4: feedback loop pesi            │
└──────────────┬───────────┘  └─────────────────┬───────────────────┘
               │                                │
               └──────────────┬─────────────────┘
                              ▼
               ┌──────────────────────────────┐
               │       MONGODB ATLAS          │
               │  Collections:                │
               │  • articles                  │
               │  • users                     │
               │  • user_profiles             │
               └──────────────────────────────┘
```

**Principio architetturale chiave:** backend Express e workflow n8n non si chiamano mai tra loro. MongoDB è il contratto condiviso. Ogni sistema legge e scrive le proprie collection; la sincronizzazione avviene a livello di dati, non di API.

---

## 3. Backend — Express + MongoDB

### Directory

```
backend/
├── src/
│   ├── server.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Article.js
│   │   └── UserProfile.js
│   └── routes/
│       ├── auth.js
│       ├── articles.js
│       ├── profile.js
│       └── stats.js
├── .env
└── package.json
```

### Dipendenze

| Pacchetto | Versione | Scopo |
|---|---|---|
| express | ^5.2.1 | Framework HTTP |
| mongoose | ^9.4.1 | ODM per MongoDB |
| jsonwebtoken | ^9.0.3 | Generazione e verifica JWT |
| bcryptjs | ^3.0.3 | Hashing password |
| helmet | ^8.1.0 | Header HTTP di sicurezza |
| cors | ^2.8.6 | Gestione CORS |
| morgan | ^1.10.1 | Logging HTTP |
| dotenv | ^17.4.1 | Caricamento variabili .env |
| nodemon | ^3.1.14 | Hot reload in sviluppo |

---

### `src/server.js` — Punto di ingresso

**Responsabilità:** configura e avvia il server Express, si connette a MongoDB e registra i router.

**Middleware globali applicati (in ordine):**
1. `helmet()` — imposta automaticamente header di sicurezza HTTP (X-Frame-Options, CSP, ecc.)
2. `cors(...)` — whitelist degli origin: in sviluppo accetta qualsiasi `localhost:*`, in produzione legge `CORS_ORIGIN` o `FRONTEND_URL` dal `.env`
3. `morgan('dev')` — log colorato di ogni richiesta HTTP
4. `express.json()` — parse del body JSON
5. `express.urlencoded({ extended: true })` — parse del body form

**Router montati:**
- `POST/GET /api/auth/*` → `./routes/auth.js`
- `GET /api/articles/*` → `./routes/articles.js`
- `GET/PUT /api/profile` → `./routes/profile.js`
- `GET /api/stats/*` → `./routes/stats.js`

**Endpoint di sistema:**
- `GET /health` — restituisce `{ status: 'ok', timestamp, service, version }`

**Error handlers:**
- Handler 404: risponde con `{ success: false, error: 'Endpoint non trovato.' }` per qualsiasi route non mappata
- Handler 500: in produzione nasconde il dettaglio dell'errore, in sviluppo lo espone (`err.message`)

**Avvio:** `mongoose.connect(MONGO_URI)` → se la connessione ha successo, chiama `app.listen(PORT)`. Se fallisce, chiama `process.exit(1)`.

---

### `src/middleware/auth.js` — Middleware JWT

**Firma:** `function auth(req, res, next)`

**Comportamento:**
1. Legge il token dall'header `Authorization` rimuovendo il prefisso `Bearer `
2. Se il token è assente → risponde `401 { success: false, error: 'Accesso negato. Token mancante.' }`
3. Chiama `jwt.verify(token, JWT_SECRET)` — se il token è valido, il payload decodificato viene iniettato in `req.user` e si chiama `next()`
4. Se il token non è valido o scaduto → risponde `401 { success: false, error: 'Token non valido o scaduto.' }`

**Uso:** viene importato e applicato a ogni route protetta come middleware posizionale (es. `router.get('/', auth, handler)`).

---

### `src/models/User.js` — Schema utente

**Collection MongoDB:** `users`

**Campi:**

| Campo | Tipo | Note |
|---|---|---|
| `userId` | String, unique | Generato come `user_${Date.now()}_${random}` |
| `email` | String, unique | Validato lato server con regex |
| `password` | String | Sempre hashata, mai in chiaro nel DB |
| `username` | String, unique | |
| `role` | Enum: `user`, `admin` | Default: `user` |
| `macroTopics` | [String] | Topic selezionati dall'utente (lista di 12 possibili) |
| `keywords` | [String] | Parole chiave personalizzate |
| `weights` | Map(String→Number) | Peso per ogni macro-topic, default 1.0 per tutti e 12 |
| `preferredSources` | [String] | Fonti aggiunte automaticamente dai like |
| `lastFeedGeneratedAt` | Date | Timestamp ultima generazione feed |
| `subscriptionPlan` | Enum: `free`, `pro` | Default: `free` |
| `subscriptionExpiresAt` | Date | Null se free |

**Hook `pre('save')`:** prima di ogni salvataggio, se il campo `password` è stato modificato, lo hasha con `bcrypt.hash(password, 10)`.

**Metodo di istanza `comparePassword(candidatePassword)`:** chiama `bcrypt.compare(candidate, this.password)` e restituisce una Promise<boolean>.

**Hook `post('save')`** — `syncUserProfile`: dopo ogni salvataggio, aggiorna (upsert) il documento corrispondente in `user_profiles` copiando `macroTopics`, `keywords`, `weights` (convertita da Map a Object), `preferredSources`, `lastFeedGeneratedAt`, `subscriptionPlan`, `subscriptionExpiresAt`. Questo mantiene le due collection sincronizzate automaticamente senza logica esplicita nel controller.

---

### `src/models/Article.js` — Schema articolo

**Collection MongoDB:** `articles`

**Campi:**

| Campo | Tipo | Popolato da | Note |
|---|---|---|---|
| `uniqueKey` | String, unique | W1 | SHA-256 di `url::title` |
| `title` | String | W1 | |
| `url` | String | W1 | URL originale |
| `pubDate` | String | W1 | Data di pubblicazione |
| `source` | String | W1 | Es: `TechCrunch`, `Reuters` |
| `category` | String | W1 | Es: `tech`, `news`, `social` |
| `content` | String | W2 | Testo estratto/arricchito |
| `summary` | String | W2 LLM | Riassunto in italiano (max 50 parole) |
| `sentiment` | Enum: `Positive`, `Neutral`, `Negative`, null | W2 LLM | |
| `entities` | [String] | W2 LLM | Entità riconosciute |
| `trendingTopics` | [String] | W2 LLM | (legacy, sostituito da macroTopics) |
| `macroTopics` | [String] | W2 LLM | Uno o più dei 12 macro-topic |
| `status` | Enum: `raw`, `ready`, `processed` | W1/W2 | Stato nella pipeline |
| `aiProcessed` | Boolean | W2 | True se LLM ha risposto correttamente |
| `aiError` | String | W2 | Messaggio di errore LLM se fallback |
| `processedAt` | Date | W2 | Timestamp elaborazione AI |

---

### `src/models/UserProfile.js` — Profilo sincronizzato

**Collection MongoDB:** `user_profiles` (nome esplicito con `{ collection: 'user_profiles' }`)

**Scopo:** copia read-optimized del profilo utente, usata direttamente dai workflow n8n senza dover passare dal backend Express.

**Campi identici a User.js:** `userId`, `macroTopics`, `keywords`, `weights` (Object invece di Map), `preferredSources`, `subscriptionPlan`, `subscriptionExpiresAt`, `lastFeedGeneratedAt`, `updatedAt`.

**Aggiornamento:** avviene in due modi:
1. Automatico tramite l'hook `post('save')` di User.js
2. Esplicito tramite `PUT /api/profile` (che chiama `UserProfile.findOneAndUpdate` con `upsert: true`)

---

### `src/routes/auth.js` — Autenticazione

#### `POST /api/auth/register`

**Input body:** `{ email, password, username, preferences?: { macroTopics?, keywords? } }`

**Logica:**
1. Valida presenza di `email`, `password`, `username`
2. Valida formato email con regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
3. Valida password con regex `/^(?=.*[A-Z])(?=.*\d).{8,}$/` (min 8 char, 1 maiuscola, 1 numero)
4. Cerca in MongoDB se esiste già un utente con quella email o username (`$or`)
5. Genera `userId = user_${Date.now()}_${Math.random().toString(36).slice(2,11)}`
6. Crea e salva il documento User (l'hook `pre('save')` hasha la password)
7. Genera un token JWT con payload `{ userId, email, role }` e scadenza `24h`
8. Risponde `201 { success: true, token, userId, username, email }`

**Nota:** il token viene emesso subito alla registrazione per evitare che l'utente debba fare un secondo login.

#### `POST /api/auth/login`

**Input body:** `{ email, password }`

**Logica:**
1. Valida presenza di `email` e `password`
2. Cerca utente per email
3. Chiama `user.comparePassword(password)` (bcrypt compare)
4. Se valido: genera JWT con payload `{ userId, email, role }` e scadenza `24h`
5. Risponde `200 { success: true, token, userId, username, email }`

#### `GET /api/auth/me` *(richiede auth middleware)*

**Logica:** legge `req.user.userId` (iniettato dal middleware), cerca l'utente e lo restituisce senza il campo password (`.select('-password')`).

**Risposta:** `{ success: true, user: { ...campiUtente } }`

---

### `src/routes/articles.js` — Articoli

#### `GET /api/articles` *(richiede auth)*

**Query params supportati:**
- `category` — filtra per categoria esatta
- `sentiment` — filtra per sentiment (`Positive`/`Neutral`/`Negative`)
- `source` — filtra per fonte
- `status` — default `processed`
- `limit` — default 50
- `page` — default 1 (paginazione offset-based)
- `search` — ricerca full-text con regex su `title` e `summary` (`$options: 'i'` = case-insensitive)

**Pipeline:**
1. Costruisce il filtro MongoDB da query params
2. Esegue `Article.find(filter).sort({ pubDate: -1 }).limit().skip().select('-__v')`
3. Applica `stripLinks()` su `content` e `summary` di tutti gli articoli `processed`
4. Esegue `Article.countDocuments(filter)` per il totale
5. Risponde con `{ success, articles, total, page, limit, totalPages }`

**Funzione `stripLinks(text)`:** rimuove tag HTML `<a>`, link markdown `[text](url)`, e URL plain (`https?://...`) dal testo. Previene che link grezzi dell'AI arrivino al frontend.

#### `GET /api/articles/:uniqueKey` *(richiede auth)*

Restituisce il singolo articolo corrispondente a `uniqueKey`. Non utilizzato attivamente dal frontend nella versione corrente.

---

### `src/routes/profile.js` — Profilo utente

#### `GET /api/profile` *(richiede auth)*

**Logica:**
1. Cerca il documento User per `userId` (senza password)
2. Cerca il documento UserProfile corrispondente (`.lean()`)
3. Costruisce un oggetto `profile` unendo i due documenti: dove UserProfile ha un valore, esso sovrascrive quello di User
4. Converte `user.weights` da Map a plain Object
5. Risponde con `{ success: true, profile: { userId, email, username, macroTopics, keywords, weights, preferredSources, lastFeedGeneratedAt, subscriptionPlan, subscriptionExpiresAt } }`

#### `PUT /api/profile` *(richiede auth)*

**Input body:** `{ macroTopics?, keywords?, preferredSources?, subscriptionState? }`

**Logica:**
1. Cerca il documento User per `userId`
2. Aggiorna i campi presenti nel body (`if (macroTopics) user.macroTopics = macroTopics`)
3. Per `subscriptionState`: se `pro`, imposta `subscriptionExpiresAt = now + 30 giorni`; se `free`, lo azzera
4. Salva il documento User (l'hook `post('save')` sincronizza automaticamente UserProfile)
5. Aggiorna anche esplicitamente UserProfile con `findOneAndUpdate + upsert` come doppia garanzia
6. Risponde con il profilo aggiornato

---

### `src/routes/stats.js` — Statistiche

Tutti gli endpoint richiedono auth. Usano le **MongoDB Aggregation Pipelines** che calcolano il risultato direttamente nel database.

#### `GET /api/stats/sentiment`
```js
Article.aggregate([
  { $match: { status: 'processed' } },
  { $group: { _id: '$sentiment', count: { $sum: 1 } } }
])
```
Restituisce la distribuzione degli articoli per sentiment.

#### `GET /api/stats/categories`
```js
Article.aggregate([
  { $match: { status: 'processed' } },
  { $group: { _id: '$category', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

#### `GET /api/stats/sources`
Identico a categories ma raggruppa per `source`.

#### `GET /api/stats/overview`
Esegue 4 query in parallelo (non aggregate):
- `countDocuments({})` → totale
- `countDocuments({ status: 'processed' })` → processati
- `countDocuments({ status: 'raw' })` → grezzi
- `countDocuments({ createdAt: { $gte: now - 24h } })` → articoli nelle ultime 24 ore

Calcola `processingRate = (processed/total * 100).toFixed(1)`.

---

## 4. Frontend — React + TypeScript

### Directory

```
frontend-BriefAI/src/
├── main.tsx
├── App.tsx
├── types/
│   └── article.ts
├── services/
│   ├── authService.ts
│   ├── apiService.ts
│   ├── feedService.ts
│   └── feedbackService.ts
├── pages/
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── OnboardingPage.tsx
│   ├── FeedPage.tsx
│   └── SettingsPage.tsx
└── components/
    ├── FeedContent.tsx
    ├── FeedSidebar.tsx
    ├── FeedTopbar.tsx
    ├── MagicCard.tsx
    ├── InterestPreferences.tsx
    ├── TrackedKeywords.tsx
    ├── AccountSettings.tsx
    └── SettingsTabs.tsx
```

### Stack

| Tecnologia | Versione | Scopo |
|---|---|---|
| React | 19 | UI |
| TypeScript | 5.x | Type safety |
| Vite | 6.x | Build tool e dev server |
| React Router | v6 | Routing client-side |
| CSS custom | — | Nessun framework UI esterno |

---

### `src/types/article.ts` — Tipo condiviso

```typescript
interface Article {
  uniqueKey: string       // ID univoco (SHA-256 hash)
  title: string
  url: string
  pubDate: string         // stringa ISO o human-readable
  source: string          // Es: "TechCrunch"
  category: string        // Es: "tech"
  summary: string         // Riassunto AI in italiano
  sentiment: 'Positive' | 'Negative' | 'Neutral'
  entities: string[]      // Entità estratte dall'AI
  trendingTopics: string[]
  macroTopics?: string[]  // Assegnati dall'AI, usati per filtering
  score?: number          // Score del Ranking Engine W3
}
```

---

### `src/main.tsx` — Entry point

Monta l'app React in `#root` avvolta da `BrowserRouter` (React Router) e `StrictMode`.

---

### `src/App.tsx` — Router principale

**Stato:** `isAuthenticated: boolean` (useState, inizialmente false)

**Route definite:**

| Path | Componente | Protezione |
|---|---|---|
| `/` | HomePage | Pubblica |
| `/login` | LoginPage | Pubblica |
| `/register` | RegisterPage | Pubblica |
| `/onboarding` | OnboardingPage | Pubblica |
| `/home` | Redirect a `/onboarding` | Pubblica |
| `/feed` | FeedPage | **Protetta** |
| `/impostazioni` | SettingsPage | **Protetta** |
| `*` | Redirect a `/` | Pubblica |

**Componente `ProtectedRoute`:** se `isAuthenticated` è false E non esiste `briefai_token` in localStorage, reindirizza a `/login`. Questa doppia condizione gestisce la race condition post-registrazione (il token esiste in localStorage ma lo stato React non è ancora aggiornato).

**Callback `onLoginSuccess` / `onRegisterSuccess`:** funzioni passate come prop a LoginPage e RegisterPage che chiamano `setIsAuthenticated(true)` per sbloccare le route protette.

---

### Servizi

#### `src/services/authService.ts`

Variabile base: `BASE = import.meta.env.VITE_API_URL`

**`saveToken(token)`** — privata — scrive `briefai_token` in localStorage.

**`getAuthHeader(): Record<string, string>`** — esportata — legge il token e restituisce `{ Authorization: 'Bearer <token>' }` oppure `{}` se assente.

**`decodeToken(token): object | null`** — esportata — decodifica il payload JWT senza librerie: `JSON.parse(atob(token.split('.')[1]))`. Restituisce null in caso di eccezione.

**`login(email, password)`** — esportata async — `POST /api/auth/login` con body JSON. Se `!res.ok` lancia il body JSON come errore (`throw await res.json()`). Se ok, chiama `saveToken` e restituisce la risposta.

**`register(payload)`** — esportata async — `POST /api/auth/register` con `{ email, password, username, preferences: { macroTopics, keywords } }`. Stesso pattern di login (throw on error, saveToken on success).

**`getMe()`** — esportata async — `GET /api/auth/me` con `getAuthHeader()`. Se la risposta non è ok, rimuove il token dal localStorage e restituisce null. Usata per validare sessioni esistenti.

**`logout()`** — esportata — rimuove `briefai_token` da localStorage.

---

#### `src/services/apiService.ts`

Variabile base: `BASE = import.meta.env.VITE_API_URL`

**`authFetch(path, options)`** — privata — wrapper di `fetch` che inietta automaticamente `getAuthHeader()` in ogni richiesta.

**`fetchSentimentStats()`** — `GET /api/stats/sentiment`

**`fetchCategoryStats()`** — `GET /api/stats/categories`

**`fetchSourceStats()`** — `GET /api/stats/sources`

**`fetchOverview()`** — `GET /api/stats/overview`

**`fetchProfile(): Promise<ProfileResponse>`** — `GET /api/profile`

**Tipo `ProfileResponse`:**
```typescript
{
  success?: boolean
  profile?: {
    userId?: string
    username?: string
    email?: string
    macroTopics?: string[]
    keywords?: string[]
    subscriptionPlan?: 'free' | 'pro'
    subscriptionExpiresAt?: string | null
  }
}
```

**`updateProfile(data)`** — esportata async — esegue due operazioni in sequenza:
1. `PUT /api/profile` con `authFetch` → aggiorna il backend Express
2. (opt-in) se `VITE_N8N_URL` è definito e `data.userId` è presente: `POST {N8N}/briefai/profile/update` → sincronizza n8n. Errori di questo secondo step vengono loggati ma non propagati.

---

#### `src/services/feedService.ts`

Variabile base: `N8N = import.meta.env.VITE_N8N_URL`

**`fetchPersonalizedFeed(): Promise<Article[]>`**

**Flusso:**
1. Legge il token da localStorage
2. Chiama `decodeToken(token)` per estrarre `userId`
3. Fallback: se `userId` è null (decode fallito), chiama `getMe()` per ottenerlo dal backend
4. `POST {N8N}/briefai/feed` con body `{ userId, limit: 50 }`
5. Normalizzazione della risposta: mappa ogni elemento di `data.articles` in un `Article` con type-cast esplicito e fallback su ogni campo (es. `sentiment` viene validato contro i tre valori possibili, altrimenti default `'Neutral'`)

**Perché chiama n8n e non il backend Express?** Perché il Ranking Engine risiede nel Workflow 3 di n8n, non nel backend.

---

#### `src/services/feedbackService.ts`

Costante: `FEEDBACK_TIMEOUT_MS = 5000`

**Pattern comune a tutte e tre le funzioni:**
- Legge il token, lo decodifica con `atob`, estrae `userId`
- Crea un `AbortController` con `setTimeout(abort, 5000)` per il timeout
- Fa la fetch con il `signal` dell'AbortController
- Nel `finally` pulisce sempre il timeout con `clearTimeout`

**`sendFeedback(articleId, vote: 1 | -1): Promise<void>`**

`POST {N8N}/briefai/feedback` con `{ userId, articleId, vote }`. Se la risposta non è ok, lancia un errore. Se la chiamata fa timeout, lancia `Error('Timeout feedback')`.

**`saveArticle(articleId): Promise<void>`**

`POST {N8N}/briefai/save-article` con `{ userId, articleId }`.

**Fallback locale in tre scenari:**
1. `VITE_N8N_URL` non configurato → salva direttamente in `briefai_saved_articles` localStorage
2. Response non ok → salva in localStorage
3. Errore di rete → salva in localStorage

**`unsaveArticle(articleId): Promise<void>`**

`POST {N8N}/briefai/unsave-article`. Stesso pattern di fallback: rimuove la chiave da `briefai_saved_articles` se n8n è irraggiungibile.

---

### Pagine

#### `src/pages/HomePage.tsx`

Landing page pubblica. Contiene sezioni statiche: hero, lista benefici, preview del prodotto, piani di abbonamento. Non fa chiamate API. Link verso `/onboarding` (nuovo utente) e `/login` (utente esistente).

---

#### `src/pages/LoginPage.tsx`

**Props:** `{ onLoginSuccess?: () => void }`

**Stato:** `email`, `password`, `error` (tutti string)

**`handleSubmit(event)`:** previene il default del form, chiama `login(email, password)` da authService. Se ha successo: resetta l'errore, chiama `onLoginSuccess()`, naviga a `/feed`. Se fallisce: mostra `'Credenziali non valide'`.

**UI:** form con `<input type="email">`, `<input type="password">`, bottone submit, link verso `/register` e `/`.

---

#### `src/pages/RegisterPage.tsx`

**Props:** `{ onRegisterSuccess?: () => void }`

**Stato:** `username`, `email`, `newPassword`, `acceptedTerms: boolean`, `error`

**Draft recovery:** all'init legge `briefai-register-draft` da localStorage (contiene i campi già compilati se l'utente è stato rediretto a onboarding). Nel `useEffect` rimuove il draft dal localStorage.

**`handleSubmit(event)`:**
1. Blocca se `!acceptedTerms`
2. Legge `macroTopics` e `keywords` da `briefai-onboarding` localStorage
3. Se non ci sono macroTopics → salva il form in `briefai-register-draft` e naviga a `/onboarding`
4. Valida email lato client con regex
5. Chiama `register({ email, password, username, preferences: { macroTopics, keywords } })`
6. Se ok: pulisce lo stato e localStorage, chiama `onRegisterSuccess()`, naviga a `/feed` con `window.location.href` (hard redirect per resettare completamente lo stato React)
7. Se errore: estrae il messaggio dall'oggetto errore (`err.error || err.message || fallback`)

---

#### `src/pages/OnboardingPage.tsx`

**Costante `TOPIC_OPTIONS`:** array di 12 oggetti `{ label, emoji }` — l'unica lista di macro-topic del frontend.

**Costante `SUGGESTIONS`:** `['OpenAI', 'Google AI', 'Anthropic', 'Tesla', 'SpaceX']`

**Stato:** `step: 1 | 2`, `selectedTopics: string[]`, `keywords: string[]`, `keywordInput: string`

**`isNewUser`:** legge `briefai-newUser === 'true'` da localStorage. Indica che l'utente è già registrato e sta configurando il profilo post-registrazione.

**Step 1 — Selezione categorie:**
- Grid di 12 card clickabili (bottoni `type="button"`)
- `toggleTopic(label)`: aggiunge o rimuove dalla lista `selectedTopics`
- Il bottone "Continua" è disabilitato se nessun topic è selezionato

**Step 2 — Keyword:**
- Input text con handler su `keyboardDown Enter`
- `addKeyword(raw)`: trimma, ignora duplicati e vuoti, aggiunge a `keywords`, resetta `keywordInput`
- `removeKeyword(kw)`: filtra la lista
- `suggestionPool` (useMemo): filtra `SUGGESTIONS` escludendo le keyword già presenti
- Chip di suggerimenti cliccabili che chiamano `addKeyword`

**`goToNextStep()`:**
- Step 1 → 2: cambia `step`
- Step 2 → fine: salva `{ selectedTopics, keywords }` in `briefai-onboarding`
  - Se `isNewUser`: rimuove `briefai-newUser` e `briefai-onboarding`, naviga a `/feed`
  - Altrimenti: naviga a `/register`

---

#### `src/pages/FeedPage.tsx`

**Stato:** `sentimentFilter`, `topicsFilter`, `preferenceFilter` (tutti `string | null`)

**Handler:**
- `handleSentimentChange(sentiment)`: se `'All Sentiment'` → null, altrimenti il valore
- `handleTopicChange(topic)`: se `'All Topics'` → null, altrimenti il valore
- `handlePreferenceChange(preference)`: se `'Tutti'` → null, altrimenti il valore

**Render:** layout fisso `feed-layout` con tre slot:
1. `<FeedSidebar activeItem="feed" />`
2. `<FeedTopbar showFeedFilters ... />` con tutti gli handler
3. `<FeedContent sentimentFilter topicsFilter preferenceFilter />` — riceve i filtri come prop

---

#### `src/pages/SettingsPage.tsx`

**Tipi locali:**
- `SettingsSnapshot = { selectedMacroTopics, keywords, subscriptionState, subscriptionExpiresAt? }`
- `ProfileIdentity = { username, email }`

**Funzioni utilitarie (module-level, non componenti):**

**`readInitialSettings(): SettingsSnapshot`:** legge prima `briefai-settings`, poi `briefai-onboarding` come fallback, poi usa i default. Gestisce `typeof window === 'undefined'` per SSR safety.

**`readJSON<T>(storageKey): T | undefined`:** wrapper type-safe per `JSON.parse(localStorage.getItem(...))` con try-catch.

**`persistSettings(snapshot)`:** serializza e scrive lo snapshot in `briefai-settings` localStorage.

**Stato del componente:**
- `activeTab: 'interests' | 'account'`
- `animDirection: 'ltr' | 'rtl' | null` — direzione animazione tab
- `prevTabRef: useRef<SettingsTab>` — tiene traccia della tab precedente per calcolare la direzione
- `profileIdentity: { username, email }`
- `selectedMacroTopics: string[]`
- `keywords: string[]`
- `keywordInput: string`
- `subscriptionState: 'free' | 'pro'`
- `subscriptionExpiresAt: string | null`
- `isSavingMacroTopics: boolean`
- `isSavingKeywords: boolean`

**`useEffect` — carica profilo dal server:** chiama `fetchProfile()` al mount e popola tutti gli stati dal risultato.

**`useEffect` — animazione tab:** quando `activeTab` cambia, imposta `animDirection` ('ltr' o 'rtl' in base alla transizione) e lo resetta dopo 480ms.

**Handler principali:**

**`handleToggleMacroTopic(topic)`:** toggle semplice di un elemento nella lista `selectedMacroTopics`.

**`handleSaveMacroTopics()`:** async — chiama `updateProfile({ macroTopics })`, aggiorna lo stato dal risultato, chiama `persistSettings`. Se fallisce, persiste comunque in locale.

**`handleAddKeyword(raw)`:** trimma, ignora duplicati/vuoti, aggiunge alla lista, resetta `keywordInput`.

**`handleRemoveKeyword(kw)`:** filtra la lista `keywords`.

**`handleSaveKeywords()`:** async — chiama `updateProfile({ keywords })`, aggiorna stato, persiste in locale.

**`handleUpgrade()`:** async — chiama `updateProfile({ subscriptionState: 'pro' })`, aggiorna `subscriptionState` e `subscriptionExpiresAt` dal risultato.

**`handleCancelSubscription()`:** async — chiama `updateProfile({ subscriptionState: 'free' })`.

---

### Componenti

#### `src/components/FeedContent.tsx`

**Props:** `{ sentimentFilter?, topicsFilter?, preferenceFilter? }` (tutti `string | null`)

**Stato:**
- `articles: Article[]`
- `status: 'loading' | 'ok' | 'error'`
- `voteByArticle: Record<string, 1 | -1 | null>` — inizializzato da localStorage
- `pendingByArticle: Record<string, boolean>` — loading per singolo articolo
- `savedByArticle: Record<string, boolean>` — inizializzato da localStorage
- `savePendingByArticle: Record<string, boolean>`
- `voteError: string | null`
- `saveError: string | null`

**`useEffect` — sync listener:**
Registra due listener:
1. `window.addEventListener('storage', ...)` — si attiva quando un'altra tab modifica localStorage
2. `document.addEventListener('visibilitychange', ...)` — si attiva quando la tab torna in focus

Entrambi chiamano `resyncPreferencesIfChanged()` che rilegge `briefai_voted_articles` e `briefai_saved_articles` e li aggiorna nello stato solo se diversi (confronto JSON.stringify per evitare render inutili).

**`useEffect` — persistenza voti:** ogni volta che `voteByArticle` cambia, lo serializza in localStorage.

**`useEffect` — persistenza salvati:** identico per `savedByArticle`.

**`useEffect` — fetch feed:** al mount chiama `fetchPersonalizedFeed()`, popola `articles` e imposta `status: 'ok'`. In caso di errore: `status: 'error'`.

**`sendVoteDelta(articleId, previousVote, nextVote)`:** async — logica per gestire voti senza idempotenza server-side:
- `null → vote` → invia il voto
- `vote → null` (undo) → invia il voto inverso come compensazione
- `vote → voto diverso` → invia il nuovo voto

**`handleVoteChange(articleId, nextVote)`:** async — implementa optimistic update:
1. Aggiorna subito `voteByArticle` nello stato
2. Imposta `pendingByArticle[articleId] = true`
3. Chiama `sendVoteDelta`
4. In caso di errore: ripristina il voto precedente e mostra `voteError`
5. Nel finally: resetta `pendingByArticle[articleId] = false`

**`handleSaveArticle(articleId)`:** async — toggle save con optimistic update:
1. Calcola `nextSaved = !savedByArticle[articleId]`
2. Aggiorna subito stato e localStorage
3. Chiama `saveArticle` o `unsaveArticle` in base al toggle
4. In caso di errore: ripristina lo stato e mostra `saveError`

**Filtraggio client-side (nel render):**
```
matchesSentiment(a): a.sentiment === sentimentFilter (se filtro attivo)
matchesTopic(a): confronto case-insensitive tra topicsFilter e a.category/trendingTopics/macroTopics
matchesPreference(a): se 'Salvati', controlla savedByArticle[a.uniqueKey] === true
```
Viene eseguito un `.filter(matchesSentiment && matchesTopic && matchesPreference)` sull'array `articles` ad ogni render.

---

#### `src/components/MagicCard.tsx`

**Props:**
```typescript
{
  articleId?: string
  articleUrl?: string
  source: string
  timeAgo: string
  sentiment: 'Positivo' | 'Negativo' | 'Neutrale'  // localizzato
  title: string
  summary: string
  tags: string[]       // macroTopics o trendingTopics
  entities: string[]
  voteState: 1 | -1 | null
  votePending?: boolean
  isSaved?: boolean
  savePending?: boolean
  onVoteChange: (articleId: string, nextVote: 1 | -1 | null) => void
  onSave?: (articleId: string) => void
}
```

**`handleVote(clickedVote)`:** se `votePending` o niente `articleId`, non fa nulla. Calcola `nextVote = voteState === clicked ? null : clicked` (toggling). Chiama `onVoteChange(articleId, nextVote)`.

**`handleSave()`:** se `savePending` o niente `articleId` o niente `onSave`, non fa nulla. Chiama `onSave(articleId)`.

**Struttura HTML:**
- `<article class="magic-card">`
  - `<header>` — source + timestamp | badge sentiment (classe CSS dinamica `positivo/negativo/neutrale`)
  - `<h3>` — titolo linkato all'URL originale (`target="_blank" rel="noopener noreferrer"`)
  - `<p>` — riassunto AI
  - `<div class="magic-card-tags">` — chip dei macro-topic
  - `<div class="magic-card-entities">` — chip delle entità
  - `<footer class="magic-card-actions">` — 3 ActionButton (like, dislike, save)

**`ActionButton`** — componente interno:
- Classe CSS: `action-button {tone} [active] [saving]`
- Quando `disabled=true`: mostra `<span class="spinner">` invece dell'icona
- `stopPropagation()` sul click per evitare bubble

**Icone SVG inline:** `ThumbUpIcon`, `ThumbDownIcon`, `BookmarkIcon` — componenti funzionali che ritornano `<svg>`.

---

#### `src/components/FeedSidebar.tsx`

**Props:** `{ activeItem: 'feed' | 'impostazioni' }`

Carica il profilo utente all'init: decodifica il token per `email` e `username`, poi chiama `getMe()` come fallback se il decode fallisce.

**Contenuto:**
- Logo/brand BriefAI
- Link di navigazione: Feed (`/feed`) e Impostazioni (`/impostazioni`), con `active` class in base a `activeItem`
- Profile block in fondo: avatar con iniziali (prima lettera di username), nome utente, email

---

#### `src/components/FeedTopbar.tsx`

**Props:** vari callback e valori per i filtri (sentimentFilter, topicsFilter, preferenceFilter, onSentimentChange, onTopicChange, onPreferenceChange, showFeedFilters)

Mostra tre dropdown condizionali (solo se `showFeedFilters=true`):
1. **Sentiment:** `All Sentiment | Positive | Negative | Neutral`
2. **Topics:** `All Topics | [12 macro-topic]`
3. **Preference:** `Tutti | Salvati`

Ogni dropdown chiama il callback corrispondente al cambio valore.

---

#### `src/components/InterestPreferences.tsx`

**Props:** `{ selectedMacroTopics, onToggleMacroTopic, onSaveMacroTopics, isSaving }`

Grid 4×3 dei 12 macro-topic. Ogni card è un bottone che mostra emoji + label. Classe `selected` se il topic è in `selectedMacroTopics`. Bottone "Salva preferenze" che chiama `onSaveMacroTopics` e mostra stato `isSaving`.

---

#### `src/components/TrackedKeywords.tsx`

**Props:** `{ keywords, keywordInput, onKeywordInputChange, onAddKeyword, onRemoveKeyword, onSaveKeywords, isSaving }`

- Input text per nuova keyword con handler su Enter
- Chip di suggerimenti: `OpenAI`, `Google AI`, `Anthropic`, `Tesla`, `SpaceX` (filtrati per escludere quelli già presenti)
- Lista keyword tracciate con bottone rimozione per ognuna
- Bottone "Salva keyword"

---

#### `src/components/AccountSettings.tsx`

**Props:** `{ username, email, subscriptionState, subscriptionExpiresAt, onUpgrade, onCancelSubscription }`

**Tipo `SubscriptionState`:** `'free' | 'pro'` — esportato per uso in SettingsPage.

Mostra: email e username in sola lettura, card abbonamento con badge piano (Free/Pro), data scadenza se pro, bottone "Upgrade a Pro" (se free) o "Annulla abbonamento" (se pro).

---

#### `src/components/SettingsTabs.tsx`

**Props:** `{ activeTab: 'interests' | 'account', onTabChange }`

**Tipo `SettingsTab`:** `'interests' | 'account'` — esportato.

Due bottoni tab con `aria-selected` e classe `active`. Al click chiama `onTabChange`.

---

## 5. Workflow n8n — Pipeline AI

n8n è una piattaforma di automazione no-code/low-code. I workflow sono definiti in JSON e vengono eseguiti su un'istanza n8n. Ogni nodo riceve dati dal nodo precedente tramite `$input` e li passa al successivo.

### Workflow 1 — `fetch articles1` — Ingestion

**Trigger:** `scheduleTrigger` ogni 15 minuti

**Fonti (lanciate in parallelo dal cron):**

| Nodo | Tipo | URL |
|---|---|---|
| RSS TechCrunch | `rssFeedRead` | `https://techcrunch.com/feed/` |
| HTTP Reuters | `httpRequest` | Google News RSS filtrato per reuters.com |
| HTTP Hacker News | `httpRequest` | `https://hnrss.org/frontpage` |
| RSS ANSA | `rssFeedRead` | `https://www.ansa.it/sito/ansait_rss.xml` |

**Nodi di tagging (`Code`):** ogni fonte ha un nodo Code che normalizza i campi e aggiunge metadati:
- `source` — nome stringa della fonte
- `category` — categoria di alto livello (`tech`, `news`, `news-it`, `social`)
- `status: 'raw'`
- `createdAt: new Date().toISOString()`

Reuters e Hacker News richiedono parsing XML manuale con regex perché il nodo `rssFeedRead` non gestisce tutti i formati.

**Merge:** nodo `merge` con 4 input unisce tutti gli articoli in un unico stream.

**Generate Unique Key (Code):** per ogni articolo calcola `SHA-256( url::title )` tramite il modulo `crypto` di Node. Lo assegna come `uniqueKey`.

**MongoDB — Save Raw Article:** `insert` nella collection `articles` con tutti i campi. Configurato con `onError: continueErrorOutput`. Se `uniqueKey` esiste già (errore E11000 MongoDB — violazione indice unico), l'articolo va sull'output di errore invece di bloccare il workflow. Il nodo `Log Duplicates Discarded` su quell'output logga il numero di duplicati senza fare nulla.

---

### Workflow 2 — `adapt articles2` — Enrichment + AI

**Trigger:** `scheduleTrigger` ogni 20 minuti

Il workflow è diviso in due fasi sequenziali (Enrichment prima, LLM dopo).

#### Fase 1 — Enrichment (raw → ready)

**MongoDB — Query Raw Articles:** legge fino a 30 articoli con `status: 'raw'`, ordinati per `createdAt ASC` (FIFO).

**Split — Enrich 1 by 1:** nodo `splitInBatches` che processa un articolo alla volta. Quando finisce, aspetta 10 secondi (`Wait`) e poi va alla Fase 2.

**IF — Is Reuters?:** controlla se `source.toLowerCase().includes('reuters')`.
- **Sì → Reuters:** `httpRequest` sulla pagina reale con User-Agent browser (best-effort scraping, `continueOnFail`). Il nodo `Extract Reuters Text` pulisce l'HTML, decodifica entità HTML, rimuove script/style/nav/footer, e produce un testo pulito fino a 3000 caratteri. Se fallisce, usa `contentSnippet` come fallback.
- **No → IF — Is Hacker News?:** stessa logica per articoli HN (cerca `'hacker'` nel source).
  - **Sì → HN:** fetch della pagina linkata dall'articolo HN, stesso extraction logic.
  - **No → Set Ready (Non-Reuters):** per TechCrunch e ANSA (che già hanno il content nell'RSS), pulisce solo l'HTML dal content esistente.

Tutti i percorsi aggiornano MongoDB con `status: 'ready'`, il contenuto pulito, `enrichedAt`, `enrichmentOk`.

#### Fase 2 — LLM Processing (ready → processed)

**Wait 10s:** attende che tutti gli update dell'enrichment siano completati.

**MongoDB — Query Ready Articles:** legge fino a 30 articoli con `status: 'ready'`.

**IF — Ready Articles Found?:** se 0 articoli, va al nodo `Stop` (fine pipeline). Se ≥1, continua.

**Split LLM — Batches of 2:** processa 2 articoli per volta per non superare i limiti del modello LLM gratuito.

**Prepare LLM Prompt (Code):** costruisce il payload per l'API LLM:

**System prompt (inviato al modello):**
```
Sei un assistente di business intelligence. Analizza ogni articolo e restituisci 
SOLO un JSON array valido con questa struttura:
[{
  "index": <1-based>,
  "uniqueKey": "<copiato esattamente dall'input>",
  "summary": "<riassunto in italiano max 50 parole>",
  "sentiment": "<Positive|Negative|Neutral>",
  "entities": ["<entita1>", ...],
  "macroTopics": ["<topic dalla lista fissa>"]
}]
Lista topic validi: Intelligenza Artificiale, Cybersecurity, Business & Finanza,
Politica & Geopolitica, Startup & Innovazione, Software & Sviluppo, Scienza & Ricerca,
Energia & Ambiente, Economia & Mercati, Social Media & Cultura, Salute & Medicina, 
Trasporti & Mobilità
```

Il payload usa `model: 'openrouter/free'`, `max_tokens: 2500`, `temperature: 0.2`.

**OpenRouter — LLM Request:** `httpRequest POST` verso `https://openrouter.ai/api/v1/chat/completions` con autenticazione Bearer (credenziale n8n). `timeout: 45s`, `retryOnFail: true`, `neverError: true`.

**Parse LLM Response + Fallback (Code):** parsing robusto della risposta:
1. Estrae il `content` dalla struttura `choices[0].message.content`
2. Rimuove eventuali backtick markdown attorno al JSON
3. Cerca il primo array JSON con regex `/\[[\s\S]*\]/`
4. Fa `JSON.parse` — se fallisce, attiva il **fallback globale**
5. Per ogni articolo nel batch: cerca il risultato per `uniqueKey` esatto (preferito) o per `index` (fallback)
6. Valida il sentiment contro i 3 valori ammessi
7. Sanitizza i `macroTopics` con `sanitizeTopics()`: mantiene solo valori nella lista fissa, usa `['Scienza & Ricerca']` come default

**Fallback attivato da:** errore HTTP, timeout, JSON invalido, risposta vuota → imposta `aiProcessed: false`, `aiError: 'messaggio'`, `sentiment: 'Neutral'`, `macroTopics: ['Scienza & Ricerca']`, `status: 'processed'`.

**MongoDB — Update to Processed:** aggiorna ogni articolo con i campi AI (`summary`, `sentiment`, `entities`, `macroTopics`, `aiProcessed`, `aiError`, `processedAt`, `status: 'processed'`).

**Log + Loop:** dopo l'update, torna al nodo `Split LLM` per processare il batch successivo.

---

### Workflow 3 — Feed personalizzato + Aggiornamento profilo

Contiene **due webhook indipendenti**.

#### 3a — `POST /briefai/feed` — Generazione feed

**Extract User Params (Code):** legge `body.userId` e `body.limit` (default 20).

**MongoDB — Fetch User Profile:** cerca il documento in `user_profiles` per `userId`.

**Normalize Profile (Code):** se il profilo non esiste, usa tutti i 12 topic con pesi 1.0. Altrimenti estrae `macroTopics`, `keywords`, `weights`, `sentimentPreference`, `preferredSources` con default su ogni campo.

**MongoDB — Fetch Enriched Articles:** legge fino a 200 articoli con `status: 'processed'`, ordinati per `pubDate DESC`.

**Ranking Engine (Code):** algoritmo principale — restituisce gli articoli ordinati per rilevanza.

**Hard filter:**
```js
articles.filter(a =>
  (a.macroTopics || []).some(t => selectedTopics.includes(t))
)
```
Gli articoli che non appartengono ad almeno uno dei macro-topic selezionati dall'utente vengono completamente esclusi prima dello scoring.

**Formula di scoring:**
```
score = (interestScore  × 0.55)
      + (keywordScore   × 0.25)
      + (recencyScore   × 0.15)
      + sentimentBonus  (0.0 – 0.2)
      + sourceBonus     (0.0 – 0.1)
```

**`recencyScore(pubDateStr)`:** decadimento lineare da 1.0 (articolo appena pubblicato) a 0.0 (articolo vecchio di 168 ore = 7 giorni).

**`keywordScore(article, keywords)`:** conta quante keyword dell'utente compaiono nel testo concatenato di `title + summary + content`. Restituisce `matches/total`, capped a 1.0. Se nessuna keyword definita, restituisce 0.5 (neutro).

**`interestScore(article, weights, selectedTopics)`:** prende i `macroTopics` dell'articolo che sono anche nei topic selezionati dall'utente, ne legge i pesi, restituisce il massimo normalizzato a 1.0 (`Math.min(weight/1.5, 1.0)`).

**`sentimentBonus(article, preference)`:** se la preferenza è `'all'`, +0.1. Se corrisponde, +0.2. Altrimenti 0.

**`sourceBonus(article, preferredSources)`:** +0.1 se la fonte è nelle fonti preferite dall'utente.

La risposta include `scoreBreakdown` per ogni articolo con il contributo di ogni componente.

**Risposta restituita al webhook:** `{ userId, generatedAt, totalFetched, totalFiltered, totalReturned, profile: { macroTopics, sentimentPreference }, articles: [...] }`

**Prepare Timestamp + MongoDB Update:** in parallelo alla risposta, aggiorna `lastFeedGeneratedAt` in `user_profiles`.

#### 3b — `POST /briefai/profile/update` — Aggiornamento profilo

**Prepare Profile Update (Code):** estrae dal body i campi `macroTopics`, `keywords`, `weights`, `sentimentPreference`, `preferredSources`, `updatedAt`. Ignora campi non presenti.

**MongoDB — Save Updated Profile:** `update` su `user_profiles` con i campi estratti, usando `userId` come chiave di ricerca.

**Risponde** con `{ success: true, message: 'Profilo aggiornato con successo', userId }`.

---

### Workflow 4 — Feedback loop

**Trigger webhook:** `POST /briefai/feedback`

**Input atteso:** `{ userId: string, articleId: string, vote: 1 | -1 }`

**Extract Feedback Params (Code):** valida presenza e tipo di tutti e tre i campi. Lancia errore se `vote` non è `1` o `-1`.

**MongoDB — Fetch Article:** cerca l'articolo per `uniqueKey = articleId`. Serve per leggere `macroTopics` e `source`.

**Attach Article Metadata (Code):** combina i dati del feedback con i metadati dell'articolo (`articleMacroTopics`, `articleSentiment`, `articleSource`).

**MongoDB — Fetch User Profile:** cerca `user_profiles` per `userId`.

**Compute Updated Weights (Code):** il cuore del feedback loop.

**Costanti:**
```js
STEP = 0.2   // incremento/decremento per ogni interazione
MIN  = 0.0   // peso minimo
MAX  = 2.4   // peso massimo
```

**Algoritmo:**
```js
for (const topic of articleMacroTopics) {
  const current = weights[topic] ?? 1.0
  const updated = clamp(current + vote * STEP, MIN, MAX)
  weights[topic] = updated
}
```

Effetto: se l'articolo ha topic `['AI', 'Cybersecurity']` e il voto è `+1`, entrambi i pesi salgono di 0.2. Se il voto è `-1`, scendono di 0.2.

**Aggiornamento preferredSources:** se `vote === 1` e la source non è già nelle preferite, viene aggiunta.

**MongoDB — Save Updated Profile:** salva `weights`, `preferredSources`, `updatedAt` su `user_profiles`.

**Risponde** con `{ success: true, message: 'Feedback registrato con successo', userId, update: feedbackSummary }`.

---

## 6. Flussi dati end-to-end

### Registrazione nuovo utente

```
1. Utente arriva su /onboarding
2. Seleziona macro-topic → passo 2 → inserisce keyword
3. localStorage: briefai-onboarding = { selectedTopics, keywords }
4. Naviga a /register, compila form
5. RegisterPage legge briefai-onboarding e invia a POST /api/auth/register
   con { email, password, username, preferences: { macroTopics, keywords } }
6. Backend crea User con hashing password (pre-save hook)
   → post-save hook crea user_profiles corrispondente
7. Backend genera JWT { userId, email, role } exp 24h
8. Frontend salva token in briefai_token localStorage
9. Naviga a /feed con window.location.href (hard redirect)
```

### Login utente esistente

```
1. POST /api/auth/login → backend verifica bcrypt → JWT
2. saveToken in localStorage
3. isAuthenticated = true → ProtectedRoute sblocca /feed
4. navigate('/feed')
```

### Caricamento feed

```
1. FeedContent al mount chiama fetchPersonalizedFeed()
2. feedService decodifica JWT → estrae userId
3. POST {N8N}/briefai/feed con { userId, limit: 50 }
4. W3 legge user_profiles per userId
5. W3 legge 200 articoli processed da MongoDB
6. Hard filter: solo articoli in macroTopics selezionati
7. Ranking Engine: score = interest×0.55 + keyword×0.25 + recency×0.15 + bonus
8. Risposta: top 50 articoli con scoreBreakdown
9. feedService normalizza con type-casting robusto
10. FeedContent setta articles → status 'ok'
11. Render lista MagicCard
```

### Like su un articolo

```
1. MagicCard chiama onVoteChange(articleId, 1)
2. FeedContent optimistic update: voteByArticle[id] = 1 → stato + localStorage
3. sendVoteDelta → sendFeedback(articleId, 1)
4. feedbackService: POST {N8N}/briefai/feedback con { userId, articleId, vote: 1 }
5. W4: fetch articolo → fetch profilo → compute weights (±0.2) → save
6. Da questo momento il prossimo feed avrà pesi aggiornati
7. Se errore: FeedContent ripristina il voto precedente (rollback optimistic)
```

### Modifica preferenze in impostazioni

```
1. SettingsPage carica profilo: GET /api/profile
2. Utente toggling macro-topic
3. handleSaveMacroTopics → PUT /api/profile con { macroTopics }
4. Backend aggiorna User → post-save hook aggiorna user_profiles
5. apiService.updateProfile anche chiama POST {N8N}/briefai/profile/update
   (doppia sincronizzazione per garanzia)
6. persistSettings scrive briefai-settings localStorage
```

---

## 7. Schema MongoDB

### Collection `users`

```json
{
  "_id": "ObjectId",
  "userId": "user_1717000000000_abc123def",
  "email": "utente@esempio.com",
  "password": "$2a$10$...(bcrypt hash)",
  "username": "nomeutente",
  "role": "user",
  "macroTopics": ["Intelligenza Artificiale", "Cybersecurity"],
  "keywords": ["OpenAI", "Tesla"],
  "weights": {
    "Intelligenza Artificiale": 1.6,
    "Cybersecurity": 0.8,
    "Business & Finanza": 1.0,
    "...altri 9 topic...": 1.0
  },
  "preferredSources": ["TechCrunch"],
  "lastFeedGeneratedAt": "2026-06-10T10:00:00.000Z",
  "subscriptionPlan": "free",
  "subscriptionExpiresAt": null,
  "createdAt": "2026-06-01T00:00:00.000Z",
  "updatedAt": "2026-06-10T10:00:00.000Z"
}
```

### Collection `articles`

```json
{
  "_id": "ObjectId",
  "uniqueKey": "a3f8d2c1...(SHA-256 hex)",
  "title": "OpenAI annuncia GPT-5",
  "url": "https://techcrunch.com/...",
  "pubDate": "Mon, 10 Jun 2026 08:00:00 +0000",
  "source": "TechCrunch",
  "category": "tech",
  "content": "Testo estratto e pulito dall'HTML...",
  "summary": "OpenAI ha presentato GPT-5 con capacità avanzate di ragionamento.",
  "sentiment": "Positive",
  "entities": ["OpenAI", "Sam Altman", "GPT-5"],
  "trendingTopics": [],
  "macroTopics": ["Intelligenza Artificiale", "Software & Sviluppo"],
  "status": "processed",
  "aiProcessed": true,
  "aiError": null,
  "processedAt": "2026-06-10T08:20:00.000Z",
  "createdAt": "2026-06-10T08:05:00.000Z"
}
```

**Ciclo di vita status:**
```
raw (da W1) → ready (da W2 Enrichment) → processed (da W2 LLM)
```

### Collection `user_profiles`

```json
{
  "_id": "ObjectId",
  "userId": "user_1717000000000_abc123def",
  "macroTopics": ["Intelligenza Artificiale", "Cybersecurity"],
  "keywords": ["OpenAI", "Tesla"],
  "weights": {
    "Intelligenza Artificiale": 1.6,
    "Cybersecurity": 0.8,
    "...": 1.0
  },
  "preferredSources": ["TechCrunch"],
  "subscriptionPlan": "free",
  "subscriptionExpiresAt": null,
  "lastFeedGeneratedAt": "2026-06-10T10:00:00.000Z",
  "updatedAt": "2026-06-10T10:00:00.000Z"
}
```

---

## 8. Schema localStorage

| Chiave | Tipo valore | Scritto da | Letto da |
|---|---|---|---|
| `briefai_token` | `string` (JWT) | authService `saveToken` | authService `getAuthHeader`, `decodeToken`; feedbackService |
| `briefai_voted_articles` | `Record<string, 1\|-1>` | FeedContent | FeedContent (init state) |
| `briefai_saved_articles` | `Record<string, boolean>` | FeedContent, feedbackService (fallback) | FeedContent (init state), feedbackService |
| `briefai-onboarding` | `{ selectedTopics: string[], keywords: string[] }` | OnboardingPage | RegisterPage, SettingsPage |
| `briefai-register-draft` | `{ username, email, password, terms }` | RegisterPage (quando redirige a onboarding) | RegisterPage (al mount) |
| `briefai-newUser` | `'true'` | (non presente nel codice attuale, gestito come flag) | OnboardingPage |
| `briefai-settings` | `SettingsSnapshot` | SettingsPage `persistSettings` | SettingsPage `readInitialSettings` |

---

## 9. Variabili d'ambiente

### Backend (`.env`)

```
MONGO_URI=mongodb+srv://...     # Stringa di connessione MongoDB Atlas
JWT_SECRET=...                  # Secret per firmare/verificare JWT (stringa random)
NODE_ENV=development            # 'development' o 'production'
PORT=5000                       # Porta del server Express
CORS_ORIGIN=                    # (opzionale) lista di origin separati da virgola
FRONTEND_URL=                   # (opzionale) URL frontend in produzione
```

### Frontend (`.env.local`)

```
VITE_API_URL=http://localhost:5000   # URL base del backend Express
VITE_N8N_URL=https://...             # URL base dell'istanza n8n (senza /webhook)
```

---

## 10. Costanti di dominio condivise

La lista dei 12 macro-topic è definita identicamente in 4 posti diversi (backend User.js, frontend OnboardingPage, W2 Prepare LLM Prompt, W3 Ranking Engine). Se si aggiunge o rinomina un topic, va aggiornato in tutti e 4.

```
Intelligenza Artificiale
Cybersecurity
Business & Finanza
Politica & Geopolitica
Startup & Innovazione
Software & Sviluppo
Scienza & Ricerca
Energia & Ambiente
Economia & Mercati
Social Media & Cultura
Salute & Medicina
Trasporti & Mobilità
```

**Pesi utente:**
- Default: `1.0` per tutti i topic
- Range: `[0.0, 2.4]`
- Step di variazione per feedback: `0.2`
- Normalizzazione in `interestScore`: `Math.min(weight / 1.5, 1.0)` — i pesi >1.5 sono capped a 1.0 nel calcolo

**Formula di scadenza abbonamento Pro:** `now + 30 * 24 * 60 * 60 * 1000` ms = 30 giorni

**Token JWT:** payload `{ userId, email, role }`, scadenza `24h`, firmato con `JWT_SECRET` (HS256 default di jsonwebtoken)
