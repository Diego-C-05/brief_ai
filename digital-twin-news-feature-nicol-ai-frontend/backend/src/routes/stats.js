const express = require('express');
const Article = require('../models/Article');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/sentiment', auth, async (req, res) => {
  try {
    const result = await Article.aggregate([
      { $match: { status: 'processed' } },
      { $group: { _id: '$sentiment', count: { $sum: 1 } } },
    ]);

    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/categories', auth, async (req, res) => {
  try {
    const result = await Article.aggregate([
      { $match: { status: 'processed' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/trending', auth, async (req, res) => {
  try {
    const result = await Article.aggregate([
      { $match: { status: 'processed' } },
      { $unwind: '$trendingTopics' },
      { $group: { _id: '$trendingTopics', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/sources', auth, async (req, res) => {
  try {
    const result = await Article.aggregate([
      { $match: { status: 'processed' } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/overview', auth, async (req, res) => {
  try {
    const total = await Article.countDocuments({});
    const processed = await Article.countDocuments({ status: 'processed' });
    const raw = await Article.countDocuments({ status: 'raw' });

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentArticles = await Article.countDocuments({ createdAt: { $gte: last24h } });

    return res.json({
      success: true,
      data: {
        total,
        processed,
        raw,
        recentArticles,
        processingRate: total > 0 ? ((processed / total) * 100).toFixed(1) : 0,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
