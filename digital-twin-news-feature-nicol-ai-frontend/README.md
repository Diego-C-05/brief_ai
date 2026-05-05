# 📰 Digital Twin News

Sistema di News Intelligence basato su LLM che raccoglie notizie tramite RSS,
le analizza con AI e fornisce una dashboard personalizzata per aziende.

## Team
| Membro | Ruolo |
|--------|-------|
| Cipolla Diego | Data Pipeline Engineer |
| Bocca Lorenzo | Frontend & Auth Engineer |
| Galluzzo Matteo | AI, Modelli & Logica |
| Salvafiorita Nicolò | Integrazione AI/UI |

## Architettura
```
[RSS Feed] → [Data Pipeline] → [MongoDB + Redis]
                                      ↓
                            [AI Analysis (Claude API)]
                                      ↓
                            [Backend API (Express)]
                                      ↓
                            [Frontend Dashboard (React)]
```

## Stack tecnologico
| Layer | Tecnologie |
|-------|-----------|
| Data Pipeline | Node.js, RSS Parser, Redis, node-cron |
| Storage | MongoDB, Redis |
| AI & Analytics | Python, Claude API, NLTK |
| Backend | Node.js, Express, JWT |
| Frontend | React, Material UI, Chart.js, Recharts |
| Infrastruttura | Docker Compose |

## Avvio rapido
```bash
# 1. Avvia i database
docker-compose up -d mongo redis

# 2. AI Analysis
cd ai-analysis
source venv/bin/activate
python src/scheduler.py

# 3. Backend API
cd backend
npm run dev

# 4. Data Pipeline
cd data-pipeline
npm start

# 5. Frontend
cd frontend
npm start
```

## KPI del sistema
- Frequenza aggiornamento: ogni 15 minuti
- Batch AI: 10 articoli per ciclo
- Autenticazione: JWT 24h
- Fallback locale: attivo se API LLM non disponibile

## Limitazioni documentate
- Sistema batch-based (non real-time puro)
- Free tier API LLM gestito con fallback locale
- Testing automatizzato fuori scope MVP