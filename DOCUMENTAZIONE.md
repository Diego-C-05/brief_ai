# BriefAI — Documentazione Tecnica v1.0

**Servizio di News Intelligence basato su LLM**  
*Documento tecnico di riferimento — Stato Finale (May 2026)*

---

## 1. Introduzione e Contesto

BriefAI è una piattaforma di personalizzazione e aggregazione di notizie che affronta il problema del sovraccarico informativo. Professionisti, analisti e appassionati di tecnologia ricevono quotidianamente centinaia di articoli da fonti eterogenee: leggere, filtrare e comprendere tutto è fisicamente impossibile. BriefAI risolve questo problema attraverso un'infrastruttura automatizzata di raccolta, analisi AI e ranking personalizzato, restituendo in pochi minuti una visione completa del contesto informativo dell'utente.

L'idea fondante è quella del "Digital Twin" di una newsletter: ogni articolo dalle fonti RSS pubbliche viene trasformato in una rappresentazione strutturata e arricchita dall'intelligenza artificiale con riassunto sintetico, sentiment analysis, estrazione di entità chiave (persone, aziende, luoghi) e identificazione di trending topic. Il risultato è chiarezza dove c'è rumore.

### Team e Ruoli
- **Lorenzo Bocca** — Frontend, Design & Infrastructure Engineer
- **Matteo Galluzzo** — AI & Analytics Engineer, Backend & Infrastructure Engineer
- **Nicolò Salvafiorita** — AI & Analytics Engineer, Backend & Infrastructure Engineer
- **Diego Cipolla** — Data Pipeline Engineer & Documentation Engineer

### Stack Tecnologico
- **Frontend:** React 19 + TypeScript + Vite 8 + React Router 7
- **Backend:** Node.js 18 + Express 4.18 + Mongoose 7.x
- **Data Pipeline:** n8n (self-hosted / cloud)
- **Database:** MongoDB Atlas
- **AI Models:** OpenRouter (accesso a modelli LLM)
- **Infrastruttura:** Docker Compose (dev), Railway/Vercel (production)

---

## 2. Architettura Generale

BriefAI è articolata in quattro layer comunicanti:

```
┌─────────────────────────────────────────────────────────┐
│ Presentation Layer (Frontend React + UI)                │
│ └─ Dashboard, Feed, Settings, Onboarding                │
├─────────────────────────────────────────────────────────┤
│ Ranking & Feedback Layer (n8n Workflow 3 & 4)           │
│ └─ Personalizzazione, calcolo score, feedback utente    │
├─────────────────────────────────────────────────────────┤
│ AI & Processing Layer (n8n Workflow 2 + OpenRouter)     │
│ └─ Batch processing LLM, riassunti, sentiment, entities │
├─────────────────────────────────────────────────────────┤
│ Data Layer (MongoDB Atlas + n8n Workflow 1)             │
│ └─ Ingestion RSS, deduplicazione, persistence           │
└─────────────────────────────────────────────────────────┘
```

Il sistema combina due motori complementari:
- **n8n:** Orchestra interamente la pipeline di raccolta dati, processing AI e ranking (modificabile senza deploy)
- **Express.js:** Gestisce autenticazione, query sugli articoli, gestione profili e statistiche aggregate
- **MongoDB:** Layer di sincronizzazione tra n8n e Express

---

## 3. Backend Express.js — 13 Endpoint REST

Il backend espone un'API REST documentata con 13 endpoint, suddivisi per dominio funzionale.

### 3.1 Autenticazione (3 endpoint — non richiedono JWT)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registra nuovo utente, crea automaticamente profilo |
| POST | `/api/auth/login` | Autentica e restituisce JWT (validità 24h) |
| GET | `/api/auth/me` | Restituisce dati utente corrente (richiede JWT) |

**Dettagli implementativi:**
- Password hashata con bcrypt (10 salt rounds)
- Email validata con regex prima del salvataggio
- Password validata: min 8 caratteri, 1 maiuscola, 1 numero
- JWT contiene `userId`, `email`, `role`; scadenza 24 ore
- Al registro, automaticamente creato documento in `user_profiles` con pesi di default

### 3.2 Articoli (2 endpoint — richiedono JWT)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/articles` | Lista articoli con filtri e paginazione |
| GET | `/api/articles/:uniqueKey` | Dettagli singolo articolo |

**Filtri disponibili su GET `/api/articles`:**
- `category` — Filtra per categoria
- `sentiment` — Filtra per sentiment (Positive/Negative/Neutral)
- `source` — Filtra per fonte (TechCrunch, Hacker News, Reuters, ANSA)
- `search` — Ricerca nel titolo e riassunto
- `status` — 'raw' o 'processed' (default: processed)
- `limit` — Articoli per pagina (default: 50)
- `page` — Numero pagina (default: 1)

**Nota importante:** Link stripping automatico su articoli processati. HTML anchors, markdown links e URL plain vengono rimossi da `content` e `summary` prima della risposta.

### 3.3 Profilo Utente (2 endpoint — richiedono JWT)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/profile` | Restituisce profilo utente con preferenze e pesi |
| PUT | `/api/profile` | Aggiorna categorie, keyword, piano di abbonamento |

**Struttura del profilo:**
```json
{
  "userId": "user_1234567890_abc",
  "email": "utente@example.com",
  "username": "utente",
  "macroTopics": ["tech", "business", "scienza"],
  "keywords": ["AI", "blockchain", "startup"],
  "weights": { "tech": 1.5, "business": 1.0, "scienza": 0.8 },
  "preferredSources": ["TechCrunch", "Hacker News"],
  "subscriptionPlan": "free",
  "subscriptionExpiresAt": null
}
```

**Gestione Subscription:**
- `subscriptionState: 'pro'` → Piano Pro (30 giorni di validità)
- `subscriptionState: 'free'` → Piano Free (senza expiry)
- Sincronizzazione automatica con `user_profiles` collection per n8n

### 3.4 Statistiche Aggregate (5 endpoint — richiedono JWT)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/stats/sentiment` | Distribuzione articoli per sentiment |
| GET | `/api/stats/categories` | Distribuzione articoli per categoria |
| GET | `/api/stats/trending` | Top 10 trending topics |
| GET | `/api/stats/sources` | Distribuzione articoli per fonte |
| GET | `/api/stats/overview` | Statistiche generali (totale, processed, raw) |

Tutte le aggregazioni eseguono filtro `status: 'processed'` e utilizzano pipeline MongoDB per performance ottimale.

### 3.5 Health Check (1 endpoint — non richiede JWT)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/health` | Verifica stato server e versione |

Utilizzato per monitoraggio e load balancer checks.

### 3.6 Sicurezza

- **Middleware JWT:** Verifica firma, scadenza e presence di token su tutti gli endpoint protetti
- **Password:** Hashate con bcrypt, non mai esposte in risposta
- **CORS:** Configurabile tramite `CORS_ORIGIN` env variable; localhost auto-trusted in dev
- **Helmet:** Protegge da vulnerabilità HTTP comuni (XSS, clickjacking, etc.)
- **Morgan:** Logging di tutte le richieste per debugging

---

## 4. Frontend React.js — Architecture e UX

### 4.1 Stack e Principi

| Tecnologia | Versione | Ruolo |
|------------|----------|-------|
| React | 19.2.5 | UI dichiarativa |
| TypeScript | 6.0.2 | Type safety |
| Vite | 8.0.9 | Bundler + dev server |
| React Router | 7.14.1 | Routing e route guards |
| React Compiler | 1.0.0 | Ottimizzazioni rendering compile-time |
| ESLint 9 | 9.39.4 | Static analysis |

**Principio architetturale:** Favorire decisioni reversibili ad alta leva, mantenere basso l'overhead cognitivo. State colocation (setState il più vicino possibile al punto d'uso), CSS per-pagina + condiviso, SVG inline per icone.

### 4.2 Routing (7 route)

| Route | Tipo | Descrizione |
|-------|------|-------------|
| `/` | Pubblica | HomePage — landing con piani e preview articolo |
| `/login` | Pubblica | LoginPage — autenticazione |
| `/register` | Pubblica | RegisterPage — registrazione |
| `/onboarding` | Protetta | OnboardingPage — wizard categorie + keyword |
| `/feed` | Protetta | FeedPage — feed personalizzato con MagicCard |
| `/impostazioni` | Protetta | SettingsPage — preferenze account e subscription |
| *`/tendenze` (RIMOSSA)* | *Protetta* | *Precedentemente: trending topics — non funzionante* |

**Nota sui cambiamenti:** La rotta `/tendenze` (TrendsPage) è stata eliminata nello stato finale perché non riusciva a funzionare correttamente. La decisione consapevole è stata quella di prioritizzare un prodotto funzionante e stabile rispetto a una feature incompleta. Le statistiche di trending rimangono disponibili tramite l'endpoint `/api/stats/trending` backend.

### 4.3 Flusso Utente Principale

1. **Homepage pubblica** → Landing con informazioni piani
2. **Registrazione** → Email, password validata, username univoco
3. **Onboarding wizard** → Selezione macroTopics, inserimento keywords, scelta piano
4. **Feed** → Visualizzazione articoli con MagicCard (titolo, riassunto, sentiment, entità, pulsanti feedback)
5. **Feedback asincrono** → 👍 / 👎 invia immediatamente a n8n senza reload pagina
6. **Impostazioni** → Modifica preferenze, upgrade/downgrade piano

### 4.4 Componenti Principali

- **MagicCard:** Componente articolo con titolo linkabile, riassunto max 50 parole, badge sentiment colorato, tag entità, pulsanti feedback
- **FeedContent:** Container del feed, traccia stato salvataggi, gestisce loading e errori
- **FeedTopbar & FeedSidebar:** Layout shell
- **AccountSettings:** Gestione subscription e profilo
- **InterestPreferences:** Selezione categorie e keyword
- **ProtectedRoute:** Route guard client-side con redirect a login

### 4.5 State Management

- **Nessun state manager globale** (Redux/Zustand volutamente esclusi)
- **localStorage:** Solo preferenze non-sensibili (onboarding, theme)
- **useState:** Stato locale per ogni pagina/componente
- **useMemo:** Memoizzazione di derivazioni per evitare re-render inutili

**Impatto:** TTI basso, zero overhead, architettura scalabile per future migrazioni a framework full-stack.

---

## 5. Pipeline n8n — Quattro Workflow

### 5.1 Workflow 1: RSS Ingestion & Deduplicazione

**Trigger:** Cron ogni 15 minuti  
**Fonti:** TechCrunch, Hacker News, Reuters, ANSA (RSS pubblici)

**Algoritmo:**
1. Fetch parallelo da 4 fonti
2. Per ogni articolo: genera `uniqueKey` = SHA-256(url::title)
3. Tenta insert su MongoDB con indice unique su `uniqueKey`
4. Se duplicato: insert fallisce ma workflow continua grazie a `continueErrorOutput`
5. Nuovi articoli salvati con `status: 'raw'`

**Bug risolto:** Hacker News era etichettato con source 'Reddit' (residuo versione precedente). Corretto aggiornando il valore nel nodo JavaScript.

**Deduplicazione strutturale:** SHA-256 su URL + titolo garantisce unicità esatta. **Limitazione nota:** Non rileva articoli semanticamente simili da fonti diverse (v. roadmap per Vector Search).

### 5.2 Workflow 2: AI Batch Processing con Fallback

**Trigger:** Cron ogni 20 minuti  
**Provider:** OpenRouter (modelli LLM free)

**Algoritmo:**
1. Query MongoDB: fino a 10 articoli con `status: 'raw'` ordinati per createdAt
2. Verifica soglia: se < 5 articoli, interrompi con log
3. Raggruppa in batch da 5 elementi
4. POST a OpenRouter con prompt strutturato
5. Estrai JSON: index, summary (50 parole max), sentiment (Positive/Negative/Neutral), entities (persone/aziende/luoghi/prodotti), trendingTopics

**Fallback robusto:**
- Se HTTP status ≠ 200, JSON malformato, o campo `choices` assente
- Assegna: sentiment=Neutral, arrays vuoti, flag `aiProcessed: false` + `aiError` descrittivo
- **Nessun articolo viene perso**, pipeline continua normalmente

**Gestione rate limit:** Pausa configurabile tra batch per non superare quota OpenRouter

### 5.3 Workflow 3: Ranking Engine & Feed Generation

**Endpoint:** POST `/briefai/feed`  
**Input:** userId  
**Output:** Top 20 articoli personalizzati per score composito

**Ranking formula:**
- 35% **weighted_interest** — Categoria articolo × peso profilo utente
- 30% **keyword_match** — Keyword presenti in titolo/riassunto/content
- 25% **recency** — Finestra 7 giorni con decadimento lineare
- 5% **sentiment_bonus** — Bonus se sentiment corrisponde preferenza utente
- 5% **source_bonus** — Bonus se fonte nelle preferite

**Operazioni:**
1. Carica profilo utente (fallback a profilo default se non trovato)
2. Carica ultimi 200 articoli `status: 'processed'` ordinati desc por pubDate
3. Calcola score per ogni articolo
4. Restituisce top 20 come JSON

**Endpoint secondario:** POST `/briefai/profile/update` per aggiornamento manuale profilo

### 5.4 Workflow 4: Feedback Loop

**Endpoint:** POST `/briefai/feedback`  
**Payload:** userId, articleId, vote (+1 per like, -1 per dislike)

**Operazioni:**
1. Recupera metadati articolo votato
2. Carica profilo utente corrente
3. Aggiorna peso categoria: `weight += 0.1 × vote`, mantenendo range [0.0, 2.0]
4. Se voto positivo e source non in preferredSources: aggiungi source
5. Salva profilo aggiornato su MongoDB
6. Restituisce JSON con riepilogo modifica

**Effetto:** Ranking futuro riflette preferenze utente in tempo reale

---

## 6. Database MongoDB

### 6.1 Collections e Schema

**Collection `articles`**
```javascript
{
  _id: ObjectId,
  uniqueKey: String (unique index),
  title: String,
  url: String,
  pubDate: Date,
  source: String (TechCrunch | Hacker News | Reuters | ANSA),
  category: String,
  content: String,
  summary: String (50 parole max, AI-generated),
  sentiment: String (Positive | Negative | Neutral),
  entities: Array<{ type: String, value: String }>,
  trendingTopics: Array<String>,
  status: String (raw | processed),
  aiProcessed: Boolean,
  aiError: String (null se aiProcessed: true),
  processedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Collection `users`**
```javascript
{
  _id: ObjectId,
  userId: String (unique),
  email: String (unique),
  username: String (unique),
  password: String (bcrypt hash),
  macroTopics: Array<String>,
  keywords: Array<String>,
  weights: Map<String, Number>,
  preferredSources: Array<String>,
  subscriptionPlan: String (free | pro),
  subscriptionExpiresAt: Date (null se free),
  role: String (user | admin),
  createdAt: Date,
  updatedAt: Date
}
```

**Collection `user_profiles`** (sincronizzata con `users` da backend)
```javascript
{
  _id: ObjectId,
  userId: String (unique),
  macroTopics: Array<String>,
  keywords: Array<String>,
  weights: Map<String, Number>,
  preferredSources: Array<String>,
  subscriptionPlan: String,
  subscriptionExpiresAt: Date,
  lastFeedGeneratedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 6.2 Indici

| Collection | Campo | Tipo | Motivo |
|------------|-------|------|--------|
| articles | uniqueKey | unique | Deduplicazione strutturale |
| articles | status | standard | Query Workflow 2 e Ranking |
| articles | pubDate | standard | Sorting feed |
| users | email | unique | Login univoco |
| users | username | unique | Unicità username |
| users | userId | unique | Identificazione utente |
| user_profiles | userId | unique | Sincronizzazione backend |

### 6.3 Sincronizzazione Backend ↔ n8n

- **Post-save hook** su `users`: Crea automaticamente documento in `user_profiles` con pesi default
- **PUT `/api/profile`** aggiorna sia `users` che `user_profiles` tramite `findOneAndUpdate` con `upsert: true`
- **n8n legge** da `user_profiles` e `articles` direttamente
- **Non c'è contesa:** n8n legge, backend scrive ordinatamente via hook

---

## 7. Infrastruttura e Deploy

### 7.1 Development Setup

```bash
# Frontend
cd frontend-BriefAI
npm install
npm run dev  # http://localhost:5173

# Backend
cd digital-twin-news-feature-nicol-ai-frontend/backend
npm install
npm run start  # http://localhost:5000

# n8n (opzionale, se self-hosted)
docker-compose up -d n8n
```

### 7.2 Variabili d'Ambiente Richieste

**Backend** (`.env`):
```bash
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/briefai
JWT_SECRET=<random-string-64-chars>
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

**Frontend** (`.env.local`):
```bash
VITE_API_URL=http://localhost:5000
```

### 7.3 Production Checklist

- [ ] MongoDB cluster configurato: tier M2 o superiore
- [ ] JWT_SECRET rigenerato (64 caratteri random)
- [ ] CORS origin aggiornato con dominio reale
- [ ] NODE_ENV=production
- [ ] SSL/TLS certificato attivo
- [ ] Backup database automatico abilitato
- [ ] Health check `/health` monitorato (load balancer)
- [ ] Rate limiting configurato (se esposto pubblicamente)
- [ ] Logging centralizzato (Sentry o equivalente)

### 7.4 Deploy Platform Consigliate

- **Backend:** Railway (scelta team), Render, Heroku, DigitalOcean App Platform
- **Frontend:** Vercel (consigliato), Netlify, GitHub Pages
- **Database:** MongoDB Atlas (cloud)
- **n8n:** Cloud n8n (paid) oppure self-hosted su VPS

---

## 8. Cambiamenti Rispetto alla Documentazione Originale

### 8.1 TrendsPage Rimossa

**Stato originale:** Documentazione descriveva 7 route protette inclusa `/tendenze` (TrendsPage)

**Stato attuale:** Route `/tendenze` eliminata dal codebase

**Motivo:** Durante lo sviluppo, la pagina TrendsPage non riusciva a funzionare correttamente. Piuttosto che mantenere una feature broken, il team ha fatto una scelta consapevole di prioritizzare un prodotto funzionante e stabile. Le funzionalità di trending rimangono **pienamente disponibili** tramite:
- Endpoint `/api/stats/trending` (top 10 trending topics)
- Campo `trendingTopics` negli articoli
- Dashboard potrebbe re-introdurre una sezione trending quando l'implementazione sarà solida

### 8.2 Subscription Management Aggiunto

**Stato originale:** Documentazione accennava ai piani (Free/Pro) ma senza implementazione

**Stato attuale:** Sistema di subscription completamente implementato

**Implementazione:**
- Campo `subscriptionPlan` in `users` collection (free | pro)
- Campo `subscriptionExpiresAt` per data scadenza (null se free, 30 giorni se pro)
- Endpoint PUT `/api/profile` accetta `subscriptionState: 'pro'` | `'free'`
- Sincronizzazione automatica con `user_profiles` per future logiche n8n

**Motivo:** Preparazione per monetizzazione futura. Non è feature core nello stato attuale, ma l'infrastruttura è già in place per scalare verso un modello freemium senza modifiche architetturali.

### 8.3 13 Endpoint Backend Confermati

Tutti i 13 endpoint descritti nel documento originale sono **ancora presenti e funzionanti:**
- 3 Auth
- 2 Articles  
- 2 Profile
- 5 Stats
- 1 Health

**Nessun endpoint è stato rimosso o deprecated.**

---

## 9. Roadmap Futura

### 9.1 Deduplicazione Semantica (Priorità Alta)

**Problema:** SHA-256 su URL::titolo non rileva articoli semanticamente simili da fonti diverse

**Soluzione pianificata:** MongoDB Atlas Vector Search
1. Al salvataggio di ogni nuovo articolo, generare embedding vettoriale del titolo+riassunto
2. Query nearest-neighbor su articoli ultimi 24 ore
3. Se similarità coseno ≥ 0.92: scartare come duplicato semantico
4. Altrimenti: salvare con embedding persistito

**Vantaggi vs Redis:**
- Nessun servizio separato da gestire (già in MongoDB)
- Scaling coerente con infrastruttura existente
- Costo embedding < costo LLM completo per articolo
- Embedding riutilizzabile per clustering e topic modeling futuri

### 9.2 Altre Priorità

**AI & Personalization:**
- Raccomandazione predittiva basata su sequenze comportamento utente
- Topic clustering automatico per articoli correlati
- Trend detection con finestra temporale variabile

**Notifiche & Integrazioni:**
- Alert real-time su keyword spia via email/Slack
- Newsletter personalizzata con export PDF
- Integrazione Notion/Obsidian per archiviazione

**Testing:**
- Unit test per endpoint API e ranking algorithm
- Integration test end-to-end n8n + MongoDB
- Consistency test output LLM

**Monetizzazione:**
- Piano Free: 20 articoli/giorno, no advanced analytics
- Piano Pro: articoli illimitati, advanced trending, alert, export, API access B2B

---

## 10. Troubleshooting e Note Tecniche

### 10.1 JWT Token Expired
Se ricevi `401 Unauthorized`, il token JWT è scaduto (24 ore). Soluzione: re-login per ricevere nuovo token.

### 10.2 CORS Errors
Se il frontend non riesce a contattare il backend, verificare:
- `CORS_ORIGIN` nel `.env` backend corrisponde all'origine frontend
- localhost:5173 è auto-trusted in development
- Header `credentials: true` è configurato

### 10.3 MongoDB Connection
Verificare:
- Variabile `MONGO_URI` corretta (coppia user:pass, cluster name)
- IP whitelist in MongoDB Atlas include indirizzo di connessione
- Network connectivity dal server al cluster Atlas

### 10.4 n8n Workflow Debug
- Accedi a n8n dashboard
- Verifica esecuzioni workflow negli ultimi 24h
- Check log di ogni nodo per errori specifici
- Simula workflow manualmente per isolare failure

---

## 11. Glossario e Concetti Chiave

| Termine | Definizione |
|---------|------------|
| **uniqueKey** | SHA-256(url::title) — chiave di deduplicazione strutturale |
| **Digital Twin** | Rappresentazione strutturata e arricchita di un articolo con AI metadata |
| **Weighted Interest** | Categoria articolo × peso preferenza utente (35% ranking formula) |
| **Sentiment** | Classificazione AI: Positive, Negative, Neutral |
| **Entity** | Entità estratta dall'articolo: persona, azienda, luogo, prodotto |
| **Trending Topic** | Tema principale identificato da LLM nell'articolo |
| **Batch Processing** | Invio di 5 articoli insieme a LLM per ottimizzare throughput |
| **Fallback** | Azione alternativa quando LLM è indisponibile (sentiment=Neutral, arrays vuoti) |
| **Rate Limit** | Limite di richieste per unità di tempo (OpenRouter ha limit free tier) |

---

## 12. Riferimenti e Contatti

- **Frontend:** `frontend-BriefAI/` — React 19 + TypeScript + Vite
- **Backend:** `digital-twin-news-feature-nicol-ai-frontend/backend/` — Express.js + MongoDB
- **n8n:** Configurazione workflow nel cloud n8n o self-hosted
- **Documentazione React:** https://react.dev/
- **Documentazione MongoDB:** https://docs.mongodb.com/
- **Documentazione n8n:** https://docs.n8n.io/

---

**Versione Documento:** 1.0  
**Data:** May 2026  
**Status:** Final  
**Pagine:** 10

