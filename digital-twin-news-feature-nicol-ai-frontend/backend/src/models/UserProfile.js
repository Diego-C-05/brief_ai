const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, unique: true, required: true },
    macroTopics: { type: [String], default: ['Scienza & Ricerca'] },
    keywords: { type: [String], default: [] },
    weights: {
      type: Object,
      default: {
        'Intelligenza Artificiale': 1.0,
        'Cybersecurity': 1.0,
        'Business & Finanza': 1.0,
        'Politica & Geopolitica': 1.0,
        'Startup & Innovazione': 1.0,
        'Software & Sviluppo': 1.0,
        'Scienza & Ricerca': 1.0,
        'Energia & Ambiente': 1.0,
        'Economia & Mercati': 1.0,
        'Social Media & Cultura': 1.0,
        'Salute & Medicina': 1.0,
        'Trasporti & Mobilità': 1.0,
      }
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
