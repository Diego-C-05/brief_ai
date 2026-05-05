const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

require('dotenv').config();

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Support payloads that send preferences nested under `preferences` (frontend)
    // or as top-level fields for backwards compatibility.
    const pref = req.body && req.body.preferences ? req.body.preferences : {}
    const rawMacroTopics = Array.isArray(pref.macroTopics) ? pref.macroTopics : req.body.macroTopics
    const rawKeywords = Array.isArray(pref.keywords) ? pref.keywords : req.body.keywords

    const macroTopics = Array.isArray(rawMacroTopics) && rawMacroTopics.length
      ? rawMacroTopics
      : ['Scienza & Ricerca']

    const keywords = Array.isArray(rawKeywords) ? rawKeywords : []

    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        error: 'Email, password e username sono obbligatori.',
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email o username gia registrati.',
      });
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

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
      { expiresIn: '24h' }
    );

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

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e password sono obbligatori.',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato.',
      });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({
        success: false,
        error: 'Password errata.',
      });
    }

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

router.get('/me', auth, async (req, res) => {
  try {
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
