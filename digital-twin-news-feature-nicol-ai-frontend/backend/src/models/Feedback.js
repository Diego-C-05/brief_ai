const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    articleId: { type: String, required: true, index: true },
    vote: { type: Number, enum: [1, -1], required: true },
  },
  { timestamps: true }
);

feedbackSchema.index({ userId: 1, articleId: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
