import React, { useState, useEffect } from "react";
import { User, Book, IssueRecord, Reservation } from "../types";
import { 
  PlusCircle, Check, Search, BookOpen, AlertCircle, FileText, Bell,
  ArrowRight, ShieldAlert, CheckCircle2, QrCode, Clipboard, CreditCard, RefreshCw, X, LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LibrarianDashboardProps {
  user: User;
  onLogout: () => void;
  onBookClick: (book: Book) => void;
}

export default function LibrarianDashboard({ user, onLogout, onBookClick }: LibrarianDashboardProps) {
  const [activeTab, setActiveTab] = useState<"issue" | "return" | "reservations" | "members" | "scanner">("issue");
  
  // Dynamic Lists from Backend
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);

  // Issue Form States
  const [issueBookId, setIssueBookId] = useState("");
  const [issueStudentId, setIssueStudentId] = useState("");
  const [isIssuing, setIsIssuing] = useState(false);
  const [issueMessage, setIssueMessage] = useState({ text: "", isError: false });

  // Fine Payment States
  const [payingStudent, setPayingStudent] = useState<User | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  // Scanner simulator
  const [scanTarget, setScanTarget] = useState("");
  const [scannedBook, setScannedBook] = useState<Book | null>(null);
  const [scannerAction, setScannerAction] = useState<"issue" | "return">("issue");

  useEffect(() => {
    loadLibrarianData();
  }, []);

  const loadLibrarianData = () => {
    fetch("/api/books").then(res => res.json()).then(data => setBooks(data));
    fetch("/api/members").then(res => res.json()).then(data => setMembers(data));
    fetch("/api/issues").then(res => res.json()).then(data => setIssues(data));
    fetch("/api/reservations").then(res => res.json()).then(data => setReservations(data));
    fetch("/api/dashboard/stats").then(res => res.json()).then(data => {
      setSystemLogs(data.activityLogs || []);
    });
  };

  // Process Issue Book
  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIssuing(true);
    setIssueMessage({ text: "", isError: false });

    try {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: issueBookId,
          studentId: issueStudentId,
          executorName: user.name
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Checkout transaction failed.");
      }
      setIssueMessage({ text: `Successfully issued '${data.bookTitle}' to ${data.studentName}! Due: ${data.dueDate}`, isError: false });
      setIssueBookId("");
      setIssueStudentId("");
      loadLibrarianData();
    } catch (err: any) {
      setIssueMessage({ text: err.message, isError: true });
    } finally {
      setIsIssuing(false);
    }
  };

  // Process Return Book
  const handleReturnBook = (issueId: string) => {
    fetch(`/api/issues/${issueId}/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ executorName: user.name })
    })
      .then(res => res.json())
      .then(data => {
        loadLibrarianData();
        alert(`Book returned successfully! Overdue fine processed: $${data.fine}`);
      })
      .catch(err => console.error(err));
  };

  // Resolve Reservation status (approved/cancelled)
  const handleResolveReservation = (resId: string, status: "approved" | "cancelled") => {
    fetch(`/api/reservations/${resId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, executorName: user.name })
    })
      .then(() => {
        loadLibrarianData();
        alert(`Reservation request successfully ${status}!`);
      });
  };

  // Manage member blocked status
  const handleToggleMemberStatus = (memberId: string, currentStatus: "Active" | "Blocked") => {
    const nextStatus = currentStatus === "Active" ? "Blocked" : "Active";
    fetch(`/api/members/${memberId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus, executorName: user.name })
    })
      .then(() => {
        loadLibrarianData();
      });
  };

  // Settle Overdue Student Fines
  const handlePayFine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingStudent) return;
    setIsPaying(true);

    try {
      const res = await fetch(`/api/members/${payingStudent.id}/pay-fine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: payAmount,
          executorName: user.name
        })
      });
      if (res.ok) {
        alert("Fine payment transaction recorded!");
        setPayingStudent(null);
        setPayAmount("");
        loadLibrarianData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPaying(false);
    }
  };

  // Simulate scanning code
  const handleSimulateScan = () => {
    if (!scanTarget) return;
    const book = books.find(b => b.id === scanTarget);
    if (book) {
      setScannedBook(book);
      // simulate audio beep
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime); // high pitched beep
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch (e) {
        console.log("Audio not supported");
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Sidebar Controls */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <img
              src={user.profilePhoto || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"}
              alt="Profile"
              className="w-12 h-12 rounded-full border border-white/25 object-cover"
            />
            <div>
              <h3 className="font-bold font-display text-sm leading-tight">{user.name}</h3>
              <p className="text-xs text-emerald-400 font-semibold font-mono">Academic Librarian</p>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-3">
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Operation Overview</p>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block font-sans">Active Loans</span>
                <span className="text-base font-bold font-mono text-emerald-400">{issues.filter(i => i.status !== "returned").length}</span>
              </div>
              <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block font-sans">Holds</span>
                <span className="text-base font-bold font-mono text-blue-400">{reservations.filter(r => r.status === "pending").length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-1">
          <button
            onClick={() => setActiveTab("issue")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-display font-medium transition ${
              activeTab === "issue" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Issue Book Desk
          </button>
          <button
            onClick={() => setActiveTab("return")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-display font-medium transition ${
              activeTab === "return" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <span className="flex items-center gap-3">
              <RefreshCw className="w-4 h-4" />
              Returns Center
            </span>
            <span className="text-xs font-mono px-2 py-0.5 bg-red-500/10 text-red-600 rounded-full">{issues.filter(i => i.status !== "returned").length}</span>
          </button>
          <button
            onClick={() => setActiveTab("reservations")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-display font-medium transition ${
              activeTab === "reservations" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <span className="flex items-center gap-3">
              <Clipboard className="w-4 h-4" />
              Approve Holds
            </span>
            {reservations.filter(r => r.status === "pending").length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-display font-medium transition ${
              activeTab === "members" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            Manage Members
          </button>
          <button
            onClick={() => setActiveTab("scanner")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-display font-medium transition ${
              activeTab === "scanner" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <QrCode className="w-4 h-4 text-emerald-500 animate-pulse" />
            Scanner Simulator
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

      {/* Main Panel views */}
      <div className="lg:col-span-9">
        <AnimatePresence mode="wait">
          {/* 1. ISSUE DESK VIEW */}
          {activeTab === "issue" && (
            <motion.div
              key="issue"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm"
            >
              <div className="space-y-1">
                <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">Issue Book Desk</h2>
                <p className="text-xs text-slate-500 font-sans">Register checkouts of books to verified student member cards.</p>
              </div>

              {issueMessage.text && (
                <div className={`p-4 rounded-xl border text-xs font-sans text-center ${
                  issueMessage.isError ? "bg-red-500/10 border-red-500/25 text-red-600" : "bg-emerald-500/10 border-emerald-500/25 text-emerald-600"
                }`}>
                  {issueMessage.text}
                </div>
              )}

              <form onSubmit={handleIssueBook} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-sans">Select Book To Checkout</label>
                  <select
                    required
                    value={issueBookId}
                    onChange={(e) => setIssueBookId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-sans"
                  >
                    <option value="">-- Choose Book copy --</option>
                    {books.map(b => (
                      <option key={b.id} value={b.id} disabled={b.availableCopies <= 0}>
                        {b.title} by {b.author} ({b.availableCopies} left)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-sans">Select Student Card</label>
                  <select
                    required
                    value={issueStudentId}
                    onChange={(e) => setIssueStudentId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-sans"
                  >
                    <option value="">-- Choose Student Card --</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id} disabled={m.status === "Blocked"}>
                        {m.name} ({m.studentId}) {m.status === "Blocked" ? " - BLOCKED" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isIssuing}
                  className="col-span-1 md:col-span-2 w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-display font-medium py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2"
                >
                  {isIssuing ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Authorize Library Loan
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* 2. RETURNS CENTER */}
          {activeTab === "return" && (
            <motion.div
              key="return"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">Active Loan Registries</h2>
                  <p className="text-xs text-slate-500 font-sans">Click return to process book receipts and log dynamically calculated overdue fines.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider">
                        <th className="py-3 font-semibold">Book Title</th>
                        <th className="py-3 font-semibold">Borrower</th>
                        <th className="py-3 font-semibold">Due Date</th>
                        <th className="py-3 font-semibold">Fine Amount</th>
                        <th className="py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {issues.filter(i => i.status !== "returned").map(record => (
                        <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                          <td className="py-4 font-bold text-slate-800 dark:text-slate-100">{record.bookTitle}</td>
                          <td className="py-4 text-slate-600 dark:text-slate-400">{record.studentName}</td>
                          <td className="py-4 font-mono text-slate-600 dark:text-slate-400">{record.dueDate}</td>
                          <td className="py-4 font-mono">
                            {record.fineAmount > 0 ? (
                              <span className="text-red-500 font-bold">${record.fineAmount.toFixed(2)}</span>
                            ) : (
                              <span className="text-slate-400">$0.00</span>
                            )}
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => handleReturnBook(record.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition"
                            >
                              Check-In Book
                            </button>
                          </td>
                        </tr>
                      ))}

                      {issues.filter(i => i.status !== "returned").length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">No book copies currently borrowed.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* 3. HOLDS RESERVATIONS */}
          {activeTab === "reservations" && (
            <motion.div
              key="reservations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">Pending Reservation holds</h2>
                  <p className="text-xs text-slate-500 font-sans">Approve holds when books return or cancel hold slots.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider">
                        <th className="py-3 font-semibold">Book Title</th>
                        <th className="py-3 font-semibold">Scholar Name</th>
                        <th className="py-3 font-semibold">Request Date</th>
                        <th className="py-3 font-semibold">Status</th>
                        <th className="py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {reservations.map(res => (
                        <tr key={res.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                          <td className="py-4 font-bold text-slate-800 dark:text-slate-100">{res.bookTitle}</td>
                          <td className="py-4 text-slate-600 dark:text-slate-400">{res.studentName}</td>
                          <td className="py-4 font-mono text-slate-600 dark:text-slate-400">{res.reserveDate}</td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              res.status === "pending" ? "bg-amber-500/15 text-amber-600" :
                              res.status === "approved" ? "bg-emerald-500/15 text-emerald-600" : "bg-slate-100 text-slate-500"
                            }`}>
                              {res.status}
                            </span>
                          </td>
                          <td className="py-4 text-right space-x-1">
                            {res.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleResolveReservation(res.id, "approved")}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleResolveReservation(res.id, "cancelled")}
                                  className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}

                      {reservations.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">No reservations placed in logs.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* 4. MANAGE MEMBERS */}
          {activeTab === "members" && (
            <motion.div
              key="members"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">Registered Student Members</h2>
                  <p className="text-xs text-slate-500 font-sans">Manage student loan clearances, block bad accounts, or settle accumulated library fines.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider">
                        <th className="py-3 font-semibold">Scholar Name</th>
                        <th className="py-3 font-semibold">Dept/ID</th>
                        <th className="py-3 font-semibold">Fines Overdue</th>
                        <th className="py-3 font-semibold">Account Status</th>
                        <th className="py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {members.map(student => (
                        <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <img src={student.profilePhoto} alt="p" className="w-7 h-7 rounded-full object-cover" />
                              <span className="font-bold text-slate-800 dark:text-slate-100">{student.name}</span>
                            </div>
                          </td>
                          <td className="py-4 text-slate-600 dark:text-slate-400">
                            <div>{student.studentId}</div>
                            <div className="text-[10px] text-slate-400">{student.department}</div>
                          </td>
                          <td className="py-4 font-mono font-bold">
                            {student.fineAmount > 0 ? (
                              <span className="text-amber-600">${student.fineAmount.toFixed(2)}</span>
                            ) : (
                              <span className="text-slate-400">$0.00</span>
                            )}
                          </td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              student.status === "Active" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                            }`}>
                              {student.status}
                            </span>
                          </td>
                          <td className="py-4 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleMemberStatus(student.id, student.status)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                                student.status === "Active" ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/15" : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15"
                              }`}
                            >
                              {student.status === "Active" ? "Block" : "Activate"}
                            </button>
                            <button
                              onClick={() => {
                                setPayingStudent(student);
                                setPayAmount(student.fineAmount.toString());
                              }}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition"
                            >
                              Collect Fine
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Settle Fine popup box */}
              {payingStudent && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-sm w-full rounded-2xl p-6 shadow-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold font-display text-slate-900 dark:text-white">Collect Overdue Fine</h3>
                      <button onClick={() => setPayingStudent(null)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 font-sans">
                      Record fine payment transaction for student cardholder <strong>{payingStudent.name}</strong>.
                    </p>

                    <form onSubmit={handlePayFine} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">Fine Settle Amount ($)</label>
                        <input
                          type="number"
                          required
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-sans focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isPaying}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-display font-medium rounded-xl text-sm shadow transition"
                      >
                        Settle Fine Settle
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* 5. SCANNER SIMULATOR */}
          {activeTab === "scanner" && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm space-y-6">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">Barcode & QR Simulator Scanner</h2>
                  <p className="text-xs text-slate-500 font-sans">Simulate scanning books with a simulated camera beep effect.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* Visual simulated viewfinder */}
                  <div className="relative bg-slate-950 rounded-2xl aspect-video overflow-hidden border border-slate-850 flex flex-col items-center justify-center p-4">
                    {/* Viewfinder lines */}
                    <div className="absolute inset-6 border border-dashed border-emerald-500/30 rounded-xl pointer-events-none" />
                    {/* Animated scanning bar */}
                    <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-bounce top-1/2" />
                    
                    {scannedBook ? (
                      <div className="z-10 text-center space-y-2">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto animate-pulse" />
                        <h4 className="font-bold text-white text-sm leading-snug">{scannedBook.title}</h4>
                        <p className="text-[10px] text-slate-400 font-mono">CODE: {scannedBook.barcode}</p>
                      </div>
                    ) : (
                      <div className="z-10 text-center text-slate-500 space-y-2">
                        <QrCode className="w-12 h-12 text-slate-600 mx-auto" />
                        <p className="text-xs font-sans">Viewfinder Camera Standby</p>
                      </div>
                    )}
                  </div>

                  {/* Simulated scanning selectors */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Pick book for physical scanning simulation</label>
                      <select
                        value={scanTarget}
                        onChange={(e) => setScanTarget(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-sans focus:outline-none"
                      >
                        <option value="">-- Choose Book copy --</option>
                        {books.map(b => (
                          <option key={b.id} value={b.id}>{b.title} ({b.barcode})</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleSimulateScan}
                      disabled={!scanTarget}
                      className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white py-2.5 rounded-xl font-display font-medium text-sm transition flex items-center justify-center gap-2"
                    >
                      <QrCode className="w-4 h-4" />
                      Simulate Scanner scan
                    </button>

                    {scannedBook && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/40 space-y-2 text-xs font-sans">
                        <p className="font-bold">Scanned Copy Registry Info:</p>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                          <div>Publisher: {scannedBook.publisher}</div>
                          <div>Shelf/Rack: {scannedBook.shelfNumber}/{scannedBook.rackNumber}</div>
                          <div>Status: {scannedBook.status}</div>
                          <div>QR Code: {scannedBook.qrCode}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
