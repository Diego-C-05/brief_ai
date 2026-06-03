# BriefAI — Testi da Dire per Ogni Slide

---

## SLIDE 1 — Cover (BriefAI)

> *"Buongiorno a tutti. Sono [nome] e con i miei colleghi Lorenzo, Matteo, Nicolò e Diego abbiamo realizzato BriefAI: un servizio di news intelligence che usa l'intelligenza artificiale per trasformare un flusso caotico di notizie in un feed personalizzato, sintetico e leggibile.*
>
> *Il progetto è stato sviluppato nell'ambito del corso Full Stack Developer, in collaborazione con l'azienda partner LucaSacchi.Net. Nei prossimi minuti vi guideremo attraverso il problema che abbiamo voluto risolvere, le scelte tecniche che abbiamo fatto e i risultati che abbiamo ottenuto."*

---

## SLIDE 2 — Il Problema

> *"Il punto di partenza è un problema che probabilmente riconoscete: ogni giorno, chiunque lavori nel settore tech o nella comunicazione è sommerso da un flusso infinito di articoli provenienti da decine di fonti diverse.*
>
> *Il problema non è la mancanza di informazioni — anzi, è l'eccesso. Le notizie sono troppe, le fonti sono eterogenee, i contenuti sono spesso irrilevanti per i propri interessi e non esiste uno strumento che sintetizzi in modo intelligente.*
>
> *Il nostro target sono professionisti, analisti e imprenditori: persone che devono stare aggiornate ma non hanno tempo di filtrare manualmente decine di fonti ogni giorno. BriefAI nasce esattamente per loro."*

---

## SLIDE 3 — Soluzione Proposta *(NUOVA)*

> *"La nostra risposta si chiama BriefAI e si basa su una pipeline completamente automatizzata: acquisizione, arricchimento AI, classificazione, ranking personalizzato e feedback loop.*
>
> *Le parole chiave che descrivono il sistema sono quattro: AI Enrichment, Sentiment Analysis, Feedback Loop e Personalizzazione Dinamica.*
>
> *L'output concreto è un feed sintetico e su misura per ogni utente, che riduce drasticamente il tempo necessario per selezionare e leggere le notizie rilevanti. Non un aggregatore passivo — un assistente che impara."*

che si riassume in questo *fai vedere dashboard

---

## SLIDE 4 — Architettura a 4 Livelli

> *"L'architettura è organizzata in quattro livelli logici ben separati.*
>
> *In cima c'è il layer di presentazione: la SPA React con le sue sei route, tre pubbliche e tre protette da JWT.*
>
> *Sotto c'è l'orchestrazione: n8n gestisce i quattro workflow operativi — dall'ingestion al feedback loop.*
>
> *Il layer API è il backend Express: espone gli endpoint REST per autenticazione, articoli e profilo.*
>
> *In fondo c'è il layer dati: MongoDB Atlas con tre collection — articles, users e user_profiles.*
>
> *Il punto chiave è che n8n e Express non si parlano direttamente: condividono lo stesso MongoDB come punto di sincronizzazione. Questo mantiene i due ambienti disaccoppiati, testabili e modificabili in modo indipendente."*

---

## SLIDE 5 — Stack Tecnologico

> *"Una delle scelte più importanti del progetto è stata costruire tutto a costo zero, senza compromettere la qualità architetturale.*
>
> *Per il frontend abbiamo scelto React 19 con TypeScript e Vite: una stack moderna, tipizzata e con hot reload sub-secondo in sviluppo.*
>
> *Il backend è in Node.js ed Express: stateless, con autenticazione JWT e ODM Mongoose.*
>
> *La parte più interessante è l'orchestrazione: abbiamo usato n8n Cloud, uno strumento di workflow automation visuale, che ci ha permesso di costruire l'intera pipeline dati senza gestire code o scheduler custom.*
>
> *MongoDB Atlas su piano M0 gratuito fa da datastore condiviso tra backend e workflow. OpenRouter ci dà accesso ai modelli LLM su piano free.*
>
> *L'intera infrastruttura ha costo zero — questa è stata una scelta deliberata per dimostrare che un MVP solido non richiede per forza cloud a pagamento."*

---

## SLIDE 6 — Pipeline n8n

> *"Il cuore operativo di BriefAI sono i quattro workflow n8n.*
>
> *W1 gira ogni 15 minuti e interroga in parallelo le quattro fonti RSS. Ogni articolo viene deduplicato tramite un hash SHA-256 calcolato su URL e titolo normalizzati.*
>
> *W2 parte ogni 20 minuti: prende gli articoli raw, ne recupera il testo completo dalle pagine originali — fondamentale per Reuters e Hacker News che non espongono il body nel feed — e poi li invia al modello LLM a batch di due per l'arricchimento.*
>
> *W3 è un webhook on-demand: quando il frontend chiede il feed, calcola in tempo reale uno score composito per ogni articolo e restituisce la lista ordinata.*
>
> *W4 riceve i feedback dell'utente e aggiorna i pesi del profilo con una formula clamp tra 0.0 e 2.0, evitando overflow.*
>
> *Il ciclo di vita di un articolo segue tre stati: raw, ready, processed — e solo i processed entrano nel feed."*

---

## SLIDE 7 — Tassonomia e AI Processing *(NUOVA)*

> *"Questa slide mostra come il sistema classifica e stabilizza l'output dell'intelligenza artificiale.*
>
> *Il punto cardine è la tassonomia condivisa: abbiamo definito 12 macroTopics fissi — dalla Tecnologia all'Economia, dalla Politica alla Scienza — che sono la stessa lista usata dal backend Express, da n8n e dal frontend React. Nessuna traduzione, nessun rischio di disallineamento.*
>
> *Per ogni articolo, il modello LLM restituisce un JSON strutturato con summary, sentiment, entities e macroTopics. Il problema dei modelli free è che a volte inventano categorie che non esistono. Per questo abbiamo implementato una funzione di sanitizzazione: se il topic non è nella lista ufficiale, viene automaticamente rimpiazzato con 'Scienza & Ricerca'.*
>
> *Sul lato configurazione: temperatura a 0.2 per output il più deterministico possibile, batch da 2 articoli per rispettare i limiti del piano gratuito, e un meccanismo di fallback che garantisce che nessun articolo resti bloccato in pipeline per un errore del modello."*

---

## SLIDE 8 — Ranking e Personalizzazione

> *"Il ranking è ciò che distingue BriefAI da un semplice aggregatore RSS.*
>
> *Lo score di ogni articolo è calcolato combinando tre componenti principali. Il più pesante è weighted_interest al 40%: prende il peso che l'utente ha costruito nel tempo per il macroTopic dell'articolo, normalizzato tra 0 e 1.*
>
> *Il secondo componente è keyword_match al 30%: misura quante delle keyword spia dell'utente compaiono nel testo dell'articolo.*
>
> *Il terzo è recency al 25%: una finestra di 168 ore, una settimana, con decadimento lineare. Un articolo di ieri vale più di uno di sei giorni fa.*
>
> *A questi tre si aggiunge un sentiment_bonus e un source_bonus per le fonti preferite. Il risultato è un feed che migliora ad ogni interazione, perché ogni feedback aggiusta i pesi per la prossima generazione."*

---

## SLIDE 9 — Methodology *(NUOVA)*

> *"Questa slide mostra il meccanismo concreto con cui il sistema impara dalle interazioni dell'utente.*
>
> *Il primo meccanismo è il Weight Update: ogni volta che l'utente mette un like o un dislike su un articolo, il peso del macroTopic associato viene aggiornato in tempo reale con la formula che vedete — newWeight uguale al clamp tra 0.0 e 2.0 del peso attuale più il voto moltiplicato per 0.1. Il clamp è fondamentale: evita che un peso cresca all'infinito o scenda sotto zero.*
>
> *Il secondo meccanismo è il Source Learning: le interazioni positive aggiornano anche la lista delle fonti preferite nel profilo. Se l'utente vota positivamente molti articoli da Reuters, Reuters sale di priorità nel ranking successivo.*
>
> *In pratica, più si usa BriefAI, più il feed diventa preciso. È un sistema che si calibra continuamente senza richiedere nessuna configurazione manuale da parte dell'utente."*

---

## SLIDE 10 — Backend Express.js

> *"Il backend espone 13 endpoint REST organizzati in cinque gruppi.*
>
> *Il gruppo auth gestisce registrazione, login e il profilo dell'utente corrente. Al momento della registrazione, un hook post-save crea automaticamente il documento user_profiles con i pesi di default.*
>
> *Il gruppo articles espone la lista paginata con filtri multipli — categoria, sentiment, fonte, testo libero — e il dettaglio del singolo articolo tramite chiave SHA-256.*
>
> *Il gruppo profile permette di leggere e aggiornare le preferenze dell'utente, propagando le modifiche anche verso n8n.*
>
> *Il gruppo stats fornisce aggregazioni pronte per la dashboard: distribuzione sentiment, top categorie, conteggio per fonte, overview totali.*
>
> *C'è infine GET /health per il monitoraggio dello stato del servizio.*
>
> *Sul lato sicurezza: JWT firma i token con HMAC-SHA256, bcrypt hash le password con 10 salt rounds, Helmet indurisce gli header HTTP e CORS è configurabile via .env."*

---

## SLIDE 11 — Frontend React.js

> *"Il frontend segue un flusso utente lineare e intenzionale: home pubblica, autenticazione, onboarding, feed, impostazioni. Le route protette verificano il token JWT prima di renderizzare qualsiasi contenuto.*
>
> *Il componente centrale è MagicCard: ogni notizia nel feed mostra il titolo, il summary generato dall'AI, il badge sentiment colorato, i tag delle entità estratte e i pulsanti di feedback. Il feedback è asincrono — va al webhook n8n senza bloccare la navigazione.*
>
> *L'onboarding è un wizard multi-step: l'utente seleziona i macroTopics di interesse, inserisce keyword spia e sceglie il piano. Lo stato è tenuto in React locale e inviato al backend solo al completamento.*
>
> *ProtectedRoute combina verifica JWT e localStorage, eliminando i redirect inutili per utenti già autenticati. Il React Compiler applica auto-memoization a compile-time, ottimizzando il re-rendering senza useCallback manuali."*

---

## SLIDE 12 — Database e Sincronizzazione

> *"Il layer dati si articola in tre collection, ognuna con una responsabilità precisa.*
>
> *articles è la collection principale: ogni documento ha un uniqueKey SHA-256 con indice unique che garantisce la deduplicazione strutturale, e un campo status che traccia il ciclo di vita raw → ready → processed.*
>
> *users contiene i dati di autenticazione — email e username con indice unique — e le preferenze dell'utente. La password è sempre hashata con bcrypt e non viene mai restituita nelle risposte API.*
>
> *user_profiles è la collection operativa letta da n8n durante il ranking: contiene i pesi per macroTopic, le keyword e le fonti preferite. Viene creata automaticamente al momento della registrazione tramite hook post-save e mantenuta sincronizzata con users ad ogni aggiornamento tramite upsert.*
>
> *La chiave di tutto è il Single Source of Truth: i 12 macroTopics condivisi eliminano qualsiasi rischio di disallineamento tra backend e workflow n8n."*

---

## SLIDE 13 — Setup e Ambiente Locale *(NUOVA)*

> *"Per far girare BriefAI in locale bastano due terminali e tre variabili d'ambiente.*
>
> *Il frontend parte su Vite alla porta 5173, il backend Express alla porta 5000. Nessun Docker, nessuna configurazione complessa — npm install e si parte.*
>
> *Le tre variabili essenziali sono: MONGO_URI per la connessione a MongoDB Atlas, JWT_SECRET per la firma dei token, e VITE_N8N_URL per puntare ai webhook n8n Cloud.*
>
> *Questa semplicità di setup è una scelta consapevole: volevamo che chiunque potesse clonare il repository e avere il sistema funzionante in pochi minuti, senza dipendenze da infrastruttura locale. Tutta la complessità è delegata ai servizi cloud gratuiti."*

---

## SLIDE 14 — Grazie

> *"BriefAI non è solo il progetto finale di un corso. È una piattaforma full stack funzionante, costruita con scelte architetturali reali e consapevoli.*
>
> *Abbiamo costruito una pipeline dati automatizzata con n8n che non richiede infrastruttura locale. Abbiamo integrato un LLM con un sistema di fallback robusto e una tassonomia semantica condivisa. Abbiamo progettato un'architettura dove React, Express e MongoDB Atlas parlano la stessa lingua — i 12 macroTopics. E abbiamo implementato un feedback loop che rende il sistema più preciso ad ogni interazione.*
>
> *Il codice è pubblico su GitHub all'indirizzo che vedete. Siamo a disposizione per qualsiasi domanda."*

---

*Durata stimata: 14–16 minuti totali · ~1 min per slide*
