const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

require('dotenv').config();

const authRoutes = require('./routes/auth');
const articleRoutes = require('./routes/articles');
const profileRoutes = require('./routes/profile');
const statsRoutes = require('./routes/stats');

const app = express();

app.use(helmet());
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || 'https://your-production-domain.com']
    : ['http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/stats', statsRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'BriefAI Backend',
    version: '1.0.0',
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint non trovato.',
  });
});

app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Errore interno del server.' : err.message,
  });
  if (typeof next === 'function') {
    return next(err);
  }
  return undefined;
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
      console.log('GET    /api/articles');
      console.log('GET    /api/articles/:uniqueKey');
      console.log('GET    /api/profile');
      console.log('PUT    /api/profile');
      console.log('GET    /api/stats/sentiment');
      console.log('GET    /api/stats/categories');
      console.log('GET    /api/stats/trending');
      console.log('GET    /api/stats/sources');
      console.log('GET    /api/stats/overview');
      console.log('GET    /health');
    });
  })
  .catch((err) => {
    console.error('Errore connessione MongoDB:', err.message);
    process.exit(1);
  });
