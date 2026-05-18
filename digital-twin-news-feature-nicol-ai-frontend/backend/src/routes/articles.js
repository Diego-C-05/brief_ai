const express = require('express');
const Article = require('../models/Article');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const {
      category,
      sentiment,
      source,
      status = 'processed',
      limit = 50,
      page = 1,
      search,
    } = req.query;

    const filter = { status };

    if (category) filter.category = category;
    if (sentiment) filter.sentiment = sentiment;
    if (source) filter.source = source;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
      ];
    }

    const parsedLimit = Number.parseInt(limit, 10) || 50;
    const parsedPage = Number.parseInt(page, 10) || 1;

    const articles = await Article.find(filter)
      .sort({ pubDate: -1 })
      .limit(parsedLimit)
      .skip((parsedPage - 1) * parsedLimit)
      .select('-__v'); // campo automatico di mongoose da evitare

    const total = await Article.countDocuments(filter); // per impaginazione frontend

    return res.json({
      success: true,
      articles,
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    });
  } catch (err) {
    console.error('[Articles List Error]', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

router.get('/:uniqueKey', auth, async (req, res) => { // funzione esistente ma non usata quindi inutile
  try {
    const article = await Article.findOne({ uniqueKey: req.params.uniqueKey });

    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Articolo non trovato.',
      });
    }

    return res.json({
      success: true,
      article,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
