# BriefAI — Documentazione Tecnica Completa
**Documento per la Commissione — Full Stack Developer**  
**Versione Verificata Contro Codebase Reale — May 2026**

---

## Indice
1. [Introduzione e Contesto](#1-introduzione-e-contesto)
2. [Architettura Generale](#2-architettura-generale)
3. [Pipeline n8n — I Quattro Workflow](#3-pipeline-n8n--i-quattro-workflow)
4. [Backend Express.js](#4-backend-expressjs)
5. [Frontend React.js](#5-frontend-reactjs)
6. [Database MongoDB Atlas](#6-database-mongodb-atlas)
7. [Variabili d'Ambiente](#7-variabili-dambiente)
8. [Setup Locale](#8-setup-locale)
9. [Difficoltà Incontrate](#9-difficoltà-incontrate)
10. [Glossario](#10-glossario)

---

## 1. Introduzione e Contesto

### Problema e Soluzione
BriefAI risolve l'information overload: raccoglie RSS da 4 fonti pubbliche, arricchisce gli articoli tramite LLM, e serve un feed personalizzato basato sui 12 macroTopics tematici selezionati dall'utente.

### Stack Tecnologico Verificato

| Layer | Tecnologia | Versione | Ruolo |
|-------|-----------|----------|-------|
| Frontend | React + TypeScript + Vite | 19.2 / 6.0 / 8.0 | SPA con HMR sub-secondo |
| Backend | Node.js + Express | 18.x / 4.18 | REST API stateless con JWT |
| Backend | Mongoose | 7.x | ODM per MongoDB |
| Orchestrazione | n8n | Cloud (hosted) | Workflow visivi — 4 pipeline |
| Database | MongoDB Atlas | M0 free tier | Datastore remoto |
| AI | OpenRouter | Free tier | Gateway multi-modello LLM |

### Team e Ruoli
- **Bocca Lorenzo**: Frontend, Design & Infrastructure
- **Galluzzo Matteo**: AI & Analytics, Backend & Infrastructure
- **Salvafiorita Nicolò**: AI & Analytics, Backend & Infrastructure
- **Cipolla Diego**: Data Pipeline & Documentation

---

## 2. Architettura Generale

### Vista Stratificata
```
┌─────────────────────────────────────────────────────────────────┐
│ PRESENTATION LAYER (React 19 SPA)                               │
│ Routes: /, /login, /register, /onboarding, /feed, /impostazioni │
└─────────────────────────────────────────────────────────────────┘
                    ↓ (REST API + webhooks)
┌─────────────────────────────────────────────────────────────────┐
│ ORCHESTRATION LAYER (n8n Cloud)                                 │
│ W1: RSS Fetch (15 min cron)     → articles (status: 'raw')     │
│ W2: Enrich + LLM (20 min cron)  → articles (status: 'processed')│
│ W3: Ranking (on-demand webhook) → personalized feed             │
│ W4: Feedback (on-demand webhook)→ update user_profiles weights  │
└─────────────────────────────────────────────────────────────────┘
                    ↓ (REST queries)
┌─────────────────────────────────────────────────────────────────┐
│ API LAYER (Express.js)                                          │
│ /api/auth/* (JWT)  /api/articles/*  /api/profile/*  /api/stats/*│
└─────────────────────────────────────────────────────────────────┘
                    ↓ (Mongoose ODM)
┌─────────────────────────────────────────────────────────────────┐
│ DATA LAYER (MongoDB Atlas)                                      │
│ Collections: articles, users, user_profiles                     │
└─────────────────────────────────────────────────────────────────┘
```

### Motori Operativi Distinti
- **n8n**: Orchestra l'intera pipeline dati (RSS → enrichment → LLM → personalizzazione). Modificabile senza deploy.
- **Express**: Gestisce autenticazione JWT, query articoli processati, operazioni profili, statistiche.
- **MongoDB Atlas**: Layer di sincronizzazione condiviso tra i due sistemi.

---

## 3. Pipeline n8n — I Quattro Workflow

### Tassonomia MacroTopics (12 categorie fisse)
La tassonomia è condivisa tra tutti i workflow:

| # | Topic | # | Topic |
|---|-------|---|-------|
| 1 | Intelligenza Artificiale | 7 | Scienza & Ricerca |
| 2 | Cybersecurity | 8 | Energia & Ambiente |
| 3 | Business & Finanza | 9 | Economia & Mercati |
| 4 | Politica & Geopolitica | 10 | Social Media & Cultura |
| 5 | Startup & Innovazione | 11 | Salute & Medicina |
| 6 | Software & Sviluppo | 12 | Trasporti & Mobilità |

Il topic di default (usato dal fallback) è: **Scienza & Ricerca**.

---

### 3.1 Workflow 1 — RSS Ingestion e Deduplicazione (ogni 15 min)

**Trigger**: Cron automatico ogni 15 minuti  
**Fonti**: TechCrunch (RSS nativo), Reuters (Google News RSS + parser custom), Hacker News (hnrss.org + parser custom), ANSA (RSS nativo)

#### Fasi di Esecuzione

**Fase 1: Fetch Parallelo**
- TechCrunch e ANSA: nodo RSS nativo di n8n
- Reuters: HTTP request + parser JavaScript custom (Google News RSS con filtro source)
- Hacker News: HTTP request + parser JavaScript custom (hnrss.org XML non standard)

**Fase 2: Tagging e Unificazione**
Ogni articolo riceve metadati:
- `source`: 'TechCrunch' | 'Reuters' | 'Hacker News' | 'ANSA'
- `category`: 'tech' | 'news' | 'social' | 'news-it'
- `status`: 'raw'
- `__sourceName`: Es. 'RSS — TechCrunch'

I quattro flussi sono unificati nel nodo "Merge Final (AB + CD)".

**Fase 3: Deduplicazione Strutturale**
- Nodo "Generate Unique Key": calcola `uniqueKey` = SHA-256(url::title normalizzato)
- MongoDB insert tentato con indice unique su `uniqueKey`
- Se esiste già (E11000): articolo scartato ma workflow continua (continueErrorOutput)
- Articoli nuovi → "Log — Saved OK"
- Duplicati → "Log — Duplicates Discarded"

#### Documento Salvato in MongoDB
```javascript
{
  _id: ObjectId,
  uniqueKey: String,          // SHA-256 — unique index
  title: String,
  url: String,
  pubDate: Date,
  source: String,             // TechCrunch | Reuters | Hacker News | ANSA
  category: String,           // tech | news | social | news-it
  content: String,            // contentSnippet originale dal feed
  contentSnippet: String,
  status: 'raw',
  createdAt: Date,
  __sourceName: String        // Es. RSS — TechCrunch
}
```

#### Bug Risolto — Etichettatura Hacker News
In una versione precedente, `__sourceName` per Hacker News era 'RSS — Reddit' (residuo da quando Reddit era fonte pianificata). Reddit è stata esclusa perché blocca lo scraping. Il valore corretto è ora 'HACKER - NEWS'.

---

### 3.2 Workflow 2 — Content Enrichment e AI Batch (ogni 20 min)

**Trigger**: Cron automatico ogni 20 minuti  
**Complessità**: Questo è il workflow più articolato.

#### Fase 1: Content Enrichment (per-fonte)

**Step 1**: Query MongoDB per fino a 30 articoli con `status: 'raw'`, ordinati per createdAt crescente (FIFO).

**Step 2**: Split in ciclo 1-a-1 per gestire rate limiting.

**Step 3**: IF sulla fonte dell'articolo → 3 rami di enrichment diversi:

**Ramo Reuters**:
1. HTTP Fetch della pagina originale con User-Agent appropriato
2. Pulizia HTML profonda: rimozione script, stili, nav, footer, commenti tramite regex
3. Decodifica HTML entity
4. Estrazione testo (max 3000 caratteri)
5. Se fetch fallisce o testo < 300 caratteri: fallback a contentSnippet/titolo
6. Salva su MongoDB con `status: 'ready'`, `enrichedAt`, `enrichmentOk`

**Ramo Hacker News**:
1. HTTP Fetch della pagina esterna linkata (non la pagina di discussione HN)
2. Stessa pulizia HTML di Reuters
3. Salva con `status: 'ready'`

**Ramo Altre Fonti (TechCrunch, ANSA)**:
1. Usa il content già disponibile nel documento
2. Pulizia base HTML
3. Imposta direttamente `status: 'ready'` (no fetch aggiuntivo)

**Pause**: Tra ogni articolo, attesa di 10 secondi per rispettare rate limit.

#### Fase 2: AI Batch Processing con Fallback

**Step 1**: Query MongoDB per articoli con `status: 'ready'`.

**Step 2**: IF verifica ≥ 1 articolo disponibile. Se no: stop con log.

**Step 3**: Split in batch da 2 elementi.

**Step 4**: Per ogni batch, prepara payload LLM:
```javascript
{
  "model": "openrouter/free",
  "max_tokens": 2500,
  "temperature": 0.2,
  "messages": [
    {
      "role": "system",
      "content": "Sei un assistente di business intelligence. Analizza ogni articolo e restituisci SOLO un array JSON valido..."
    },
    {
      "role": "user",
      "content": "Analizza i seguenti X articoli: [articoli con index, uniqueKey, titolo, fonte, data, URL, contenuto]"
    }
  ]
}
```

**Step 5**: Chiama OpenRouter API.

**Step 6**: Parse della risposta LLM + Fallback:
- Matching per `uniqueKey` (preferito), poi per `index` posizionale
- Se JSON malformato, HTTP error, o array invalido → attiva fallback automatico
- Fallback imposta: `summary` da contentSnippet/titolo (max 300 char), `sentiment: 'Neutral'`, `entities: []`, `macroTopics: ['Scienza & Ricerca']`, `aiProcessed: false`, `aiError: '<descrizione>'`
- In ogni caso, `status: 'processed'` (nessun articolo rimane bloccato)

#### Documento Processato in MongoDB
```javascript
{
  // ... campi precedenti ...
  summary: String,            // max 50 parole, AI-generated
  sentiment: String,          // Positive | Negative | Neutral
  entities: Array<String>,    // NER extracted
  macroTopics: Array<String>, // dalla tassonomia dei 12 topic
  aiProcessed: Boolean,       // true se LLM riuscito
  aiError: String,            // null se success
  processedAt: Date,
  enrichmentOk: Boolean,      // true se fetch pagina riuscito
  status: 'processed'
}
```

#### Validazione MacroTopics
Nel nodo "Parse LLM Response + Fallback", il campo `macroTopics` viene sanitizzato:
- Solo valori dalla lista dei 12 topic sono accettati
- Se LLM restituisce topic inventati (Es. 'AI' invece di 'Intelligenza Artificiale'): rimossi
- Se nessun topic valido: assegna il topic di default 'Scienza & Ricerca'

---

### 3.3 Workflow 3 — Ranking Engine e Feed Personalizzato (on-demand)

**Trigger**: Webhook POST `/briefai/feed`  
**Payload atteso**:
```json
{
  "userId": "user123",
  "limit": 20  // default 20, max 200
}
```

#### Algoritmo di Ranking

**Step 1**: Estrai `userId` e `limit` dal payload.

**Step 2**: Carica profilo utente dalla collection `user_profiles`:
- Se trovato: usa `macroTopics`, `keywords`, `weights`, `sentimentPreference`, `preferredSources`
- Se non trovato: profilo di default (tutti i 12 topic con peso 1.0, nessuna keyword, sentiment 'all')

**Step 3**: Carica ultimi 200 articoli con `status: 'processed'`, ordinati per `pubDate` decrescente.

**Step 4**: HARD FILTER — esclude articoli che NON appartengono ad almeno uno dei `macroTopics` selezionati dall'utente. Questo filtro è fondamentale per la rilevanza: se l'utente ha scelto 'Intelligenza Artificiale' e 'Cybersecurity', non vedrà mai articoli di altri topic, indipendentemente dallo score.

**Step 5**: Per ogni articolo che supera il filtro, calcola score composito ponderato:

| Dimensione | Peso | Formula |
|-----------|------|---------|
| `weighted_interest` | 40% | Peso del macroTopic con score più alto tra quelli dell'articolo presenti nel profilo. Range pesi [0.0–2.0], normalizzato a [0.0–1.0]. |
| `keyword_match` | 30% | Rapporto tra keyword trovate in titolo+summary+content e totale keyword del profilo. Se nessuna keyword: 0.5. |
| `recency` | 25% | Finestra 168 ore (7 giorni) con decadimento lineare. Score = 1 − (ageHours / 168). Articoli fuori finestra: 0.0. |
| `sentiment_bonus` | — | +0.2 se sentiment articolo = preferenza utente. +0.1 se preferenza = 'all'. Altrimenti 0.0. |
| `source_bonus` | — | +0.1 se source in preferredSources. Altrimenti 0.0. |

**Step 6**: Ordina articoli per score decrescente, restituisci top N (default 20).

**Step 7**: Aggiorna `lastFeedGeneratedAt` nel profilo utente su MongoDB (traccia ultimo accesso al feed).

#### Risposta JSON
```json
{
  "userId": "user123",
  "generatedAt": "2026-05-19T10:00:00Z",
  "totalFetched": 200,
  "totalFiltered": 45,
  "totalReturned": 20,
  "profile": {
    "macroTopics": ["Intelligenza Artificiale", "Cybersecurity"],
    "sentimentPreference": "all"
  },
  "articles": [
    {
      "id": "uniqueKey_hash",
      "title": "...",
      "url": "...",
      "source": "TechCrunch",
      "macroTopics": ["Intelligenza Artificiale"],
      "pubDate": "2026-05-19T09:30:00Z",
      "summary": "...",
      "sentiment": "Positive",
      "entities": ["OpenAI", "GPT"],
      "score": 0.8642,
      "scoreBreakdown": {
        "weighted_interest": 0.40,
        "keyword_match": 0.27,
        "recency": 0.21,
        "sentiment_bonus": 0.10,
        "source_bonus": 0.00
      }
    }
  ]
}
```

#### Webhook Secondario: Profile Update
**POST `/briefai/profile/update`** — consente aggiornamento diretto del profilo da n8n (usato dal backend Express dopo PUT /api/profile).

---

### 3.4 Workflow 4 — Feedback Loop e Aggiornamento Pesi (on-demand)

**Trigger**: Webhook POST `/briefai/feedback`  
**Payload atteso**:
```json
{
  "userId": "user123",
  "articleId": "uniqueKey_hash",
  "vote": 1  // 1 = like (thumbs up), -1 = dislike (thumbs down)
}
```

#### Logica del Feedback Loop

**Step 1**: Valida payload: userId, articleId, vote ∈ {-1, +1}. Se invalido: lancia errore.

**Step 2**: Recupera metadati articolo da `articles` tramite `uniqueKey` lookup → accedi a `macroTopics` e `source`.

**Step 3**: Recupera profilo utente corrente da `user_profiles`.

**Step 4**: Per ogni `macroTopic` presente nell'articolo votato:
```
newWeight = clamp(currentWeight + (vote × 0.1), 0.0, 2.0)
```
Il clamping garantisce range [0.0, 2.0].

**Step 5**: Se voto positivo (+1) e `source` dell'articolo non è già in `preferredSources` → aggiungi source a `preferredSources` (influenza il source_bonus nei ranking futuri).

**Step 6**: Salva profilo aggiornato su MongoDB:
- Aggiorna: `weights`, `preferredSources`, `updatedAt`

#### Risposta JSON
```json
{
  "success": true,
  "message": "Feedback registrato con successo",
  "userId": "user123",
  "update": {
    "macroTopics": ["Intelligenza Artificiale"],
    "updatedWeights": {
      "Intelligenza Artificiale": {
        "previous": 1.0,
        "new": 1.1
      }
    },
    "delta": 0.1,
    "vote": 1,
    "source": "TechCrunch"
  }
}
```

---

## 4. Backend Express.js

### Stack
- **Node.js 18.x** + **Express 4.18**
- **Mongoose 7.x** (ODM per MongoDB)
- **jsonwebtoken** (JWT HS256, scadenza 24h)
- **bcryptjs** (password hashing, 10 salt rounds)
- **Helmet** (security headers)
- **CORS** (gestione cross-origin)
- **Morgan** (HTTP logger)

### I 13 Endpoint REST

#### Autenticazione (3 endpoint — JWT non richiesto)

| Metodo | Endpoint | Descrizione | Logica |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Registra nuovo utente | Email regex + password policy (min 8 char, 1 maiusc, 1 numero). Hook post-save crea user_profiles con pesi default. |
| POST | `/api/auth/login` | Autentica utente | Verifica password con bcrypt. Restituisce JWT con payload: { userId, email, role }. |
| GET | `/api/auth/me` | Dati utente corrente | Richiede JWT. Ritorna profilo senza digest password. |

#### Articoli (2 endpoint — JWT richiesto)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/articles` | Lista articoli con paginazione e filtri: category, sentiment, source, search, status, limit, page. Middleware di link stripping rimuove anchor tag HTML, markdown link, URL plain-text. Filtro `status: 'processed'` applicato di default. |
| GET | `/api/articles/:uniqueKey` | Dettagli singolo articolo tramite chiave SHA-256. Stesso link stripping applicato. |

#### Profilo Utente (2 endpoint — JWT richiesto)

| Metodo | Endpoint | Descrizione | Azione Secondaria |
|--------|----------|-------------|------------------|
| GET | `/api/profile` | Ritorna profilo: userId, macroTopics, keywords, pesi, subscriptionPlan, subscriptionExpiresAt | — |
| PUT | `/api/profile` | Aggiorna: macroTopics, keywords, sentimentPreference, subscriptionState | Sincronizza a user_profiles via upsert. Inoltre, chiama webhook n8n POST `/briefai/profile/update` (try-catch, non blocca se fallisce). |

#### Statistiche Aggregate (5 endpoint — JWT richiesto)

| Metodo | Endpoint | Pipeline MongoDB |
|--------|----------|------------------|
| GET | `/api/stats/sentiment` | Group by sentiment, count + percentuale. Filtro: status = 'processed'. |
| GET | `/api/stats/categories` | Group by category, sort by count desc. |
| GET | `/api/stats/sources` | Group by source, count articoli. |
| GET | `/api/stats/overview` | Total count, processed count, raw count, articoli ultime 24h. |
| GET | `/api/stats/trending` | **⚠️ Nota**: Implementazione non trasparente dal codice. Presumibilmente usa il campo `macroTopics` degli articoli. |

#### Health Check (1 endpoint — JWT non richiesto)

| Metodo | Endpoint | Risposta |
|--------|----------|----------|
| GET | `/health` | HTTP 200 + { version, timestamp }. Usato per monitoraggio. |

### Sicurezza

**4 livelli**:
1. **Autenticazione JWT**: Middleware verifica presence, firma HMAC-SHA256, scadenza.
2. **Credential Storage**: Password hashate con bcrypt a 10 salt rounds, mai esposte in risposta.
3. **Header HTTP**: Helmet applica automaticamente CSP, X-Frame-Options, X-Content-Type-Options.
4. **CORS**: Origin configurabile via `CORS_ORIGIN` env var. Default: `localhost:5173` (Vite) o `localhost:3000` (CRA).

---

## 5. Frontend React.js

### Stack
- **React 19.2.5** (UI layer dichiarativo)
- **TypeScript 6.0.2** (type safety)
- **Vite 8.0.9** (bundler ESM-first, HMR sub-secondo)
- **React Router DOM 7.14.1** (routing modulare)
- **React Compiler 1.0.0** (auto-memoization)
- **ESLint 9 + typescript-eslint** (static analysis)

### Route e Componenti

| Route | Tipo | Componente | Descrizione |
|-------|------|-----------|-------------|
| `/` | Pubblica | HomePage | Landing con hero, card piani (Free/Pro), articolo demo. |
| `/login` | Pubblica | LoginPage | Form autenticazione con validazione client-side. Token salvato in localStorage. |
| `/register` | Pubblica | RegisterPage | Form registrazione con password policy enforcement. Chiama POST /api/auth/register. |
| `/onboarding` | Protetta | OnboardingPage | Wizard multi-step: (1) selezione 12 macroTopics, (2) keyword spia con validazione, (3) scelta piano. Preferenze salvate nello stato React tra i passaggi, inviate a /api/auth/register al completamento. |
| `/feed` | Protetta | FeedPage | Feed personalizzato. Chiama POST /briefai/feed (n8n webhook). Visualizza articoli tramite componente MagicCard. |
| `/impostazioni` | Protetta | SettingsPage | Preferenze account, interessi, upgrade/downgrade piano. Chiama PUT /api/profile. |

**Nota**: Route `/tendenze` (TrendsPage) rimossa perché non funzionava. I dati di trending rimangono disponibili via GET /api/stats/overview e campo macroTopics degli articoli.

### Decisioni Architetturali

| Aspetto | Scelta | Impatto |
|--------|--------|--------|
| State Management | useState locale + useMemo | TTI basso, zero overhead globale. Redux/Zustand deliberatamente esclusi. |
| Persistenza | localStorage per preferenze non-sensibili | Nessun accoppiamento prematuro con backend. Token JWT salvato in localStorage. |
| CSS | File per-pagina + App.css per shell | Isolamento stili, manutenibilità. |
| Icone | SVG inline | Zero dipendenze runtime. |
| Error Boundary | Non implementato | Trade-off esplicito: complessità contenuta in prototipo. |

### Componente Centrale: MagicCard

Visualizza ogni articolo nel feed con:
- Titolo linkabile alla fonte originale
- Riassunto AI (max 50 parole)
- Badge sentiment con colore semantico (verde = Positive, rosso = Negative, grigio = Neutral)
- Tag entità estratte
- Pulsanti feedback 👍 (like) / 👎 (dislike)

Feedback inviato asincrono via POST al webhook n8n senza ricaricare pagina. Stato ottimistico con rollback su errore.

### Auth Flow

**ProtectedRoute** (inline in App.tsx):
1. Verifica `isAuthenticated` state React
2. Fallback a localStorage per race condition post-registrazione
3. Redirige a `/login` se non autenticato

Token JWT decodificato lato client per estrarre `userId` (usato in feedService.ts).

---

## 6. Database MongoDB Atlas

### Schema e Sincronizzazione

#### Collection `articles`
```javascript
{
  _id: ObjectId,
  uniqueKey: String,          // SHA-256(url::title) — UNIQUE INDEX
  title: String,
  url: String,
  pubDate: Date,
  source: String,             // TechCrunch | Reuters | Hacker News | ANSA
  category: String,           // tech | news | social | news-it
  
  // Arricchito da W2
  content: String,            // HTML-pulito, max 3000 char
  contentSnippet: String,     // snippet originale dal feed RSS
  summary: String,            // max 50 parole, AI-generated
  sentiment: String,          // Positive | Negative | Neutral
  entities: Array<String>,    // NER extracted
  macroTopics: Array<String>, // dalla tassonomia 12-topic
  
  // Processing state
  status: String,             // raw | ready | processed — STANDARD INDEX
  aiProcessed: Boolean,
  aiError: String,            // null se success
  
  // Metadata
  enrichedAt: Date,
  enrichmentOk: Boolean,
  processedAt: Date,
  __sourceName: String,       // Es. 'RSS — TechCrunch'
  createdAt: Date,            // STANDARD INDEX
  updatedAt: Date
}
```

**Indici**:
- `uniqueKey`: UNIQUE (deduplicazione)
- `status`: STANDARD (query W2 raw/ready, W3 processed)
- `pubDate`: STANDARD (ordinamento feed)

#### Collection `users`
```javascript
{
  _id: ObjectId,
  userId: String,             // UNIQUE
  email: String,              // UNIQUE
  username: String,           // UNIQUE
  password: String,           // bcrypt hash — mai esposto
  
  // Profilo
  macroTopics: Array<String>,       // Topic selezionati dall'utente
  keywords: Array<String>,
  weights: Map<String, Number>,    // CHIAVI: categoria backend (vedi nota sotto)
  preferredSources: Array<String>,
  
  // Subscription
  subscriptionPlan: String,   // free | pro
  subscriptionExpiresAt: Date,
  
  role: String,               // user | admin
  createdAt: Date,
  updatedAt: Date
}
```

**⚠️ NOTA CRITICA SUI WEIGHTS**:
Il campo `weights` nella collection `users` utilizza **categorie backend** ('tech', 'news', 'social', 'news-it', 'general'), NON i 12 macroTopics della tassonomia n8n. Questo crea una disconnessione nella sincronizzazione: il profilo utente backend non allineato con il ranking engine n8n.

**Indici**:
- `email`, `username`, `userId`: tutti UNIQUE

#### Collection `user_profiles`
Punto di lettura primario per i workflow n8n. Sincronizzata con `users` tramite hook Mongoose.

```javascript
{
  _id: ObjectId,
  userId: String,             // UNIQUE — FK logica verso users
  
  macroTopics: Array<String>,      // 12-topic taxonomy
  keywords: Array<String>,
  
  // Aggiornati dal Feedback Loop (W4)
  weights: Object,            // CHIAVI: 12 macroTopics, VAL: [0.0–2.0]
  preferredSources: Array<String>,
  
  subscriptionPlan: String,
  subscriptionExpiresAt: Date,
  
  // Tracking
  lastFeedGeneratedAt: Date,  // aggiornato da W3 ogni volta che genera feed
  createdAt: Date,
  updatedAt: Date
}
```

**Indici**:
- `userId`: UNIQUE (lookup diretto da n8n)

### Meccanismo di Sincronizzazione

**Registrazione**: Hook Mongoose `post('save')` su `users` → crea documento in `user_profiles` con pesi default (1.0 per tutti i 12 macroTopics).

**Update Profilo**: PUT /api/profile nel backend esegue `findOneAndUpdate` con `upsert: true` su ENTRAMBE le collection. Inoltre, tenta di chiamare webhook n8n POST `/briefai/profile/update`.

**Flusso Feedback**: W4 legge e scrive esclusivamente da `user_profiles`. Express è l'unico writer su `users` e `user_profiles` tramite API. Nessuna contesa tra i due sistemi.

---

## 7. Variabili d'Ambiente

### Backend `.env`
```bash
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/briefai
JWT_SECRET=<stringa-random-minimo-64-caratteri>
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

**Dettagli**:
- `PORT`: Porta di ascolto del server Express.
- `MONGO_URI`: Connection string MongoDB Atlas con credenziali.
- `JWT_SECRET`: Stringa casuale per firma HMAC-SHA256. Minimo 64 caratteri raccomandati.
- `CORS_ORIGIN`: Origin del frontend. Se Vite (default): `localhost:5173`. Se CRA: `localhost:3000`.
- `NODE_ENV`: 'development' o 'production'.

### Frontend `.env.local`
```bash
VITE_API_URL=http://localhost:5000
VITE_N8N_URL=<n8n-webhook-base-url>
```

**Dettagli**:
- `VITE_API_URL`: Base URL del backend Express (usato da authService.ts e apiService.ts).
- `VITE_N8N_URL`: Base URL dei webhook n8n cloud. **OBBLIGATORIO** per:
  - `feedService.ts`: POST `{VITE_N8N_URL}/briefai/feed`
  - `feedbackService.ts`: POST `{VITE_N8N_URL}/briefai/feedback`
  - `apiService.ts`: PUT `{VITE_N8N_URL}/briefai/profile/update`

**Esempio n8n**:
```bash
VITE_N8N_URL=https://n8n.example.com/webhook
```

---

## 8. Setup Locale

### Prerequisiti
- Node.js 18.x (verificare con `node -v`)
- npm 9.x+ (verificare con `npm -v`)
- Account MongoDB Atlas con cluster M0 attivo
- Account n8n cloud con 4 workflow importati e attivati
- Account OpenRouter per API LLM free tier

### Avvio Development

#### Frontend
```bash
cd frontend-BriefAI
npm install
npm run dev
# Dev server avviato su http://localhost:5173
```

#### Backend
```bash
cd digital-twin-news-feature-nicol-ai-frontend/backend
npm install
npm run start
# Server avviato su http://localhost:5000
```

#### n8n
- Accedi al cloud n8n tramite browser
- Importa i 4 workflow JSON
- Attiva ciascun workflow
- Configura credenziali MongoDB Atlas e OpenRouter

#### MongoDB Atlas
- Crea cluster M0 gratuito
- Aggiungi IP locale alla whitelist (Network Access)
- Copia connection string in `MONGO_URI` del `.env` backend

### Checklist Configurazione
```
☐ Node.js 18.x installato
☐ MongoDB Atlas cluster M0 attivo
☐ MONGO_URI nel .env backend (user, pass, cluster name)
☐ IP locale in whitelist MongoDB Atlas
☐ JWT_SECRET random 64+ caratteri
☐ n8n cloud account attivo con 4 workflow importati e attivati
☐ MongoDB Atlas credential in n8n (nome: 'MongoDB Atlas — BriefAI')
☐ OpenRouter credential in n8n (nome: 'openrouter/free')
☐ CORS_ORIGIN nel .env backend = http://localhost:5173
☐ VITE_API_URL nel .env.local frontend = http://localhost:5000
☐ VITE_N8N_URL nel .env.local frontend = <n8n-webhook-url>
```

---

## 9. Difficoltà Incontrate

### 9.1 Transizione Python → n8n
La prima versione usava cron script Python + multi-database (PostgreSQL + MongoDB + Redis). Il passaggio a n8n ha richiesto rielaborazione concettuale: ogni logica divenne grafo visivo di nodi modificabili senza deploy.

### 9.2 Content Enrichment Reuters/HN
Reuters (Google News RSS) e HN (hnrss.org) non forniscono il corpo completo dell'articolo. Soluzione: fetch HTTP della pagina originale con pulizia HTML tramite regex + meccanismo di fallback.

### 9.3 Deduplicazione senza Redis
Prima versione prevedeva Redis per registro in-memory. Soluzione: indice unique MongoDB su `uniqueKey` (SHA-256). E11000 error non blocca workflow grazie a `continueErrorOutput`.

### 9.4 Classificazione LLM con MacroTopics Predefiniti
LLM free tier tende a inventare categorie. Soluzione: prompt di sistema con lista completa dei 12 topic + funzione di sanitizzazione nel nodo "Parse LLM Response + Fallback" che filtra la risposta LLM.

### 9.5 Esclusione Reddit come Fonte
Reddit blocca lo scraping automatico. Soluzione: sostituito con Hacker News via hnrss.org (contenuti tecnici di qualità, nessun blocking).

### 9.6 Persistenza Preferenze Onboarding
Difficoltà: conservare scelte utente attraverso i passaggi del wizard. Soluzione: salvataggio temporaneo nello stato React del componente OnboardingPage, invio all'endpoint /api/auth/register al completamento dell'ultimo step.

---

## 10. Glossario

| Termine | Definizione |
|---------|------------|
| **uniqueKey** | SHA-256(url::title normalizzato) — chiave di deduplicazione strutturale univoca per ogni articolo. |
| **macroTopic** | Uno dei 12 temi tematici predefiniti della tassonomia BriefAI usati per classificazione, hard filter e ranking. |
| **weighted_interest** | Peso del macroTopic più rilevante dell'articolo nel profilo utente (40% della formula di ranking). Range [0.0–2.0]. |
| **Hard Filter** | Esclusione totale degli articoli non appartenenti ai macroTopics selezionati dall'utente, prima del calcolo dello score. |
| **Content Enrichment** | Fase del Workflow 2 in cui si scarica il testo completo degli articoli Reuters e HN tramite fetch HTTP della pagina originale. |
| **Sentiment** | Classificazione AI dell'attitudine emotiva dell'articolo: Positive, Negative, Neutral. |
| **status: raw** | Articolo acquisito dal feed RSS ma non ancora arricchito né processato dall'AI. |
| **status: ready** | Articolo con contenuto arricchito (HTML pulito) disponibile, in attesa di elaborazione LLM. |
| **status: processed** | Articolo con summary, sentiment, entities e macroTopics generati dall'LLM, disponibile nel feed. |
| **Batch Processing** | Invio di gruppi di articoli (batch da 2) al modello LLM in una singola chiamata API. |
| **Fallback** | Meccanismo automatico che assegna valori di default (sentiment Neutral, macroTopic di default) quando il LLM non è disponibile o fallisce. |
| **continueErrorOutput** | Modalità n8n che permette al workflow di proseguire anche in caso di errore su un nodo, instradando il flusso sull'output di errore. |
| **sanitizeTopics** | Funzione di validazione che filtra la risposta LLM accettando solo macroTopics presenti nella tassonomia predefinita. |
| **Rate Limit** | Limite massimo di richieste per unità di tempo imposto da OpenRouter sul free tier e dalle sorgenti RSS esterne. |
| **JWT** | JSON Web Token (RFC 7519) — token stateless firmato HMAC-SHA256 con scadenza 24h. |
| **bcrypt** | Algoritmo di hashing adattivo per password con salt rounds configurabili, resistente agli attacchi brute-force. |
| **HMR** | Hot Module Replacement — sostituzione live dei moduli durante lo sviluppo senza reload della pagina (Vite). |
| **Upsert** | Operazione MongoDB: update se il documento esiste, insert se non esiste. |
| **ODM** | Object Document Mapper — Mongoose mappa documenti MongoDB a oggetti JavaScript con schema validato. |

---

## Conclusione

BriefAI combina due motori operativi distinti (n8n + Express) su un layer dati unificato (MongoDB Atlas). La pipeline è robusta con fallback automatici, il ranking personalizzato rispetta i filtri hard, e il feedback loop adatta continuamente i pesi utente.

**Versione Verificata**: Questo documento corrisponde al codice reale analizzato dalla codebase e dai 4 workflow n8n a maggio 2026.

---

**Fine del Documento**  
BriefAI — Documentazione Tecnica Verificata | May 2026
