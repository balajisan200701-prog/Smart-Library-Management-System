import React, { useState, useEffect } from "react";
import { Book } from "../types";
import { Search, BookOpen, Star, MessageSquare, Award, Clock, ArrowRight, HelpCircle, ChevronDown, Sparkles, Filter, ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HomeViewProps {
  onNavigate: (tab: string) => void;
  onBookClick: (book: Book) => void;
}

export default function HomeView({ onNavigate, onBookClick }: HomeViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [faqOpen, setFaqOpen] = useState<{ [key: number]: boolean }>({});
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Fetch books from backend
    fetch(`/api/books?search=${searchQuery}${selectedCategory !== "All" ? `&category=${selectedCategory}` : ""}`)
      .then((res) => res.json())
      .then((data) => {
        setBooks(data);
      })
      .catch((err) => console.error(err));
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    // Get unique categories from seeding / database
    fetch("/api/books")
      .then((res) => res.json())
      .then((data: Book[]) => {
        const uniqueCats = Array.from(new Set(data.map((b) => b.category)));
        setCategories(uniqueCats);
      })
      .catch((err) => console.error(err));
  }, []);

  const toggleFaq = (index: number) => {
    setFaqOpen((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const stats = [
    { label: "Total Books", value: "24,500+", suffix: "Volume" },
    { label: "Active Members", value: "1,850+", suffix: "Students" },
    { label: "Daily Circulation", value: "340+", suffix: "Issues" },
    { label: "Digital Journals", value: "12,000+", suffix: "PDFs" }
  ];

  const faqs = [
    {
      question: "How long can I borrow a book for?",
      answer: "By default, students can borrow books for up to 14 days. You can renew your book loan once from your Student Dashboard if there are no pending reservations for it."
    },
    {
      question: "What happens if I return a book late?",
      answer: "A late fine is automatically calculated at $1.50 per day past the due date. Fines can be paid directly at the librarian desk or viewed in your Student Dashboard."
    },
    {
      question: "How do I reserve a book that is currently out of stock?",
      answer: "If a book is 'Checked Out' or has 0 available copies, you can log into your Student Account, open the book's detail panel, and click 'Reserve Book'. The librarian will approve and hold it for you as soon as it is returned."
    },
    {
      question: "What is the AI Book Recommendation tool?",
      answer: "Our intelligent reading advisor evaluates your unique checkout history, active wishlist, and academic department using Gemini AI to recommend 3 real-world masterworks curated specifically for your learning goals."
    }
  ];

  const announcements = [
    {
      title: "New Research Manuscripts Added",
      desc: "Our Computer Science department has acquired original hardcopies of advanced IEEE research journals and modern AI engineering books.",
      date: "July 12, 2026",
      tag: "Acquisitions"
    },
    {
      title: "Summer Accelerated Reading Challenge",
      desc: "Borrow at least 5 books across different categories this month to earn an official 'Academic Scholar Certificate' and waive 50% of any active fines.",
      date: "July 08, 2026",
      tag: "Event"
    }
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* 1. Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-12">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-white dark:from-slate-900/40 dark:via-slate-950 dark:to-slate-950 -z-10" />
        
        {/* Ambient blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="max-w-5xl mx-auto px-4 text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide font-display"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Empowering Minds with Next-Gen Intelligence
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold font-display tracking-tight text-slate-900 dark:text-white leading-tight"
          >
            The Intelligent <br />
            <span className="text-gradient">Library Commons</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-sans leading-relaxed"
          >
            Discover, checkout, and experience custom curated knowledge. Seamless catalog searching, smart reservation approval systems, and AI-powered book matchmaking.
          </motion.p>

          {/* Quick Search Panel */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800/80">
              <div className="relative flex-1 flex items-center">
                <Search className="absolute left-4 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search titles, authors, categories, ISBNs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-transparent border-0 focus:ring-0 focus:outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 font-sans"
                />
              </div>
              <button 
                onClick={() => {
                  const element = document.getElementById("catalog-section");
                  if (element) element.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-display font-medium px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Explore Books
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 dark:text-slate-500">Popular searches:</span>
              {["Clean Code", "Algorithms", "Atomic Habits", "History"].map((keyword) => (
                <button
                  key={keyword}
                  onClick={() => {
                    setSearchQuery(keyword);
                    const element = document.getElementById("catalog-section");
                    if (element) element.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-xs font-sans bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 px-3 py-1 rounded-full text-slate-600 dark:text-slate-400 transition"
                >
                  {keyword}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Micro Statistics */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6 text-center shadow-sm"
            >
              <p className="text-xs font-mono tracking-widest text-slate-500 uppercase">{stat.suffix}</p>
              <h3 className="text-3xl md:text-4xl font-bold font-display text-slate-900 dark:text-white mt-1">{stat.value}</h3>
              <p className="text-sm font-sans text-slate-600 dark:text-slate-400 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. Catalog Section */}
      <section id="catalog-section" className="max-w-6xl mx-auto px-4 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold font-display text-slate-900 dark:text-white">Academic Catalog</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl font-sans">
              Filter through our premium selection of academic literature, programming design guides, and self-improvement assets.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`px-4 py-2 rounded-xl text-sm font-display font-medium transition ${
                selectedCategory === "All"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              All Genres
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-display font-medium transition ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {books.length > 0 ? (
              books.map((book) => (
                <motion.div
                  key={book.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
                  onClick={() => onBookClick(book)}
                >
                  <div className="space-y-4">
                    {/* Category Tag & Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md font-semibold">
                        {book.category}
                      </span>
                      <span className={`text-xs font-sans px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 ${
                        book.availableCopies > 0
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}>
                        <Clock className="w-3 h-3" />
                        {book.availableCopies > 0 ? `${book.availableCopies} Copies Available` : "Reserved Only"}
                      </span>
                    </div>

                    {/* Book Metadata */}
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white line-clamp-1">
                        {book.title}
                      </h3>
                      {book.subtitle && (
                        <p className="text-xs text-slate-500 dark:text-slate-500 italic line-clamp-1">
                          {book.subtitle}
                        </p>
                      )}
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-sans">
                        By {book.author}
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {book.description}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60 mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{book.rating}</span>
                      <span className="text-xs text-slate-500">({book.reviewsCount} reviews)</span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Shelf {book.shelfNumber}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center space-y-4">
                <BookOpen className="w-12 h-12 mx-auto text-slate-400 stroke-[1.5]" />
                <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">No Books Found</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto font-sans">
                  We couldn't find any titles matching your query. Try broadening your keywords.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* 4. Side-by-Side: Announcements & Student Testimonials */}
      <section className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left column: Announcements */}
        <div className="space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Library Bulletin Board</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-sans">Stay updated with current acquisitions and events.</p>
          </div>
          <div className="space-y-4">
            {announcements.map((ann, i) => (
              <div key={i} className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800/60 rounded-2xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2.5 py-0.5 rounded-full">
                    {ann.tag}
                  </span>
                  <span className="text-xs text-slate-400">{ann.date}</span>
                </div>
                <h4 className="text-base font-bold font-display text-slate-800 dark:text-white">{ann.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{ann.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Testimonials */}
        <div className="space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Scholar Community</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-sans">What our academic research community says about the library.</p>
          </div>
          <div className="space-y-4">
            <div className="bg-gradient-to-tr from-emerald-500/5 to-blue-500/5 dark:from-emerald-500/2 dark:to-blue-500/2 border border-emerald-500/10 rounded-2xl p-6 space-y-4 shadow-sm relative">
              <MessageSquare className="absolute top-6 right-6 text-emerald-500/10 w-12 h-12" />
              <div className="flex items-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed font-sans">
                "The server-side AI book recommendation system is unbelievably accurate! Based on my borrow history in Computer Science, it suggested exactly the Design Patterns text and another software architecture handbook that solved my thesis problems."
              </p>
              <div className="flex items-center gap-3 pt-2">
                <img
                  src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100"
                  alt="Student"
                  className="w-10 h-10 rounded-full object-cover border border-slate-200/50"
                />
                <div>
                  <h5 className="text-sm font-bold font-display text-slate-900 dark:text-white">Alex Rivera</h5>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-sans">VI Semester B.Tech, Computer Science</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQs Section */}
      <section className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <HelpCircle className="w-8 h-8 text-emerald-500 mx-auto stroke-[1.5]" />
          <h2 className="text-3xl font-bold font-display text-slate-900 dark:text-white">Frequently Asked Questions</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto font-sans text-sm">
            Everything you need to know about loan durations, late fees, automated reservations, and our smart recommendation assistants.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden transition-all shadow-sm"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between p-5 text-left font-display font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <span>{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${faqOpen[idx] ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {faqOpen[idx] && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="p-5 pt-0 text-sm text-slate-600 dark:text-slate-400 font-sans border-t border-slate-100 dark:border-slate-800/40 leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Footer Section */}
      <footer className="border-t border-slate-200/60 dark:border-slate-800/60 pt-16 mt-12 bg-slate-50/50 dark:bg-slate-950/20">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-10 pb-12">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <div className="bg-emerald-600 p-2 rounded-lg text-white">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-bold font-display text-lg tracking-tight">Commons UI</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
              Next-generation Intelligent Library Management and Academic Resource matching system for scholars and universities.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200">Catalog Indexes</h5>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-sans">
              <li><button onClick={() => { setSelectedCategory("Computer Science"); }} className="hover:text-emerald-500 transition">Computer Science</button></li>
              <li><button onClick={() => { setSelectedCategory("Algorithms"); }} className="hover:text-emerald-500 transition">Algorithms</button></li>
              <li><button onClick={() => { setSelectedCategory("Software Design"); }} className="hover:text-emerald-500 transition">Software Design</button></li>
              <li><button onClick={() => { setSelectedCategory("History"); }} className="hover:text-emerald-500 transition">Human History</button></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200">Campus Services</h5>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-sans">
              <li><button onClick={() => onNavigate("auth")} className="hover:text-emerald-500 transition">Student Login</button></li>
              <li><button onClick={() => onNavigate("auth")} className="hover:text-emerald-500 transition">Librarian Access</button></li>
              <li><button onClick={() => onNavigate("auth")} className="hover:text-emerald-500 transition">Academic Board Portal</button></li>
              <li><a href="#catalog-section" className="hover:text-emerald-500 transition">Barcode Scan Center</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200">Operating Hours</h5>
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 font-sans">
              <p>Monday – Friday: 08:00 AM – 09:00 PM</p>
              <p>Saturday: 09:00 AM – 06:00 PM</p>
              <p>Sunday: 10:00 AM – 04:00 PM</p>
              <p className="text-emerald-600 font-medium pt-1">Digital Services: 24/7 Online</p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6 border-t border-slate-200/40 dark:border-slate-800/40 text-center flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500 font-sans">
            &copy; 2026 Academic Library Commons. Built with advanced Express + React + Gemini.
          </p>
          <div className="flex gap-4 text-xs text-slate-500 font-sans">
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Privacy Charter</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
