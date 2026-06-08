import React, { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../lib/firebase";
import { X, AlertCircle, Heart } from "lucide-react";

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to authenticate with Google");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sand-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-[0_8px_40px_rgba(0,0,0,0.12)] overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-sand-500 hover:text-sand-800 hover:bg-sand-100/50 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-8 pt-10 pb-10">
          <div className="flex items-center justify-center w-12 h-12 bg-sage-50 rounded-2xl mb-6 shadow-sm border border-sage-100 mx-auto">
            <Heart className="w-6 h-6 text-sage-600" />
          </div>
          <h2 className="text-2xl font-bold text-center text-sand-900 mb-2 font-display">
            Welcome
          </h2>
          <p className="text-sm text-center text-sand-600 mb-8 font-sans">
            Sign in to securely persist your mindful insights
          </p>

          {error && (
            <div className="p-3 mb-6 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 bg-white border border-sand-200 hover:bg-sand-50 active:bg-sand-100 text-sand-800 rounded-xl text-sm font-semibold transition-colors disabled:opacity-70 flex items-center justify-center gap-3 shadow-sm"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
            {isLoading ? "Please wait..." : "Continue with Google"}
          </button>
        </div>
      </div>
    </div>
  );
}
