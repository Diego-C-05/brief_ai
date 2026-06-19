// Mongoose: ODM per definire schemi e modelli su MongoDB
const mongoose = require('mongoose');

// bcryptjs: per fare l'hash delle password (mai salvate in chiaro)
const bcrypt = require('bcryptjs');

// Registra il modello UserProfile prima dei hook, così l'hook post('save')
// può risolverlo con mongoose.model('UserProfile') senza errori di ordine di caricamento.
require('./UserProfile');

// Schema dell'utente: struttura che ogni documento in collezione "users" deve rispettare.
const userSchema = new mongoose.Schema(
  {
    // Campi identificativi: obbligatori e univoci (no duplicati tra utenti).
    userId: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true }, // salvata già hashata (vedi pre-save)
    username: { type: String, unique: true, required: true },
    // Ruolo vincolato a 'admin' o 'user'; finisce nel payload del token JWT.
    role: { type: String, enum: ['admin', 'user'], default: 'user' },

    // Preferenze tematiche usate per personalizzare il feed.
    macroTopics: [String],
    keywords: [String],
    // Pesi per topic (chiave = topic, valore = peso numerico), aggiornati dal feedback utente.
    weights: {
      type: Map,
      of: Number,
      // default come funzione: ogni nuovo utente riceve la PROPRIA Map (non condivisa),
      // con tutti i 12 topic inizializzati a peso 1.0.
      default: () => {
        const MACRO_TOPICS = [
          'Intelligenza Artificiale', 'Cybersecurity', 'Business & Finanza',
          'Politica & Geopolitica', 'Startup & Innovazione', 'Software & Sviluppo',
          'Scienza & Ricerca', 'Energia & Ambiente', 'Economia & Mercati',
          'Social Media & Cultura', 'Salute & Medicina', 'Trasporti & Mobilità'
        ];
        return new Map(MACRO_TOPICS.map(t => [t, 1.0]));
      }
    },


    // Fonti preferite (es. testate giornalistiche).
    preferredSources: [String],

    // Dati su feed e abbonamento.
    lastFeedGeneratedAt: Date,
    subscriptionPlan: { type: String, enum: ['free', 'pro'], default: 'free' },
    subscriptionExpiresAt: Date,

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  // timestamps: Mongoose gestisce createdAt/updatedAt automaticamente.
  { timestamps: true }
);

// Hook PRIMA del salvataggio: fa l'hash della password solo se è stata modificata
// (evita di ri-hashare una password già cifrata quando si aggiornano altri campi).
userSchema.pre('save', async function preSave() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10); // 10 = salt rounds (costo)
});

// Metodo d'istanza: confronta una password in chiaro con l'hash salvato (usato al login).
userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Hook DOPO il salvataggio: tiene allineata la collezione "user_profiles"
// (letta/scritta anche dai workflow n8n) con i dati dell'utente.
userSchema.post('save', async function syncUserProfile(doc) {
  const UserProfile = mongoose.model('UserProfile');

  // Converte la Map dei pesi in oggetto piano { topic: peso }, formato atteso da UserProfile.
  const weightsObject = {};
  if (doc.weights instanceof Map) {
    doc.weights.forEach((value, key) => {
      weightsObject[key] = value;
    });
  }

  // upsert: crea il profilo se non esiste, altrimenti lo aggiorna.
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
          subscriptionPlan: doc.subscriptionPlan || 'free',
          subscriptionExpiresAt: doc.subscriptionExpiresAt || null,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
});

// Compila lo schema nel modello "User" e lo esporta per l'uso nelle rotte.
module.exports = mongoose.model('User', userSchema);
