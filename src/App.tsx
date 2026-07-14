import React, { useState, useEffect } from "react";
import { User, Book } from "./types";
import HomeView from "./components/HomeView";
import AuthView from "./components/AuthView";
import BookDetailModal from "./components/BookDetailModal";
import StudentDashboard from "./pages/StudentDashboard";
import LibrarianDashboard from "./pages/LibrarianDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { BookOpen, Moon, Sun, Bell, LogOut, ShieldCheck, HelpCircle, Laptop } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Dark mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // Auth/Session State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("token");
  });

  // Page Routing States
  const [currentTab, setCurrentTab] = useState<string>("home");
  
  // Selected book detail state
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedBookDetailed, setSelectedBookDetailed] = useState<Book | null>(null);

  // Apply Dark Mode Class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Fetch complete book details including reviews
  const handleOpenBookDetail = (book: Book) => {
    setSelectedBook(book);
    fetch(`/api/books/${book.id}`)
      .then((res) => res.json())
      .then((detailed) => {
        setSelectedBookDetailed(detailed);
      })
      .catch((err) => {
        console.error("Error loading detailed book stats", err);
        setSelectedBookDetailed(book); // fallback
      });
  };

  const handleLoginSuccess = (user: User, userToken: string) => {
    setCurrentUser(user);
    setToken(userToken);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", userToken);
    
    // Redirect appropriately
    setCurrentTab("dashboard");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setCurrentTab("home");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300 font-sans">
      {/* 1. Glassmorphic Navigation Bar */}
      <nav className="sticky top-0 z-40 glass w-full border-b border-slate-200/50 dark:border-slate-800/50 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          
          {/* Logo brand */}
          <div 
            onClick={() => setCurrentTab("home")}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="bg-emerald-600 dark:bg-emerald-500 p-2 rounded-xl text-white shadow-md shadow-emerald-500/15 group-hover:scale-105 transition-all">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold font-display text-lg tracking-tight text-slate-900 dark:text-white leading-tight block">
                Academic Commons
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider uppercase block -mt-0.5">
                Next-Gen Library
              </span>
            </div>
          </div>

          {/* Nav Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentTab("home")}
              className={`text-sm font-display font-medium transition ${
                currentTab === "home" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Public Catalog
            </button>

            {currentUser ? (
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-full font-mono font-medium flex items-center gap-1.5 border border-slate-200/50 dark:border-slate-700/50 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                {currentUser.role.toUpperCase()}
              </span>
            ) : (
              <button
                onClick={() => setCurrentTab("auth")}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-display text-xs font-semibold px-4 py-2 rounded-xl transition shadow-md"
              >
                Access Portal
              </button>
            )}

            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl transition"
              title="Switch Themes"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-400 fill-amber-400/20" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Main Page Layout Wrapper */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {/* A. Not logged in: Catalog / Home */}
          {!currentUser && currentTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <HomeView 
                onNavigate={setCurrentTab} 
                onBookClick={handleOpenBookDetail} 
              />
            </motion.div>
          )}

          {/* B. Not logged in: Secure Authorization Portal */}
          {!currentUser && currentTab === "auth" && (
            <motion.div
              key="auth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AuthView 
                onLoginSuccess={handleLoginSuccess} 
                onBack={() => setCurrentTab("home")} 
              />
            </motion.div>
          )}

          {/* C. User dashboards */}
          {currentUser && (
            <motion.div
              key="dashboards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {currentUser.role === "student" && (
                <StudentDashboard 
                  user={currentUser} 
                  onLogout={handleLogout} 
                  onBookClick={handleOpenBookDetail} 
                />
              )}
              {currentUser.role === "librarian" && (
                <LibrarianDashboard 
                  user={currentUser} 
                  onLogout={handleLogout} 
                  onBookClick={handleOpenBookDetail} 
                />
              )}
              {currentUser.role === "admin" && (
                <AdminDashboard 
                  user={currentUser} 
                  onLogout={handleLogout} 
                  onBookClick={handleOpenBookDetail} 
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 3. Global book details modal overlay */}
      <AnimatePresence>
        {selectedBookDetailed && (
          <BookDetailModal
            book={selectedBookDetailed}
            user={currentUser}
            onClose={() => {
              setSelectedBook(null);
              setSelectedBookDetailed(null);
            }}
            onRefresh={() => {
              if (selectedBook) {
                handleOpenBookDetail(selectedBook);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
