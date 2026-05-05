const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function auth(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Accesso negato. Token mancante.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Token non valido o scaduto.',
    });
  }
};
