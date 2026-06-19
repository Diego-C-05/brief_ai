// Libreria per creare e verificare i token JWT (JSON Web Token)
const jwt = require('jsonwebtoken');

// Carica le variabili d'ambiente dal file .env in process.env (qui serve JWT_SECRET)
require('dotenv').config();

// Middleware Express che protegge le rotte: verifica il token di autenticazione.
// req = richiesta, res = risposta, next = passa al prossimo handler della catena.
module.exports = function auth(req, res, next) {

  // Legge l'header "Authorization" (formato "Bearer <token>") e isola il token puro.
  // L'optional chaining (?.) evita errori se l'header è assente.
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Nessun token presente: l'utente non è autenticato -> blocca con 401.
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Accesso negato. Token mancante.',
    });
  }

  try {

    // Verifica firma e scadenza del token con la chiave segreta.
    // Se valido, restituisce il payload decodificato (es. { id, email, iat, exp }).
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Salva i dati dell'utente su req, così le rotte successive sanno chi è autenticato.
    req.user = decoded;

    // Token valido: prosegue con il prossimo middleware/handler.
    return next();
  } catch (err) {

    // Token manomesso, firma errata o scaduto -> accesso negato con 401.
    return res.status(401).json({
      success: false,
      error: 'Token non valido o scaduto.',
    });
  }
};
