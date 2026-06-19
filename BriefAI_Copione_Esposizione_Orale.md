# BriefAI — Copione dell'Esposizione Orale

**Presentazione finale di progetto — Corso Full Stack Developer (LucaSacchi.Net)**

*Guida slide per slide per la discussione davanti alla commissione. Per ogni slide trovi: il titolo, l'obiettivo comunicativo, il discorso completo da esporre e il collegamento naturale alla slide successiva. Il testo è pensato per essere letto ad alta voce in modo fluido e naturale.*

---

## Slide 1 — La citazione di apertura

Buongiorno a tutti, e grazie per essere qui, mi chiamo Diego Cipolla, sono diplomato in un liceo scientifico scienze applicate e oggi vorrei parlare di un argomento che percepisco essere molto importante per la nostra generazione e quelle a venire.
e vorrei iniziare così, non con una tecnologia, non con un'architettura, ma con una frase che mette tutti noi sullo stesso piano...

> *"Ogni giorno ricevi più informazioni di quante un uomo del 1500 ne ricevesse in tutta la vita."*

Fermiamoci un attimo a pensare a cosa significa davvero. Una persona che viveva cinque secoli fa, nell'arco di un'intera esistenza, incontrava un numero di notizie, fatti e storie che oggi noi attraversiamo nel giro di una singola giornata, spesso senza nemmeno accorgercene. Apriamo il telefono al mattino e siamo già immersi in decine di titoli, notifiche, articoli, aggiornamenti. Il problema, oggi, non è più trovare l'informazione perchè molto spesso è lei a trovare noi. Il problema è riuscire a distinguere ciò che conta da ciò che è soltanto rumore.

Questa frase è il punto di partenza del nostro progetto, perché racconta un'esperienza che ognuno di voi ha vissuto: la sensazione di essere costantemente connessi e, allo stesso tempo, di non riuscire a stare davvero al passo. È da qui che nasce l'idea.

**Collegamento alla slide successiva:**

Se vi siete mai detti che è solo un'illusione o una vostra percezione,non lo è,è un fenomeno misurabile, documentato, con un impatto concreto sulla salute e sull'economia. Vediamo tre dati che lo dimostrano.

---

## Slide 2 — I 3 fatti

**Discorso da esporre:**
> 83% delle persone si sente sopraffatta dalla quantità di informazioni ·

Il primo: l'ottantatré per cento delle persone dichiara di sentirsi sopraffatto dalla quantità di informazioni che deve gestire ogni giorno. Non è una minoranza, è la quasi totalità delle persone. È un disagio diffuso, trasversale, che riguarda tutti.

> +45% di accessi psichiatrici tra i giovani italiani (19-25 anni) dopo l'era social, solo nel Lazio 
Il secondo dato è ancora più serio, perché tocca la salute. Solo nel Lazio si è registrato un aumento del quarantacinque per cento degli accessi psichiatrici tra i giovani tra i diciannove e i venticinque anni nell'era dei social. Il sovraccarico informativo non è quindi solo una questione di tempo perso: ha un peso sul benessere mentale, soprattutto delle nuove generazioni, quelle che sono cresciute immerse in questo flusso continuo.

> 450 miliardi di dollari di produttività persa ogni anno
Il terzo dato sposta il discorso sul piano economico: quattrocentocinquanta miliardi di dollari di produttività persi ogni anno nel mondo, semplicemente perché le persone saltano continuamente da un contenuto all'altro, senza riuscire a concentrarsi. Ogni interruzione costa, e moltiplicata per miliardi di persone, diventa una cifra enorme.

Mettendo insieme questi tre fatti — il disagio psicologico, l'impatto sulla salute dei giovani e la perdita economica — emerge con chiarezza che il sovraccarico informativo è un problema che vale la pena risolvere.

**Collegamento alla slide successiva:**

A questo problema abbiamo voluto rispondere con una soluzione concreta. Ve la presento.

---

## Slide 3 — La soluzione: BriefAI

> *La nostra news intelligence per accompagnare le nuove generazioni a informarsi.*


**Discorso da esporre:**

Si chiama BriefAI. Lo definiamo un sistema di *news intelligence*, e mi piace spiegare cosa intendiamo con questa espressione, perché è il cuore di tutto.

BriefAI non è un altro aggregatore di notizie, di quelli che vi mettono davanti l'ennesima lista infinita di titoli. È esattamente il contrario: è un sistema che prende quel flusso grezzo e caotico di notizie da fonti diverse e lo trasforma in qualcosa di ordinato, sintetico e — soprattutto — personale. Ogni utente riceve un feed costruito su misura per i suoi interessi, dove ogni articolo è già stato letto, riassunto e classificato da... un'intelligenza artificiale.

L'idea di fondo è semplice: invece di chiedere alla persona di filtrare lei stessa centinaia di notizie, è il sistema che lo fa per lei. L'utente riceve solo ciò che gli interessa davvero, già riassunto in poche righe. Il tempo che prima si perdeva a scorrere e scartare, ora viene restituito alla persona.

E abbiamo scelto di rivolgerci in particolare alle nuove generazioni, perché — come abbiamo visto dai dati — sono quelle che pagano il prezzo più alto del sovraccarico informativo, ma sono anche quelle più pronte ad adottare uno strumento intelligente che le aiuti a informarsi meglio.

**Collegamento alla slide successiva:**

Una soluzione di questo tipo, però, ha bisogno di un'architettura solida che la sostenga. E abbiamo voluto costruirla con un vincolo che ci siamo dati fin dall'inizio: zero costi di infrastruttura. Vediamo come.

---

## Slide 4 — Architettura e tecnologie zero-cost

> Presentation: React 19 SPA · Orchestration: n8n Cloud (W1→W2→W3→W4) · API Layer: Express.js 5.2 · Data: MongoDB Atlas M0



**Discorso da esporre:**

Prima di entrare nelle singole funzionalità, voglio darvi una visione d'insieme di come è fatto BriefAI, perché aiuta a capire tutto il resto. Potete immaginare il sistema come un edificio a quattro piani, dove ogni piano ha un compito preciso e comunica solo con quelli vicini.

Al piano più alto c'è la *presentazione*: è l'interfaccia che l'utente vede e con cui interagisce, costruita come applicazione web moderna con React 19. È la parte visibile, quella che dà l'esperienza d'uso.

>Sotto c'è il livello di *orchestrazione* che ho progettato e implementato io stesso, realizzato con n8n: è il motore che lavora dietro le quinte, in modo automatico e continuo. È qui che le notizie vengono raccolte, lette dall'intelligenza artificiale, classificate e ordinate. Lo rappresentiamo come una sequenza di quattro workflow — dalla raccolta delle notizie, all'arricchimento con l'AI, al ranking personalizzato, fino al feedback dell'utente — e li vedremo uno per uno più avanti.

Il terzo livello è quello delle *API*, costruito con Express: è il punto di contatto tra l'interfaccia e i dati. Gestisce le cose delicate come la registrazione, il login, il profilo dell'utente. È il guardiano che decide chi può accedere a cosa.

Alla base di tutto c'è il *dato*: il database MongoDB Atlas, dove vivono tre raccolte di informazioni — gli articoli, gli utenti e i profili. È l'unico punto in cui tutti i dati sono custoditi, ed è condiviso tra i vari livelli.

C'è un dettaglio di cui andiamo particolarmente orgogliosi: tutta questa architettura gira a costo zero. Abbiamo scelto deliberatamente i piani gratuiti di ogni servizio — React e n8n, MongoDB Atlas nel tier M0, e così via. Questo dimostra che con le scelte progettuali giuste si può costruire un sistema completo e funzionante senza spendere nulla in infrastruttura. È stato un vincolo che ci siamo imposti e che ha guidato molte delle nostre decisioni tecniche.

**Collegamento alla slide successiva:**

Vista l'architettura dall'alto, scendiamo ora nell'esperienza concreta dell'utente. Tutto comincia dal primo accesso.

---

## Slide 5 — Login, registrazione e onboarding

> Schermate: Accedi · Registrati · "A cosa sei interessato?" (12 categorie) · "Tieni traccia di argomenti specifici" (keyword)

**Obiettivo comunicativo:** far capire che fin dal primo minuto il sistema si mette in ascolto dell'utente, raccogliendo le sue preferenze per costruire da subito un'esperienza personalizzata, e spiegare perché questo passaggio è strategico.

**Discorso da esporre:**

Il viaggio dell'utente comincia in modo semplice, come ci si aspetta da qualsiasi applicazione: un accesso o una registrazione. Ma è subito dopo che accade qualcosa di importante per la filosofia del nostro progetto.

Appena un nuovo utente si registra, non lo gettiamo direttamente dentro un feed generico, uguale per tutti. Lo accompagniamo invece attraverso un breve percorso guidato, quello che chiamiamo *onboarding*. Gli poniamo due domande, perché sono le due domande che ci servono per costruire da subito un feed su misura.

La prima è: "A cosa sei interessato?". Gli presentiamo dodici macro-categorie — Intelligenza Artificiale, Cybersecurity, Business e Finanza, Politica, Startup, e così via — e lui sceglie quelle che lo riguardano. Queste dodici categorie non sono casuali: sono la spina dorsale dell'intero sistema, il linguaggio comune che mette d'accordo l'intelligenza artificiale, il motore di ranking e il profilo dell'utente. Ne riparleremo, perché sono un elemento centrale.

La seconda domanda è più fine: gli chiediamo se vuole tenere traccia di argomenti specifici — nomi di aziende, persone, marchi, parole chiave. Per aiutarlo gli proponiamo dei suggerimenti, come OpenAI, Google AI, Anthropic, Tesla, SpaceX. Mentre le categorie definiscono gli interessi generali, le parole chiave permettono un monitoraggio molto più mirato: chi segue una certa azienda vedrà valorizzate le notizie che la riguardano.

Perché tutto questo è importante? Perché risolviamo da subito uno dei problemi classici di questi prodotti: la cosiddetta "pagina vuota". Molte applicazioni mostrano contenuti rilevanti solo dopo settimane di utilizzo, quando hanno imparato a conoscerti. Noi invece chiediamo direttamente all'utente cosa gli interessa, e già dal primo accesso il suo feed è personalizzato. L'utente sente immediatamente che lo strumento è suo.

Aggiungo un dettaglio progettuale di cui siamo soddisfatti: durante questo percorso guidato, le preferenze vengono salvate solo alla fine, quando il wizard è completato. Questo perché in una versione precedente, se l'utente tornava indietro tra un passaggio e l'altro, rischiava di perdere le scelte già fatte. L'abbiamo corretto, e oggi la compilazione è sicura dall'inizio alla fine.

**Collegamento alla slide successiva:**

Una volta completato l'onboarding, l'utente entra finalmente nel cuore dell'applicazione: il feed personalizzato e il modo in cui presentiamo ogni singola notizia.

---

## Slide 6 — Dashboard e Magic Card

> Esempio di card: fonte e data · badge sentiment "Positivo" · titolo · riassunto AI · tag categorie · entità estratte · pulsanti 👍 👎 🔖

**Obiettivo comunicativo:** mostrare il prodotto finale così come l'utente lo vede, spiegando che ogni elemento della card non è decorativo ma risponde a un bisogno preciso, e introducendo il concetto di "notizia trasformata in informazione strutturata".

**Discorso da esporre:**

Eccoci al momento in cui tutto il lavoro che avviene dietro le quinte diventa visibile all'utente. Questa è quella che abbiamo chiamato la *Magic Card*: il componente che rappresenta ogni singola notizia all'interno del feed. Il nome non è casuale — la chiamiamo "magica" perché in un solo sguardo l'utente ottiene tutto ciò che gli serve per decidere se quella notizia gli interessa, senza dover aprire nulla.

Vediamo cosa contiene, perché ogni elemento ha una ragione. In alto trovate la fonte e la data, così l'utente sa subito da dove arriva la notizia e quanto è recente. Accanto c'è un'etichetta che indica il *sentiment* — cioè il tono della notizia, se è positiva, negativa o neutra. Questa è un'informazione che normalmente l'utente capisce solo dopo aver letto l'articolo: noi gliela diamo prima, calcolata dall'intelligenza artificiale, così può scegliere con consapevolezza cosa leggere.

Poi c'è il titolo, e subito sotto l'elemento che secondo noi cambia davvero l'esperienza: il riassunto generato dall'AI. In poche righe, mai più di una cinquantina di parole, l'utente capisce di cosa parla l'articolo senza doverlo aprire. È qui che restituiamo tempo alla persona: invece di cliccare, leggere, tornare indietro e ripetere, legge tre righe e sa già se quella notizia merita la sua attenzione.

Sotto al riassunto ci sono i tag delle categorie — quei dodici argomenti di cui parlavo — e poi le entità: i nomi propri di aziende, persone o prodotti che l'intelligenza artificiale ha estratto dal testo. Nell'esempio che vedete, da una notizia su OpenAI il sistema ha riconosciuto e messo in evidenza "OpenAI", "Greg Brockman", "ChatGPT", "Codex". Questo aiuta l'utente a orientarsi a colpo d'occhio.

Infine, in basso, ci sono tre pulsanti: pollice su, pollice giù e salva. Non sono solo bottoni di interazione: sono il modo in cui l'utente insegna al sistema cosa gli piace. Ogni "mi piace" e ogni "non mi piace" affina il profilo e migliora i feed futuri. Ma su questo torneremo, perché è uno dei meccanismi più interessanti del progetto.

In sostanza, la Magic Card è il punto in cui una notizia smette di essere testo grezzo e diventa informazione strutturata, pronta da consumare in pochi secondi.

**Collegamento alla slide successiva:**

L'utente però non è passivo: può modellare attivamente la propria esperienza. Vediamo come.

---

## Slide 7 — Funzione di personalizzazione

> Pagina Impostazioni: tab "Interessi" (Macro-Topics + parole chiave monitorate) · tab "Profilo" (informazioni account, gestione abbonamento Free/Pro)

**Obiettivo comunicativo:** dimostrare che la personalizzazione non è fissata al primo accesso ma è continua e nelle mani dell'utente, e che le sue scelte hanno un effetto reale e immediato sul sistema.

**Discorso da esporre:**

Abbiamo visto che durante l'onboarding l'utente sceglie i suoi interessi. Ma le persone cambiano, e con loro cambiano gli argomenti che le appassionano. Per questo abbiamo dedicato un'intera area dell'applicazione alla personalizzazione continua: la pagina delle Impostazioni.

Qui l'utente trova due schede. Nella prima, "Interessi", può rivedere in qualsiasi momento le sue dodici macro-categorie, attivandone di nuove o disattivandone altre, e può gestire le parole chiave che vuole monitorare — aggiungerne, rimuoverne. È lui che decide cosa modella il suo feed, e può farlo quando vuole.

Nella seconda scheda, "Profilo", trova le informazioni del suo account — l'email, il nome utente — e soprattutto la gestione dell'abbonamento, dove può vedere se è sul piano gratuito o passare al piano Pro.

C'è un aspetto che voglio sottolineare, perché è importante a livello di esperienza. Quando l'utente salva una preferenza qui, non resta un'impostazione scritta da qualche parte e dimenticata. La modifica viene comunicata immediatamente al motore che costruisce il feed, in modo che il prossimo aggiornamento tenga già conto delle nuove scelte. C'è quindi un legame diretto tra ciò che l'utente decide nelle impostazioni e ciò che vedrà nel suo feed. Abbiamo progettato questo collegamento con attenzione, perché volevamo che l'utente sentisse di avere realmente il controllo, e che le sue scelte producessero un effetto concreto e tempestivo.

Un dettaglio tecnico che mostra la nostra cura per la robustezza: anche se la comunicazione in tempo reale con il motore non andasse a buon fine, la preferenza viene comunque salvata in modo sicuro nel database. L'utente non perde mai la sua scelta. È un esempio del principio che ha guidato tutto il progetto: il sistema deve restare affidabile anche quando qualcosa va storto.

**Collegamento alla slide successiva:**

Fin qui abbiamo raccontato cosa vede e cosa fa l'utente. Ma il vero cuore di BriefAI batte dietro le quinte, in un motore di automazione che lavora ininterrottamente. Voglio raccontarvi come ci siamo arrivati.

---

## Slide 8 — n8n e tirocinio

> *Per questo progetto abbiamo implementato le conoscenze apprese al tirocinio con Luca Sacchi, il nostro professore di introduzione all'AI.*

**Discorso da esporre:**

Arriviamo ora alla parte che costituisce il vero motore operativo di BriefAI, e che rappresenta il cuore tecnico del mio contributo personale al progetto: l'orchestrazione realizzata con n8n.

Lasciatemi spiegare cos'è n8n con un'immagine semplice. Immaginate una catena di montaggio automatica: arriva la materia prima — in questo caso le notizie grezze — e passa attraverso una serie di stazioni di lavoro, dove a ogni stazione viene aggiunto qualcosa, finché alla fine non esce il prodotto finito, cioè la notizia pulita, riassunta e classificata. n8n è esattamente questo: uno strumento che ci permette di costruire queste catene di automazione collegando visivamente dei blocchi, senza dover scrivere da zero un intero programma per ogni passaggio.

Questa scelta non è nata per caso. È il frutto diretto del percorso di tirocinio che abbiamo svolto con Luca Sacchi, il nostro professore di intelligenza artificiale. Le competenze che abbiamo costruito durante quel percorso le abbiamo messe in pratica proprio qui, in un progetto reale e completo. Per noi è stato il momento in cui la teoria si è trasformata in pratica.

Aggiungo che n8n ci ha dato un vantaggio enorme: i nostri flussi di lavoro sono modificabili visivamente, anche mentre sono in funzione, senza dover fermare e ripubblicare l'intero sistema a ogni piccola modifica. In un progetto in cui sperimentavamo continuamente, questa flessibilità è stata preziosa.

L'intera pipeline è organizzata in quattro workflow, quattro stazioni della nostra catena di montaggio, ognuna con un compito ben preciso. Ve li racconto uno per uno, come una storia che segue il viaggio di una notizia dall'inizio alla fine.

**Collegamento alla slide successiva:**

Partiamo dall'inizio di tutto: come fa una notizia a entrare nel sistema. Questo è il compito del primo workflow.

---

## Slide 9 — Workflow 1: Fetch Articles (raccolta e deduplicazione)

> Schedule Trigger (Cron 15 min) → RSS/HTTP Sources (TechCrunch, Reuters, ANSA, Hacker News) → Merge + Dedup (SHA-256 uniqueKey) → MongoDB (articles)

**Discorso da esporre:**

Il primo workflow risolve un problema fondamentale: come fa il sistema a procurarsi le notizie, in modo automatico e continuo, senza che nessuno debba andarle a cercare a mano?

La storia comincia con un orologio. Ogni quindici minuti, in automatico, il sistema si sveglia da solo e va a bussare a quattro porte diverse — quattro fonti di notizie: TechCrunch, Reuters, ANSA e Hacker News. Abbiamo scelto fonti volutamente eterogenee, alcune di tecnologia internazionale, una italiana, una più orientata alla community, per garantire varietà.

Qui ho incontrato la prima sfida concreta. Non tutte le fonti si comportano allo stesso modo. TechCrunch e ANSA mettono a disposizione un canale di notizie standard, facile da leggere. Reuters invece non offre un canale diretto e blocca attivamente le richieste automatiche: ho dovuto aggirare l'ostacolo passando attraverso Google News come intermediario, filtrando poi con cura per tenere solo gli articoli che provengono davvero da Reuters. Hacker News, dal canto suo, restituiva le notizie in un formato che lo strumento standard non riusciva a leggere, quindi ho scritto un piccolo lettore su misura. La lezione qui è che il mondo reale è disordinato, e una buona pipeline deve sapersi adattare a ogni fonte invece di pretendere che tutte parlino la stessa lingua.

Una volta raccolte da queste quattro fonti, le notizie confluiscono tutte insieme in un unico flusso. Ed è qui che entra in gioco la parte di deduplicazione. Il problema è semplice da capire — la stessa notizia può arrivare da più fonti, o può essere ripubblicata, e noi non vogliamo riempire il feed dell'utente di doppioni. La soluzione che ho adottato è: per ogni articolo calcolo un codice unibvoco ottenuto combinando l'indirizzo della notizia e il suo titolo. Due notizie identiche producono la stessa impronta. A quel punto è il database stesso a fare da guardiano: se arriva un articolo con un'impronta già presente, viene semplicemente scartato in automatico, senza bloccare il resto del flusso.

Voglio sottolineare il valore di questa scelta. Nell'architettura iniziale era previsto un componente aggiuntivo apposta per questo controllo. Io ho preferito affidare il compito direttamente al database, sfruttando un suo meccanismo nativo. Il risultato è che abbiamo eliminato un pezzo di infrastruttura, ridotto la complessità e i costi, e mantenuto comunque un certo livello di certezza che gli articoli non siano sdoppiati.

Al termine di questo primo workflow, le notizie sono salvate nel database, ancora grezze, etichettate come "da lavorare". La materia prima è entrata nella catena di montaggio.

**Collegamento alla slide successiva:**

Ma una notizia grezza non serve a molto: è solo un titolo e un link. È il secondo workflow a darle valore, ed è qui che entra in scena l'intelligenza artificiale.

---

## Slide 10 — Workflow 2: Adapt Articles (arricchimento AI)

> Schedule Trigger (Cron 20 min) → MongoDB Query (status: raw) → LLM OpenRouter (summary, sentiment, macroTopics, entities) → MongoDB Update (status: processed ✓)

**Discorso da esporre:**

Il secondo workflow è il più complesso di tutti, ed è quello che dà davvero "intelligenza" al sistema. Il suo compito è prendere le notizie grezze raccolte dal primo workflow e trasformarle in informazione ricca: aggiungere il riassunto, capire il tono, classificare l'argomento, estrarre i nomi propri.

Anche qui la storia comincia con un orologio: ogni venti minuti il sistema controlla se ci sono notizie ancora da lavorare. Ma prima di chiamare l'intelligenza artificiale c'è un passaggio che ho voluto separare con cura, e vi spiego perché. Alcune fonti — come Reuters e Hacker News — non forniscono il testo completo dell'articolo, ma solo un'anteprima. Per queste, il sistema va a recuperare la pagina originale e ne estrae il contenuto pulito, ripulendolo da tutto ciò che è grafica, menu, pubblicità. Ho tenuto questa fase di "recupero del testo" separata dalla fase di intelligenza artificiale, perché sono due operazioni con problemi diversi: il recupero del testo può essere lento o fallire per un sito irraggiungibile, mentre l'AI ha altri tipi di limiti. Tenendole separate, un problema nell'una non manda all'aria l'altra. Se la pagina originale è irraggiungibile — magari per un paywall — il sistema ha comunque un piano B: usa l'anteprima o il titolo, così l'intelligenza artificiale ha sempre qualcosa su cui lavorare.

A questo punto entra in gioco il modello di linguaggio, l'intelligenza artificiale vera e propria, che raggiungiamo attraverso il servizio OpenRouter/free. A questo modello chiediamo quattro cose per ogni articolo: un riassunto in italiano di massimo cinquanta parole, il sentiment — positivo, negativo o neutro — l'elenco delle entità nominate, e la classificazione nelle nostre dodici categorie. Quando il modello ha finito, l'articolo viene aggiornato nel database e marcato come "processato", pronto per essere mostrato nel feed.

Ora, abbiamo scelto di usare un modello di intelligenza artificiale gratuito, coerentemente con il vincolo "zero costi" del progetto. Ma un modello gratuito è imprevedibile: a volte rispondeva con un formato sbagliato, a volte inventava categorie che non esistevano nella nostra lista, a volte semplicemente non rispondeva per via della lentezza. Se avessi lasciato le cose così, il sistema sarebbe stato inaffidabile.

La soluzione è stata costruire una rete di sicurezza a più livelli. Primo: ho reso le istruzioni al modello il più rigide possibile, chiedendo esplicitamente solo un certo formato e solo le categorie ammesse. Secondo: ho aggiunto un controllo che scarta automaticamente qualsiasi categoria inventata dal modello, accettando solo quelle ufficiali, e quando il modello è in dubbio assegna una categoria di riserva. Terzo: se proprio la risposta non arriva o è inutilizzabile, l'articolo non viene perso, ma segnalato e gestito. Il risultato è che, partendo da uno strumento gratuito e capriccioso, siamo riusciti a ottenere un comportamento sempre corretto e prevedibile. Questa, per me, è stata una delle parti più formative del progetto: imparare a costruire un sistema affidabile sopra un componente che affidabile non è.

**Collegamento alla slide successiva:**

Ora abbiamo un magazzino pieno di notizie pulite, riassunte e classificate. Ma come facciamo a scegliere, per ogni singolo utente, esattamente quelle giuste? È il compito del terzo workflow.

---

## Slide 11 — Workflow 3: Personalized Feed (motore di ranking)

> Webhook (POST /briefai/feed) → MongoDB (user_profiles + articles) → Ranking Engine (55% interesse, 25% keyword, 15% recency, + bonus) → Response (feed JSON)

**Discorso da esporre:**

Questo workflow funziona in modo diverso dai primi due. Non si attiva con un orologio, ma su richiesta: nel momento esatto in cui un utente apre la sua pagina del feed, l'applicazione lo chiama e dice "dammi le notizie per questa persona". È una richiesta che arriva e a cui bisogna rispondere subito.

Cosa succede in quel momento? Il sistema fa due cose in parallelo. Da un lato recupera il profilo dell'utente — quali categorie ha scelto, quali parole chiave segue, quali pesi ha sui vari argomenti. Dall'altro prende le notizie più recenti disponibili. E poi le mette insieme attraverso quello che chiamiamo il *motore di ranking*.

Questo motore applica un filtro netto: scarta tutte le notizie che non rientrano in nessuna delle categorie scelte dall'utente. Se a una persona non interessa lo sport, le notizie di sport non le vedrà proprio. Poi, sulle notizie rimaste, calcola un punteggio per decidere l'ordine. E qui c'è una vera e propria formula.

Il punteggio è composto da più ingredienti, ciascuno con un peso. La parte più importante, il cinquantacinque per cento, dipende da quanto l'argomento della notizia corrisponde agli interessi forti dell'utente. Un altro venticinque per cento premia le notizie che contengono le parole chiave che l'utente sta monitorando. Un quindici per cento valorizza la freschezza: una notizia di un'ora fa vale più di una di tre giorni fa, e questo valore decade gradualmente nel tempo. A questi si aggiungono dei piccoli bonus: per esempio se il tono della notizia corrisponde alle preferenze dell'utente, o se proviene da una fonte che ha mostrato di apprezzare.

Il risultato è una lista di notizie ordinate dalla più rilevante alla meno rilevante, costruita su misura per quella singola persona, che viene restituita all'applicazione e mostrata nel feed.

**Collegamento alla slide successiva:**

A questo punto manca un ultimo tassello: come fa il sistema a imparare e migliorare nel tempo? La risposta è nel quarto e ultimo workflow.

---

## Slide 12 — Workflow 4: Feedback Loop (apprendimento dai voti)

> Webhook (+1 / -1, userId · articleId) → MongoDB ×2 (articolo + profilo) → Compute Weights (range 0.0–2.4, step ±0.2) → Save (profilo aggiornato)

**Discorso da esporre:**

Eccoci all'ultimo workflow, il *feedback loop*, cioè il meccanismo con cui il sistema impara dall'utente e migliora nel tempo.

Ricordate i tre pulsanti della Magic Card — pollice su, pollice giù, salva? Questo workflow è ciò che dà loro un significato. Ogni volta che l'utente esprime un voto su una notizia, parte una richiesta che dice: "questa persona ha messo mi piace, o non mi piace, a questo articolo". E il sistema reagisce.

Vi spiego la logica con un'immagine. Ogni utente ha, per ciascuna delle dodici categorie, un "peso" che rappresenta quanto quell'argomento gli interessa. All'inizio tutti i pesi partono da un valore neutro. Quando l'utente mette "mi piace" a una notizia, il sistema guarda di che argomenti tratta quella notizia e alza un po' il peso di quegli argomenti. Quando mette "non mi piace", lo abbassa. È come una manopola che l'utente, senza accorgersene, gira a ogni interazione.

Questi pesi non sono un dettaglio isolato: sono esattamente gli stessi numeri che il motore di ranking del workflow precedente usa per ordinare le notizie. Ecco che il cerchio si chiude. L'utente vota, i pesi cambiano, e il prossimo feed che riceverà sarà di conseguenza più allineato ai suoi gusti reali. Più usa l'applicazione, più questa lo conosce e meglio lo serve.

Sui parametri di questo meccanismo, ogni voto sposta il peso di una certa quantità, e il peso può muoversi entro un intervallo definito. All'inizio avevamo pensato a incrementi piccoli e a un tetto più basso, per un comportamento prudente. Poi ho deciso di renderlo più reattivo: con incrementi leggermente più decisi e un tetto più alto. In questo modo il sistema risponde con prontezza ai segnali chiari dell'utente, invece di muoversi troppo lentamente. All'estremo opposto, un argomento su cui l'utente mostra disinteresse persistente può scendere fino a essere praticamente considerato neutro.

Con questo quarto workflow il cerchio è completo: raccogliamo, arricchiamo, ordiniamo e impariamo. Una catena che si autoalimenta e migliora a ogni utilizzo.

**Collegamento alla slide successiva:**

Abbiamo visto tutto il motore di automazione. Ma c'è un altro pilastro che lavora in silenzio per garantire che tutto sia sicuro e ordinato: il backend.

---

## Slide 13 — Backend e sicurezza

> Identità & accessi · Profilo utente || Sicurezza: chiave JWT · password cifrata · Helmet 8.1 · controllo accessi (CORS)

**Obiettivo comunicativo:** presentare il backend come il "guardiano" del sistema, spiegando in modo accessibile le quattro misure di sicurezza e perché proteggono concretamente l'utente.

**Discorso da esporre:**

Se i workflow sono il motore che produce le notizie, il backend è il guardiano che custodisce i dati e decide chi può accedere a cosa. Lo definiamo il "motore nascosto" dell'applicazione: l'utente non lo vede mai direttamente, ma ogni volta che fa login, apre il suo profilo o scorre gli articoli, sta parlando con lui. Una caratteristica importante è che ogni richiesta è indipendente: il server non si porta dietro memoria da una richiesta all'altra, e questo lo rende semplice, prevedibile e facile da far crescere.

Qui è utile chiarire la divisione dei ruoli: i workflow n8n si occupano dei *contenuti* — raccolgono, arricchiscono, ordinano e personalizzano le notizie — mentre il backend si occupa delle *persone*. In una frase: n8n produce le notizie, il backend protegge gli utenti. Concretamente fa due cose. La prima è gestire l'identità e gli accessi: registrazione di nuovi utenti con controlli rigorosi, login, e il rilascio della chiave di accesso che autorizza ogni richiesta riservata. La seconda è gestire il profilo dell'utente, restituendo sempre i dati più aggiornati e mantenendoli sincronizzati con l'automazione, così che le preferenze impostate dall'utente e quelle apprese dal sistema restino sempre coerenti.

Ma la parte su cui voglio soffermarmi è la sicurezza, perché quando si gestiscono account e password la responsabilità è alta. L'abbiamo costruita su quattro livelli, e ve li spiego in parole semplici.

Il primo è la chiave di accesso digitale, quello che tecnicamente si chiama JWT. Funziona come un braccialetto di un evento: quando entri, ti viene dato un braccialetto firmato e con una scadenza; finché ce l'hai e non è scaduto, puoi muoverti liberamente, e nessuno può falsificarlo perché la firma è verificabile. Ogni richiesta riservata richiede di mostrare questo braccialetto.

Il secondo livello riguarda le password. Questo è un punto su cui insisto: la password dell'utente non viene mai salvata come testo leggibile. Viene trasformata in un codice irreversibile, dal quale è impossibile risalire alla password originale. Nemmeno noi, che abbiamo costruito il sistema, possiamo leggere le password degli utenti. E non viene mai restituita in nessuna risposta. È la garanzia minima che ogni servizio serio deve dare.

Il terzo livello è uno strato di protezioni automatiche — lo strumento si chiama Helmet — che aggiunge difese standard nella comunicazione tra l'applicazione e il server, proteggendo da una serie di attacchi noti e comuni del web.

Il quarto livello è il controllo degli accessi: solo le applicazioni autorizzate possono comunicare con il nostro server, e questo si configura a seconda dell'ambiente. È come una lista di invitati all'ingresso: chi non è in lista non entra.

Messi insieme, questi quattro livelli fanno sì che l'utente possa fidarsi del sistema. E la fiducia, in un prodotto che gestisce informazione personale, è tutto.

**Collegamento alla slide successiva:**

Tutta questa sicurezza protegge i dati. Ma dove vivono, esattamente, questi dati? Vediamo il cuore informativo del sistema: il database.

---

## Slide 14 — Il database flessibile

> Tutto nel cloud, nessuna copia locale. Tre collezioni: **articles** (le notizie), **users** (gli utenti), **user_profiles** (profilo leggero). Le tre collezioni sono sempre sincronizzate.

**Obiettivo comunicativo:** spiegare l'organizzazione dei dati in modo accessibile, giustificare la scelta delle tre collezioni e introdurre il principio del minimo privilegio come scelta di sicurezza e pulizia architetturale.

**Discorso da esporre:**

Tutti i dati di BriefAI vivono in un unico posto nel cloud, accessibile sia dall'applicazione sia dai flussi di automazione. Non esistono copie sparse o disallineate: c'è una sola fonte di verità, e questo è già di per sé una scelta che semplifica enormemente la gestione e previene errori.

I dati sono organizzati in tre raccolte, e ognuna ha un ruolo chiaro. La prima raccoglie gli articoli: tutte le notizie provenienti da TechCrunch, Reuters, ANSA e Hacker News. Ogni articolo ha quel codice univoco di cui parlavo, che garantisce l'assenza di duplicati, e porta con sé l'indicazione della fase in cui si trova — appena acquisito, pronto, oppure processato. In pratica, guardando un articolo sappiamo sempre a che punto è del suo viaggio nella catena di montaggio.

La seconda raccoglie gli utenti: nome, email, preferenze di lettura, piano di abbonamento. È qui che, come dicevo, la password è custodita in forma cifrata e irreversibile, e non viene mai mostrata.

La terza raccolta è quella che merita una spiegazione particolare, perché è una scelta progettuale che ci ha richiesto ragionamento. Accanto agli utenti completi teniamo una versione "leggera" del profilo, pensata appositamente per i flussi di automazione. Contiene solo le preferenze necessarie a costruire il feed — gli interessi, le parole chiave, i pesi — e nient'altro. Nessun dato sensibile di accesso.

Perché questa separazione? Per due motivi. Il primo è un principio di sicurezza che si chiama "minimo privilegio": ogni parte del sistema deve poter accedere solo a ciò che le serve davvero, e niente di più. I flussi di automazione hanno bisogno di sapere cosa interessa all'utente per costruirgli il feed, ma non hanno alcun bisogno di vedere la sua email o la sua password. Tenendo i dati sensibili separati, riduciamo la superficie di rischio. Il secondo motivo è di ordine pratico, legato a un'incompatibilità tecnica tra il formato usato dal backend e quello usato dall'automazione, che abbiamo risolto proprio mantenendo le due rappresentazioni distinte.

La sfida, naturalmente, è tenere queste raccolte sempre allineate tra loro. Un profilo può essere aggiornato dall'utente tramite le impostazioni, oppure dal sistema tramite il feedback. Abbiamo costruito dei meccanismi automatici che garantiscono che ogni modifica, da qualunque parte arrivi, mantenga le tre raccolte coerenti tra loro. È un lavoro invisibile all'utente, ma è ciò che fa funzionare tutto senza intoppi.

**Collegamento alla slide successiva:**

Abbiamo descritto il prodotto completo nella sua versione gratuita. Ma abbiamo anche immaginato dove può andare, con un piano premium. Vediamolo.

---

## Slide 15 — Il piano Pro

> Fonti personalizzate e più articoli · Notifiche e digest via email · Trending (pagina /tendenze) · Personalizzazione del modello AI in base alle preferenze

**Obiettivo comunicativo:** dimostrare visione di prodotto e prospettiva di crescita, presentando le funzionalità premium come naturale evoluzione del valore già costruito.

**Discorso da esporre:**

Quello che vi abbiamo mostrato finora è il prodotto nella sua forma gratuita, già completo e funzionante. Ma fin dall'inizio abbiamo ragionato anche su come BriefAI potrebbe crescere e sostenersi, e abbiamo immaginato un piano Pro con funzionalità avanzate. Ve le presento, perché raccontano la direzione del progetto.

La prima funzionalità premium è la possibilità di aggiungere fonti personalizzate e di accedere a un numero maggiore di articoli. L'utente Pro non è più limitato alle nostre quattro fonti, ma può portare le sue, e ricevere un volume più ampio di notizie.

La seconda sono le notifiche e i digest via email: invece di dover aprire l'applicazione, l'utente riceve direttamente nella sua casella un riassunto periodico delle notizie più rilevanti per lui. È il prodotto che va incontro all'utente, e non viceversa.

La terza è la pagina delle tendenze, il "trending": una sezione che mostra gli argomenti più caldi del momento, cogliendo le notizie che stanno emergendo trasversalmente. È un modo per dare all'utente non solo ciò che ha chiesto, ma anche un polso di ciò che sta accadendo nel mondo.

La quarta, e secondo me la più affascinante, è la personalizzazione del modello di intelligenza artificiale in base alle preferenze del singolo utente. Significa portare la personalizzazione a un livello ancora più profondo, adattando il modo stesso in cui l'AI lavora alle esigenze specifiche di chi la usa.

Quello che voglio trasmettere con questa slide è che BriefAI non è un esercizio chiuso in sé stesso, ma un prodotto con una traiettoria di crescita chiara. Le fondamenta che abbiamo costruito — la pipeline, il ranking, il feedback — sono solide proprio perché pensate per poter accogliere domani queste evoluzioni.

**Collegamento alla slide successiva:**

Costruire tutto questo, però, non è stato un percorso lineare. Voglio essere trasparente con voi e raccontarvi gli ostacoli che abbiamo incontrato e come li abbiamo superati, perché è lì che abbiamo imparato di più.

---

## Slide 16 — Difficoltà superate

> Migrazione a n8n · Articoli senza testo completo · Deduplicazione articoli · AI con risposte irregolari · Preferenze non allineate · Perdita dati nell'onboarding

**Obiettivo comunicativo:** mostrare maturità tecnica e capacità di problem solving, raccontando i problemi reali come occasioni di apprendimento e le soluzioni come scelte ragionate. È la slide che dimostra la profondità del lavoro.

**Discorso da esporre:**

Nessun progetto reale procede senza ostacoli, e i nostri li abbiamo affrontati a testa alta. Voglio raccontarvene alcuni, perché credo che il modo in cui si superano le difficoltà dica più sul lavoro svolto di qualsiasi funzionalità riuscita.

La prima sfida è stata la migrazione verso n8n. La nostra pipeline iniziale era basata su un'architettura più rigida, fatta di script in Python e diversi componenti separati. Il problema era che ogni piccola modifica richiedeva un intero ciclo di sviluppo e ripubblicazione. Passando a n8n abbiamo ottenuto flussi di lavoro visivi, modificabili direttamente mentre sono in produzione. Ma questo ha richiesto un cambio di mentalità: pensare non più in termini di righe di codice sequenziali, ma in termini di blocchi collegati, con percorsi alternativi e ramificazioni. È stata una crescita prima ancora che tecnica, di metodo.

Il secondo ostacolo: alcune fonti, come Reuters e Hacker News, non forniscono il testo completo dell'articolo. Senza testo, l'intelligenza artificiale non ha materiale su cui lavorare. La soluzione è stata far sì che il sistema recuperasse automaticamente la pagina originale; e quando questa è bloccata, ad esempio da un paywall, ripiega su un testo di anteprima. In nessun caso l'AI resta a mani vuote.

Il terzo: il rischio di salvare lo stesso articolo più volte da fonti diverse. L'ho già raccontato — l'abbiamo risolto dando a ogni articolo un'impronta digitale univoca, così i duplicati vengono scartati automaticamente.

Il quarto è forse quello che mi ha insegnato di più: l'intelligenza artificiale gratuita che produceva risposte irregolari, a volte con categorie inventate o formati malformati. Qui ho costruito quella rete di sicurezza di cui parlavo: istruzioni rigide, bassa variabilità nelle risposte e una categoria di riserva che garantisce sempre un risultato corretto, qualunque cosa faccia il modello.

Il quinto: le preferenze dell'utente che non sempre si riflettevano correttamente nel ranking. Il problema nasceva dal fatto che le diverse parti del sistema rischiavano di non parlare la stessa lingua. La soluzione è stata standardizzare i dodici argomenti chiave come vocabolario comune, condiviso identico tra tutti i componenti — l'AI, il ranking, il feedback, l'interfaccia. Una sola tassonomia, valida ovunque.

E infine un problema di esperienza utente: nell'onboarding, navigare indietro tra i passaggi poteva cancellare le preferenze già inserite. L'abbiamo risolto facendo in modo che le preferenze vengano salvate solo al termine del percorso, eliminando ogni rischio di perdita durante la compilazione.

Il filo conduttore di tutte queste soluzioni è uno solo: privilegiare la robustezza e la semplicità. Ogni volta abbiamo scelto la strada che rendeva il sistema più affidabile e più facile da mantenere, anche quando non era la più immediata.

**Collegamento alla slide successiva:**

Tutto questo non sarebbe stato possibile senza il lavoro di squadra. Vi presento le persone dietro BriefAI.

---

## Slide 17 — Il team di sviluppo

> Diego Cipolla — Data Pipeline & n8n · Nicolò Salvafiorita — AI Analytics & Backend · Matteo Galluzzo — Backend & Infrastructure · Lorenzo Bocca — Frontend & Design

**Obiettivo comunicativo:** dare il giusto riconoscimento al lavoro di squadra, mostrando come le competenze si siano integrate, e contestualizzare il proprio ruolo all'interno del progetto complessivo.

**Discorso da esporre:**

BriefAI è il risultato del lavoro di un team di quattro persone, e ognuno ha portato un pezzo fondamentale del puzzle. Mi piace presentarvi i miei compagni, perché la qualità del progetto nasce proprio dall'incastro delle nostre competenze.

Io, Diego Cipolla, mi sono occupato della pipeline dati e dell'orchestrazione con n8n: i quattro workflow che abbiamo visto in dettaglio, il cuore operativo che raccoglie, arricchisce, ordina e fa apprendere il sistema. Ho curato anche la documentazione tecnica del progetto.

Nicolò Salvafiorita ha lavorato sulla componente di AI Analytics e sul backend, contribuendo in particolare alla definizione della tassonomia dei dodici argomenti — quel vocabolario comune che tiene insieme tutto il sistema — e ai criteri di scoring del ranking, in stretto coordinamento con me per l'implementazione nei workflow.

Matteo Galluzzo si è occupato del backend e dell'infrastruttura: il server delle API, la modellazione del database, il sistema di sicurezza con autenticazione e cifratura delle password che vi ho descritto.

Lorenzo Bocca ha realizzato l'intero frontend e il design: tutta l'interfaccia che l'utente vede e con cui interagisce, dalle pagine di accesso al feed, fino alle scelte di colori e tipografia che danno all'applicazione la sua identità.

Quello che voglio sottolineare è che questi ruoli non hanno lavorato in isolamento. La pipeline che ho costruito doveva parlare perfettamente con il backend di Matteo e Nicolò e con il frontend di Lorenzo. La tassonomia di Nicolò doveva essere identica in ogni livello. La sicurezza del backend doveva proteggere i dati che la mia pipeline produceva. È stato un esercizio costante di integrazione e dialogo, ed è questo, più di ogni singola tecnologia, ciò di cui vado più orgoglioso.

**Collegamento alla slide successiva:**

E con questo siamo arrivati alla fine del nostro percorso.

---

## Slide 18 — Grazie

> *Grazie.*

**Obiettivo comunicativo:** chiudere con eleganza, riassumere in poche frasi il valore del progetto e aprire al dialogo con la commissione.

**Discorso da esporre:**

Siamo partiti da una frase — l'idea che ogni giorno riceviamo più informazioni di quante un uomo del 1500 ne vedesse in tutta la vita — e da un problema reale, misurabile, che pesa sulla nostra serenità, sulla salute dei più giovani e sulla produttività di tutti.

A quel problema abbiamo risposto con BriefAI: un sistema che prende il caos delle notizie e lo trasforma in un feed ordinato, sintetico e personale. Lo abbiamo costruito con un'architettura a costo zero, con una pipeline intelligente che raccoglie, arricchisce, ordina e impara, con un backend sicuro e un'interfaccia pensata per le persone. E lo abbiamo fatto affrontando ostacoli concreti, ogni volta scegliendo la robustezza e la semplicità.

Per noi questo progetto è stato molto più di un esercizio accademico: è stato il momento in cui le competenze acquisite durante il corso e il tirocinio si sono trasformate in qualcosa di vivo e funzionante. Vi ringrazio per l'attenzione, e siamo a disposizione per qualsiasi domanda o approfondimento vogliate farci.

---

*Fine del copione — BriefAI, Corso Full Stack Developer, LucaSacchi.Net*
