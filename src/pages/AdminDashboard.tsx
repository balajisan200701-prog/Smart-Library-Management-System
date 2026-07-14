import React, { useState, useEffect } from "react";
import { User, Book, DashboardStats, SystemSettings } from "../types";
import { 
  PlusCircle, Edit, Trash2, Database, Settings, Shield, Activity, 
  BarChart, PieChart as PieIcon, LineChart, TrendingUp, Search, X, 
  Download, Upload, Save, Sparkles, CheckCircle2, RefreshCw, LogOut
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend, BarChart as ReBarChart, Bar } from "recharts";
import { motion, AnimatePresence } from "motion/react";

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  onBookClick: (book: Book) => void;
}

export default function AdminDashboard({ user, onLogout, onBookClick }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"analytics" | "books" | "settings" | "database" | "logs">("analytics");
  
  // Data States
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Book CRUD Form states
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  
  // Form Fields
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [isbn, setIsbn] = useState("");
  const [shelf, setShelf] = useState("");
  const [rack, setRack] = useState("");
  const [totalCopies, setTotalCopies] = useState("3");
  const [price, setPrice] = useState("29.99");
  const [description, setDescription] = useState("");

  // DB Backup state
  const [backupString, setBackupString] = useState("");
  const [restoreString, setRestoreString] = useState("");

  useEffect(() => {
    loadAdminStats();
    loadBooks();
    loadSettings();
  }, []);

  const loadAdminStats = () => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  const loadBooks = () => {
    fetch("/api/books")
      .then((res) => res.json())
      .then((data) => setBooks(data))
      .catch((err) => console.error(err));
  };

  const loadSettings = () => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch((err) => console.error(err));
  };

  // Create or Update Book
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title,
      author,
      category,
      isbn,
      shelfNumber: shelf,
      rackNumber: rack,
      totalCopies: Number(totalCopies),
      price: Number(price),
      description,
      executorName: user.name
    };

    const endpoint = editingBook ? `/api/books/${editingBook.id}` : "/api/books";
    const method = editingBook ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        alert(editingBook ? "Book details updated!" : "Book added to catalogue!");
        setIsBookModalOpen(false);
        resetForm();
        loadBooks();
        loadAdminStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setEditingBook(null);
    setTitle("");
    setAuthor("");
    setCategory("");
    setIsbn("");
    setShelf("");
    setRack("");
    setTotalCopies("3");
    setPrice("29.99");
    setDescription("");
  };

  const handleEditClick = (book: Book) => {
    setEditingBook(book);
    setTitle(book.title);
    setAuthor(book.author);
    setCategory(book.category);
    setIsbn(book.isbn);
    setShelf(book.shelfNumber);
    setRack(book.rackNumber);
    setTotalCopies(book.totalCopies.toString());
    setPrice(book.price.toString());
    setDescription(book.description);
    setIsBookModalOpen(true);
  };

  // Delete Book copy
  const handleDeleteBook = async (id: string) => {
    if (!confirm("Are you sure you want to completely delete this book from catalog? This will remove related reservation histories.")) return;
    try {
      const res = await fetch(`/api/books/${id}?executorName=${user.name}`, {
        method: "DELETE"
      });
      if (res.ok) {
        alert("Book successfully deleted.");
        loadBooks();
        loadAdminStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update System parameters
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        alert("System constraints updated successfully!");
        loadSettings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Export database
  const handleExportBackup = () => {
    fetch("/api/admin/backup", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        setBackupString(data.dataString);
        alert("Backup JSON compiled successfully. Copy the text from the area.");
      });
  };

  // Restore database
  const handleRestoreBackup = () => {
    if (!restoreString) {
      alert("Please paste backup JSON string first.");
      return;
    }
    fetch("/api/admin/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataString: restoreString })
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message);
        loadAdminStats();
        loadBooks();
        loadSettings();
        setRestoreString("");
      });
  };

  // Charts palette colors
  const COLORS = ["#10b981", "#3b82f6", "#a855f7", "#f59e0b", "#ec4899", "#14b8a6", "#6366f1"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Sidebar Controls */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <img
              src={user.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"}
              alt="Profile"
              className="w-12 h-12 rounded-full border border-white/25 object-cover"
            />
            <div>
              <h3 className="font-bold font-display text-sm leading-tight">{user.name}</h3>
              <p className="text-xs text-blue-400 font-semibold font-mono">Board Administrator</p>
            </div>
          </div>
        </div>

        {/* Action Menu */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-1">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-display font-medium transition ${
              activeTab === "analytics" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            System Analytics
          </button>
          <button
            onClick={() => setActiveTab("books")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-display font-medium transition ${
              activeTab === "books" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Book Inventories
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-display font-medium transition ${
              activeTab === "settings" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Settings className="w-4 h-4" />
            Circulation settings
          </button>
          <button
            onClick={() => setActiveTab("database")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-display font-medium transition ${
              activeTab === "database" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Database className="w-4 h-4" />
            Database backups
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-display font-medium transition ${
              activeTab === "logs" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <span className="flex items-center gap-3">
              <Activity className="w-4 h-4" />
              Activity Audits
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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

      {/* Main Panel View */}
      <div className="lg:col-span-9">
        <AnimatePresence mode="wait">
          {/* 1. ANALYTICS & VISUAL CHARTS */}
          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm text-center">
                    <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Volume</span>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.totalBooks}</h3>
                    <p className="text-xs text-slate-500 mt-1">Total Book Copies</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm text-center">
                    <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Circulation</span>
                    <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.borrowedBooks}</h3>
                    <p className="text-xs text-slate-500 mt-1">Active Loans</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm text-center">
                    <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Available</span>
                    <h3 className="text-2xl font-bold text-blue-500 mt-1">{stats.availableBooks}</h3>
                    <p className="text-xs text-slate-500 mt-1">Shelved Books</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm text-center">
                    <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Overdue</span>
                    <h3 className="text-2xl font-bold text-red-500 mt-1">{stats.overdueBooks}</h3>
                    <p className="text-xs text-slate-500 mt-1">Overdue Registers</p>
                  </div>
                </div>
              )}

              {stats && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Category Breakdown (Pie chart) */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
                    <h4 className="font-bold font-display text-slate-800 dark:text-white text-sm flex items-center gap-2">
                      <BarChart className="w-4 h-4 text-emerald-500" />
                      Inventories by Genre Breakdown
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {stats.categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Monthly circulation stats (Area Chart) */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
                    <h4 className="font-bold font-display text-slate-800 dark:text-white text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      Monthly Circulation Logs
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.monthlyIssues}>
                          <defs>
                            <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                          <YAxis stroke="#94a3b8" fontSize={11} />
                          <Tooltip />
                          <Area type="monotone" dataKey="issues" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIssues)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* 2. BOOK INVENTORIES CRUD */}
          {activeTab === "books" && (
            <motion.div
              key="books"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white">Active Catalog Registries</h2>
                  <p className="text-xs text-slate-500 font-sans">Total {books.length} publications indexed.</p>
                </div>
                <button
                  onClick={() => {
                    resetForm();
                    setIsBookModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-display font-medium text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  Register Publication
                </button>
              </div>

              {/* Book Lists */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider">
                        <th className="py-3 font-semibold">Title/Author</th>
                        <th className="py-3 font-semibold">Category</th>
                        <th className="py-3 font-semibold">ISBN</th>
                        <th className="py-3 font-semibold">Copies</th>
                        <th className="py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {books.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                          <td className="py-4 cursor-pointer" onClick={() => onBookClick(b)}>
                            <div className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{b.title}</div>
                            <div className="text-[10px] text-slate-400">By {b.author}</div>
                          </td>
                          <td className="py-4 text-slate-600 dark:text-slate-400">{b.category}</td>
                          <td className="py-4 font-mono text-slate-500">{b.isbn}</td>
                          <td className="py-4 font-mono">
                            {b.availableCopies}/{b.totalCopies}
                          </td>
                          <td className="py-4 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => handleEditClick(b)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-blue-500 transition"
                              title="Edit details"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBook(b.id)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-red-500 transition"
                              title="Delete Book copy"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CRUD MODAL */}
              {isBookModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold font-display text-slate-900 dark:text-white">
                        {editingBook ? "Edit Book Details" : "Register Publication"}
                      </h3>
                      <button onClick={() => setIsBookModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveBook} className="grid grid-cols-2 gap-4 text-xs font-sans">
                      <div className="space-y-1 col-span-2">
                        <label className="text-slate-500">Book Title</label>
                        <input
                          type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500">Author Name</label>
                        <input
                          type="text" required value={author} onChange={(e) => setAuthor(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500">ISBN</label>
                        <input
                          type="text" required value={isbn} onChange={(e) => setIsbn(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500">Genre Category</label>
                        <input
                          type="text" required placeholder="e.g. History, Computer Science" value={category} onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500">Total Copies</label>
                        <input
                          type="number" required value={totalCopies} onChange={(e) => setTotalCopies(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500">Shelf Number</label>
                        <input
                          type="text" required placeholder="S-03" value={shelf} onChange={(e) => setShelf(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500">Rack Number</label>
                        <input
                          type="text" required placeholder="R-1" value={rack} onChange={(e) => setRack(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                        />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <label className="text-slate-500">Summary Description</label>
                        <textarea
                          rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="col-span-2 py-2.5 mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-display font-medium rounded-xl text-sm shadow transition"
                      >
                        Publish Publication
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* 3. SETTINGS */}
          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm max-w-lg mx-auto"
            >
              {settings && (
                <form onSubmit={handleSaveSettings} className="space-y-6 text-xs font-sans">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white">Circulation Parameters</h2>
                    <p className="text-slate-500">Configure global constraints for borrow days and fine scales.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-600">Max Loan Period (Days)</label>
                      <input
                        type="number"
                        value={settings.maxBorrowDays}
                        onChange={(e) => setSettings({ ...settings, maxBorrowDays: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-600">Daily Late Penalty Rate ($)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={settings.finePerDay}
                        onChange={(e) => setSettings({ ...settings, finePerDay: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-600">Student Borrow Copy Limit</label>
                      <input
                        type="number"
                        value={settings.borrowLimit}
                        onChange={(e) => setSettings({ ...settings, borrowLimit: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-display font-medium rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save circulation settings
                  </button>
                </form>
              )}
            </motion.div>
          )}

          {/* 4. DATABASE RESTORE / BACKUP */}
          {activeTab === "database" && (
            <motion.div
              key="database"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold font-display text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-500" />
                    Backup System Database
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">Compile current books, issue logs, and reservations into a JSON string.</p>
                </div>
                <button
                  onClick={handleExportBackup}
                  className="w-full bg-slate-900 hover:bg-slate-850 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 py-2.5 rounded-xl text-sm font-display font-medium transition flex items-center justify-center gap-2"
                >
                  Compile Backup Code
                </button>
                {backupString && (
                  <textarea
                    readOnly
                    rows={6}
                    value={backupString}
                    onClick={(e) => (e.target as any).select()}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 font-mono text-[10px] rounded-xl border border-slate-100 dark:border-slate-850 resize-none cursor-pointer"
                  />
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold font-display text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <Upload className="w-4 h-4 text-blue-500" />
                    Restore System Database
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">Paste a previously compiled backup JSON string below to overwrite records.</p>
                </div>
                <textarea
                  rows={6}
                  placeholder="Paste database JSON here..."
                  value={restoreString}
                  onChange={(e) => setRestoreString(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 font-mono text-[10px] rounded-xl border border-slate-150 dark:border-slate-850 resize-none"
                />
                <button
                  onClick={handleRestoreBackup}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-display font-medium transition"
                >
                  Overwrite Restore Database
                </button>
              </div>
            </motion.div>
          )}

          {/* 5. SYSTEM ACTIVITY LOGS */}
          {activeTab === "logs" && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm space-y-4"
            >
              <div className="space-y-1">
                <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">Activity Audit Trail</h2>
                <p className="text-xs text-slate-500 font-sans">Real-time audit log of librarian checkout approvals, returns, and scholar reservation holds.</p>
              </div>

              {stats && (
                <div className="space-y-3">
                  {stats.activityLogs.map((log) => (
                    <div key={log.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/40 flex justify-between items-center text-xs font-sans">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{log.action}</p>
                        <p className="text-[10px] text-slate-500">Performed by: {log.user}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
