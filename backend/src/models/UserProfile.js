// Mongoose: ODM per MongoDB. Qui non serve bcrypt: nessuna password, solo preferenze.
const mongoose = require('mongoose');

// Schema della collezione "user_profiles": versione delle preferenze condivisa con n8n.
const userProfileSchema = new mongoose.Schema(
  {
    // Chiave di collegamento con la collezione "users" (stesso userId). Unico = 1 profilo per utente.
    userId: { type: String, unique: true, required: true },
    // Preferenze tematiche (stessi fallback usati nell'hook di User.js).
    macroTopics: { type: [String], default: ['Scienza & Ricerca'] },
    keywords: { type: [String], default: [] },
    // Pesi per topic come OGGETTO piano (in User.js sono una Map: l'hook converte Map -> Object).
    // Formato JSON-friendly comodo per i workflow n8n.
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
    // Fonti preferite.
    preferredSources: { type: [String], default: [] },
    // Dati di abbonamento e feed, replicati da "users" così n8n ha tutto qui.
    subscriptionPlan: { type: String, enum: ['free', 'pro'], default: 'free' },
    subscriptionExpiresAt: Date,
    lastFeedGeneratedAt: Date,
    // Aggiornato a mano negli updateOne (timestamps automatici disattivati sotto).
    updatedAt: { type: Date, default: Date.now },
  },
  // collection: forza il nome esatto "user_profiles" (altrimenti Mongoose userebbe "userprofiles"),
  // perché è la collezione attesa da n8n. timestamps:false -> createdAt/updatedAt non automatici.
  { collection: 'user_profiles', timestamps: false }
);

// Compila ed esporta il modello "UserProfile" (lo stesso nome risolto in User.js).
module.exports = mongoose.model('UserProfile', userProfileSchema);
