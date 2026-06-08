import React, { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { X, Mail, Lock, AlertCircle, Heart } from "lucide-react";

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to authenticate");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sand-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-[0_8px_40px_rgba(0,0,0,0.12)] overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-sand-500 hover:text-sand-800 hover:bg-sand-100/50 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-8 pt-10 pb-8">
          <div className="flex items-center justify-center w-12 h-12 bg-sage-50 rounded-2xl mb-6 shadow-sm border border-sage-100">
            <Heart className="w-6 h-6 text-sage-600" />
          </div>
          <h2 className="text-2xl font-bold text-sand-900 mb-2 font-display">
            {isLogin ? "Welcome back" : "Begin your journey"}
          </h2>
          <p className="text-sm text-sand-600 mb-8 font-sans">
            {isLogin ? "Sign in to access your mindful space" : "Create an account to securely persist your insights"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-sand-800 pl-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-sand-50 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sage-500/30 focus:border-sage-500 transition-all font-sans"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1 pb-2">
              <label className="text-xs font-semibold text-sand-800 pl-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-sand-50 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sage-500/30 focus:border-sage-500 transition-all font-sans"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-sage-600 hover:bg-sage-700 active:bg-sage-800 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? "Please wait..." : (isLogin ? "Sign In" : "Sign Up")}
            </button>
          </form>
        </div>

        <div className="px-8 py-5 bg-sand-50/50 border-t border-sand-100 flex items-center justify-center gap-2 text-sm text-sand-700">
          <span>{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(""); }}
            className="font-semibold text-sage-700 hover:text-sage-800 hover:underline"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
