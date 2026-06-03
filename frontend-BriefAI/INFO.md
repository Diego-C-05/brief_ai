# Project Architecture & Technical Documentation

## Aggiornamento Home Pubblica (22/04/2026)
### Obiettivo implementato
- La prima pagina visibile e ora una home pubblica dedicata (`/`), separata dal flusso autenticato.
- La pagina pubblica non usa sidebar e non usa topbar.
- I pulsanti "Start without login" e "Login" della hero sono stati rimossi.
- I pulsanti `Login` e `Registrati` sono stati spostati dentro due card piano (`Free` e `Pagamento`).

### Specifiche UI implementate
- Sfondo pagina: gradiente verticale da slate-50 a bianco.
- Hero con badge pill gradiente blu-viola e icona sparkles.
- Headline principale grande con testo a gradiente blu-viola.
- Sottotitolo centrale in colore slate-600.
- Sezione piani con 2 card (`Piano Gratuito`, `Piano a Pagamento`) e 2 bottoni per card (`Login`, `Registrati`).
- Sezione benefits a 3 card responsive (1 colonna mobile, 3 desktop).
- Sezione preview con contenitore gradiente e card demo articolo.
- Footer centrale: "BriefAI © 2026 - Strumento di Decision Intelligence".

### Routing aggiornato
- `/` -> Home pubblica.
- `/login` -> Pagina login.
- `/register` -> Pagina registrazione.
- Route protette invarianti (`/onboarding`, `/feed`, `/tendenze`, `/impostazioni`) con redirect a `/login` se non autenticato.

### Tecnologie usate nella home
- React 19 + TypeScript.
- React Router DOM per collegamenti `Login`/`Registrati` e gestione route.
- CSS modulare per pagina (`HomePage.css`) senza librerie UI esterne.
- SVG inline per icone (Sparkles, Zap, TrendingUp) senza dipendenze icon pack aggiuntive.

### File coinvolti
- `src/pages/HomePage.tsx`
- `src/pages/HomePage.css`
- `src/App.tsx`
- `src/App.css`
- `src/pages/LoginPage.tsx`
- `src/pages/RegisterPage.tsx`
- `src/index.css`

## Executive Summary
BriefAI Frontend e una web app single-page orientata alla curazione di notizie tech con onboarding guidato, feed personalizzato e area impostazioni. Il progetto e impostato come frontend-first prototype: privilegia velocita di iterazione, chiarezza architetturale e una base TypeScript pronta a evolvere verso integrazioni API reali.

> Design Principle: favorire decisioni reversibili ad alta leva tecnica, mantenendo basso l'overhead cognitivo del team.

### Refactor CSS per pagina
- Gli stili non sono piu concentrati in un unico file monolitico, App.css.
- Ogni pagina in src/pages ora ha il proprio CSS dedicato:
	- LoginPage.css
	- RegisterPage.css
	- OnboardingPage.css
	- FeedPage.css
	- SettingsPage.css
- App.css contiene solo le regole condivise minime della shell applicativa.

### Verifica tecnica
- Build di produzione verificata con esito positivo.
- Nessun errore TypeScript/CSS rilevato nei file toccati.

## 1. Project Overview
### Obiettivo prodotto
- Rendere veloce la configurazione iniziale delle preferenze (interessi + keyword).
- Presentare un feed tematico con card informative e azioni rapide.
- Offrire un pannello impostazioni per preferenze e stato account.

### Scope tecnico corrente
- SPA con routing client-side e route protette lato UI.
- Stato locale nei componenti e persistenza su localStorage per onboarding/impostazioni.
- Dataset feed statico (mock) in attesa di integrazione backend.

## 2. Tech Stack & Rationale
### Core stack
| Tecnologia | Ruolo | Rationale tecnico |
| --- | --- | --- |
| React 19 | UI layer dichiarativo | Composizione a componenti, ergonomia elevata e base solida per feature growth incrementale. |
| TypeScript 6 | Type safety | Riduce errori runtime e rende i contratti (props, union types, snapshot settings) espliciti e manutenibili. |
| Vite 8 | Bundler/dev server | Startup e HMR molto rapidi, ottimo ciclo feedback per sviluppo UI iterativo. |
| React Router DOM 7 | Navigazione applicativa | Routing modulare con guardie applicative semplici e prevedibili. |

### Tooling & quality stack
| Tool | Ruolo | Vantaggio operativo |
| --- | --- | --- |
| ESLint 9 + @eslint/js | Static analysis JS/TS | Enforce di regole baseline affidabili e riduzione regressioni banali. |
| typescript-eslint | Linting TypeScript | Coerenza tra type system e quality gate lint. |
| eslint-plugin-react-hooks | Regole hooks | Previene violazioni su dipendenze hooks e side effect non intenzionali. |
| eslint-plugin-react-refresh | Compatibilita HMR | Migliore stabilita del ciclo di sviluppo con Vite. |
| React Compiler preset (plugin React + Babel) | Ottimizzazione React compile-time | Abilita ottimizzazioni del rendering e apre a miglioramenti performance senza cambiare API applicative. |

## 3. Architectural Design Decisions
### Feature-Driven Structure (Mental Model)
La codebase e oggi organizzata per tipologia di file (pages/components), ma il modello logico e gia allineato a una migrazione feature-based:

| Dominio | Struttura attuale | Direzione di scala |
| --- | --- | --- |
| Auth | Login/Register + route guard in App | src/features/auth con ui, state, adapters e contracts dedicati |
| Onboarding | Wizard con selezione topic/keyword | src/features/onboarding con step engine e persistence boundary |
| Feed | Sidebar + Topbar + FeedContent + MagicCard | src/features/feed con query model e rendering pipeline |
| Settings | Tab interessi/account + snapshot locale | src/features/settings con settings store locale/remoto |

> Design Principle: il modulo funzionale e l'unita di evoluzione, non il singolo componente.

### State Colocation & Lifting Strategy
- Stato mantenuto il piu vicino possibile al punto d'uso (state colocation) per ridurre fan-out dei render.
- Lifting State Up applicato solo per coordinazione reale tra componenti fratelli.
- Prop drilling profondo evitato con decomposizione gerarchica e confini di responsabilita chiari.
- Context globale non introdotto in questa fase per evitare broadcast render non necessari su update frequenti.
- Redux/Zustand evitati deliberatamente nel prototipo per contenere TTI e carico cognitivo, sfruttando la composizione React e la prossimita dello stato.

### Data Masking & Normalization
- Sebbene i dati siano mock, la forma degli oggetti e stabile e semanticamente normalizzata per semplificare l'innesto di API reali.
- Le entita UI (news item, keyword, category, subscription state) sono gia mappate con naming consistente e contratti tipizzati.
- La persistenza locale usa snapshot JSON minimali, evitando accoppiamento prematuro con schemi backend.

### Error Handling & Boundary Strategy
- Stato attuale: non e ancora presente un Error Boundary globale dedicato.
- Strategia target: introdurre boundary a due livelli.

| Livello | Scopo | Azione prevista |
| --- | --- | --- |
| App Boundary | Contenere crash non recuperabili di pagina | Fallback shell + action di recover/navigation |
| Feature Boundary | Isolare failure locali (Feed, Settings, Onboarding) | Fallback contestuale con retry e telemetry hook |

- I flussi form adottano gia validazioni e early return per gli errori funzionali prevedibili.

### React 19 Positioning
- React 19 e React Compiler sono attivi per preparare il terreno a ottimizzazioni basate su concurrency.
- Le API Actions e use() non sono ancora adottate intenzionalmente: l'app e attualmente client-only e non ha boundary async server-backed da cui trarre vantaggio netto.
- Decisione architetturale: introdurre Actions/use() insieme al data layer remoto, evitando un'adozione parziale non giustificata dal contesto runtime attuale.

## 4. Coding Style & Best Practices
### Standard adottati
- Naming esplicito e orientato al dominio (es. selectedCategories, subscriptionState, handleAddKeyword).
- Tipizzazione forte con union types e type alias per props/stati critici.
- Funzioni piccole e focalizzate (toggle, add/remove, save handlers).
- Uso consistente di early return nelle validazioni input.
- Commenti tecnici mirati solo dove chiariscono intento non ovvio.

### Clean Code e principi SOLID (applicazione pratica)
- Single Responsibility: componenti specializzati per sezione funzionale.
- Open/Closed (parziale): comportamento estendibile tramite props senza riscrivere componenti base.
- Dependency inversion non ancora formalizzata: manca un abstraction layer dati dedicato.

### Gestione dello stato
- Stato locale React (useState) per interazioni UI immediate.
- useMemo in onboarding per derivazioni non banali (suggestion pool).
- Persistenza selettiva su localStorage per settings/onboarding.
- Nessuno state manager globale introdotto intenzionalmente per contenere complessita, mantenere basso il TTI e ridurre overhead cognitivo in una fase di prototipazione rapida.

## 5. Resilience & DX (Developer Experience)
### Sfide tecniche e risposte progettuali
| Tema | Decisione | Impatto ingegneristico |
| --- | --- | --- |
| Type Invariants | Uso di union literal e type alias di dominio (es. stato sottoscrizione) | Impedisce stati UI illegali a compile time e migliora refactor safety |
| Early vs Premature Optimization | React Compiler in build, memoizzazione manuale ridotta al necessario | Meno debito tecnico da useMemo/useCallback superflui e migliore leggibilita |
| Failure visibility | Strategia Error Boundary pianificata per livello app/feature | Riduce blast radius dei crash e abilita fallback UX prevedibili |

> Design Principle: ottimizzare il percorso di delivery del team prima della micro-ottimizzazione locale.

## 6. Performance & Security
### Performance
| Area | Implementazione attuale | Impatto |
| --- | --- | --- |
| Toolchain | Vite + HMR + build moderna ES2023 | Riduce latenza in sviluppo e genera bundle ottimizzati per target moderni. |
| Rendering | React Compiler preset abilitato | Potenziale riduzione re-render non necessari in scenari complessi. |
| UI state updates | Aggiornamenti immutabili mirati e funzioni pure | Migliore prevedibilita e riduzione side effect inutili. |
| Layout responsiveness | Breakpoint CSS e grid/flex | UX stabile su viewport desktop/mobile senza logica JS aggiuntiva. |

### Advanced Performance Metrics
| Area | Implementazione attuale | Effetto atteso |
| --- | --- | --- |
| Tree Shaking & Bundle Hygiene | Pipeline ESM-first con Vite | Eliminazione del dead code nel bundle finale |
| Dependency hygiene | Stack runtime ridotto e senza state manager globale | Minore payload iniziale e parse cost piu basso |
| Selective Hydration Ready | Architettura a confini funzionali chiari | Base pronta a migrare verso framework full-stack (Next.js/Remix) |

### Security
| Area | Misura presente | Note |
| --- | --- | --- |
| Input handling | Validazioni client-side (required, trim, controllo duplicati) | Riduce errori UX ma non sostituisce validazione server-side. |
| XSS surface | Nessun uso di dangerouslySetInnerHTML | Diminuisce rischio di injection lato rendering. |
| Routing access control | Guardia route lato client | Misura UX-only, non e sicurezza forte senza backend/sessione reale. |
| Data persistence | localStorage per preferenze non sensibili | Evitare storage di token/PII sensibili in chiaro. |

### Gap noti (da roadmap tecnica)
- Autenticazione reale assente (attualmente credenziali hardcoded demo [User: Lorenzo Password: Bocca]).
- Nessun layer API/back-end integration e nessuna strategia di token handling.
- Nessuna suite test automatica (unit/integration/e2e) ancora integrata.

## 7. Known Trade-offs
- Abbiamo sacrificato persistenza complessa e autenticazione reale per massimizzare velocita di prototipazione e validazione UX.
- L'assenza di un Error Boundary in questa fase riduce la resilienza ai crash, ma ha contenuto la complessita iniziale della codebase.
- L'organizzazione per tipo file accelera onboarding dei contributor nel breve periodo, ma scala peggio di una feature-based structure oltre una certa soglia di moduli.

## 8. Guida al Setup (Peer Review Quickstart)
### Prerequisiti
- Node.js 20+ consigliato.
- npm 10+.

### Avvio rapido
1. Installazione dipendenze:

```bash
npm install
```

2. Avvio in sviluppo:

```bash
npm run dev
```

3. Linting:

```bash
npm run lint
```

4. Build produzione:

```bash
npm run build
```

5. Preview build:

```bash
npm run preview
```

### Flusso di review consigliato
1. Verificare routing e protezione route private (login -> onboarding -> feed/settings).
2. Controllare persistenza localStorage su onboarding/settings e fallback a default.
3. Eseguire lint e build per validare quality gate e bundle output.

## Dipendenze principali
### Runtime dependencies
| Package | Versione |
| --- | --- |
| react | ^19.2.5 |
| react-dom | ^19.2.5 |
| react-router-dom | ^7.14.1 |

### Development dependencies
| Package | Versione |
| --- | --- |
| vite | ^8.0.9 |
| typescript | ~6.0.2 |
| @vitejs/plugin-react | ^6.0.1 |
| @rolldown/plugin-babel | ^0.2.3 |
| @babel/core | ^7.29.0 |
| babel-plugin-react-compiler | ^1.0.0 |
| eslint | ^9.39.4 |
| @eslint/js | ^9.39.4 |
| typescript-eslint | ^8.58.2 |
| eslint-plugin-react-hooks | ^7.1.1 |
| eslint-plugin-react-refresh | ^0.5.2 |
| globals | ^17.5.0 |
| @types/react | ^19.2.14 |
| @types/react-dom | ^19.2.3 |
| @types/node | ^24.12.2 |
| @types/babel__core | ^7.20.5 |

## Evoluzione suggerita (Technical Roadmap)
1. Introdurre data layer dedicato con API client typed e error model esplicito.
2. Portare autenticazione da mock a JWT/session cookie con route guard server-backed.
3. Introdurre Error Boundary multi-livello (app + feature) con fallback UX e logging telemetrico.
4. Abilitare code splitting per rotte ad alto payload e misurare Core Web Vitals.
5. Introdurre Visual Regression Testing (Playwright/Storybook) per garantire l'integrita del design system durante iterazioni rapide del prototipo.
