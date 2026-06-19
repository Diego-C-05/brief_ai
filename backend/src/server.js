const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

require('dotenv').config();

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

const app = express();

app.use(helmet());
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || 'https://your-production-domain.com']//placeholder
    : ['http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
      if (allowedOrigins.includes(origin) || localhostRegex.test(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,//cookie non ancora implementati
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'BriefAI Backend',
  });
});

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

const port = Number.parseInt(process.env.PORT, 10) || 5000;

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
    console.error('Errore connessione MongoDB:', err.message);
    process.exit(1);
  });
