# Analisi del progetto BriefAI

## Obiettivo del prodotto
BriefAI e una piattaforma di news intelligence che raccoglie articoli da piu fonti, li arricchisce con AI, li salva in MongoDB e li presenta in un feed personalizzato. Il sistema combina un backend Node/Express, un frontend React/Vite e workflow n8n per ingestione, enrichment, ranking e feedback loop.

## Struttura del repository
- `digital-twin-news-feature-nicol-ai-frontend/backend`: API backend in Node.js con Express e MongoDB.
- `frontend-BriefAI`: applicazione frontend React + TypeScript + Vite.
- I workflow n8n sono stati forniti come JSON separati e fanno parte della pipeline esterna del progetto.

## Stack tecnico
- Backend: Node.js, Express, Mongoose, JWT, bcryptjs, cors, helmet, morgan.
- Frontend: React 19, TypeScript, React Router, Vite.
- Persistenza: MongoDB Atlas, con collezioni `articles`, `users`, `user_profiles`.
- Automazione AI / integrazione esterna: n8n + OpenRouter.

## Backend: responsabilita e flusso
Il backend espone quattro aree principali: autenticazione, articoli, profilo e statistiche.

### Autenticazione
- `POST /api/auth/register`: crea un utente con validazione email/password, assegna `userId`, salva preferenze iniziali e restituisce un JWT.
- `POST /api/auth/login`: verifica credenziali e restituisce un JWT.
- `GET /api/auth/me`: restituisce il profilo autenticato a partire dal token.

### Articoli
- `GET /api/articles`: restituisce articoli filtrabili per categoria, sentiment, source, testo e paginazione.
- `GET /api/articles/:uniqueKey`: endpoint di dettaglio presente ma non usato dal frontend.
- Gli articoli processed vengono sanitizzati lato backend rimuovendo link da content e summary.

### Profilo
- `GET /api/profile`: unisce dati del modello `User` con l'eventuale documento `UserProfile` sincronizzato da n8n.
- `PUT /api/profile`: aggiorna macroTopics, keywords, preferredSources e subscriptionState, poi sincronizza anche `user_profiles`.

### Statistiche
- `GET /api/stats/sentiment`
- `GET /api/stats/categories`
- `GET /api/stats/trending`
- `GET /api/stats/sources`
- `GET /api/stats/overview`

### Avvio backend
- Il server legge `MONGO_URI`, `JWT_SECRET`, `PORT` e `CORS_ORIGIN`.
- Il CORS permette localhost e gli origin configurati in env.

## Modelli dati
### `User`
- Contiene `userId`, `email`, `password`, `username`, `role`.
- Memorizza preferenze: `macroTopics`, `keywords`, `weights`, `preferredSources`, `lastFeedGeneratedAt`, `subscriptionPlan`, `subscriptionExpiresAt`.
- Quando il documento viene salvato, sincronizza automaticamente un record parallelo in `user_profiles`.

### `Article`
- Identificato da `uniqueKey`.
- Campi principali: `title`, `url`, `pubDate`, `source`, `category`, `content`, `summary`, `sentiment`, `entities`, `trendingTopics`, `macroTopics`, `status`.
- Stati usati dal sistema: `raw` e `processed`.

### `UserProfile`
- Replica orientata all'orchestrazione n8n.
- Conserva macroTopics, keywords, weights, preferredSources, subscriptionPlan, subscriptionExpiresAt e lastFeedGeneratedAt.

## Frontend: flusso utente
### Home
- La landing spiega il valore del prodotto e porta a login/registrazione/onboarding.

### Login e registrazione
- `LoginPage` salva il token JWT in `localStorage` e porta al feed.
- `RegisterPage` richiede username, email, password e consenso termini.
- La registrazione usa eventuali preferenze raccolte durante onboarding.

### Onboarding
- Wizard in due step:
  1. selezione dei macro-topics;
  2. inserimento keyword da monitorare.
- I dati vengono salvati in `localStorage` e poi usati dalla registrazione.

### Feed
- `FeedPage` mostra sidebar, topbar e contenuto feed.
- `FeedContent`:
  - recupera il feed personalizzato da n8n,
  - applica filtri client-side per sentiment, topic e articoli salvati,
  - gestisce like/dislike e salvataggio locale/piu n8n.
- `MagicCard` mostra notizia, sentiment, tag, entita e azioni rapide.

### Impostazioni
- `SettingsPage` separa preferenze e account in due tab.
- Permette di modificare macroTopics, keywords e subscriptionState.
- Le modifiche vengono sincronizzate sia al backend sia, se configurato, al webhook n8n.

## Servizi frontend
- `authService.ts`: login, register, getMe, logout, gestione token.
- `apiService.ts`: fetch profilo, statistiche e update profilo; opzionalmente sincronizza n8n.
- `feedService.ts`: ottiene il feed personalizzato da n8n usando `userId` dal JWT o da `/api/auth/me`.
- `feedbackService.ts`: invia feedback, salvataggi e unsave a n8n con fallback locale.

## I 4 workflow n8n allegati

### Workflow 1: `fetch articles1`
Scopo: ingestione articoli da fonti diverse e salvataggio su MongoDB come `raw`.

Catena logica:
1. Cron ogni 15 minuti.
2. Lettura feed da TechCrunch, ANSA, Reuters e Hacker News.
3. Normalizzazione dei record e aggiunta di metadati comuni.
4. Generazione di `uniqueKey` tramite SHA-256 su `url::title`.
5. Inserimento nella collezione `articles` con deduplicazione via indice unico.

Fonti:
- TechCrunch RSS.
- ANSA RSS.
- Reuters tramite Google News RSS filtrato per Reuters.
- Hacker News frontpage.

Osservazione importante:
- Questo workflow e il punto di ingresso della pipeline contenuti.

### Workflow 2: `adapt articles2`
Scopo: trasformare gli articoli `raw` in `ready` o `processed`.

Catena logica:
1. Cron ogni 20 minuti.
2. Estrae gli articoli `raw` da MongoDB.
3. Se l'articolo e Reuters, prova a scaricare la pagina originale e pulisce l'HTML.
4. Se non e Reuters, normalizza il contenuto e marca l'articolo come `ready`.
5. Raccoglie gli articoli `ready` e li invia a OpenRouter per riassunto, sentiment, entita e macroTopics.
6. Fa fallback locale se il LLM non risponde o se il JSON non e valido.
7. Scrive il risultato su MongoDB con `status = processed`.

Ruolo nel sistema:
- E il workflow di enrichment semantico e AI.

### Workflow 3: `3`
Scopo: costruzione del feed personalizzato per l'utente.

Catena logica:
1. Webhook `POST /briefai/feed` riceve `userId` e `limit`.
2. Legge il profilo utente da `user_profiles`.
3. Se il profilo non esiste, usa valori di default.
4. Recupera fino a 200 articoli `processed`.
5. Applica hard filter sui macro-topics selezionati.
6. Calcola lo score finale con:
   - peso dei topic,
   - keyword match,
   - recency,
   - bonus sentiment,
   - bonus source.
7. Restituisce il feed ordinato per score e aggiorna `lastFeedGeneratedAt`.

Formula concettuale:
- `score = weighted_interest(55%) + keyword_match(25%) + recency(15%) + bonus sentiment + bonus source`.

Ruolo nel sistema:
- E il motore di ranking che alimenta il feed frontend.

### Workflow 4: `4`
Scopo: feedback loop dell'utente su singolo articolo.

Catena logica:
1. Webhook `POST /briefai/feedback` riceve `userId`, `articleId`, `vote`.
2. Recupera l'articolo da MongoDB per ottenere `macroTopics`, `sentiment` e `source`.
3. Recupera il profilo utente da `user_profiles`.
4. Aggiorna i pesi dei macroTopics dell'articolo di uno step fisso `0.2` in range `0.0` - `2.4`.
5. Se il voto e positivo, aggiunge la source alle `preferredSources`.
6. Salva il profilo aggiornato e risponde con un riepilogo.

Ruolo nel sistema:
- E il meccanismo di apprendimento dal comportamento dell'utente.

## Mappa end-to-end
1. Il backend autentica l'utente e conserva il profilo base.
2. I workflow n8n importano, arricchiscono e classificano gli articoli.
3. Il workflow di ranking costruisce il feed personalizzato per ciascun `userId`.
4. Il frontend mostra il feed e raccoglie like, dislike e salvataggi.
5. Il workflow di feedback aggiorna i pesi del profilo, chiudendo il ciclo di personalizzazione.

## Punti tecnici rilevanti
- L'app usa due livelli di profilo: `User` nel backend e `UserProfile` per la sincronizzazione n8n.
- Il frontend conserva diverse preferenze anche in `localStorage` come fallback operativo.
- Il feed dipende da `VITE_N8N_URL`, quindi senza n8n configurato la parte principale del prodotto non funziona.
- Il salvataggio degli articoli e i feedback sono progettati per degradare con fallback locale.

## Osservazioni rapide
- L'architettura e coerente: ingestion -> enrichment -> ranking -> feedback.
- La logica di personalizzazione e distribuita tra backend, frontend e n8n, quindi va mantenuta allineata con attenzione.
- Alcuni endpoint backend esistono ma il frontend non li usa ancora direttamente, soprattutto il dettaglio articolo.
