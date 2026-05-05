const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    uniqueKey: { type: String, unique: true, required: true },
    title: { type: String, required: true },
    url: String,
    pubDate: String,
    source: String,
    category: String,
    content: String,

    summary: String,
    sentiment: {
      type: String,
      enum: ['Positive', 'Neutral', 'Negative', null],
      default: null,
    },
    entities: [String],
    trendingTopics: [String],
    macroTopics: [String],

    status: { type: String, enum: ['raw', 'processed'], default: 'raw' },
    aiProcessed: { type: Boolean, default: false },
    aiError: String,
    processedAt: Date,
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Article', articleSchema);
