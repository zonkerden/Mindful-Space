/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { DailyCheckIn } from "../types";
import { Sparkles, Volume2, VolumeX, CheckSquare, Compass, Quote, MessageSquare, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MindfulnessPanelProps {
  selectedLog: DailyCheckIn | null;
}

export default function MindfulnessPanel({ selectedLog }: MindfulnessPanelProps) {
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [completedTips, setCompletedTips] = useState<Record<string, boolean>>({});
  const [ttsError, setTtsError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      try { audioSourceRef.current.disconnect(); } catch (e) {}
      audioSourceRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      audioContextRef.current = null;
    }
    setIsPlayingVoice(false);
  };

  // Reset completed checklists when active check-in changes
  useEffect(() => {
    setCompletedTips({});
    setTtsError(null);
    // Interrupted voice playbacks if switching logs
    stopAudio();
  }, [selectedLog]);

  // Clean up any remaining TTS loops on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const handleToggleTip = (index: number) => {
    const key = `${selectedLog?.id}-${index}`;
    setCompletedTips(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSpeakAloud = async () => {
    if (!selectedLog || !selectedLog.copingInstructions) return;

    if (isPlayingVoice) {
      stopAudio();
      return;
    }

    try {
      setIsPlayingVoice(true);
      setTtsError(null);
      const { affirmation, insight, copingTips } = selectedLog.copingInstructions;
      const speakText = `Today's positive alignment. ${affirmation}. Gentle reflection. ${insight}. Here are your daily coping strategies. First, ${copingTips[0] || ""}. Second, ${copingTips[1] || ""}. Third, ${copingTips[2] || ""}. Breathe deeply and focus under your calm space.`;

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: speakText })
      });
      
      const data = await response.json();
      
      if (data.audio) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = audioCtx;

        const binaryStr = window.atob(data.audio);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        const pcm16 = new Int16Array(bytes.buffer);
        const audioBuffer = audioCtx.createBuffer(1, pcm16.length, 24000);
        const channelData = audioBuffer.getChannelData(0);
        for (let i = 0; i < pcm16.length; i++) {
           channelData[i] = pcm16[i] / 32768.0; 
        }

        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.onended = () => {
           setIsPlayingVoice(false);
        };
        audioSourceRef.current = source;
        source.start();
      } else {
        setTtsError("Soma audio synthesis is offline; reading mode activated.");
        setIsPlayingVoice(false);
        setTimeout(() => setTtsError(null), 5000);
      }
    } catch (err) {
      console.warn("TTS playback error:", err);
      setTtsError("Audio system busy. Mindful reading mode recommended.");
      setIsPlayingVoice(false);
      setTimeout(() => setTtsError(null), 5000);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {!selectedLog ? (
        <motion.div
          key="empty-panel"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl p-6 md:p-8 border border-sand-200/80 shadow-[0_4px_20px_-4px_rgba(230,223,211,0.5)] flex flex-col justify-center items-center text-center h-full min-h-[300px]"
          id="mindfulness_empty_panel"
        >
          <Compass className="w-12 h-12 text-sage-200 stroke-[1.2] mb-3 animate-[spin_10s_linear_infinite]" />
          <h4 className="font-display text-base font-semibold text-sand-800">Mindful Haven Unlocked</h4>
          <p className="text-xs text-sand-700 font-sans mt-1.5 max-w-sm leading-relaxed">
            Select any historic check-in dot on the graph above or record a new reflection to spawn tailored positive mappings, empathetic summaries, and actionable breathing guides.
          </p>
        </motion.div>
      ) : (
        <motion.div
          key={selectedLog.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white rounded-3xl p-6 md:p-8 border border-sand-200/80 shadow-[0_4px_20px_-4px_rgba(230,223,211,0.5)] flex flex-col gap-6"
          id={`mindfulness_panel_container`}
        >
          {/* Header section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sand-100">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sage-600 px-2 py-0.5 bg-sage-50 rounded-full">
                Emotional Accent: {selectedLog.mood}
              </span>
              <h4 className="font-display text-sm text-sand-700 font-medium mt-1.5 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-sand-700/80" />
                {new Date(selectedLog.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  timeZone: "UTC"
                })}
              </h4>
            </div>

            {/* Read-aloud trigger buttons */}
            <div className="flex flex-col items-start sm:items-end gap-1.5">
              <button
                onClick={handleSpeakAloud}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-300 border ${
                  isPlayingVoice
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-sand-50/50 hover:bg-sand-100 text-sand-800 border-sand-200"
                }`}
                title="Speak Aloud"
                id="tts_speak_aloud_button"
              >
                {isPlayingVoice ? (
                  <>
                    <VolumeX className="w-4 h-4" />
                    Silence Voice
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-sage-600" />
                    Listen with Presence
                  </>
                )}
              </button>
              {ttsError && (
                <span className="text-[10px] text-coral-600 text-red-500 font-sans font-medium animate-pulse">
                  {ttsError}
                </span>
              )}
            </div>
          </div>

          {/* The Affirmations view */}
          <div className="relative bg-sand-50/50 rounded-2xl p-5 md:p-6 border border-sand-100/50 flex flex-col gap-2 italic text-sand-800 text-center select-text">
            <Quote className="absolute -top-3 left-4 w-7 h-7 text-sage-100 rotate-180 opacity-60" />
            <p className="font-display text-base md:text-lg font-medium tracking-tight font-serif text-sage-800 leading-relaxed">
              &ldquo;{selectedLog.copingInstructions?.affirmation || "Be present with your current breath. You are safe here."}&rdquo;
            </p>
          </div>

          {/* The Compassionate Insight summary */}
          <div className="flex flex-col gap-2">
            <h5 className="text-[10px] font-mono font-medium uppercase tracking-wider text-sand-800 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-sage-600" />
              Compassionate View
            </h5>
            <p className="text-sm text-sand-800 font-sans leading-relaxed select-text bg-sand-50/20 p-4 rounded-xl border border-dashed border-sand-200/50">
              {selectedLog.copingInstructions?.insight || "Mindfulness is not about empty thoughts; it is about observing them flowing past like stream water."}
            </p>
          </div>

          {/* The customized Actionable Coping Tips checking list */}
          <div className="flex flex-col gap-3">
            <h5 className="text-[10px] font-mono font-medium uppercase tracking-wider text-sand-800 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-sage-600" />
              Somatic Coping Steps
            </h5>

            <div className="flex flex-col gap-2.5">
              {(selectedLog.copingInstructions?.copingTips || [
                "Follow your breathing: Feel the cold air on your nose tip during inhale.",
                "Root: Feel your sits bones weight anchored tightly to support you.",
                "Release: Make a sigh sound on your exhale."
              ]).map((tip, index) => {
                const checklistKey = `${selectedLog.id}-${index}`;
                const isCompleted = completedTips[checklistKey] || false;

                return (
                  <div
                    key={index}
                    onClick={() => handleToggleTip(index)}
                    className={`flex gap-3 items-start p-3.5 rounded-2xl border cursor-pointer select-none transition-all duration-300 ${
                      isCompleted
                        ? "bg-sage-50/40 border-sage-100/60 opacity-60"
                        : "bg-white border-sand-200/80 hover:border-sage-200 shadow-sm"
                    }`}
                    id={`coping_tip_row_${index}`}
                  >
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center border-2 transition-all mt-0.5 ${
                      isCompleted
                        ? "bg-sage-600 border-sage-600 text-white"
                        : "border-sand-700 bg-white"
                    }`}>
                      {isCompleted && (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs font-sans font-medium text-sand-800 leading-relaxed ${isCompleted ? "line-through text-sand-700" : ""}`}>
                        {tip}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User's Original Written Reflections card */}
          <div className="mt-2 pt-4 border-t border-sand-100 flex flex-col gap-2">
            <h5 className="text-[10px] font-mono font-medium uppercase tracking-wider text-sand-800">
              Your Original Recorded Thought
            </h5>
            <div className="p-4 bg-sand-50/80 rounded-2xl text-xs font-sans text-sand-800 leading-relaxed italic border border-sand-200/50 whitespace-pre-wrap select-text">
              &ldquo;{selectedLog.journalEntry}&rdquo;
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
