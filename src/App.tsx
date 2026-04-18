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
  word: string;
  category: string;
  type: string;
  language: string;
  score: number;
  timestamp: string;
}

type View = "AUTH" | "PROFILE_SELECT" | "CATEGORIES" | "GAME" | "PROGRESS" | "SPELLING";

export default function App() {
  const [view, setView] = useState<View>("AUTH");
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [allWords, setAllWords] = useState<Word[]>([]);
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
    fetch("/api/words")
      .then((res) => { if (!res.ok) throw new Error("Failed to load words"); return res.json(); })
      .then((data) => setAllWords(data))
      .catch((err) => console.error("Words fetch error:", err));

    fetch("/api/users")
      .then((res) => { if (!res.ok) throw new Error("Failed to load users"); return res.json(); })
      .then((data) => setUsers(data))
      .catch((err) => console.error("Users fetch error:", err));
  }, []);

  useEffect(() => {
    if (user && selectedCategory) {
      setWords(allWords.filter((w) => w.language === lang && w.category === selectedCategory));
      setCurrentIndex(0);
      setFeedback(null);
    }
  }, [lang, selectedCategory, allWords, user]);

  useEffect(() => {
    if (user) {
      fetchStats();
      if (view === "PROGRESS") fetchHistory();
    }
  }, [feedback, view, user]);

  const fetchStats = () => {
    if (!user) return;
    fetch(`/api/stats/${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setAccuracy(data.avgScore || 0);
          setAttempts(data.totalAttempts || 0);
        }
      });
  };

  const fetchHistory = () => {
    if (!user) return;
    fetch(`/api/progress/${user.id}`)
      .then((res) => res.json())
      .then((data) => setHistory(Array.isArray(data) ? data : []));
  };

  const currentWord = words.length > 0 ? words[currentIndex % words.length] : null;

  const handleSignup = (e: FormEvent) => {
    e.preventDefault();
    const ageValue = newAge === "" ? 4 : newAge;
    fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, age: ageValue, preferred_exercise: newPref })
    })
    .then(res => res.json())
    .then(data => {
        setUsers([...users, data]);
        setUser(data);
        setView("CATEGORIES");
    });
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
        setMicError("Microphone bloqué. Cliquez sur l'icône 'Cadenas' dans la barre d'adresse pour l'autoriser, ou ouvrez l'app dans un nouvel onglet.");
      } else if (event.error === 'no-speech') {
        setMicError("Aucun son détecté. Parlez plus fort !");
      } else {
        setMicError("Erreur micro: " + event.error);
      }
    };

    recognitionRef.current.onresult = async (event: any) => {
      // Guard: currentWord may be null if user navigated away during recording
      if (!currentWord) {
        setIsRecording(false);
        return;
      }
      const transcript = event.results[0][0].transcript;
      console.log("Transcript received:", transcript);
      try {
        const response = await fetch("/api/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            transcript, 
            expectedWord: currentWord.word,
            category: selectedCategory,
            language: lang,
            type,
            userId: user?.id
          }),
        });
        if (!response.ok) throw new Error("Evaluate API error");
        const result = await response.json();
        setFeedback(result);
      } catch (err) {
        console.error("Error evaluating speech:", err);
        setMicError("Erreur lors de l'évaluation. Réessayez.");
      }
    };

    try {
      recognitionRef.current.start();
      // We set recording to true immediately to show intent, 
      // onstart will confirm it
      setIsRecording(true); 
    } catch (err) {
      console.error("Failed to start recognition:", err);
      setMicError("Impossible de lancer le micro. Essayez de rafraîchir la page.");
      setIsRecording(false);
    }
  };

  const playAudio = () => {
    if (!currentWord) return;
    // Cancel any pending speech to avoid overlapping or blocking
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(currentWord.word);
    utterance.lang = lang === "FR" ? "fr-FR" : "en-US";
    utterance.rate = 0.85; // Faster for kids to understand but slow enough
    utterance.pitch = 1.1; // Slightly higher pitch for a child-friendly voice
    
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-[768px] mx-auto border-8 border-app-accent overflow-hidden bg-app-bg text-app-text font-sans shadow-2xl relative">
      {/* Dynamic Header */}
      {view !== "AUTH" && view !== "PROFILE_SELECT" && (
        <header className="h-20 px-8 flex justify-between items-center border-b-2 border-app-border bg-white shrink-0 z-20">
            <div 
            onClick={() => setView("CATEGORIES")}
            className="font-serif text-2xl font-black italic text-app-primary tracking-tighter cursor-pointer"
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
          <aside className="w-56 border-r-2 border-app-border bg-white/40 p-8 flex flex-col items-center shrink-0">
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
                className="p-10 flex flex-col items-center justify-center min-h-full bg-white"
              >
                <div className="font-serif text-5xl font-black italic text-app-primary mb-8 tracking-tighter">SghiriTalk.</div>
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
                    className="p-10 flex flex-col items-center justify-center min-h-full"
                >
                    <h2 className="font-serif text-4xl font-black mb-10 italic">Who is playing?</h2>
                    <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
                        {users.map((u) => (
                            <button 
                                key={u.id}
                                onClick={() => { setUser(u); setView("CATEGORIES"); }}
                                className="bg-white border-4 border-app-border p-8 rounded-[40px] word-card-shadow hover:border-app-secondary transition-all flex flex-col items-center group"
                            >
                                <div className="w-20 h-20 bg-app-accent rounded-full mb-4 group-hover:scale-110 transition-transform flex items-center justify-center text-3xl">
                                    {u.age < 6 ? "🧸" : "🎨"}
                                </div>
                                <div className="font-black text-xl">{u.name}</div>
                                <div className="text-[10px] uppercase font-bold text-gray-400">{u.age} years old</div>
                            </button>
                        ))}
                        <button 
                            onClick={() => setView("AUTH")}
                            className="bg-white border-4 border-dashed border-app-border p-8 rounded-[40px] hover:border-app-primary transition-all flex flex-col items-center justify-center group"
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
                className="p-8 pb-20"
              >
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h2 className="font-serif text-4xl font-black text-app-text mb-2 italic">SghiriTalk Adventure</h2>
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Hello, {user?.name}! Pick a module</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-app-accent px-4 py-2 rounded-2xl flex items-center gap-2">
                            <Star size={16} fill="white" className="text-white" />
                            <span className="font-black text-white">{user?.streak} Days</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {["Fruits", "Animals", "Colors", "Home", "Shapes", "Actions", "Phrases", "Reading"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                          setSelectedCategory(cat);
                          setView("GAME");
                      }}
                      className="bg-white border-2 border-app-border p-5 rounded-[24px] flex flex-col items-center word-card-shadow hover:border-app-primary transition-all group"
                    >
                      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                          {cat === "Fruits" ? "🍎" : cat === "Animals" ? "🐱" : cat === "Colors" ? "🎨" : cat === "Home" ? "🏠" : cat === "Shapes" ? "📐" : cat === "Actions" ? "🏃" : cat === "Phrases" ? "💬" : "📖"}
                      </div>
                      <h3 className="font-serif font-black text-lg">{cat}</h3>
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
                className="p-10 pt-4 flex flex-col items-center h-full"
              >
                <button 
                  onClick={() => setView("CATEGORIES")}
                  className="self-start flex items-center gap-2 text-[10px] font-black uppercase text-app-text/40 hover:text-app-primary transition-colors mb-6"
                >
                  <ChevronLeft size={16} /> Change Module
                </button>

                <div className="flex bg-white border-2 border-app-border p-1 rounded-full mb-8">
                  <button onClick={() => { setLang("FR"); setFeedback(null); setMicError(null); }} className={`px-5 py-1.5 rounded-full text-[10px] font-black transition-all ${lang === "FR" ? "bg-app-secondary text-white shadow-md" : "text-app-text"}`}>FRANÇAIS</button>
                  <button onClick={() => { setLang("EN"); setFeedback(null); setMicError(null); }} className={`px-5 py-1.5 rounded-full text-[10px] font-black transition-all ${lang === "EN" ? "bg-app-secondary text-white shadow-md" : "text-app-text"}`}>ENGLISH</button>
                </div>

                <div className="w-full max-w-sm h-72 bg-white rounded-[40px] word-card-shadow border-2 border-app-border flex flex-col items-center justify-center relative overflow-hidden p-6 mb-8">
                  {currentWord ? (
                    <>
                      <div className="absolute top-4 left-4 opacity-5 text-9xl pointer-events-none">{currentWord.emoji}</div>
                      <motion.div 
                        key={currentWord.id}
                        initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                        className="font-serif text-6xl font-black text-app-text mb-2 text-center"
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

                <div className="flex gap-6 items-center">
                  <button onClick={playAudio} className="w-16 h-16 rounded-full bg-app-secondary text-white flex items-center justify-center btn-push"><Volume2 size={28} /></button>
                  <button onClick={() => startRecording(view === "SPELLING" ? "spelling" : "pronunciation")} disabled={isRecording} className={`w-28 h-28 rounded-full flex items-center justify-center btn-push shadow-xl ${isRecording ? "bg-red-500" : "bg-app-primary"} text-white relative`}>
                    <Mic size={40} className={isRecording ? "animate-bounce" : ""} />
                    {isRecording && (
                        <motion.div 
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="absolute inset-0 bg-red-500 rounded-full"
                        />
                    )}
                  </button>
                  <button onClick={() => { setCurrentIndex(prev => prev + 1); setFeedback(null); setMicError(null); }} className="w-16 h-16 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center btn-push"><ArrowRight size={28} /></button>
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
                <div className="mt-auto mb-4 w-full px-6 py-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex items-center justify-between">
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
                    className="p-8"
                >
                     <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="font-serif text-4xl font-black text-app-text mb-1 italic">{user?.name}'s Book</h2>
                            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Learning timeline</p>
                        </div>
                        <div className="bg-app-accent p-4 rounded-[32px] flex items-center gap-3 shadow-lg">
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
        <footer className="h-16 border-t-2 border-app-border px-8 flex items-center justify-between text-[11px] font-black text-gray-400 bg-white shrink-0 uppercase tracking-tighter">
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
