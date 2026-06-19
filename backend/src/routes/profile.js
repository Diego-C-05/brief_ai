const express = require('express');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const auth = require('../middleware/auth'); // tutte le rotte qui sono protette

const router = express.Router();

// GET /api/profile — restituisce il profilo completo dell'utente loggato.
router.get('/', auth, async (req, res) => {
  try {
    // Carica l'utente da "users" (senza l'hash della password).
    const user = await User.findOne({ userId: req.user.userId }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Profilo non trovato.',
      });
    }

    // Legge anche il profilo da "user_profiles" (può essere aggiornato dai workflow n8n).
    // .lean() restituisce un oggetto JS semplice invece di un documento Mongoose (più leggero).
    const userProfile = await UserProfile.findOne({ userId: user.userId }).lean();

    // I pesi in "users" sono una Map: la convertiamo in oggetto piano per la risposta JSON.
    const userWeights = user.weights instanceof Map ? Object.fromEntries(user.weights) : user.weights || {};

    // Profilo di base costruito dai dati di "users".
    const profile = {
      userId: user.userId,
      email: user.email,
      username: user.username,
      macroTopics: user.macroTopics || [],
      keywords: user.keywords || [],
      weights: userWeights,
      preferredSources: user.preferredSources || [],
      lastFeedGeneratedAt: user.lastFeedGeneratedAt || null,
      subscriptionPlan: user.subscriptionPlan || 'free',
      subscriptionExpiresAt: user.subscriptionExpiresAt || null,
    };

    // Se esiste il profilo n8n, i suoi valori hanno la precedenza (sono i più aggiornati).
    if (userProfile) {
      profile.macroTopics = userProfile.macroTopics || profile.macroTopics;
      profile.keywords = userProfile.keywords || profile.keywords;
      profile.weights = userProfile.weights || profile.weights;
      profile.preferredSources = userProfile.preferredSources || profile.preferredSources;
      profile.lastFeedGeneratedAt = userProfile.lastFeedGeneratedAt || profile.lastFeedGeneratedAt;
      profile.subscriptionPlan = userProfile.subscriptionPlan || profile.subscriptionPlan;
      profile.subscriptionExpiresAt = userProfile.subscriptionExpiresAt || profile.subscriptionExpiresAt;
    }

    return res.json({ success: true, profile });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// PUT /api/profile — aggiorna le preferenze dell'utente loggato.
router.put('/', auth, async (req, res) => {
  try {
    const { macroTopics, keywords, preferredSources, subscriptionState } = req.body;

    const user = await User.findOne({ userId: req.user.userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato.',
      });
    }

    // Aggiorna solo i campi effettivamente presenti nel body (update parziale).
    if (macroTopics) user.macroTopics = macroTopics;
    if (keywords) user.keywords = keywords;
    if (preferredSources) user.preferredSources = preferredSources;
    if (subscriptionState) {
      // subscriptionState atteso = 'free' o 'pro'.
      user.subscriptionPlan = subscriptionState === 'pro' ? 'pro' : 'free';
      if (subscriptionState === 'pro') {
        // Piano pro: scadenza a 30 giorni da ora.
        user.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      } else {
        user.subscriptionExpiresAt = null;
      }
    }

    user.updatedAt = new Date();
    // save() fa scattare anche l'hook post-save di User.js che sincronizza user_profiles.
    await user.save();

    // Sync esplicito su user_profiles (ridondante con l'hook, ma garantisce l'allineamento).
    // Avvolto in try/catch: se fallisce non blocca la risposta all'utente.
    try {
      await UserProfile.findOneAndUpdate(
        { userId: user.userId },
        {
          macroTopics: user.macroTopics,
          keywords: user.keywords,
          preferredSources: user.preferredSources,
          subscriptionPlan: user.subscriptionPlan,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          updatedAt: new Date(),
        },
        { upsert: true }
      );
    } catch (e) {
      console.warn('[Profile Sync] Impossibile aggiornare user_profiles:', e.message || e);
    }

    // Converte i pesi (Map) in oggetto piano per la risposta.
    const weights = user.weights instanceof Map ? Object.fromEntries(user.weights) : user.weights || {};

    return res.json({
      success: true,
      message: 'Profilo aggiornato con successo.',
      profile: {
        userId: user.userId,
        macroTopics: user.macroTopics,
        keywords: user.keywords,
        weights,
        preferredSources: user.preferredSources,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
