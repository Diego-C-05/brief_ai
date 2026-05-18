const express = require('express');
const auth = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const UserProfile = require('../models/UserProfile');

const router = express.Router();

// POST /api/feedback — registra o aggiorna il voto dell'utente
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { articleId, vote } = req.body;

    if (!userId || !articleId || (vote !== 1 && vote !== -1)) {
      return res.status(400).json({ success: false, error: 'Parametri mancanti o non validi' });
    }

    const doc = await Feedback.findOneAndUpdate(
      { userId, articleId },
      { $set: { vote } },
      { upsert: true, new: true }
    );

    return res.json({ success: true, feedback: doc });
  } catch (err) {
    console.error('[Feedback Save Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/feedback/save-article — aggiunge articolo salvato nel profilo
router.post('/save-article', auth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { articleId } = req.body;
    if (!userId || !articleId) return res.status(400).json({ success: false, error: 'Parametri mancanti' });

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { $addToSet: { savedArticles: articleId }, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    return res.json({ success: true, profile });
  } catch (err) {
    console.error('[Save Article Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/feedback/unsave-article — rimuove articolo salvato
router.post('/unsave-article', auth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { articleId } = req.body;
    if (!userId || !articleId) return res.status(400).json({ success: false, error: 'Parametri mancanti' });

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { $pull: { savedArticles: articleId }, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    return res.json({ success: true, profile });
  } catch (err) {
    console.error('[Unsave Article Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
