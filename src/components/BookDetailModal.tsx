import React, { useState } from "react";
import { Book, User, Review } from "../types";
import { X, Star, MapPin, Calendar, Layers, BookOpen, Clock, PenTool, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BookDetailModalProps {
  book: Book;
  user: User | null;
  onClose: () => void;
  onRefresh: () => void;
}

export default function BookDetailModal({ book, user, onClose, onRefresh }: BookDetailModalProps) {
  // Review inputs
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [borrowMessage, setBorrowMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please log in to submit a review.");
      return;
    }
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/books/${book.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: user.name,
          rating,
          comment
        })
      });
      if (res.ok) {
        setComment("");
        setRating(5);
        onRefresh();
        alert("Review published successfully!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Borrow Book copy directly from modal
  const handleBorrow = async () => {
    if (!user) {
      alert("Please log in to borrow books.");
      return;
    }
    setBorrowMessage("");

    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: book.id,
          studentId: user.id,
          executorName: "Self Service"
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to borrow book copy.");
      }
      setBorrowMessage(`Success! Borrowed. Due: ${data.dueDate}`);
      setIsSuccess(true);
      onRefresh();
    } catch (err: any) {
      setBorrowMessage(err.message);
      setIsSuccess(false);
    }
  };

  // Place holding Reservation
  const handleReserve = async () => {
    if (!user) {
      alert("Please log in to place reservations.");
      return;
    }
    setBorrowMessage("");

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: book.id,
          studentId: user.id,
          studentName: user.name
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to reserve book copy.");
      }
      setBorrowMessage("Success! Reservation hold placed and pending librarian approval.");
      setIsSuccess(true);
      onRefresh();
    } catch (err: any) {
      setBorrowMessage(err.message);
      setIsSuccess(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-2xl w-full rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-500" />
            <span className="font-mono text-xs text-slate-400 font-bold uppercase tracking-wider">Book Registry Card</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Contents */}
        <div className="p-8 overflow-y-auto space-y-6 flex-1 no-scrollbar">
          {/* Main publication Info */}
          <div className="space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white leading-snug">{book.title}</h2>
                {book.subtitle && <p className="text-sm text-slate-500 italic font-sans">{book.subtitle}</p>}
                <p className="text-sm text-slate-600 dark:text-slate-400 font-sans font-medium">By {book.author}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                book.availableCopies > 0 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
              }`}>
                {book.availableCopies > 0 ? "In Stock" : "Reserved Holds Only"}
              </span>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans pt-2 border-t border-slate-100 dark:border-slate-850">
              {book.description}
            </p>
          </div>

          {/* Fact parameters grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 font-mono block">ISBN</span>
              <span className="text-xs font-semibold font-mono text-slate-800 dark:text-slate-200">{book.isbn}</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-slate-400 font-mono block">SHELF LOCATION</span>
              <span className="text-xs font-semibold font-mono text-slate-800 dark:text-slate-200">{book.shelfNumber} / {book.rackNumber}</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-slate-400 font-mono block">AVAILABILITY</span>
              <span className="text-xs font-semibold font-mono text-slate-800 dark:text-slate-200">{book.availableCopies} of {book.totalCopies} copies</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-slate-400 font-mono block">PUBLISHER</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">{book.publisher}</span>
            </div>
          </div>

          {/* Borrow Actions inside details overlay */}
          {user && user.role === "student" && (
            <div className="bg-slate-50 dark:bg-slate-850/20 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/50 space-y-4">
              <h4 className="text-sm font-bold font-display text-slate-800 dark:text-white">Self-Service Checkout desk</h4>
              
              <div className="flex gap-2">
                <button
                  onClick={handleBorrow}
                  disabled={book.availableCopies <= 0}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-display font-medium transition ${
                    book.availableCopies > 0 
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  Request Instant Borrow
                </button>
                <button
                  onClick={handleReserve}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-display font-medium transition"
                >
                  Place Reservation Hold
                </button>
              </div>

              {borrowMessage && (
                <div className={`p-3 rounded-lg border text-xs text-center font-sans ${
                  isSuccess ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-red-500/10 border-red-500/20 text-red-600"
                }`}>
                  {borrowMessage}
                </div>
              )}
            </div>
          )}

          {/* Reviews List and input Form */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-850">
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-1.5">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              Scholar Reviews
            </h3>

            {/* Existing reviews */}
            <div className="space-y-3">
              {book.reviews && book.reviews.length > 0 ? (
                book.reviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/40 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{rev.studentName}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3 h-3 ${s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-sans leading-relaxed">{rev.comment}</p>
                    <span className="text-[10px] text-slate-400 font-mono block text-right">{rev.date}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No scholar reviews yet. Be the first to publish a study guide note!</p>
              )}
            </div>

            {/* Write new review */}
            {user && (
              <form onSubmit={handleSubmitReview} className="p-4 bg-slate-50/50 dark:bg-slate-850/20 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3 text-xs font-sans">
                <p className="font-bold">Publish study guide note or review:</p>
                <div className="flex gap-4 items-center">
                  <span className="text-slate-500">Your Rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setRating(s)}
                        className="p-0.5"
                      >
                        <Star className={`w-4 h-4 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300 hover:text-amber-300"}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <textarea
                    rows={2}
                    required
                    placeholder="Write your study guide summary notes or critique..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-display font-medium py-2 rounded-xl transition shadow"
                >
                  Publish Review
                </button>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
