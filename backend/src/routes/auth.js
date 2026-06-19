const express = require('express');
const jwt = require('jsonwebtoken'); // creazione token JWT (qui si firmano)
const User = require('../models/User');
const auth = require('../middleware/auth'); // middleware per proteggere /me

require('dotenv').config(); // carica JWT_SECRET in process.env

const router = express.Router();

// POST /api/auth/register — crea un nuovo utente e restituisce subito un token.
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Le preferenze possono arrivare annidate in "preferences" o direttamente nel body: si gestiscono entrambi.
    const pref = req.body && req.body.preferences ? req.body.preferences : {}
    const rawMacroTopics = Array.isArray(pref.macroTopics) ? pref.macroTopics : req.body.macroTopics
    const rawKeywords = Array.isArray(pref.keywords) ? pref.keywords : req.body.keywords

    // Fallback: se non arrivano topic validi, ne assegna uno di default.
    const macroTopics = Array.isArray(rawMacroTopics) && rawMacroTopics.length
      ? rawMacroTopics
      : ['Scienza & Ricerca']

    const keywords = Array.isArray(rawKeywords) ? rawKeywords : []

    // Campi obbligatori mancanti -> 400 Bad Request.
    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        error: 'Email, password e username sono obbligatori.',
      });
    }

    // Validazione formato email.
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Email non valida.',
      });
    }

    // Validazione password: minimo 8 caratteri, almeno 1 maiuscola e 1 numero.
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password deve avere almeno 8 caratteri, 1 maiuscola e 1 numero.',
      });
    }

    // Controlla che email o username non siano già usati ($or = uno dei due).
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email o username gia registrati.',
      });
    }

    // Genera un userId univoco: timestamp + porzione casuale.
    const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    // Crea l'utente: la password verrà hashata dall'hook pre-save di User.js.
    const user = new User({
      userId,
      email,
      password,
      username,
      macroTopics,
      keywords,
    });

    await user.save();

    // Genera token JWT al momento della registrazione per evitare login separato
    const token = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // il token scade dopo 24 ore
    );

    // 201 Created: registrazione riuscita, ritorna il token così il client è già loggato.
    return res.status(201).json({
      success: true,
      message: 'Utente registrato con successo.',
      token,
      userId: user.userId,
      username: user.username,
      email: user.email,
    });
  } catch (err) {
    console.error('[Auth Register Error]', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// POST /api/auth/login — verifica le credenziali e restituisce un token.
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Campi obbligatori.
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e password sono obbligatori.',
      });
    }

    // Cerca l'utente per email.
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato.',
      });
    }

    // Confronta la password in chiaro con l'hash salvato (metodo definito in User.js).
    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({
        success: false,
        error: 'Password errata.',
      });
    }

    // Credenziali valide: genera il token con lo stesso payload della registrazione.
    const token = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      token,
      userId: user.userId,
      username: user.username,
      email: user.email,
    });
  } catch (err) {
    console.error('[Auth Login Error]', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// GET /api/auth/me — rotta protetta: restituisce i dati dell'utente loggato.
// Il middleware "auth" ha già verificato il token e popolato req.user.
router.get('/me', auth, async (req, res) => {
  try {
    // .select('-password') esclude l'hash della password dalla risposta.
    const user = await User.findOne({ userId: req.user.userId }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato.',
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
