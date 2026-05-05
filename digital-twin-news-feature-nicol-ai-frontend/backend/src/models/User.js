const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Register model early so post-save hook can resolve it safely.
require('./UserProfile');

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    username: { type: String, unique: true, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },

    macroTopics: [String],
    keywords: [String],
    weights: {
      type: Map,
      of: Number,
      default: () =>
        new Map([
          ['tech', 1.0],
          ['news', 1.0],
          ['social', 1.0],
          ['news-it', 1.0],
          ['general', 1.0],
        ]),
    },


    preferredSources: [String],

    lastFeedGeneratedAt: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.pre('save', async function preSave() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.post('save', async function syncUserProfile(doc) {
  const UserProfile = mongoose.model('UserProfile');

  const weightsObject = {};
  if (doc.weights instanceof Map) {
    doc.weights.forEach((value, key) => {
      weightsObject[key] = value;
    });
  }

  await UserProfile.updateOne(
    { userId: doc.userId },
    {
      $set: {
        userId: doc.userId,
        macroTopics: doc.macroTopics || ['Scienza & Ricerca'],
        keywords: doc.keywords || [],
        weights: weightsObject,
        // sentimentPreference removed: we no longer persist a global sentiment preference
        preferredSources: doc.preferredSources || [],
        lastFeedGeneratedAt: doc.lastFeedGeneratedAt || null,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
});

module.exports = mongoose.model('User', userSchema);
