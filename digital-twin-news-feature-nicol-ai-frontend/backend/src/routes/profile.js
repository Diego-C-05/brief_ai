const express = require('express');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Profilo non trovato.',
      });
    }

    // Read associated UserProfile (may be created/updated by n8n) verifica se n8n workflow 3 e 4 funzionano
    const userProfile = await UserProfile.findOne({ userId: user.userId }).lean();

    // Convert weights map (from User model) to plain object
    const userWeights = user.weights instanceof Map ? Object.fromEntries(user.weights) : user.weights || {};

    // Build merged profile: prefer values from userProfile when available
    const profile = {
      userId: user.userId,
      email: user.email,
      username: user.username,
      macroTopics: user.macroTopics || [],
      keywords: user.keywords || [],
      weights: userWeights,
      preferredSources: user.preferredSources || [],
      lastFeedGeneratedAt: user.lastFeedGeneratedAt || null,
    };

    if (userProfile) {
      profile.macroTopics = userProfile.macroTopics || profile.macroTopics;
      profile.keywords = userProfile.keywords || profile.keywords;
      profile.weights = userProfile.weights || profile.weights;
      profile.preferredSources = userProfile.preferredSources || profile.preferredSources;
      profile.lastFeedGeneratedAt = userProfile.lastFeedGeneratedAt || profile.lastFeedGeneratedAt;
    }

    return res.json({ success: true, profile });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

router.put('/', auth, async (req, res) => {
  try {
    const { macroTopics, keywords, preferredSources } = req.body;

    const user = await User.findOne({ userId: req.user.userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato.',
      });
    }

    if (macroTopics) user.macroTopics = macroTopics;
    if (keywords) user.keywords = keywords;
    if (preferredSources) user.preferredSources = preferredSources;

    user.updatedAt = new Date();
    await user.save();

    // Sync su user_profiles in modo che n8n e backend siano allineati
    try {
      await UserProfile.findOneAndUpdate(
        { userId: user.userId },
        {
          macroTopics: user.macroTopics,
          keywords: user.keywords,
          preferredSources: user.preferredSources,
          updatedAt: new Date(),
        },
        { upsert: true }
      );
    } catch (e) {
      console.warn('[Profile Sync] Impossibile aggiornare user_profiles:', e.message || e);
    }

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
