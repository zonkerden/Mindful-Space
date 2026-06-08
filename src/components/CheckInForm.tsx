/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Compass, Sunset, Sparkles, Feather } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DailyCheckIn } from "../types";

interface CheckInFormProps {
  onSubmit: (data: {
    stressLevel: number;
    sleepQuality: number;
    energyLevel: number;
    mood: string;
    moodEmoji: string;
    journalEntry: string;
  }) => void;
  isSubmitting: boolean;
}

const PRESET_MOODS = [
  { label: "Serene", emoji: "🌿", description: "Tranquil Garden", color: "text-sage-600" },
  { label: "Joyful", emoji: "✨", description: "Vibrant Spark", color: "text-amber-500" },
  { label: "Rooted", emoji: "🌲", description: "Steady Ground", color: "text-emerald-700" },
  { label: "Anxious", emoji: "🌀", description: "Inner Spiral", color: "text-slate-500" },
  { label: "Tired", emoji: "🔋", description: "Drained Reserve", color: "text-indigo-400" },
  { label: "Restless", emoji: "⚡", description: "Electric Jolt", color: "text-orange-500" },
  { label: "Sad", emoji: "🥀", description: "Heavy Bloom", color: "text-rose-400" },
  { label: "Angry", emoji: "🌋", description: "Volcanic Pulse", color: "text-red-500" },
  { label: "Overwhelmed", emoji: "🌊", description: "Flooding Tide", color: "text-blue-500" }
];

export default function CheckInForm({ onSubmit, isSubmitting }: CheckInFormProps) {
  const [stressLevel, setStressLevel] = useState<number>(5);
  const [sleepQuality, setSleepQuality] = useState<number>(3);
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [mood, setMood] = useState<string>("Rooted");
  const [journalEntry, setJournalEntry] = useState<string>("");

  const getStressLabel = (val: number) => {
    if (val <= 2) return { text: "Serene", color: "text-sage-600 bg-sage-50", fill: "bg-sage-400" };
    if (val <= 4) return { text: "Calm", color: "text-emerald-700 bg-emerald-50", fill: "bg-emerald-400" };
    if (val <= 6) return { text: "Tense", color: "text-amber-700 bg-amber-50", fill: "bg-amber-400" };
    if (val <= 8) return { text: "Overwhelmed", color: "text-orange-700 bg-orange-50", fill: "bg-orange-400" };
    return { text: "Distressed", color: "text-red-700 bg-red-50", fill: "bg-red-400" };
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalEntry.trim()) return;

    const selectedPreset = PRESET_MOODS.find((p) => p.label === mood);
    const emoji = selectedPreset ? selectedPreset.emoji : "🪵";

    onSubmit({
      stressLevel,
      sleepQuality,
      energyLevel,
      mood,
      moodEmoji: emoji,
      journalEntry
    });
    setJournalEntry("");
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onSubmit={handleFormSubmit}
      className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-10 border border-white shadow-[0_8px_30px_-4px_rgba(230,223,211,0.6)] flex flex-col gap-10 max-w-4xl mx-auto"
      id="checkin_submission_form"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sand-100 pb-6">
        <div>
          <h3 className="font-display text-2xl md:text-3xl font-semibold text-sand-800 tracking-tight flex items-center gap-2.5">
            <Sunset className="w-7 h-7 text-sage-500" />
            Daily Alignment
          </h3>
          <p className="text-sand-600 font-sans mt-2 text-sm md:text-base leading-relaxed">
            Take a gentle pause. How is your internal weather today?
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sand-50 rounded-full border border-sand-100/50">
          <Feather className="w-3.5 h-3.5 text-sand-400" />
          <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-sand-500">Reflection Mode</span>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* Stress Level */}
        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between">
            <label className="text-sm font-semibold text-sand-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sand-100 flex items-center justify-center text-[10px] font-mono font-bold text-sand-600">1</span>
              Current Tension Level
            </label>
            <AnimatePresence mode="popLayout">
              <motion.span 
                key={stressLevel}
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                className={`text-xs px-3 py-1 rounded-full font-bold tracking-wide ${getStressLabel(stressLevel).color}`}
              >
                {getStressLabel(stressLevel).text}
              </motion.span>
            </AnimatePresence>
          </div>
          
          <div className="bg-sand-50/60 rounded-2xl p-1.5 border border-sand-100 shadow-inner flex relative h-11">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
              <button
                type="button"
                key={val}
                onClick={() => setStressLevel(val)}
                className={`flex-1 flex justify-center items-center relative z-10 transition-colors cursor-pointer text-sm font-medium ${
                  stressLevel === val ? "text-white" : "text-sand-500 hover:text-sand-800"
                }`}
              >
                {stressLevel === val && (
                  <motion.div
                    layoutId="stressTrack"
                    className="absolute inset-1 rounded-[1rem] bg-sand-800 -z-10 shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {val}
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Rest Restoration */}
          <section className="flex flex-col gap-4">
            <label className="text-sm font-semibold text-sand-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sand-100 flex items-center justify-center text-[10px] font-mono font-bold text-sand-600">2</span>
              Rest Quality
            </label>
            <div className="bg-sand-50/60 rounded-2xl p-1.5 border border-sand-100 shadow-inner flex h-11 gap-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setSleepQuality(val)}
                  className={`flex-1 flex justify-center items-center relative z-10 cursor-pointer text-sm font-bold transition-colors ${
                    sleepQuality === val ? "text-white" : "text-sand-500 hover:text-sand-800"
                  }`}
                >
                  {sleepQuality === val && (
                    <motion.div
                      layoutId="sleepTrack"
                      className="absolute inset-1 rounded-[1rem] bg-sand-800 -z-10 shadow-sm"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  {val}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] uppercase font-mono font-bold tracking-wider text-sand-400 px-2">
              <span>Restless</span>
              <span>Deep Rest</span>
            </div>
          </section>

          {/* Energy Reserve */}
          <section className="flex flex-col gap-4">
            <label className="text-sm font-semibold text-sand-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sand-100 flex items-center justify-center text-[10px] font-mono font-bold text-sand-600">3</span>
              Energy Reserve
            </label>
            <div className="bg-sand-50/60 rounded-2xl p-1.5 border border-sand-100 shadow-inner flex h-11 gap-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setEnergyLevel(val)}
                  className={`flex-1 flex justify-center items-center relative z-10 cursor-pointer text-sm font-bold transition-colors ${
                    energyLevel === val ? "text-white" : "text-sand-500 hover:text-sand-800"
                  }`}
                >
                  {energyLevel === val && (
                    <motion.div
                      layoutId="energyTrack"
                      className="absolute inset-1 rounded-[1rem] bg-sand-800 -z-10 shadow-sm"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  {val}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] uppercase font-mono font-bold tracking-wider text-sand-400 px-2">
              <span>Exhausted</span>
              <span>Vibrant</span>
            </div>
          </section>
        </div>

        {/* Emotion Bubble Grid */}
        <section className="flex flex-col gap-4">
          <label className="text-sm font-semibold text-sand-800 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sand-100 flex items-center justify-center text-[10px] font-mono font-bold text-sand-600">4</span>
            Primary Emotion
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {PRESET_MOODS.map((p) => {
              const isSelected = p.label === mood;
              return (
                <button
                  type="button"
                  key={p.label}
                  onClick={() => setMood(p.label)}
                  className={`relative flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl transition-all z-10 cursor-pointer ${
                    isSelected ? "text-sand-900 bg-white border border-sand-200 shadow-[0_4px_15px_rgba(230,223,211,0.6)]" : "text-sand-700 bg-white border border-sand-100/50 shadow-sm hover:shadow-md hover:border-sand-200"
                  }`}
                >
                  <motion.span 
                    animate={{ scale: isSelected ? 1.15 : 1 }}
                    className="text-xl mb-1 flex-shrink-0"
                  >
                    {p.emoji}
                  </motion.span>
                  <span className={`text-[10px] sm:text-xs font-bold tracking-tight px-1 w-full text-center break-words transition-colors ${isSelected ? p.color : "text-sand-800"}`}>
                    {p.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Journal */}
        <section className="flex flex-col gap-4">
          <label className="text-sm font-semibold text-sand-800 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sand-100 flex items-center justify-center text-[10px] font-mono font-bold text-sand-600">5</span>
            Release Thoughts
          </label>
          <div className="relative group">
            <textarea
              rows={4}
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
              placeholder="What occupies your mind today? Let it flow loosely..."
              required
              className="w-full text-sm md:text-base rounded-[1.5rem] border border-sand-200/60 p-5 bg-sand-50/30 text-sand-800 placeholder-sand-400 focus:outline-none focus:ring-4 focus:ring-sage-100/50 focus:border-sage-300 focus:bg-white transition-all resize-none shadow-inner"
            ></textarea>
            <div className="absolute right-4 bottom-4 transition-opacity opacity-50 group-focus-within:opacity-100">
               <Feather className="w-4 h-4 text-sage-400" />
            </div>
          </div>
        </section>

        {/* Submit */}
        <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-sand-100/60">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-full bg-sage-50 border border-sage-100 flex items-center justify-center text-sage-500 animate-pulse shadow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-sand-800">Inhale peace.</p>
              <p className="text-[10px] text-sand-500 uppercase tracking-widest font-mono font-medium">Exhale release before closing</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !journalEntry.trim()}
            className={`w-full md:w-auto py-3.5 px-8 rounded-[1.25rem] text-sm font-bold tracking-wide cursor-pointer flex items-center justify-center gap-2.5 transition-all outline-none ${
              isSubmitting || !journalEntry.trim()
                ? "bg-sand-100 text-sand-400 cursor-not-allowed shadow-none"
                : "bg-sand-800 hover:bg-black text-sand-50 transform hover:-translate-y-1 shadow-[0_8px_20px_rgba(43,39,34,0.2)] focus:ring-4 focus:ring-sand-200"
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 opacity-75" />
                Store Reflection
              </>
            )}
          </button>
        </div>
      </div>
    </motion.form>
  );
}
