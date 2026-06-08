/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { DailyCheckIn } from "../types";
import { Brain, Moon, Sparkles, Wind, ArrowDown, ArrowUp, Minus, Music, Volume2, VolumeX } from "lucide-react";

interface StatsGridProps {
  logs: DailyCheckIn[];
}

interface BreathCycle {
  name: string;
  ratio: string;
  inhale: number;
  holdFull: number;
  exhale: number;
  holdEmpty: number;
  advice: string;
}

const BREATH_CYCLES: BreathCycle[] = [
  { name: "Box (Panic Relief)", ratio: "4-4-4-4", inhale: 4, holdFull: 4, exhale: 4, holdEmpty: 4, advice: "Resets raw anxiety & centers focus." },
  { name: "Calm (Anti-Anxiety)", ratio: "4-7-8", inhale: 4, holdFull: 7, exhale: 8, holdEmpty: 0, advice: "Triggers deep nervous system relief." },
  { name: "Steady (Centering)", ratio: "4-2-4", inhale: 4, holdFull: 2, exhale: 4, holdEmpty: 0, advice: "A quick, gentle stabilizer." }
];

// Lightweight browser procedural synthesizers for offline ambient soundscapes
class SanctuaryAudioEngine {
  private ctx: AudioContext | null = null;
  private oscillators: any[] = [];
  private gains: any[] = [];
  private noiseNode: any | null = null;
  private filter: any | null = null;
  public currentType: 'celestial' | 'rain' | 'bowl' | null = null;

  init() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  stop() {
    this.oscillators.forEach(o => { try { o.stop(); } catch(e) {} });
    this.gains.forEach(g => { try { g.disconnect(); } catch(e) {} });
    if (this.noiseNode) {
      try { this.noiseNode.disconnect(); } catch(e) {}
    }
    this.oscillators = [];
    this.gains = [];
    this.noiseNode = null;
    this.filter = null;
    this.currentType = null;
  }

  playCelestial(val: number) {
    this.stop();
    this.init();
    if (!this.ctx) return;
    this.currentType = "celestial";

    try {
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(val * 0.15, this.ctx.currentTime);
      masterGain.connect(this.ctx.destination);
      this.gains.push(masterGain);

      const freqs = [110, 130.81, 164.81, 220];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx % 2 === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq + Math.random() * 0.3, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start();

        this.oscillators.push(osc);
        this.gains.push(gain);

        // Sub LFO for gentle analog filter sweeps
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(0.05 + Math.random() * 0.04, this.ctx.currentTime);
        lfoGain.gain.setValueAtTime(1.2, this.ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        this.oscillators.push(lfo);
        this.gains.push(lfoGain);
      });
    } catch (e) {
      console.warn("Audio Context creation warning:", e);
    }
  }

  playRain(val: number) {
    this.stop();
    this.init();
    if (!this.ctx) return;
    this.currentType = "rain";

    try {
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(val * 0.18, this.ctx.currentTime);
      masterGain.connect(this.ctx.destination);
      this.gains.push(masterGain);

      const bufferSize = 4096;
      const noise = this.ctx.createScriptProcessor(bufferSize, 1, 1);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

      noise.onaudioprocess = (e) => {
        const output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Pink noise filter poles
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          b6 = white * 0.115926;
          output[i] = pink * 0.08;
        }
      };

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);

      const windLfo = this.ctx.createOscillator();
      const windLfoGain = this.ctx.createGain();
      windLfo.frequency.setValueAtTime(0.04, this.ctx.currentTime);
      windLfoGain.gain.setValueAtTime(250, this.ctx.currentTime);
      
      windLfo.connect(windLfoGain);
      windLfoGain.connect(filter.frequency);
      windLfo.start();

      noise.connect(filter);
      filter.connect(masterGain);

      this.noiseNode = noise;
      this.filter = filter;
      this.oscillators.push(windLfo);
      this.gains.push(windLfoGain);
    } catch (e) {
      console.warn("Audio Context creation warning:", e);
    }
  }

  playBowl(val: number) {
    this.stop();
    this.init();
    if (!this.ctx) return;
    this.currentType = "bowl";

    try {
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(val * 0.28, this.ctx.currentTime);
      masterGain.connect(this.ctx.destination);
      this.gains.push(masterGain);

      const fund = 144; // low D sing
      const partials = [1.0, 2.01, 3.02, 4.05];
      const partialGains = [0.4, 0.2, 0.1, 0.05];

      partials.forEach((ratio, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(fund * ratio + Math.random() * 0.1, this.ctx.currentTime);
        gain.gain.setValueAtTime(partialGains[idx], this.ctx.currentTime);

        const beatLfo = this.ctx.createOscillator();
        const beatGain = this.ctx.createGain();
        beatLfo.frequency.setValueAtTime(0.12 + Math.random() * 0.1, this.ctx.currentTime);
        beatGain.gain.setValueAtTime(partialGains[idx] * 0.25, this.ctx.currentTime);

        beatLfo.connect(beatGain);
        beatGain.connect(gain.gain);
        beatLfo.start();

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start();

        this.oscillators.push(osc);
        this.oscillators.push(beatLfo);
        this.gains.push(gain);
        this.gains.push(beatGain);
      });
    } catch (e) {
      console.warn("Audio Context creation warning:", e);
    }
  }

  setVolume(val: number) {
    if (!this.ctx) return;
    this.gains.forEach(g => {
      try {
        g.gain.setValueAtTime(val * 0.2, this.ctx!.currentTime);
      } catch (e) {}
    });
  }
}

const audioEngine = new SanctuaryAudioEngine();

export default function StatsGrid({ logs }: StatsGridProps) {
  const [activeTab, setActiveTab] = useState<"breathe" | "soundscape">("breathe");
  
  // Breathing controls
  const [selectedCycleIndex, setSelectedCycleIndex] = useState<number>(0);
  const selectedCycle = BREATH_CYCLES[selectedCycleIndex];

  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold (Full)" | "Exhale" | "Hold (Empty)">("Inhale");
  const [breathTimer, setBreathTimer] = useState<number>(4);
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(false);

  // Soundscape selector
  const [activeSound, setActiveSound] = useState<'celestial' | 'rain' | 'bowl' | null>(null);
  const [volume, setVolume] = useState<number>(0.5);

  // Sync Breathing loop to the active cycle selection
  useEffect(() => {
    if (!isBreathingActive) {
      setBreathPhase("Inhale");
      setBreathTimer(selectedCycle.inhale);
      return;
    }

    let timer = selectedCycle.inhale;
    let phase: "Inhale" | "Hold (Full)" | "Exhale" | "Hold (Empty)" = "Inhale";
    setBreathPhase(phase);
    setBreathTimer(timer);

    const interval = setInterval(() => {
      timer -= 1;
      if (timer <= 0) {
        // Switch phase based on multi-ratio config
        if (phase === "Inhale") {
          if (selectedCycle.holdFull > 0) {
            phase = "Hold (Full)";
            timer = selectedCycle.holdFull;
          } else {
            phase = "Exhale";
            timer = selectedCycle.exhale;
          }
        } else if (phase === "Hold (Full)") {
          phase = "Exhale";
          timer = selectedCycle.exhale;
        } else if (phase === "Exhale") {
          if (selectedCycle.holdEmpty > 0) {
            phase = "Hold (Empty)";
            timer = selectedCycle.holdEmpty;
          } else {
            phase = "Inhale";
            timer = selectedCycle.inhale;
          }
        } else if (phase === "Hold (Empty)") {
          phase = "Inhale";
          timer = selectedCycle.inhale;
        }
        setBreathPhase(phase);
      }
      setBreathTimer(timer);
    }, 1000);

    return () => clearInterval(interval);
  }, [isBreathingActive, selectedCycleIndex]);

  // Audio effect trigger
  useEffect(() => {
    if (!activeSound) {
      audioEngine.stop();
      return;
    }
    if (activeSound === 'celestial') {
      audioEngine.playCelestial(volume);
    } else if (activeSound === 'rain') {
      audioEngine.playRain(volume);
    } else if (activeSound === 'bowl') {
      audioEngine.playBowl(volume);
    }
  }, [activeSound]);

  // Synchronize master volume
  useEffect(() => {
    audioEngine.setVolume(volume);
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioEngine.stop();
    };
  }, []);

  const metrics = useMemo(() => {
    if (logs.length === 0) {
      return {
        avgStress: 0,
        avgSleep: 0,
        commonMood: "None",
        stressTrend: "stable",
        correlation: "Insufficient entry points"
      };
    }

    const stressSum = logs.reduce((acc, log) => acc + log.stressLevel, 0);
    const sleepSum = logs.reduce((acc, log) => acc + log.sleepQuality, 0);
    const avgStress = Number((stressSum / logs.length).toFixed(1));
    const avgSleep = Number((sleepSum / logs.length).toFixed(1));

    // Mood frequency
    const moodCounts: Record<string, number> = {};
    logs.forEach(log => {
      moodCounts[log.mood] = (moodCounts[log.mood] || 0) + 1;
    });
    let commonMood = "None";
    let maxCount = 0;
    Object.entries(moodCounts).forEach(([m, count]) => {
      if (count > maxCount) {
        maxCount = count;
        commonMood = m;
      }
    });

    // Simple trend calculation (last 3 entries compared to prior)
    let stressTrend: "improving" | "stable" | "worsening" = "stable";
    if (logs.length >= 4) {
      const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const recent = sorted.slice(-3);
      const older = sorted.slice(-6, -3);

      if (older.length > 0) {
        const recentAvg = recent.reduce((sum, l) => sum + l.stressLevel, 0) / recent.length;
        const olderAvg = older.reduce((sum, l) => sum + l.stressLevel, 0) / older.length;

        if (recentAvg < olderAvg - 0.5) stressTrend = "improving";
        else if (recentAvg > olderAvg + 0.5) stressTrend = "worsening";
      }
    }

    // Correlation calculation (Sleep quality vs Stress Level)
    let correlation = "Healthy correlation";
    if (logs.length >= 3) {
      let matchingHypothesisCount = 0;
      logs.forEach(log => {
        const goodSleep = log.sleepQuality >= 3;
        const lowStress = log.stressLevel <= 5;
        if (goodSleep === lowStress) {
          matchingHypothesisCount++;
        }
      });
      const ratio = matchingHypothesisCount / logs.length;
      if (ratio >= 0.7) {
        correlation = "High Connection: Sound rest strongly curbs your stress levels.";
      } else if (ratio >= 0.45) {
        correlation = "Moderate: Rest quality supports emotional resilience.";
      } else {
        correlation = "Fluctuating: Your stress seems heavily driven by active external deadlines.";
      }
    }

    return {
      avgStress,
      avgSleep,
      commonMood,
      stressTrend,
      correlation
    };
  }, [logs]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="stats_bento_grid">
      {/* Average Stress Card */}
      <div className="bg-white rounded-3xl p-6 border border-sand-200/80 shadow-[0_4px_16px_rgba(230,223,211,0.3)] flex flex-col justify-between" id="stress_stat_card">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-sand-800">Stress Amplitude</span>
          <Brain className="w-4.5 h-4.5 text-red-500" />
        </div>
        <div className="mt-4">
          <div className="text-3xl font-display font-extrabold text-sand-800">{metrics.avgStress} <span className="text-sm font-normal text-sand-700">/ 10</span></div>
          <p className="text-[11px] text-sand-700 font-sans mt-1">Average stress level across entry logs.</p>
        </div>
        <div className="mt-4 pt-3 border-t border-sand-100 flex items-center justify-between">
          <span className="text-xs text-sand-800 font-sans font-medium">Trend Dynamics:</span>
          {metrics.stressTrend === "improving" && (
            <span className="text-xs font-semibold text-sage-600 flex items-center gap-1">
              <ArrowDown className="w-3.5 h-3.5" /> Improving
            </span>
          )}
          {metrics.stressTrend === "worsening" && (
            <span className="text-xs font-semibold text-red-500 flex items-center gap-1">
              <ArrowUp className="w-3.5 h-3.5" /> Elevated Stress
            </span>
          )}
          {metrics.stressTrend === "stable" && (
            <span className="text-xs font-semibold text-amber-600 flex items-center gap-1">
              <Minus className="w-3.5 h-3.5" /> Stable Waves
            </span>
          )}
        </div>
      </div>

      {/* Sleep quality Card */}
      <div className="bg-white rounded-3xl p-6 border border-sand-200/80 shadow-[0_4px_16px_rgba(230,223,211,0.3)] flex flex-col justify-between" id="sleep_stat_card">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-sand-800">Sleep Level</span>
          <Moon className="w-4.5 h-4.5 text-sage-600" />
        </div>
        <div className="mt-4">
          <div className="text-3xl font-display font-extrabold text-sand-800">{metrics.avgSleep} <span className="text-sm font-normal text-sand-700">/ 5</span></div>
          <p className="text-[11px] text-sand-700 font-sans mt-1">Weighted average of your rest restoration.</p>
        </div>
        <div className="mt-4 pt-3 border-t border-sand-100/80 flex items-center gap-1 text-[11px] font-sans text-sand-800 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <span>Fostering sleep yields peaceful days.</span>
        </div>
      </div>

      {/* Correlation Insights Card */}
      <div className="bg-white rounded-3xl p-6 border border-sand-200/80 shadow-[0_4px_16px_rgba(230,223,211,0.3)] flex flex-col justify-between hover:border-sand-300 transition-all" id="correlation_insight_card">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-sand-800">Dual Correlations</span>
          <div className="w-2 h-2 rounded-full bg-sage-500 animate-ping"></div>
        </div>
        <div className="mt-4">
          <span className="text-xs font-bold text-sage-600 font-sans block mb-1">Most Common Indicator: {metrics.commonMood}</span>
          <p className="text-xs text-sand-800 font-sans leading-relaxed selection:bg-sand-200">
            {metrics.correlation}
          </p>
        </div>
        <div className="text-[10px] font-mono text-sand-700 mt-2">Circadian Analysis</div>
      </div>

      {/* Sanctuary Zone Card (Tabs: Breathing & Soundscapes) */}
      <div className="bg-white rounded-3xl p-5 border border-sand-200/80 shadow-[0_4px_16px_rgba(230,223,211,0.3)] flex flex-col justify-between min-h-[250px]" id="breathing_exercise_card">
        {/* Tab Header Selector */}
        <div className="flex items-center justify-between border-b border-sand-100 pb-2">
          <div className="flex gap-1.5 bg-sand-50 p-1 rounded-xl border border-sand-100/60">
            <button
              onClick={() => setActiveTab("breathe")}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === "breathe" ? "bg-white text-sage-600 shadow-sm" : "text-sand-700/80 hover:text-sand-800"
              }`}
            >
              Breathe
            </button>
            <button
              onClick={() => setActiveTab("soundscape")}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === "soundscape" ? "bg-white text-sage-600 shadow-sm" : "text-sand-700/80 hover:text-sand-800"
              }`}
            >
              Audio
            </button>
          </div>
          {activeTab === "breathe" ? (
            <Wind className={`w-4 s-4 text-sage-500 ${isBreathingActive ? "animate-[spin_6s_linear_infinite]" : ""}`} />
          ) : (
            <Music className={`w-4 h-4 text-sage-500 ${activeSound ? "animate-pulse" : ""}`} />
          )}
        </div>

        {/* Tab contents */}
        {activeTab === "breathe" ? (
          <div className="flex-1 flex flex-col justify-between gap-2.5 pt-2" id="breathing_tab_inner">
            {isBreathingActive ? (
              <div className="flex items-center gap-4 py-1" id="breath_active_view">
                {/* Visual breathing expansion bubble */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-1000 border-2 select-none ${
                    breathPhase === "Inhale"
                      ? "scale-135 bg-sage-50 text-sage-800 border-sage-300 shadow-md"
                      : breathPhase === "Hold (Full)"
                      ? "scale-135 bg-emerald-50 text-emerald-800 border-emerald-300 shadow-md"
                      : breathPhase === "Exhale"
                      ? "scale-100 bg-sand-100 text-sand-800 border-sand-200"
                      : "scale-100 bg-amber-50/50 text-amber-800 border-amber-200"
                  }`}
                >
                  {breathTimer}s
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-sage-800 font-display transition-all duration-300 truncate">{breathPhase}</div>
                  <p className="text-[10px] text-sand-700 mt-0.5 leading-snug">Relax eyes. Breathe along with the expanding circle.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 py-0.5">
                {/* Cycle selector buttons */}
                <div className="flex flex-wrap gap-1" id="breath_cycle_options">
                  {BREATH_CYCLES.map((bc, idx) => (
                    <button
                      key={bc.name}
                      onClick={() => setSelectedCycleIndex(idx)}
                      className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                        selectedCycleIndex === idx
                          ? "bg-sage-600 text-white border-sage-600"
                          : "bg-sand-50/50 hover:bg-sand-100 text-sand-800 border-sand-100"
                      }`}
                    >
                      {bc.name}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-sand-800/95 leading-relaxed font-sans">
                  {selectedCycle.advice}
                </p>
              </div>
            )}

            <button
              onClick={() => setIsBreathingActive(!isBreathingActive)}
              className={`w-full py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                isBreathingActive
                  ? "bg-sand-800 hover:bg-sand-900 text-sand-50"
                  : "bg-sage-100 hover:bg-sage-200 text-sage-700"
              }`}
              id="breath_toggle_button"
            >
              {isBreathingActive ? "Stop Breathing" : `Start Breath (${selectedCycle.ratio})`}
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between gap-2.5 pt-2" id="soundscape_tab_inner">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-sand-800 font-medium">Select dynamic analog synthesizer soundscapes:</span>
              <div className="grid grid-cols-3 gap-1" id="soundscape_selectors">
                {[
                  { type: "celestial", label: "Celestial", desc: "Warm Drone" },
                  { type: "rain", label: "Rain", desc: "Pink Noise" },
                  { type: "bowl", label: "Bowl", desc: "Bell Chime" }
                ].map((s) => {
                  const isActive = activeSound === s.type;
                  return (
                    <button
                      type="button"
                      key={s.type}
                      onClick={() => {
                        if (isActive) {
                          setActiveSound(null);
                        } else {
                          setActiveSound(s.type as any);
                        }
                      }}
                      className={`py-1.5 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                        isActive
                          ? "bg-sage-600 text-white border-sage-600 shadow-inner"
                          : "bg-sand-50/50 hover:bg-sand-100 border-sand-100 text-sand-800"
                      }`}
                    >
                      <div className="text-[10px] font-bold font-sans">{s.label}</div>
                      <div className={`text-[8px] tracking-tight ${isActive ? "text-white/80" : "text-sand-700/80"}`}>{s.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Volume sliders */}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[9px] font-mono text-sand-800 font-bold">VOL:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="flex-1 accent-sage-600 bg-sand-100 rounded-lg h-1 outline-none cursor-pointer"
                />
                <span className="text-[9px] font-mono text-sand-800 font-bold">{Math.round(volume * 100)}%</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (activeSound) {
                  setActiveSound(null);
                } else {
                  setActiveSound("celestial");
                }
              }}
              className={`w-full py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                activeSound
                  ? "bg-red-50 hover:bg-red-100/80 text-red-700 border border-red-100"
                  : "bg-sage-100 hover:bg-sage-200 text-sage-700"
              }`}
            >
              {activeSound ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  Mute Sanctuary Sound
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  Activate Ambient Synth
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
