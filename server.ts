import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import fs from "fs";

// Levenshtein Distance Implementation
function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .toLowerCase()
    .trim();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Database
  const db = new Database("sghiri.db");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER,
      preferred_exercise TEXT, -- 'words', 'game', 'reading', 'spelling'
      streak INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      word TEXT,
      category TEXT,
      type TEXT, -- 'pronunciation', 'spelling', 'reading'
      language TEXT, -- FR or EN
      score INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  app.use(express.json());

  // User Management
  app.post("/api/users", (req, res) => {
    const { name, age, preferred_exercise } = req.body;
    const stmt = db.prepare("INSERT INTO users (name, age, preferred_exercise) VALUES (?, ?, ?)");
    const info = stmt.run(name, age, preferred_exercise);
    res.json({ id: info.lastInsertRowid, name, age, preferred_exercise });
  });

  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT * FROM users").all();
    res.json(users);
  });

  // API Routes
  app.get("/api/words", (req, res) => {
    const words = [
      // Fruits — FR
      { id: 1,  word: "Pomme",     phonetic: "/ pɔm /",        language: "FR", emoji: "🍎", category: "Fruits" },
      { id: 2,  word: "Banane",    phonetic: "/ ba.nan /",      language: "FR", emoji: "🍌", category: "Fruits" },
      { id: 3,  word: "Orange",    phonetic: "/ ɔ.ʁɑ̃ʒ /",     language: "FR", emoji: "🍊", category: "Fruits" },
      { id: 4,  word: "Raisin",    phonetic: "/ ʁɛ.zɛ̃ /",     language: "FR", emoji: "🍇", category: "Fruits" },
      // Fruits — EN
      { id: 5,  word: "Apple",     phonetic: "/ ˈæp.əl /",     language: "EN", emoji: "🍎", category: "Fruits" },
      { id: 6,  word: "Banana",    phonetic: "/ bəˈnɑː.nə /",  language: "EN", emoji: "🍌", category: "Fruits" },
      { id: 7,  word: "Orange",    phonetic: "/ ˈɒr.ɪndʒ /",   language: "EN", emoji: "🍊", category: "Fruits" },
      { id: 8,  word: "Grapes",    phonetic: "/ ɡreɪps /",     language: "EN", emoji: "🍇", category: "Fruits" },
      // Animals — FR
      { id: 9,  word: "Chat",      phonetic: "/ ʃa /",         language: "FR", emoji: "🐱", category: "Animals" },
      { id: 10, word: "Chien",     phonetic: "/ ʃjɛ̃ /",       language: "FR", emoji: "🐶", category: "Animals" },
      { id: 11, word: "Lapin",     phonetic: "/ la.pɛ̃ /",     language: "FR", emoji: "🐰", category: "Animals" },
      { id: 12, word: "Oiseau",    phonetic: "/ wa.zo /",      language: "FR", emoji: "🐦", category: "Animals" },
      // Animals — EN
      { id: 13, word: "Cat",       phonetic: "/ kæt /",        language: "EN", emoji: "🐱", category: "Animals" },
      { id: 14, word: "Dog",       phonetic: "/ dɒɡ /",        language: "EN", emoji: "🐶", category: "Animals" },
      { id: 15, word: "Rabbit",    phonetic: "/ ˈræb.ɪt /",   language: "EN", emoji: "🐰", category: "Animals" },
      { id: 16, word: "Bird",      phonetic: "/ bɜːd /",       language: "EN", emoji: "🐦", category: "Animals" },
      // Colors — FR
      { id: 17, word: "Rouge",     phonetic: "/ ʁuʒ /",        language: "FR", emoji: "🔴", category: "Colors" },
      { id: 18, word: "Bleu",      phonetic: "/ blø /",        language: "FR", emoji: "🔵", category: "Colors" },
      { id: 19, word: "Vert",      phonetic: "/ vɛʁ /",        language: "FR", emoji: "🟢", category: "Colors" },
      { id: 20, word: "Jaune",     phonetic: "/ ʒon /",        language: "FR", emoji: "🟡", category: "Colors" },
      // Colors — EN
      { id: 21, word: "Red",       phonetic: "/ rɛd /",        language: "EN", emoji: "🔴", category: "Colors" },
      { id: 22, word: "Blue",      phonetic: "/ bluː /",       language: "EN", emoji: "🔵", category: "Colors" },
      { id: 23, word: "Green",     phonetic: "/ ɡriːn /",      language: "EN", emoji: "🟢", category: "Colors" },
      { id: 24, word: "Yellow",    phonetic: "/ ˈjɛl.əʊ /",   language: "EN", emoji: "🟡", category: "Colors" },
      // Home — FR
      { id: 25, word: "Chaise",    phonetic: "/ ʃɛz /",        language: "FR", emoji: "🪑", category: "Home" },
      { id: 26, word: "Table",     phonetic: "/ tabl /",       language: "FR", emoji: "🪵", category: "Home" },
      { id: 27, word: "Lit",       phonetic: "/ li /",         language: "FR", emoji: "🛏️", category: "Home" },
      { id: 28, word: "Fenêtre",   phonetic: "/ fə.nɛtʁ /",   language: "FR", emoji: "🪟", category: "Home" },
      // Home — EN
      { id: 29, word: "Chair",     phonetic: "/ tʃɛər /",      language: "EN", emoji: "🪑", category: "Home" },
      { id: 30, word: "Table",     phonetic: "/ ˈteɪ.bl̩ /",   language: "EN", emoji: "🪵", category: "Home" },
      { id: 31, word: "Bed",       phonetic: "/ bɛd /",        language: "EN", emoji: "🛏️", category: "Home" },
      { id: 32, word: "Window",    phonetic: "/ ˈwɪn.dəʊ /",  language: "EN", emoji: "🪟", category: "Home" },
      // Shapes — FR
      { id: 33, word: "Carré",     phonetic: "/ ka.ʁe /",      language: "FR", emoji: "⬛", category: "Shapes" },
      { id: 34, word: "Cercle",    phonetic: "/ sɛʁkl /",      language: "FR", emoji: "⭕", category: "Shapes" },
      { id: 35, word: "Triangle",  phonetic: "/ tʁi.ɑ̃ɡl /",   language: "FR", emoji: "🔺", category: "Shapes" },
      { id: 36, word: "Étoile",    phonetic: "/ e.twal /",     language: "FR", emoji: "⭐", category: "Shapes" },
      // Shapes — EN
      { id: 37, word: "Square",    phonetic: "/ skwɛər /",     language: "EN", emoji: "⬛", category: "Shapes" },
      { id: 38, word: "Circle",    phonetic: "/ ˈsɜː.kl̩ /",   language: "EN", emoji: "⭕", category: "Shapes" },
      { id: 39, word: "Triangle",  phonetic: "/ ˈtraɪæŋɡl /", language: "EN", emoji: "🔺", category: "Shapes" },
      { id: 40, word: "Star",      phonetic: "/ stɑːr /",      language: "EN", emoji: "⭐", category: "Shapes" },
      // Actions — FR
      { id: 41, word: "Manger",    phonetic: "/ mɑ̃.ʒe /",     language: "FR", emoji: "🍴", category: "Actions" },
      { id: 42, word: "Dormir",    phonetic: "/ dɔʁ.miʁ /",   language: "FR", emoji: "😴", category: "Actions" },
      { id: 43, word: "Courir",    phonetic: "/ ku.ʁiʁ /",    language: "FR", emoji: "🏃", category: "Actions" },
      { id: 44, word: "Sauter",    phonetic: "/ so.te /",      language: "FR", emoji: "🤸", category: "Actions" },
      // Actions — EN
      { id: 45, word: "Eat",       phonetic: "/ iːt /",        language: "EN", emoji: "🍴", category: "Actions" },
      { id: 46, word: "Sleep",     phonetic: "/ sliːp /",      language: "EN", emoji: "😴", category: "Actions" },
      { id: 47, word: "Run",       phonetic: "/ rʌn /",        language: "EN", emoji: "🏃", category: "Actions" },
      { id: 48, word: "Jump",      phonetic: "/ dʒʌmp /",      language: "EN", emoji: "🤸", category: "Actions" },
      // Phrases — FR
      { id: 49, word: "Il fait beau aujourd'hui", phonetic: "It's nice outside today", language: "FR", emoji: "☀️", category: "Phrases" },
      { id: 50, word: "J'aime lire des livres",   phonetic: "I love reading books",    language: "FR", emoji: "📚", category: "Phrases" },
      { id: 51, word: "Bonjour, comment ça va",   phonetic: "Hello, how are you",      language: "FR", emoji: "👋", category: "Phrases" },
      { id: 52, word: "Je m'appelle Léo",          phonetic: "My name is Léo",          language: "FR", emoji: "😊", category: "Phrases" },
      // Phrases — EN
      { id: 53, word: "The sun is shining bright", phonetic: "Le soleil brille fort",  language: "EN", emoji: "☀️", category: "Phrases" },
      { id: 54, word: "I like to play outside",    phonetic: "J'aime jouer dehors",    language: "EN", emoji: "🎈", category: "Phrases" },
      { id: 55, word: "Hello, how are you",        phonetic: "Bonjour, comment ça va", language: "EN", emoji: "👋", category: "Phrases" },
      { id: 56, word: "My name is Leo",            phonetic: "Je m'appelle Léo",        language: "EN", emoji: "😊", category: "Phrases" },
      // Reading — FR
      { id: 57, word: "Le petit chat boit du lait blanc.",      phonetic: "Histoire 1", language: "FR", emoji: "🥛", category: "Reading" },
      { id: 58, word: "Le soleil brille dans le ciel bleu.",    phonetic: "Histoire 2", language: "FR", emoji: "☀️", category: "Reading" },
      { id: 59, word: "Le chien joue avec la balle rouge.",     phonetic: "Histoire 3", language: "FR", emoji: "🎾", category: "Reading" },
      // Reading — EN
      { id: 60, word: "The big red dog runs fast.",             phonetic: "Story 1",    language: "EN", emoji: "🐕", category: "Reading" },
      { id: 61, word: "The sun shines on the blue sea.",        phonetic: "Story 2",    language: "EN", emoji: "🌊", category: "Reading" },
      { id: 62, word: "The cat sits on the soft mat.",          phonetic: "Story 3",    language: "EN", emoji: "🐱", category: "Reading" },
    ];
    res.json(words);
  });

  app.post("/api/evaluate", (req, res) => {
    const { transcript, expectedWord, category, language, type, userId } = req.body;
    
    const normTranscript = normalize(transcript);
    const normExpected = normalize(expectedWord);
    
    let distance = getLevenshteinDistance(normTranscript, normExpected);
    let similarity = 0;

    if (type === 'spelling') {
        // For spelling, we might want to compare character by character more strictly
        // but Levenshtein still works. We can normalize to remove spaces if they spelt letter by letter.
        const cleanTranscript = normTranscript.replace(/\s/g, "");
        const cleanExpected = normExpected.replace(/\s/g, "");
        distance = getLevenshteinDistance(cleanTranscript, cleanExpected);
        const maxLength = Math.max(cleanTranscript.length, cleanExpected.length);
        similarity = maxLength === 0 ? 0 : Math.max(0, 100 - (distance / maxLength) * 100);
    } else {
        const maxLength = Math.max(normTranscript.length, normExpected.length);
        similarity = maxLength === 0 ? 0 : Math.max(0, 100 - (distance / maxLength) * 100);
    }
    
    const stmt = db.prepare("INSERT INTO progress (user_id, word, category, language, type, score) VALUES (?, ?, ?, ?, ?, ?)");
    stmt.run(userId || 1, expectedWord, category || "General", language || "FR", type || "pronunciation", Math.round(similarity));

    res.json({
      score: Math.round(similarity),
      match: similarity > 75,
      transcript: normTranscript
    });
  });

  app.get("/api/progress/:userId", (req, res) => {
    const history = db.prepare(`
      SELECT p.*, u.name as user_name 
      FROM progress p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.user_id = ? 
      ORDER BY p.timestamp DESC LIMIT 50`
    ).all(req.params.userId);
    res.json(history);
  });

  app.get("/api/stats/:userId", (req, res) => {
      const stats = db.prepare("SELECT AVG(score) as avgScore, COUNT(*) as totalAttempts FROM progress WHERE user_id = ?").get(req.params.userId);
      res.json(stats);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
