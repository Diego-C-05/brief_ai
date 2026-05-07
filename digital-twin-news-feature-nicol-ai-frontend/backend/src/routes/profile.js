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

    // Read associated UserProfile (may be created/updated by n8n)
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
      subscriptionPlan: user.subscriptionPlan || 'free',
      subscriptionExpiresAt: user.subscriptionExpiresAt || null,
    };

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

    if (macroTopics) user.macroTopics = macroTopics;
    if (keywords) user.keywords = keywords;
    if (preferredSources) user.preferredSources = preferredSources;
    if (subscriptionState) {
      // subscriptionState expected to be 'free' or 'pro'
      user.subscriptionPlan = subscriptionState === 'pro' ? 'pro' : 'free';
      if (subscriptionState === 'pro') {
        // set expiry to 30 days from now by default
        user.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      } else {
        user.subscriptionExpiresAt = null;
      }
    }

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
          subscriptionPlan: user.subscriptionPlan,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
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
