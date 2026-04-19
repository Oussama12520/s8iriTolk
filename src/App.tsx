import { useState, useEffect, useRef, FormEvent } from "react";
import { Mic, Volume2, ArrowRight, Star, Home, CheckCircle2, XCircle, ChevronLeft, Award, UserPlus, Users, LogOut, SpellCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Word {
  id: number;
  word: string;
  phonetic: string;
  language: string;
  emoji: string;
  category: string;
}

interface User {
  id: number;
  name: string;
  age: number;
  preferred_exercise: string;
  streak: number;
}

interface ProgressRecord {
  id: number;
  user_id: number;
  word: string;
  category: string;
  type: string;
  language: string;
  score: number;
  timestamp: string;
}

type View = "AUTH" | "PROFILE_SELECT" | "CATEGORIES" | "GAME" | "PROGRESS" | "SPELLING";

// --- Static Word Data ---
const ALL_WORDS: Word[] = [
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

// --- Evaluation Logic ---
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

function evaluateSpeech(transcript: string, expectedWord: string, type: string) {
  const normTranscript = normalize(transcript);
  const normExpected = normalize(expectedWord);
  
  let distance = getLevenshteinDistance(normTranscript, normExpected);
  let similarity = 0;

  if (type === 'spelling') {
      const cleanTranscript = normTranscript.replace(/\s/g, "");
      const cleanExpected = normExpected.replace(/\s/g, "");
      distance = getLevenshteinDistance(cleanTranscript, cleanExpected);
      const maxLength = Math.max(cleanTranscript.length, cleanExpected.length);
      similarity = maxLength === 0 ? 0 : Math.max(0, 100 - (distance / maxLength) * 100);
  } else {
      const maxLength = Math.max(normTranscript.length, normExpected.length);
      similarity = maxLength === 0 ? 0 : Math.max(0, 100 - (distance / maxLength) * 100);
  }
  
  return {
    score: Math.round(similarity),
    match: similarity > 75,
    transcript: normTranscript
  };
}

// --- LocalStorage DAO ---
const DB = {
  getUsers: (): User[] => JSON.parse(localStorage.getItem('st_users') || '[]'),
  addUser: (name: string, age: number, preferred_exercise: string): User => {
    const users = DB.getUsers();
    const newUser: User = { id: Date.now(), name, age, preferred_exercise, streak: 0 };
    localStorage.setItem('st_users', JSON.stringify([...users, newUser]));
    return newUser;
  },
  getProgress: (userId: number): ProgressRecord[] => {
    const all = JSON.parse(localStorage.getItem('st_progress') || '[]') as ProgressRecord[];
    return all.filter(p => p.user_id === userId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50);
  },
  addProgress: (userId: number, word: string, category: string, language: string, type: string, score: number) => {
    const all = JSON.parse(localStorage.getItem('st_progress') || '[]') as ProgressRecord[];
    all.push({
      id: Date.now(),
      user_id: userId,
      word,
      category,
      type,
      language,
      score,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('st_progress', JSON.stringify(all));
  },
  getStats: (userId: number) => {
    const all = JSON.parse(localStorage.getItem('st_progress') || '[]') as ProgressRecord[];
    const userProgress = all.filter(p => p.user_id === userId);
    if (userProgress.length === 0) return { avgScore: 0, totalAttempts: 0 };
    const avgScore = userProgress.reduce((sum, p) => sum + p.score, 0) / userProgress.length;
    return { avgScore, totalAttempts: userProgress.length };
  }
};


export default function App() {
  const [view, setView] = useState<View>("AUTH");
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<{ score: number; match: boolean; transcript: string } | null>(null);
  const [lang, setLang] = useState("FR");
  const [accuracy, setAccuracy] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [history, setHistory] = useState<ProgressRecord[]>([]);
  const [micError, setMicError] = useState<string | null>(null);

  // Auth/Signup State
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState<number | "">(4);
  const [newPref, setNewPref] = useState("words");

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setUsers(DB.getUsers());
  }, []);

  useEffect(() => {
    if (user && selectedCategory) {
      setWords(ALL_WORDS.filter((w) => w.language === lang && w.category === selectedCategory));
      setCurrentIndex(0);
      setFeedback(null);
    }
  }, [lang, selectedCategory, user]);

  useEffect(() => {
    if (user) {
      fetchStats();
      if (view === "PROGRESS") fetchHistory();
    }
  }, [feedback, view, user]);

  const fetchStats = () => {
    if (!user) return;
    const stats = DB.getStats(user.id);
    setAccuracy(stats.avgScore);
    setAttempts(stats.totalAttempts);
  };

  const fetchHistory = () => {
    if (!user) return;
    setHistory(DB.getProgress(user.id));
  };

  const currentWord = words.length > 0 ? words[currentIndex % words.length] : null;

  const handleSignup = (e: FormEvent) => {
    e.preventDefault();
    const ageValue = newAge === "" ? 4 : newAge;
    const newUser = DB.addUser(newName, ageValue, newPref);
    setUsers(DB.getUsers());
    setUser(newUser);
    setView("CATEGORIES");
  };

  const startRecording = (type: string = "pronunciation") => {
    setMicError(null);
    if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch(e) {}
    }
    
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setMicError("Reconnaissance vocale non supportée sur ce navigateur.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = lang === "FR" ? "fr-FR" : "en-US";
    recognitionRef.current.interimResults = false;
    recognitionRef.current.maxAlternatives = 1;

    recognitionRef.current.onstart = () => {
      setIsRecording(true);
      setMicError(null);
      console.log("Speech recognition started");
    };
    
    recognitionRef.current.onend = () => {
      setIsRecording(false);
      console.log("Speech recognition ended");
    };
    
    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
      if (event.error === 'not-allowed') {
        setMicError("Microphone bloqué. Autorisez le micro dans la barre d'adresse.");
      } else if (event.error === 'no-speech') {
        setMicError("Aucun son détecté. Parlez plus fort !");
      } else {
        setMicError("Erreur micro: " + event.error);
      }
    };

    recognitionRef.current.onresult = async (event: any) => {
      if (!currentWord) {
        setIsRecording(false);
        return;
      }
      
      const transcript = event.results[0][0].transcript;
      console.log("Transcript received:", transcript);
      
      const result = evaluateSpeech(transcript, currentWord.word, type);
      
      // Save progress to local storage
      if (user) {
         DB.addProgress(user.id, currentWord.word, selectedCategory || "General", lang, type, result.score);
      }
      
      setFeedback(result);
    };

    try {
      recognitionRef.current.start();
      setIsRecording(true); 
    } catch (err) {
      console.error("Failed to start recognition:", err);
      setMicError("Impossible de lancer le micro. Essayez de rafraîchir la page.");
      setIsRecording(false);
    }
  };

  const playAudio = () => {
    if (!currentWord) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(currentWord.word);
    utterance.lang = lang === "FR" ? "fr-FR" : "en-US";
    utterance.rate = 0.85; 
    utterance.pitch = 1.1; 
    
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-[768px] mx-auto sm:border-8 border-4 border-app-accent overflow-hidden bg-app-bg text-app-text font-sans shadow-2xl relative">
      {/* Dynamic Header */}
      {view !== "AUTH" && view !== "PROFILE_SELECT" && (
        <header className="h-14 sm:h-20 px-4 sm:px-8 flex justify-between items-center border-b-2 border-app-border bg-white shrink-0 z-20">
            <div 
            onClick={() => setView("CATEGORIES")}
            className="font-serif text-lg sm:text-2xl font-black italic text-app-primary tracking-tighter cursor-pointer"
            >
            SghiriTalk.
            </div>
            <nav className="flex gap-2">
            <button 
                onClick={() => setView("CATEGORIES")}
                className={`p-2 rounded-xl transition-all ${view === "CATEGORIES" ? "bg-app-accent text-white" : "hover:bg-gray-50 text-gray-400"}`}
            >
                <Home size={18} />
            </button>
            <button 
                onClick={() => setView("PROGRESS")}
                className={`p-2 rounded-xl transition-all ${view === "PROGRESS" ? "bg-app-accent text-white" : "hover:bg-gray-50 text-gray-400"}`}
            >
                <Award size={18} />
            </button>
            <button 
                onClick={() => setView("PROFILE_SELECT")}
                className="p-2 rounded-xl hover:bg-gray-50 text-gray-400"
            >
                <Users size={18} />
            </button>
            </nav>
        </header>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Mascot */}
        {view !== "AUTH" && view !== "PROFILE_SELECT" && (
          <aside className="hidden sm:flex w-48 md:w-56 border-r-2 border-app-border bg-white/40 p-4 md:p-8 flex-col items-center shrink-0">
            <motion.div 
              animate={{ 
                y: [0, -8, 0],
                scale: isRecording ? [1, 1.1, 1] : 1
              }}
              transition={{ repeat: Infinity, duration: isRecording ? 0.5 : 2, ease: "easeInOut" }}
              className={`w-[110px] h-[110px] rounded-full mascot-shadow flex items-center justify-center mb-6 relative border-4 border-white transition-colors ${feedback ? (feedback.match ? 'bg-app-secondary' : 'bg-red-400') : 'bg-app-accent'}`}
            >
              <div className="flex gap-4">
                <motion.div 
                  animate={{ height: feedback ? (feedback.match ? 4 : 8) : [10, 10, 0, 10, 10] }}
                  transition={{ repeat: Infinity, duration: 4, times: [0, 0.9, 0.95, 1] }}
                  className="w-3 bg-black rounded-full" 
                />
                <motion.div 
                  animate={{ height: feedback ? (feedback.match ? 4 : 8) : [10, 10, 0, 10, 10] }}
                  transition={{ repeat: Infinity, duration: 4, times: [0, 0.9, 0.95, 1] }}
                  className="w-3 bg-black rounded-full" 
                />
              </div>
              <motion.div 
                animate={{
                  width: feedback ? (feedback.match ? 30 : 20) : 24,
                  height: feedback ? (feedback.match ? 15 : 6) : 10,
                  borderRadius: feedback ? (feedback.match ? "0 0 50px 50px" : "50px 50px 0 0") : "50%",
                  bottom: feedback ? (feedback.match ? 25 : 30) : 32
                }}
                className="absolute bg-black"
              />
            </motion.div>

            <motion.div 
              key={selectedCategory || "none"}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-app-primary text-white px-3 py-1.5 rounded-lg font-extrabold text-[10px] mb-8 uppercase tracking-wider text-center"
            >
              {selectedCategory ? `Module: ${selectedCategory}` : "Pick a module!"}
            </motion.div>

            <div className="text-center mb-10">
              <div className="text-[10px] uppercase opacity-50 mb-1 leading-none font-black">Daily Score</div>
              <div className="text-3xl font-black text-app-primary leading-tight">{Math.round(accuracy || 0)}%</div>
            </div>

            <div className="flex gap-1 mt-auto">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star 
                  key={s} 
                  size={16} 
                  fill={s <= Math.floor((attempts || 0) / 2) ? "var(--color-app-accent)" : "none"}
                  className={s <= Math.floor((attempts || 0) / 2) ? "text-app-accent" : "text-app-border"}
                />
              ))}
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative bg-white/10">
          <AnimatePresence mode="wait">
            {view === "AUTH" && (
              <motion.div 
                key="auth"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6 sm:p-10 flex flex-col items-center justify-center min-h-full bg-white"
              >
                <div className="font-serif text-4xl sm:text-5xl font-black italic text-app-primary mb-6 sm:mb-8 tracking-tighter">SghiriTalk.</div>
                <div className="w-full max-w-sm">
                    <h2 className="text-2xl font-bold mb-6 text-center">Parent Setup</h2>
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Child's Name</label>
                            <input 
                                required
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full bg-app-bg border-2 border-app-border rounded-xl p-3 focus:border-app-primary outline-none transition-all font-bold"
                                placeholder="e.g. Leo Martin"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Age</label>
                                <input 
                                    type="number"
                                    min="3" max="12"
                                    value={newAge === "" ? "" : String(newAge)}
                                    onChange={(e) => {
                                        const val = e.target.value === "" ? "" : parseInt(e.target.value);
                                        setNewAge(val);
                                    }}
                                    className="w-full bg-app-bg border-2 border-app-border rounded-xl p-3 focus:border-app-primary outline-none transition-all font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Favorite Mode</label>
                                <select 
                                    value={newPref}
                                    onChange={(e) => setNewPref(e.target.value)}
                                    className="w-full bg-app-bg border-2 border-app-border rounded-xl p-3 focus:border-app-primary outline-none transition-all font-bold appearance-none"
                                >
                                    <option value="words">Words</option>
                                    <option value="spelling">Spelling</option>
                                    <option value="reading">Reading</option>
                                </select>
                            </div>
                        </div>
                        <button className="w-full bg-app-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest mt-4 shadow-lg active:scale-95 transition-all">
                            Start learning!
                        </button>
                    </form>
                    <div className="mt-8 pt-8 border-t-2 border-app-border text-center">
                        <button onClick={() => setView("PROFILE_SELECT")} className="text-app-secondary font-black text-xs uppercase tracking-widest flex items-center gap-2 mx-auto">
                            <Users size={16} /> Already have a profile?
                        </button>
                    </div>
                </div>
              </motion.div>
            )}

            {view === "PROFILE_SELECT" && (
                <motion.div 
                    key="profiles"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-6 sm:p-10 flex flex-col items-center justify-center min-h-full"
                >
                    <h2 className="font-serif text-3xl sm:text-4xl font-black mb-6 sm:mb-10 italic">Who is playing?</h2>
                    <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-lg">
                        {users.map((u) => (
                            <button 
                                key={u.id}
                                onClick={() => { setUser(u); setView("CATEGORIES"); }}
                                className="bg-white border-4 border-app-border p-5 sm:p-8 rounded-[32px] sm:rounded-[40px] word-card-shadow hover:border-app-secondary transition-all flex flex-col items-center group"
                            >
                                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-app-accent rounded-full mb-3 sm:mb-4 group-hover:scale-110 transition-transform flex items-center justify-center text-2xl sm:text-3xl">
                                    {u.age < 6 ? "🧸" : "🎨"}
                                </div>
                                <div className="font-black text-base sm:text-xl">{u.name}</div>
                                <div className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-400">{u.age} years old</div>
                            </button>
                        ))}
                        <button 
                            onClick={() => setView("AUTH")}
                            className="bg-white border-4 border-dashed border-app-border p-5 sm:p-8 rounded-[32px] sm:rounded-[40px] hover:border-app-primary transition-all flex flex-col items-center justify-center group"
                        >
                            <UserPlus size={40} className="text-app-border mb-4 group-hover:text-app-primary transition-colors" />
                            <div className="font-black text-sm uppercase tracking-widest text-gray-400">Add profile</div>
                        </button>
                    </div>
                </motion.div>
            )}

            {view === "CATEGORIES" && (
              <motion.div 
                key="cats"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 sm:p-8 pb-16 sm:pb-20"
              >
                <div className="flex justify-between items-start mb-6 sm:mb-10">
                    <div>
                        <h2 className="font-serif text-2xl sm:text-4xl font-black text-app-text mb-1 sm:mb-2 italic">SghiriTalk Adventure</h2>
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Hello, {user?.name}! Pick a module</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-app-accent px-4 py-2 rounded-2xl flex items-center gap-2">
                            <Star size={16} fill="white" className="text-white" />
                            <span className="font-black text-white">{user?.streak} Days</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
                  {["Fruits", "Animals", "Colors", "Home", "Shapes", "Actions", "Phrases", "Reading"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                          setSelectedCategory(cat);
                          setView("GAME");
                      }}
                      className="bg-white border-2 border-app-border p-3 sm:p-5 rounded-[18px] sm:rounded-[24px] flex flex-col items-center word-card-shadow hover:border-app-primary transition-all group"
                    >
                      <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                          {cat === "Fruits" ? "🍎" : cat === "Animals" ? "🐱" : cat === "Colors" ? "🎨" : cat === "Home" ? "🏠" : cat === "Shapes" ? "📐" : cat === "Actions" ? "🏃" : cat === "Phrases" ? "💬" : "📖"}
                      </div>
                      <h3 className="font-serif font-black text-sm sm:text-lg">{cat}</h3>
                    </button>
                  ))}
                  <button 
                    onClick={() => { setView("SPELLING"); if (!selectedCategory) setSelectedCategory("Fruits"); }}
                    className="col-span-2 bg-app-secondary/10 border-2 border-app-secondary p-5 rounded-[24px] flex items-center justify-between word-card-shadow hover:bg-app-secondary/20 transition-all font-black text-app-secondary uppercase tracking-widest"
                  >
                    <div className="flex items-center gap-4">
                        <SpellCheck /> <span>Spelling Mode</span>
                    </div>
                    <ArrowRight />
                  </button>
                </div>
              </motion.div>
            )}

            {(view === "GAME" || view === "SPELLING") && (
              <motion.div 
                key="game"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-4 sm:p-10 pt-3 sm:pt-4 flex flex-col items-center h-full"
              >
                <button 
                  onClick={() => setView("CATEGORIES")}
                  className="self-start flex items-center gap-2 text-[10px] font-black uppercase text-app-text/40 hover:text-app-primary transition-colors mb-6"
                >
                  <ChevronLeft size={16} /> Change Module
                </button>

                <div className="flex bg-white border-2 border-app-border p-1 rounded-full mb-4 sm:mb-8">
                  <button onClick={() => { setLang("FR"); setFeedback(null); setMicError(null); }} className={`px-5 py-1.5 rounded-full text-[10px] font-black transition-all ${lang === "FR" ? "bg-app-secondary text-white shadow-md" : "text-app-text"}`}>FRANÇAIS</button>
                  <button onClick={() => { setLang("EN"); setFeedback(null); setMicError(null); }} className={`px-5 py-1.5 rounded-full text-[10px] font-black transition-all ${lang === "EN" ? "bg-app-secondary text-white shadow-md" : "text-app-text"}`}>ENGLISH</button>
                </div>

                <div className="w-full h-48 sm:h-72 bg-white rounded-[28px] sm:rounded-[40px] word-card-shadow border-2 border-app-border flex flex-col items-center justify-center relative overflow-hidden p-4 sm:p-6 mb-4 sm:mb-8">
                  {currentWord ? (
                    <>
                      <div className="absolute top-4 left-4 opacity-5 text-9xl pointer-events-none">{currentWord.emoji}</div>
                      <motion.div 
                        key={currentWord.id}
                        initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                        className="font-serif text-4xl sm:text-6xl font-black text-app-text mb-2 text-center"
                      >
                        {view === "SPELLING" ? currentWord.word.split('').join(' ') : currentWord.word}
                      </motion.div>
                      <div className="font-sans text-sm text-gray-400 tracking-[0.2em] uppercase font-bold">{currentWord.phonetic}</div>
                      {feedback && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`mt-6 font-black text-sm uppercase flex items-center gap-2 ${feedback.match ? "text-app-secondary" : "text-app-primary"}`}>
                          {feedback.match ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                          <span className="text-xl">{feedback.match ? "Bravo!" : "Oups!"} {feedback.score}%</span>
                        </motion.div>
                      )}
                    </>
                  ) : <div className="opacity-20 font-black animate-pulse uppercase">Searching words...</div>}
                </div>

                <div className="flex gap-4 sm:gap-6 items-center">
                  <button onClick={playAudio} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-app-secondary text-white flex items-center justify-center btn-push"><Volume2 size={22} /></button>
                  <button onClick={() => startRecording(view === "SPELLING" ? "spelling" : "pronunciation")} disabled={isRecording} className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full flex items-center justify-center btn-push shadow-xl ${isRecording ? "bg-red-500" : "bg-app-primary"} text-white relative`}>
                    <Mic size={30} className={isRecording ? "animate-bounce" : ""} />
                    {isRecording && (
                        <motion.div 
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="absolute inset-0 bg-red-500 rounded-full"
                        />
                    )}
                  </button>
                  <button onClick={() => { setCurrentIndex(prev => prev + 1); setFeedback(null); setMicError(null); }} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center btn-push"><ArrowRight size={22} /></button>
                </div>

                <div className="mt-4 flex flex-col items-center gap-2 text-center">
                    <p className={`font-black text-xs uppercase tracking-widest ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
                        {isRecording ? "Listening... Speak now!" : "Tap the mic to start"}
                    </p>
                    <p className="italic text-gray-400 text-[10px] font-black uppercase tracking-wider">
                        {view === "SPELLING" ? "Spell the word out loud!" : `Say "${currentWord?.word || '...'}"`}
                    </p>
                </div>
                {micError && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 px-4 py-2 bg-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase border-2 border-red-200">
                        ⚠️ {micError}
                    </motion.div>
                )}
                {feedback && !feedback.match && !micError && (
                    <div className="mt-4 px-4 py-1 bg-app-primary/5 rounded-full text-[10px] font-black text-app-primary uppercase">I heard: "{feedback.transcript}"</div>
                )}

                {/* Micro Diagnostics Indicator */}
                <div className="mt-auto mb-2 sm:mb-4 w-full px-3 sm:px-6 py-2 sm:py-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl sm:rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${("webkitSpeechRecognition" in window || "SpeechRecognition" in window) ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Micro Engine: {("webkitSpeechRecognition" in window || "SpeechRecognition" in window) ? 'OK' : 'Error'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <Star size={10} className="text-app-accent" fill="var(--color-app-accent)" />
                         <span className="text-[9px] font-black uppercase text-gray-400">Ready for {user?.name}</span>
                    </div>
                </div>
              </motion.div>
            )}

            {view === "PROGRESS" && (
                <motion.div 
                    key="progress"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-4 sm:p-8"
                >
                     <div className="flex justify-between items-center mb-5 sm:mb-8">
                        <div>
                            <h2 className="font-serif text-2xl sm:text-4xl font-black text-app-text mb-1 italic">{user?.name}'s Book</h2>
                            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Learning timeline</p>
                        </div>
                        <div className="bg-app-accent p-3 sm:p-4 rounded-[24px] sm:rounded-[32px] flex items-center gap-2 sm:gap-3 shadow-lg">
                             <Award className="text-white" size={24} />
                             <div className="text-right">
                                <div className="text-[10px] font-black uppercase opacity-60 text-white">Avg Score</div>
                                <div className="text-xl font-black text-white leading-none">{Math.round(accuracy || 0)}%</div>
                             </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {history.length > 0 ? history.map((record) => (
                            <div key={record.id} className="bg-white border-2 border-app-border p-4 rounded-3xl flex items-center justify-between word-card-shadow translate-y-0 hover:-translate-y-1 transition-transform">
                                <div className="flex items-center gap-4">
                                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${record.score > 75 ? 'bg-green-50' : 'bg-red-50'}`}>
                                        {record.type === 'spelling' ? '🔤' : record.category === 'Fruits' ? '🍎' : record.category === 'Animals' ? '🐱' : record.category === 'Colors' ? '🎨' : record.category === 'Reading' ? '📖' : '✏️'}
                                     </div>
                                     <div>
                                        <div className="font-black text-sm">{record.word}</div>
                                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{record.type} • {record.language} • {record.category}</div>
                                     </div>
                                </div>
                                <div className="text-right">
                                     <div className={`font-black text-xl ${record.score > 75 ? 'text-app-secondary' : 'text-app-primary'}`}>{record.score}%</div>
                                     <div className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">{new Date(record.timestamp).toLocaleString()}</div>
                                </div>
                            </div>
                        )) : (
                            <div className="bg-app-bg border-4 border-dashed border-app-border rounded-[40px] p-20 text-center text-gray-400">
                                <div className="text-4xl mb-4">📖</div>
                                <p className="font-black text-xs uppercase tracking-widest">Nothing recorded yet!</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Persistence Bar */}
      {view !== "AUTH" && view !== "PROFILE_SELECT" && (
        <footer className="h-14 sm:h-16 border-t-2 border-app-border px-4 sm:px-8 flex items-center justify-between text-[10px] sm:text-[11px] font-black text-gray-400 bg-white shrink-0 uppercase tracking-tighter">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-app-accent flex items-center justify-center text-xs">👶</div>
                <span>Playing as: <strong className="text-app-text">{user?.name}</strong></span>
            </div>
            <div className="flex gap-6 items-center">
                <span>Total Words: <strong className="text-app-text">{attempts}</strong></span>
                <button onClick={() => setView("PROFILE_SELECT")} className="text-app-primary hover:scale-110 transition-transform">
                    <LogOut size={18} />
                </button>
            </div>
        </footer>
      )}
    </div>
  );
}
