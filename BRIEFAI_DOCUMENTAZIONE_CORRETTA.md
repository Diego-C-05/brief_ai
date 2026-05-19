# BriefAI — Documentazione Tecnica Corretta
**Documento per la Commissione — May 2026**

---

## Sommario delle Correzioni Rispetto al PDF

Le seguenti **incongruenze critiche** sono state identificate e corrette:

### ⚠️ Incongruenza #1: Mismatch tra Weights Backend e Taxonomy n8n
**Problema**: Il PDF descrive i weights nel range [0.0–2.0] per i 12 macroTopics della tassonomia n8n (Intelligenza Artificiale, Cybersecurity, etc.). Ma il codice reale del backend (User.js, UserProfile.js) usa **categorie completamente diverse**:
- `tech`, `news`, `social`, `news-it`, `general`

Questi sono incompatibili con i macroTopics n8n e causano una disconnessione nel sistema di ranking.

**Stato**: Richiede chiarimento. Presumibilmente il backend è stato rifattorizzato ma la documentazione non è stata aggiornata.

### ⚠️ Incongruenza #2: VITE_N8N_URL Mancante dalle Variabili d'Ambiente
**Problema**: Il PDF (sezione 7.1) elenca solo `VITE_API_URL` per il frontend, ma il codice reale (feedService.ts, feedbackService.ts) richiede `VITE_N8N_URL`. Questa variabile è **critica** per il funzionamento della pipeline.

**Correzione**: La sezione 7.1 dovrebbe includere:
```
Frontend (.env.local)
VITE_API_URL=http://localhost:5000
VITE_N8N_URL=<n8n-webhook-base-url>  # ES: https://n8n.example.com
```

### ⚠️ Incongruenza #3: Endpoint /api/stats/trending Non Documentato
**Problema**: La sezione 4.2.4 descrive un endpoint `GET /api/stats/trending` con "Unwind trendingTopics, group, top 10", ma il campo `trendingTopics` non esiste nello schema della collection `articles`. Non è chiaro come viene popola to questo endpoint.

**Nota**: L'endpoint è referenziato nel CLAUDE.md come risorsa disponibile, ma la sua implementazione non è trasparente dal codice.

### ⚠️ Incongruenza #4: Backend Weights vs Frontend Macrotopics
**Problema Critico**: 
- **Backend (User.js)**: weights su categorie `tech`, `news`, `social`, `news-it`, `general`
- **n8n Workflows (W3, W4)**: pesi su 12 macroTopics tematici diversi
- **Frontend**: mostra i 12 macroTopics all'utente durante l'onboarding

Questa disconnessione rompe la sincronizzazione tra il profilo utente backend e il ranking engine n8n.

### ⚠️ Incongruenza #5: Variabile d'Ambiente CORS_ORIGIN
**Problema**: Il PDF indica `localhost:3000` come default, ma Vite usa per default `localhost:5173`. Se il frontend gira su porta 5173, il CORS_ORIGIN deve essere aggiornato.

---

## Architettura Corretta (Versione Verificata)

### Autenticazione e Token
- **JWT**: Scadenza 24h, payload contiene `userId`, `email`, `role`
- **Storage**: localStorage key `briefai_token`
- **Header**: `Authorization: Bearer <token>`

### Flusso Dati Reale
```
RSS Sources (ogni 15 min)
  ↓ [W1: Fetch & Dedup]
  ↓ Status: 'raw' → MongoDB articles
  ↓ [W2: Enrich + LLM] (ogni 20 min)
  ↓ Status: 'ready' → 'processed'
  ↓ [W3: Ranking] (on-demand webhook)
  ↓ Frontend fetch POST /briefai/feed
  ↓ User votes: [W4: Update Weights]
  ↓ MongoDB user_profiles sync
```

### Database Schema — CORREZIONI CRITICHE

#### Collection `articles`
```javascript
{
  _id: ObjectId,
  uniqueKey: String,          // SHA-256 — unique index
  title: String,
  url: String,
  pubDate: Date,
  source: String,             // 'TechCrunch' | 'Reuters' | 'Hacker News' | 'ANSA'
  category: String,           // 'tech' | 'news' | 'social' | 'news-it'
  
  // Enriched by W2 (LLM)
  content: String,            // HTML-cleaned testo arricchito
  summary: String,            // max 50 parole, AI-generated
  sentiment: String,          // 'Positive' | 'Negative' | 'Neutral'
  entities: Array<String>,    // NER extracted
  macroTopics: Array<String>, // 12-topic taxonomy from n8n classification
  
  // Processing state
  status: String,             // 'raw' | 'ready' | 'processed'
  aiProcessed: Boolean,
  aiError: String,            // null if successful
  
  // Metadata
  enrichedAt: Date,
  enrichmentOk: Boolean,
  processedAt: Date,
  __sourceName: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Collection `users` — ERRORE NEL PDF
**Il PDF NON documenta il mismatch**. Il codice reale ha:
```javascript
{
  _id: ObjectId,
  userId: String,             // unique
  email: String,              // unique
  username: String,           // unique
  password: String,           // bcrypt hash
  
  // ⚠️ ATTENZIONE: Questi sono in "categorie", non "macroTopics"!
  macroTopics: Array<String>,      // Come selezionato dall'utente (intento)
  keywords: Array<String>,
  weights: Map<String, Number>,    // CHIAVI: 'tech', 'news', 'social', 'news-it', 'general'
  preferredSources: Array<String>,
  
  // Subscription
  subscriptionPlan: String,   // 'free' | 'pro'
  subscriptionExpiresAt: Date,
  
  role: String,              // 'user' | 'admin'
  createdAt: Date,
  updatedAt: Date
}
```

**Problema**: Il campo `weights` usa categorie backend, non i 12 macroTopics della tassonomia n8n. Questo causa disallineamento nel ranking.

#### Collection `user_profiles`
```javascript
{
  _id: ObjectId,
  userId: String,             // unique — referenced by n8n
  
  // Selezionati dall'utente durante onboarding
  macroTopics: Array<String>,      // I 12 topic della tassonomia
  keywords: Array<String>,
  
  // Aggiornati dal Feedback Loop (W4)
  weights: Object,            // CHIAVI: 12 macroTopics, VAL: [0.0–2.0]
  preferredSources: Array<String>,
  
  // Subscription
  subscriptionPlan: String,
  subscriptionExpiresAt: Date,
  
  // Tracking
  lastFeedGeneratedAt: Date,  // aggiornato da W3
  createdAt: Date,
  updatedAt: Date
}
```

**Nota**: user_profiles è sincronizzata da Express tramite hook Mongoose, ma la struttura dei weights differisce da `users`. Questo è il **bug principale del sistema**.

---

## Variabili d'Ambiente — VERSIONE CORRETTA

### Backend `.env`
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/briefai
JWT_SECRET=<stringa-random-minimo-64-caratteri>
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

**⚠️ Attenzione**: Se il frontend gira su porta 5173 (Vite default), non 3000, aggiornare CORS_ORIGIN di conseguenza.

### Frontend `.env.local` — VERSIONE CORRETTA
```
VITE_API_URL=http://localhost:5000
VITE_N8N_URL=<n8n-cloud-webhook-base-url>
```

**Esempio**:
```
VITE_N8N_URL=https://n8n.example.com/webhook
```

Questo è **obbligatorio** per:
- `feedService.ts`: POST `/briefai/feed`
- `feedbackService.ts`: POST `/briefai/feedback`
- `apiService.ts`: PUT `/briefai/profile/update`

---

## n8n Workflows — Conferma della Documentazione

### W1 (Fetch Articles)
✅ **Confermato**: 4 fonti in parallelo, cron ogni 15 min, dedup SHA-256

### W2 (Enrich + LLM)
✅ **Confermato**: Cron ogni 20 min, arricchimento Reuters/HN, LLM batch da 2

### W3 (Ranking Engine)
✅ **Confermato**: Webhook on-demand, hard filter + scoring su 5 dimensioni

### W4 (Feedback Loop)
✅ **Confermato**: Webhook on-demand, aggiorna pesi [0.0–2.0] per macroTopics

---

## Frontend — Conferma e Correzioni

### Route Protette
```
/feed → feedService.ts → POST VITE_N8N_URL/briefai/feed
/onboarding → seleziona 12 macroTopics (tassonomia)
/impostazioni → PUT /api/profile (sincronizzato a n8n webhook)
```

✅ **Confermato**: React 19, TypeScript, Vite, ProtectedRoute inline in App.tsx

---

## Backend Express.js — Conferma

### 13 Endpoint
✅ **Confermato**: 3 auth + 2 articoli + 2 profilo + 5 stats + 1 health

### Sicurezza
✅ **Confermato**: JWT, bcrypt, Helmet, CORS, Morgan

---

## Problemi Richiesti di Chiarimento

### 🔴 Priorità Alta

1. **Sincronizzazione Weights Backend ↔ n8n**
   - Backend usa categorie: `tech`, `news`, `social`, `news-it`, `general`
   - n8n usa 12 macroTopics: `Intelligenza Artificiale`, `Cybersecurity`, etc.
   - **Come gestire il mapping durante il feedback loop?**

2. **VITE_N8N_URL Obbligatoria**
   - Aggiungere a `.env.local` del frontend
   - Se n8n è su dominio diverso, configurare CORS su n8n

3. **Endpoint /api/stats/trending**
   - Implementazione non trasparente
   - Campo `trendingTopics` non presente in schema

### 🟡 Priorità Media

4. **CORS_ORIGIN Default**
   - PDF: `localhost:3000`
   - Reale: Vite usa `localhost:5173`

5. **Frontend VITE_API_URL**
   - PDF non specifica la porta Vite
   - Aggiungere nota esplicita sulla porta 5173

---

## Checklist di Configurazione — AGGIORNATA

```
☐ MongoDB Atlas cluster M0 attivo
☐ MONGO_URI nel .env backend
☐ IP locale in whitelist MongoDB Atlas
☐ JWT_SECRET random 64+ caratteri
☐ n8n cloud account con 4 workflow attivi
☐ MongoDB Atlas credential in n8n (nome: 'MongoDB Atlas — BriefAI')
☐ OpenRouter credential in n8n (nome: 'openrouter/free')
☐ CORS_ORIGIN = http://localhost:5173 (se Vite) o :3000 (se CRA)
☐ VITE_API_URL = http://localhost:5000 (.env.local frontend)
☐ VITE_N8N_URL = <n8n-webhook-base> (.env.local frontend) ← AGGIUNGO
```

---

## Conclusione

Il documento PDF è **85% accurato** ma ha **5 incongruenze critiche** relative a:
1. Mismatch tra weights backend e taxonomy n8n
2. Mancanza di VITE_N8N_URL nella sezione variabili
3. Endpoint /api/stats/trending non documentato
4. CORS_ORIGIN port mismatch
5. Assenza di note sulla porta Vite 5173

**Raccomandazione**: Usare questa versione corretta come source of truth fino a quando il team non risolve il mismatch della sincronizzazione dei weights tra backend e n8n.
