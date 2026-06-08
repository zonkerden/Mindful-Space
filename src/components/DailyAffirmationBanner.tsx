/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function DailyAffirmationBanner() {
  const [affirmation, setAffirmation] = useState<string>("Take a gentle breath. You are exactly where you need to be.");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchWithRetry = async (retries = 3, delay = 1200): Promise<any> => {
    try {
      const response = await fetch("/api/daily-affirmation");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (e) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry(retries - 1, delay * 1.5);
      }
      throw e;
    }
  };

  const fetchAffirmation = async () => {
    setIsLoading(true);
    try {
      const data = await fetchWithRetry();
      if (data && data.affirmation) {
        setAffirmation(data.affirmation.replace(/[""]/g, ""));
      }
    } catch (e) {
      console.warn("Could not retrieve daily affirmation via API. Standard fallback applied gracefully.", e);
      // Soft default so the client remains visually intact
      setAffirmation("Take a gentle breath. You are exactly where you need to be.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAffirmation();
  }, []);

  return (
    <div className="bg-gradient-to-r from-sage-50 to-sand-100/50 rounded-3xl p-6 border border-sage-200/50 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Decorative background element */}
      <div className="absolute -left-10 -top-10 w-40 h-40 bg-sage-200/30 rounded-full blur-3xl" />
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-amber-100/30 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col flex-1 items-center md:items-start text-center md:text-left gap-2">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-sage-600 font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Today's Guidance
        </h3>

        <div className="min-h-[3rem] flex items-center justify-center md:justify-start w-full">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex items-center gap-2"
              >
                <div className="h-4 bg-sage-200/50 rounded-md w-3/4 animate-pulse"></div>
              </motion.div>
            ) : (
              <motion.p
                key={affirmation}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.6 }}
                className="font-display text-lg md:text-xl font-medium text-sand-800 leading-snug tracking-tight"
              >
                {affirmation}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative z-10 flex-shrink-0">
        <button
          onClick={fetchAffirmation}
          disabled={isLoading}
          className="px-4 py-2 bg-white/60 hover:bg-white rounded-xl text-xs font-bold text-sage-700 border border-sage-200/60 shadow-sm transition-all focus:outline-none flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-[spin_3s_linear_infinite]' : ''}`} />
          {isLoading ? "Channeling..." : "New Affirmation"}
        </button>
      </div>
    </div>
  );
}
