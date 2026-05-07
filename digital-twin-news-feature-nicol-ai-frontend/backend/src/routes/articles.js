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
      .select('-__v');

    // Helper to strip anchor tags and plain URLs from text fields
    const stripLinks = (text) => {
      if (!text || typeof text !== 'string') return text;
      // remove HTML anchor tags but keep inner text
      let s = text.replace(/<a[^>]*>(.*?)<\/a>/gi, '$1');
      // remove markdown links [text](url) -> keep text
      s = s.replace(/\[([^\]]+)\]\((?:[^)]+)\)/g, '$1');
      // remove plain URLs
      s = s.replace(/https?:\/\/[^\s\"'<>]+/gi, '');
      return s;
    };

    // For processed articles, strip links from `content` and `summary`
    const sanitizedArticles = articles.map((a) => {
      if (a.status === 'processed') {
        const doc = a.toObject ? a.toObject() : a;
        doc.content = stripLinks(doc.content);
        doc.summary = stripLinks(doc.summary);
        return doc;
      }
      return a;
    });

    const total = await Article.countDocuments(filter);

    return res.json({
      success: true,
      articles: sanitizedArticles,
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

router.get('/:uniqueKey', auth, async (req, res) => {
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
