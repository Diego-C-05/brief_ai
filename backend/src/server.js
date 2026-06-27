const express = require('express'); // framework web
const mongoose = require('mongoose'); // connessione/ODM MongoDB
const cors = require('cors'); // gestione richieste cross-origin (frontend -> backend)
const helmet = require('helmet'); // header HTTP di sicurezza
const morgan = require('morgan'); // logging delle richieste HTTP

require('dotenv').config(); // carica le variabili d'ambiente da .env

// Node.js su Windows usa c-ares che fallisce i lookup SRV; forziamo Google DNS.
require('dns').setServers(['8.8.8.8', '8.8.4.4']);

// Importa i gruppi di rotte.
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

const app = express();

// Helmet: imposta header di sicurezza di default.
app.use(helmet());

// Determina le origini consentite dal CORS in base all'ambiente:
// - CORS_ORIGIN esplicito (lista separata da virgole), oppure
// - in produzione: il dominio frontend, oppure
// - in sviluppo: il dev server Vite su localhost:5173.
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || 'https://your-production-domain.com']//placeholder
    : ['http://localhost:5173'];

app.use(
  cors({
    // Funzione che decide se accettare l'origine della richiesta.
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // richieste senza origin (es. curl/Postman) ammesse
      const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
      // Ammette le origini in whitelist o qualsiasi localhost (dev).
      if (allowedOrigins.includes(origin) || localhostRegex.test(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS')); // altrimenti blocca
    },
    credentials: true,//cookie non ancora implementati
  })
);
app.use(morgan('dev')); // logga ogni richiesta in console
app.use(express.json()); // parsa il body JSON in req.body
app.use(express.urlencoded({ extended: true })); // parsa i form url-encoded

// Monta i gruppi di rotte sotto i rispettivi prefissi.
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Endpoint di health check: utile per monitoraggio/deploy.
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'BriefAI Backend',
  });
});

// Catch-all: qualsiasi rotta non gestita sopra risponde 404.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint non trovato.',
  });
});

// Error-handling middleware: i 4 parametri (incluso _next, non usato)
// servono a Express per riconoscerlo come gestore errori.
app.use((err, req, res, _next) => {
  console.error('[Server Error]', err.stack);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Errore interno del server.' : err.message,
  });
});

// Porta dal .env, con fallback a 5000.
const port = Number.parseInt(process.env.PORT, 10) || 5000;

// Connette a MongoDB e avvia il server SOLO se la connessione riesce.
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connesso a MongoDB Atlas');
    app.listen(port, () => {
      console.log(`Backend BriefAI attivo su http://localhost:${port}`);
      console.log('Endpoints disponibili:');
      console.log('POST   /api/auth/register');
      console.log('POST   /api/auth/login');
      console.log('GET    /api/auth/me');
      console.log('GET    /api/profile');
      console.log('PUT    /api/profile');
      console.log('GET    /health');
    });
  })
  .catch((err) => {
    // Se MongoDB non è raggiungibile, logga e termina il processo (exit code 1).
    console.error('Errore connessione MongoDB:', err.message);
    process.exit(1);
  });
