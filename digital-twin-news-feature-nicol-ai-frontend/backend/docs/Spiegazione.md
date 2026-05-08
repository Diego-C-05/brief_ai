# Documento Tecnico Backend — BriefAI (Aggiornato al codice attuale)

---

## 1. Obiettivo del backend

Il backend BriefAI fornisce API REST per:
- autenticazione utenti con JWT
- lettura articoli processati e filtri di ricerca
- gestione profilo utente e preferenze
- statistiche aggregate sugli articoli

Il backend condivide MongoDB con i workflow n8n e mantiene sincronizzata la collection `user_profiles`.

---

## 2. Architettura reale (attuale)

### 2.1 Componenti

- **Express API**: espone endpoint `/api/auth`, `/api/articles`, `/api/profile`, `/api/stats`, `/health`
- **MongoDB Atlas**: persistenza utenti, profili utente, articoli
- **Workflow n8n esterni**: ranking/feed/feedback e aggiornamenti su `user_profiles`

### 2.2 Flusso dati

1. L'utente si registra/login dal frontend.
2. Il backend genera JWT con scadenza 24h.
3. Le API protette leggono `Authorization: Bearer <token>`.
4. Le API articoli/stats leggono la collection `articles`.
5. Le API profilo leggono e aggiornano `users`, con sync su `user_profiles`.
6. Il post-save hook del model `User` esegue upsert automatico su `user_profiles`.

---

## 3. Stack tecnico effettivo

### 3.1 Runtime e librerie

- Node.js (CommonJS)
- Express **5.2.1**
- Mongoose **9.4.1**
- jsonwebtoken **9.0.3**
- bcryptjs **3.0.3**
- helmet **8.1.0**
- cors **2.8.6**
- morgan **1.10.1**
- dotenv **17.4.1**
- nodemon **3.1.14** (dev)

### 3.2 Script npm

```bash
npm start   # node src/server.js
npm run dev # nodemon src/server.js
```

---

## 4. Bootstrap applicazione (`src/server.js`)

### 4.1 Middleware globali

Ordine di registrazione:

1. `helmet()`
2. `cors(...)`
3. `morgan('dev')`
4. `express.json()`
5. `express.urlencoded({ extended: true })`

### 4.2 CORS attuale

`allowedOrigins` viene calcolato cosi:
- se `CORS_ORIGIN` esiste: split su virgola
- altrimenti, in produzione: `[FRONTEND_URL || 'https://your-production-domain.com']`
- altrimenti (dev): `['http://localhost:5173']`

La callback CORS consente:
- richieste senza `origin` (es. curl/server-to-server)
- richieste con origin nella allowlist

Altrimenti ritorna errore `Not allowed by CORS`.

### 4.3 Mount route

- `/api/auth` -> `routes/auth.js`
- `/api/articles` -> `routes/articles.js`
- `/api/profile` -> `routes/profile.js`
- `/api/stats` -> `routes/stats.js`

### 4.4 Endpoint di sistema

- `GET /health`
- 404 handler JSON per endpoint non trovati
- error handler 500 JSON (messaggio dettagliato in dev, generico in production)

### 4.5 Avvio server

- Porta: `PORT` env, fallback `5000`
- Connessione Mongo: `mongoose.connect(process.env.MONGO_URI)`
- Se la connessione fallisce: log errore e `process.exit(1)`

---

## 5. Autenticazione (`src/middleware/auth.js`)

### 5.1 Comportamento

- Legge header `Authorization`
- Rimuove prefisso `Bearer `
- Se token assente: `401` con `Accesso negato. Token mancante.`
- Se token invalido/scaduto: `401` con `Token non valido o scaduto.`
- Se token valido: salva payload su `req.user` e chiama `next()`

### 5.2 Payload atteso

Il payload JWT contiene:
- `userId`
- `email`
- `role`

Scadenza token: `24h`.

---

## 6. Modelli Mongoose

## 6.1 Model `User` (`src/models/User.js`)

Campi principali:
- `userId` string, unique, required
- `email` string, unique, required
- `password` string, required
- `username` string, unique, required
- `role` enum `['admin','user']`, default `user`
- `macroTopics` array string
- `keywords` array string
- `weights` map<string, number> con default:
  - `tech: 1.0`
  - `news: 1.0`
  - `social: 1.0`
  - `news-it: 1.0`
  - `general: 1.0`
- `preferredSources` array string
- `lastFeedGeneratedAt` date
- `createdAt`, `updatedAt` + `timestamps: true`

Hook e metodi:
- `pre('save')`: hash bcrypt della password solo se modificata
- `comparePassword(candidate)`: confronto bcrypt
- `post('save')`: upsert su `user_profiles` con `macroTopics`, `keywords`, `weights`, `preferredSources`, `lastFeedGeneratedAt`

Nota funzionale importante:
- `sentimentPreference` e `categories` non sono piu parte del modello attuale.

## 6.2 Model `UserProfile` (`src/models/UserProfile.js`)

Collection fisica: `user_profiles`.

Campi:
- `userId` unique, required
- `macroTopics` default `['Scienza & Ricerca']`
- `keywords` default `[]`
- `weights` oggetto con stessi default del model `User`
- `preferredSources` default `[]`
- `lastFeedGeneratedAt`
- `updatedAt` default `Date.now`

Opzioni schema:
- `timestamps: false`

## 6.3 Model `Article` (`src/models/Article.js`)

Campi base:
- `uniqueKey` unique, required
- `title` required
- `url`, `pubDate`, `source`, `category`, `content`

Campi AI/enrichment:
- `summary`
- `sentiment` enum `['Positive','Neutral','Negative',null]`, default `null`
- `entities` array string
- `trendingTopics` array string
- `macroTopics` array string

Campi pipeline:
- `status` enum `['raw','processed']`, default `raw`
- `aiProcessed` boolean default `false`
- `aiError` string
- `processedAt` date
- `createdAt` default `Date.now`
- `timestamps: true`

---

## 7. Route API dettagliate

## 7.1 Auth (`src/routes/auth.js`)

### `POST /api/auth/register`

Input richiesti:
- `email`
- `password`
- `username`

Supporta preferenze in due formati:
- `preferences.macroTopics` / `preferences.keywords` (frontend attuale)
- `macroTopics` / `keywords` top-level (backward compatibility)

Logica:
1. valida campi obbligatori
2. verifica duplicati su email o username
3. genera `userId` formato `user_<timestamp>_<random>`
4. crea utente
5. salva (triggerando hash password e sync user_profiles)
6. emette JWT 24h
7. restituisce token e dati principali utente

Codici principali:
- `201` successo
- `400` campi mancanti o utente gia registrato
- `500` errore interno

### `POST /api/auth/login`

Input:
- `email`
- `password`

Logica:
1. valida input
2. cerca utente per email
3. verifica password via `comparePassword`
4. genera JWT 24h
5. ritorna token + dati utente

Codici principali:
- `200` successo
- `400` input mancanti
- `404` utente non trovato
- `401` password errata
- `500` errore interno

### `GET /api/auth/me` (protetta)

- Richiede JWT valido
- Cerca utente per `req.user.userId`
- Restituisce utente senza password (`select('-password')`)

Codici principali:
- `200` successo
- `404` utente non trovato
- `500` errore interno

## 7.2 Articles (`src/routes/articles.js`)

### `GET /api/articles` (protetta)

Query supportate:
- `category`
- `sentiment`
- `source`
- `status` (default: `processed`)
- `limit` (default: `50`)
- `page` (default: `1`)
- `search` (regex case-insensitive su `title` e `summary`)

Logica:
- costruisce filtro dinamico
- ordina per `pubDate` decrescente
- applica paginazione (`limit`, `skip`)
- calcola `total` e `totalPages`

Risposta:
- `articles`
- `total`
- `page`
- `limit`
- `totalPages`

### `GET /api/articles/:uniqueKey` (protetta)

- Cerca articolo per `uniqueKey`
- ritorna 404 se non esiste

## 7.3 Profile (`src/routes/profile.js`)

### `GET /api/profile` (protetta)

Logica:
1. legge utente da `users`
2. legge profilo corrispondente da `user_profiles`
3. converte `weights` di User (Map) in oggetto plain
4. costruisce profilo merge:
   - base da `users`
   - override da `user_profiles` se presenti

Campi risposta:
- `userId`, `email`, `username`
- `macroTopics`, `keywords`, `weights`
- `preferredSources`, `lastFeedGeneratedAt`

### `PUT /api/profile` (protetta)

Input modificabili:
- `macroTopics`
- `keywords`
- `preferredSources`

Logica:
1. carica utente corrente
2. aggiorna solo campi presenti in body
3. salva utente (`updatedAt` aggiornato)
4. prova sync su `user_profiles` via `findOneAndUpdate(..., { upsert: true })`
5. in caso errore sync profilo: warning log, ma non blocca la risposta API

Output:
- `message: Profilo aggiornato con successo.`
- `profile` aggiornato

Nota:
- `sentimentPreference` non e gestito nel backend attuale.

## 7.4 Stats (`src/routes/stats.js`)

Tutte le route stats sono protette e filtrano articoli `status: 'processed'` (eccetto overview per `total`, `raw`, `processed` separati).

### `GET /api/stats/sentiment`

Aggregation:
- group per `sentiment`
- count per gruppo

### `GET /api/stats/categories`

Aggregation:
- group per `category`
- sort count desc

### `GET /api/stats/trending`

Aggregation:
- unwind `trendingTopics`
- group per topic
- sort desc
- limit 10

### `GET /api/stats/sources`

Aggregation:
- group per `source`
- sort desc

### `GET /api/stats/overview`

Calcoli:
- `total` articoli
- `processed`
- `raw`
- `recentArticles` (ultime 24h su `createdAt`)
- `processingRate = (processed / total) * 100` (1 decimale, stringa)

---

## 8. Contratto risposte e errori

Pattern prevalente risposta:

```json
{
  "success": true,
  "data": {}
}
```

Oppure, nelle route specifiche:
- `user`, `profile`, `articles`, `article`, `message`, `token`

Pattern errore:

```json
{
  "success": false,
  "error": "messaggio"
}
```

Codici HTTP usati nel progetto:
- `200`, `201`
- `400`, `401`, `404`
- `500`

---

## 9. Variabili ambiente richieste

Minime necessarie:

```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
NODE_ENV=development
```

Opzionali utili:

```env
CORS_ORIGIN=http://localhost:5173,https://tuodominio.com
FRONTEND_URL=https://tuodominio.com
```

---

## 10. Sicurezza implementata

- JWT con secret da env
- scadenza token 24h
- hash password con bcrypt (salt rounds 10)
- Helmet attivo su tutte le richieste
- CORS con allowlist dinamica
- esclusione password nelle risposte profilo utente (`-password`)

Limiti attuali:
- nessun rate limiting
- validazione input ancora minima
- assenza di refresh token

---

## 11. Integrazione con n8n (stato reale)

Punti chiave:
- backend e n8n condividono MongoDB
- `user_profiles` e il ponte dati tra autenticazione backend e ranking/feed n8n
- la sync avviene in due punti:
  - hook `post('save')` su `User`
  - `PUT /api/profile` con upsert esplicito su `user_profiles`

Questo riduce disallineamenti quando le preferenze cambiano lato backend.

---

## 12. Checklist operativa rapida

### Avvio sviluppo

```bash
cd backend
npm install
npm run dev
```

Output atteso:
- connessione MongoDB riuscita
- backend in ascolto su `http://localhost:5000` (o porta configurata)

### Test minimi

1. `GET /health` deve rispondere `status: ok`
2. `POST /api/auth/register` crea utente e token
3. `POST /api/auth/login` restituisce token valido
4. `GET /api/profile` con token deve rispondere con profilo
5. `GET /api/stats/overview` con token deve restituire metriche

---

## 13. Differenze principali rispetto alla documentazione precedente

- Stack versioni aggiornato (Express 5.x, Mongoose 9.x)
- CORS dev su `http://localhost:5173` (non 3000)
- profilo usa `macroTopics` e non `categories`
- `sentimentPreference` rimosso dal flusso attuale
- `profile` legge e merge da `users` + `user_profiles`
- `PUT /api/profile` sincronizza `user_profiles` con upsert e warning non bloccante

---

**Autori backend originali:** Galluzzo Matteo, Salvafiorita Nicolò  
**Documento aggiornato automaticamente sul codice corrente:** Maggio 2026
