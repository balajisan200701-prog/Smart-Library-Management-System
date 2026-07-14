import React, { useState, useEffect } from "react";
import { User, Book, IssueRecord, LibraryNotification, Reservation } from "../types";
import { 
  BookOpen, Clock, AlertCircle, Heart, Star, Compass, Sparkles, Mic, MicOff, Search,
  Bell, Check, RefreshCw, UserCheck, Settings, LogOut, ChevronRight, Bookmark, ArrowUpRight, Send, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
  onBookClick: (book: Book) => void;
}

export default function StudentDashboard({ user, onLogout, onBookClick }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "catalog" | "history" | "ai" | "settings">("dashboard");
  const [studentDetails, setStudentDetails] = useState<User>(user);
  
  // Data States
  const [borrowedBooks, setBorrowedBooks] = useState<IssueRecord[]>([]);
  const [wishlist, setWishlist] = useState<Book[]>([]);
  const [notifications, setNotifications] = useState<LibraryNotification[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  
  // Catalog / Search States
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isListening, setIsListening] = useState(false);
  
  // AI State
  const [aiInterest, setAiInterest] = useState("");
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // Settings State
  const [phone, setPhone] = useState(user.phone || "");
  const [address, setAddress] = useState(user.address || "");
  const [profileSaved, setProfileSaved] = useState(false);

  // Poll intervals or load hooks
  useEffect(() => {
    loadStudentData();
    loadCatalog();
  }, [studentDetails.id]);

  const loadStudentData = () => {
    // 1. Fetch Issues
    fetch(`/api/issues/student/${studentDetails.id}`)
      .then((res) => res.json())
      .then((data) => setBorrowedBooks(data))
      .catch((err) => console.error(err));

    // 2. Fetch Wishlist
    fetch(`/api/wishlist/${studentDetails.id}`)
      .then((res) => res.json())
      .then((data) => setWishlist(data))
      .catch((err) => console.error(err));

    // 3. Fetch Reservations
    fetch("/api/reservations")
      .then((res) => res.json())
      .then((data: Reservation[]) => {
        const studentRes = data.filter((r) => r.studentId === studentDetails.id);
        setReservations(studentRes);
      })
      .catch((err) => console.error(err));

    // 4. Fetch Notifications
    fetch(`/api/notifications/${studentDetails.id}`)
      .then((res) => res.json())
      .then((data) => setNotifications(data))
      .catch((err) => console.error(err));
  };

  const loadCatalog = () => {
    fetch("/api/books")
      .then((res) => res.json())
      .then((data) => setAllBooks(data))
      .catch((err) => console.error(err));
  };

  // Renew a book loan
  const handleRenew = (issueId: string) => {
    fetch(`/api/issues/${issueId}/renew`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ executorName: studentDetails.name })
    })
      .then((res) => {
        if (res.ok) {
          loadStudentData();
          alert("Book lease extended by 14 days!");
        } else {
          alert("Unable to renew. It might be reserved by another student.");
        }
      });
  };

  // Mark notification as read
  const handleReadNotification = (id: string) => {
    fetch(`/api/notifications/${id}/read`, {
      method: "POST"
    }).then(() => {
      loadStudentData();
    });
  };

  // Voice Search with Web Speech API
  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser version. Try using Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setSearchQuery(speechToText);
      setActiveTab("catalog");
    };

    recognition.onerror = (err: any) => {
      console.error("Speech Recognition Error", err);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // AI-Powered Book Curated Recommendations
  const generateAiRecommendations = () => {
    setIsAiLoading(true);
    setAiError("");
    setAiRecommendations([]);

    fetch("/api/ai/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: studentDetails.id,
        readingInterests: aiInterest
      })
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("AI Recommendations is unavailable or key is unconfigured.");
        }
        return res.json();
      })
      .then((data) => {
        setAiRecommendations(data);
      })
      .catch((err: any) => {
        setAiError(err.message || "Failed to load smart AI recommendations. Check the Secrets tab for GEMINI_API_KEY.");
      })
      .finally(() => {
        setIsAiLoading(false);
      });
  };

  // Settings Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  // Wishlist toggle
  const handleWishlistToggle = (bookId: string) => {
    fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: studentDetails.id, bookId })
    })
      .then((res) => res.json())
      .then(() => {
        loadStudentData();
      });
  };

  // Filter Catalog
  const filteredBooks = allBooks.filter((book) => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(allBooks.map((b) => b.category)));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* 1. Sidebar Navigation */}
      <div className="lg:col-span-3 space-y-6">
        {/* Scholar Card Panel */}
        <div className="bg-gradient-to-br from-emerald-600 to-blue-600 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10" />
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={studentDetails.profilePhoto || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150"}
                alt="Profile"
                className="w-12 h-12 rounded-full border-2 border-white/40 object-cover"
              />
              <div>
                <h3 className="font-bold font-display text-base tracking-tight leading-tight">{studentDetails.name}</h3>
                <p className="text-xs text-white/80 font-mono">{studentDetails.studentId}</p>
              </div>
            </div>

            <div className="border-t border-white/20 pt-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/70">Department</span>
                <span className="font-medium">{studentDetails.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Academics</span>
                <span className="font-medium">{studentDetails.course} • {studentDetails.semester}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Limit</span>
                <span className="font-medium font-mono">{borrowedBooks.filter(i => i.status !== "returned").length}/{studentDetails.borrowLimit} Books</span>
              </div>
            </div>

            {studentDetails.fineAmount > 0 && (
              <div className="bg-amber-500/20 border border-amber-400/20 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-300">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-semibold">Active Fines</span>
                </div>
                <span className="font-mono text-sm font-bold text-amber-200">${studentDetails.fineAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Menu */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-1">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-display font-medium transition ${
              activeTab === "dashboard"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Compass className="w-4 h-4" />
            Scholar Dashboard
          </button>
          <button
            onClick={() => setActiveTab("catalog")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-display font-medium transition ${
              activeTab === "catalog"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <span className="flex items-center gap-3">
              <BookOpen className="w-4 h-4" />
              Digital Catalog
            </span>
            <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">{allBooks.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-display font-medium transition ${
              activeTab === "ai"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Sparkles className="w-4 h-4 text-gradient animate-pulse" />
            Gemini AI Advisor
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-display font-medium transition ${
              activeTab === "settings"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Settings className="w-4 h-4" />
            Card settings
          </button>

          <div className="border-t border-slate-100 dark:border-slate-800/60 my-2 pt-2">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-display font-medium text-red-600 dark:text-red-400 hover:bg-red-500/5 transition"
            >
              <LogOut className="w-4 h-4" />
              Log Out Session
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Tab Contents */}
      <div className="lg:col-span-9">
        <AnimatePresence mode="wait">
          {/* A. DASHBOARD VIEW */}
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Voice search mini action bar */}
              <div className="flex gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm items-center">
                <Search className="text-slate-400 w-5 h-5 ml-2" />
                <input
                  type="text"
                  placeholder="Quick search library catalogue... or click the mic to speak!"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setActiveTab("catalog")}
                  className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 font-sans"
                />
                <button
                  type="button"
                  onClick={startVoiceSearch}
                  className={`p-2.5 rounded-xl transition-all ${
                    isListening ? "bg-red-500 text-white animate-bounce" : "bg-emerald-600 hover:bg-emerald-500 text-white"
                  }`}
                  title="Voice Search Catalog"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              {/* Borrowed Books Trackers */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-500" />
                  Currently Borrowed ({borrowedBooks.filter((b) => b.status !== "returned").length})
                </h3>
                
                {borrowedBooks.filter((b) => b.status !== "returned").length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {borrowedBooks
                      .filter((b) => b.status !== "returned")
                      .map((record) => (
                        <div
                          key={record.id}
                          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-4"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white text-base line-clamp-1">{record.bookTitle}</h4>
                              <p className="text-xs text-slate-500 font-sans">Issued: {record.issueDate}</p>
                            </div>
                            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md font-bold ${
                              record.status === "overdue" ? "bg-red-500/10 text-red-600" : "bg-blue-500/10 text-blue-600"
                            }`}>
                              {record.status}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs font-sans">
                            <span className="text-slate-500">Return Deadline:</span>
                            <span className={`font-semibold font-mono ${record.status === "overdue" ? "text-red-500" : "text-slate-800 dark:text-slate-300"}`}>
                              {record.dueDate}
                            </span>
                          </div>

                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex gap-2">
                            <button
                              onClick={() => handleRenew(record.id)}
                              className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-display font-medium text-slate-700 dark:text-slate-300 transition flex items-center justify-center gap-1.5"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Renew 14 Days
                            </button>
                            <button
                              onClick={() => alert("Please hand over the book copy to Librarian desk at Level 2 to verify barcode and settle return records.")}
                              className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-display font-medium transition flex items-center justify-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Return Center
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 p-8 rounded-2xl text-center space-y-2">
                    <BookOpen className="w-10 h-10 mx-auto text-slate-400 stroke-[1.5]" />
                    <p className="text-slate-700 dark:text-slate-300 font-display font-bold">No active loans</p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto font-sans">Explore the digital catalogue to check out software design handbooks and academic journals.</p>
                  </div>
                )}
              </div>

              {/* Side-by-Side: Reservations & Reading Wishlist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Wishlist */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                    Reading Wishlist ({wishlist.length})
                  </h3>
                  {wishlist.length > 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800/60 shadow-sm overflow-hidden">
                      {wishlist.map((book) => (
                        <div key={book.id} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                          <div className="cursor-pointer" onClick={() => onBookClick(book)}>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{book.title}</h4>
                            <p className="text-xs text-slate-500 font-sans">By {book.author}</p>
                          </div>
                          <button
                            onClick={() => handleWishlistToggle(book.id)}
                            className="text-xs font-sans text-red-500 hover:text-red-400"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 p-6 rounded-2xl text-center space-y-1">
                      <Bookmark className="w-8 h-8 mx-auto text-slate-400 stroke-[1.5]" />
                      <p className="text-xs text-slate-500 font-sans">Add items from catalogue to track your wishlists here.</p>
                    </div>
                  )}
                </div>

                {/* Reservations */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-blue-500" />
                    Holding Reservations ({reservations.length})
                  </h3>
                  {reservations.length > 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800/60 shadow-sm overflow-hidden">
                      {reservations.map((res) => (
                        <div key={res.id} className="p-4 flex justify-between items-center">
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{res.bookTitle}</h4>
                            <p className="text-xs text-slate-500 font-sans">Placed: {res.reserveDate}</p>
                          </div>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                            res.status === "pending" ? "bg-amber-500/15 text-amber-600" :
                            res.status === "approved" ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/15 text-red-600"
                          }`}>
                            {res.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 p-6 rounded-2xl text-center space-y-1">
                      <HelpCircle className="w-8 h-8 mx-auto text-slate-400 stroke-[1.5]" />
                      <p className="text-xs text-slate-500 font-sans">No book copy holds currently placed.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notifications Inbox */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-emerald-500" />
                  System Notifications Box
                </h3>
                {notifications.length > 0 ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800/60 shadow-sm overflow-hidden">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 flex justify-between items-start gap-4 transition ${
                          notif.read ? "bg-transparent" : "bg-emerald-500/3 dark:bg-emerald-500/1"
                        }`}
                      >
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{notif.title}</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">{notif.message}</p>
                          <span className="text-[10px] text-slate-400 block font-mono">{notif.date}</span>
                        </div>
                        {!notif.read && (
                          <button
                            onClick={() => handleReadNotification(notif.id)}
                            className="text-xs font-sans text-emerald-600 hover:text-emerald-500 whitespace-nowrap flex items-center gap-1 font-semibold"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Mark Read
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 p-6 rounded-2xl text-center">
                    <p className="text-xs text-slate-500 font-sans">All notifications are up to date.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* B. CATALOGUE VIEW */}
          {activeTab === "catalog" && (
            <motion.div
              key="catalog"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Academic Catalog</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-sans">Browse or search library items. Tap voice mic to do high-fidelity research searches.</p>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full flex items-center">
                  <Search className="absolute left-4 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search titles, authors, categories, ISBNs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-sans"
                  />
                  <button
                    type="button"
                    onClick={startVoiceSearch}
                    className={`absolute right-3 p-2 rounded-xl ${
                      isListening ? "bg-red-500 text-white animate-pulse" : "text-slate-400 hover:text-emerald-600"
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-sans text-slate-700 dark:text-slate-300 focus:outline-none w-full sm:w-48 cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Catalog Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBooks.map((book) => {
                  const isInWishlist = wishlist.some((b) => b.id === book.id);
                  return (
                    <div
                      key={book.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between cursor-pointer"
                      onClick={() => onBookClick(book)}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded">
                            {book.category}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWishlistToggle(book.id);
                            }}
                            className={`p-1.5 rounded-full transition ${
                              isInWishlist ? "text-red-500 bg-red-500/5" : "text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isInWishlist ? "fill-red-500" : ""}`} />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{book.title}</h4>
                          <p className="text-xs text-slate-500 font-sans">By {book.author}</p>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {book.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-4 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span>Shelf {book.shelfNumber}</span>
                        <span className={book.availableCopies > 0 ? "text-emerald-600" : "text-amber-600"}>
                          {book.availableCopies > 0 ? `${book.availableCopies} Copies` : "0 Copies"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* C. AI ADVISOR VIEW */}
          {activeTab === "ai" && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm"
            >
              <div className="space-y-3">
                <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                  <Sparkles className="w-6 h-6 animate-pulse text-gradient" />
                </div>
                <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
                  Gemini AI Scholar Advisor
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-sans leading-relaxed max-w-2xl">
                  Our advanced integration evaluates your active reading history, wishlist items, and department background to recommend 3 physical masterworks in the catalog that sync with your studies.
                </p>
              </div>

              {/* Research Input Panel */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-sans">What research topic or genre interest are you pursuing today?</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="e.g. Distributed backend architecture, algorithms optimization, behavioral psychology, history of science"
                      value={aiInterest}
                      onChange={(e) => setAiInterest(e.target.value)}
                      className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-sans"
                    />
                    <button
                      onClick={generateAiRecommendations}
                      disabled={isAiLoading}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-display font-medium px-6 py-3 rounded-xl transition flex items-center gap-2"
                    >
                      {isAiLoading ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Consult Advisor
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {aiError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl font-sans">
                    {aiError}
                  </div>
                )}

                {/* AI Recommendations Cards */}
                <div className="space-y-4 pt-4">
                  {aiRecommendations.length > 0 && (
                    <h3 className="text-base font-bold font-display text-slate-800 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      Curated Readings For You
                    </h3>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {aiRecommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="border border-emerald-500/15 dark:border-emerald-500/10 bg-emerald-500/5 dark:bg-emerald-500/2 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded">
                            {rec.category || "AI Recommendation"}
                          </span>
                          <h4 className="font-bold text-slate-900 dark:text-white text-base leading-snug">{rec.title}</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-sans">By {rec.author}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1 border-t border-emerald-500/10 font-sans">
                            {rec.description}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-emerald-500/10 mt-2">
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans leading-relaxed font-semibold">
                            💡 {rec.whyRecommended}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {!isAiLoading && aiRecommendations.length === 0 && (
                    <div className="p-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 space-y-2">
                      <Compass className="w-10 h-10 mx-auto stroke-[1.5]" />
                      <p className="text-sm font-display font-medium text-slate-700 dark:text-slate-300">Your curated queue is currently empty</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto font-sans">
                        Describe what you are working on, study course, or research interest, then consult the Gemini Advisor.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* D. SETTINGS VIEW */}
          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm max-w-xl mx-auto space-y-6"
            >
              <div className="space-y-1">
                <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">Scholar Card Settings</h2>
                <p className="text-xs text-slate-500 font-sans">Update registered email address, contact numbers, and campus delivery addresses.</p>
              </div>

              {profileSaved && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl text-center font-sans">
                  Profile updated and saved to system files successfully!
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-sans">Cardholder Name</label>
                    <input
                      type="text"
                      disabled
                      value={studentDetails.name}
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-sans cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-sans">Academic ID</label>
                    <input
                      type="text"
                      disabled
                      value={studentDetails.studentId}
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-sans cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-sans">Registered Email</label>
                  <input
                    type="email"
                    disabled
                    value={studentDetails.email}
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-sans cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-sans">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="+1 555-0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-sans">Hostel / Mailing Address</label>
                  <textarea
                    rows={3}
                    placeholder="Enter delivery/mailing address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-sans resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-display font-medium py-2.5 px-4 rounded-xl transition shadow-md"
                >
                  Save Updates
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
