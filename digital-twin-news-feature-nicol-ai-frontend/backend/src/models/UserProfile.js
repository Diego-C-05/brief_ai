const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, unique: true, required: true },
    macroTopics: { type: [String], default: ['Scienza & Ricerca'] },
    keywords: { type: [String], default: [] },
    weights: {
      type: Object,
      default: {
        tech: 1.0,
        news: 1.0,
        social: 1.0,
        'news-it': 1.0,
        general: 1.0,
      },//in user uso ma e qui object forse inutile
    },
    preferredSources: { type: [String], default: [] },
    subscriptionPlan: { type: String, enum: ['free', 'pro'], default: 'free' },
    subscriptionExpiresAt: Date,
    lastFeedGeneratedAt: Date,
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'user_profiles', timestamps: false }
);

module.exports = mongoose.model('UserProfile', userProfileSchema);
