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


## Slide 4 — Architettura e tecnologie zero-cost

> Presentation: React 19 SPA · Orchestration: n8n Cloud (W1→W2→W3→W4) · API Layer: Express.js 5.2 · Data: MongoDB Atlas M0

>Sotto c'è il livello di *orchestrazione* che ho progettato e implementato io stesso, realizzato con n8n: è il motore che lavora dietro le quinte, in modo automatico e continuo. È qui che le notizie vengono raccolte, lette dall'intelligenza artificiale, classificate e ordinate. Lo rappresentiamo come una sequenza di quattro workflow — dalla raccolta delle notizie, all'arricchimento con l'AI, al ranking personalizzato, fino al feedback dell'utente — e li vedremo uno per uno più avanti.

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
