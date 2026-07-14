import React, { useState } from "react";
import { User } from "../types";
import { UserCheck, Shield, Key, Eye, EyeOff, Sparkles, Mail, Lock, User as UserIcon, LogIn, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

interface AuthViewProps {
  onLoginSuccess: (user: User, token: string) => void;
  onBack: () => void;
}

export default function AuthView({ onLoginSuccess, onBack }: AuthViewProps) {
  const [role, setRole] = useState<"student" | "librarian" | "admin">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const endpoint = isSignUp ? "/api/auth/signup" : "/api/auth/login";
    const body = isSignUp ? { email, password, name, role } : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || "Failed to authenticate. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreset = (presetRole: "student" | "librarian" | "admin") => {
    setRole(presetRole);
    setIsSignUp(false);
    if (presetRole === "student") {
      setEmail("student@library.com");
      setPassword("student123");
    } else if (presetRole === "librarian") {
      setEmail("librarian@library.com");
      setPassword("librarian123");
    } else {
      setEmail("admin@library.com");
      setPassword("admin123");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-400 font-sans transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home Catalog
      </button>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 shadow-xl space-y-6 relative overflow-hidden"
      >
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />

        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            {isSignUp ? "Create Scholar Account" : "Secure Gatekeeper Log In"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">
            {isSignUp ? "Join our collaborative library network" : "Select your role and authenticate below"}
          </p>
        </div>

        {/* Quick presets helper */}
        {!isSignUp && (
          <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
            <p className="text-xs font-mono font-medium text-slate-500 text-center uppercase tracking-wider">Demo Gateways (Click to Autofill)</p>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => loadPreset("student")}
                className="text-xs py-1.5 px-1 font-display font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-500 dark:text-slate-300 transition-all bg-white dark:bg-slate-900 shadow-sm"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => loadPreset("librarian")}
                className="text-xs py-1.5 px-1 font-display font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-500 dark:text-slate-300 transition-all bg-white dark:bg-slate-900 shadow-sm"
              >
                Librarian
              </button>
              <button
                type="button"
                onClick={() => loadPreset("admin")}
                className="text-xs py-1.5 px-1 font-display font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-500 dark:text-slate-300 transition-all bg-white dark:bg-slate-900 shadow-sm"
              >
                Admin
              </button>
            </div>
          </div>
        )}

        {/* Role toggle */}
        {isSignUp && (
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
            {(["student", "librarian"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2 text-xs font-display font-semibold rounded-lg capitalize transition-all ${
                  role === r
                    ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl text-center font-sans">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-sans">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-sans"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-sans">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
              <input
                type="email"
                required
                placeholder="email@library.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-sans"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-sans">Security Key</label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => alert("Demo key triggers for testing are: student123, librarian123, admin123")}
                  className="text-[10px] text-slate-400 hover:text-emerald-500 font-sans"
                >
                  Forgot Key?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-4 rounded-xl font-display font-medium transition-all shadow-md flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                {isSignUp ? "Register Scholar Identity" : "Authorize Session"}
              </>
            )}
          </button>
        </form>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 text-center">
          <button
            onClick={() => {
              setError("");
              setIsSignUp(!isSignUp);
            }}
            className="text-xs text-slate-500 hover:text-emerald-500 font-sans"
          >
            {isSignUp ? "Already have a scholar card? Log In" : "Need a student or librarian card? Register Account"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
