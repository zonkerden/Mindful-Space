/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { DailyCheckIn } from "../types";
import { Check, Calendar, Activity, Zap, BookOpen } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart
} from "recharts";

const getMoodEmoji = (mood: string = "", fallback?: string) => {
  const moodClean = mood.trim().toLowerCase();
  const f = fallback ? fallback.trim() : "";
  if (moodClean.includes("serene") || f === "🌱" || f === "🌿") return "🌿";
  if (moodClean.includes("joy") || moodClean.includes("happy") || f === "☀️" || f === "✨") return "✨";
  if (moodClean.includes("root") || f === "🪵" || f === "🌲") return "🌲";
  if (moodClean.includes("anx") || f === "worry") return "🌀";
  if (f === "🌪️" || f === "🌀") return "🌀";
  if (moodClean.includes("tired") || moodClean.includes("exhaust") || f === "💤" || f === "🔋") return "🔋";
  if (moodClean.includes("restless") || moodClean.includes("nervous") || f === "⚡") return "⚡";
  if (moodClean.includes("sad") || moodClean.includes("heavy") || f === "🌧️" || f === "🥀") return "🥀";
  if (moodClean.includes("angry") || moodClean.includes("frustr") || f === "🔥" || f === "🌋") return "🌋";
  if (moodClean.includes("overwhelmed") || moodClean.includes("stress") || f === "🤯" || f === "🌊") return "🌊";
  return fallback || "🌲";
};

const getMoodColors = (mood: string = "") => {
  const m = mood.toLowerCase();
  if (m.includes("joy")) return { bg: "#FEF3C7", border: "#F59E0B" };
  if (m.includes("serene") || m.includes("root")) return { bg: "#ECFDF5", border: "#10B981" };
  if (m.includes("anxious") || m.includes("restless")) return { bg: "#F3E8FF", border: "#A855F7" };
  if (m.includes("tired") || m.includes("sad")) return { bg: "#EFF6FF", border: "#3B82F6" };
  if (m.includes("angry") || m.includes("overwhelmed")) return { bg: "#FEF2F2", border: "#EF4444" };
  return { bg: "#F3F4F6", border: "#9CA3AF" };
};

interface StressChartProps {
  logs: DailyCheckIn[];
  selectedId: string | null;
  onSelectLog: (id: string) => void;
}

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const moodEmoji = getMoodEmoji(data.mood, data.moodEmoji);
    const moodColors = getMoodColors(data.mood);
    
    return (
      <div className="bg-white/95 backdrop-blur-md border border-sand-200/80 p-4 rounded-2xl shadow-xl z-50 min-w-[200px]">
        <h4 className="font-display font-semibold text-sand-800 mb-1 border-b border-sand-100 pb-2">
          {new Date(data.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}
        </h4>
        
        <div className="space-y-2 mt-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-mono uppercase text-red-600 font-bold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Stress
            </span>
            <span className="text-sm font-semibold text-sand-800">{data.stressLevel}/10</span>
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-mono uppercase text-sage-600 font-bold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Sleep
            </span>
            <span className="text-sm font-semibold text-sand-800">{data.sleepQuality}/5</span>
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-mono uppercase text-amber-600 font-bold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Energy
            </span>
            <span className="text-sm font-semibold text-sand-800">{data.energyLevel}/5</span>
          </div>
          
          <div className="mt-3 pt-3 border-t border-sand-100 flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-sm border"
              style={{ backgroundColor: moodColors.bg, borderColor: moodColors.border }}
            >
              {moodEmoji}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-sand-500 uppercase tracking-wide">Mood</span>
              <span className="text-sm font-medium text-sand-800 capitalize leading-tight">{data.mood}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};



export default function StressChart({ logs, selectedId, onSelectLog }: StressChartProps) {
  const [metric, setMetric] = useState<"all" | "stress" | "sleep" | "energy">("all");
  const [timeRange, setTimeRange] = useState<"7days" | "30days" | "all">("all");

  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const chartData = useMemo(() => {
    if (logs.length === 0) return [];
    
    const uniqueLogsMap = new Map<string, DailyCheckIn>();
    logs.forEach(log => {
      // Keep only logs up to today
      if (log.date <= todayStr) {
        uniqueLogsMap.set(log.date, log);
      }
    });

    const parseYYYYMMDD = (str: string) => {
      const [y, m, dayOfMonth] = str.split("-").map(Number);
      return new Date(y, m - 1, dayOfMonth);
    };

    let anchorDateStr = todayStr;
    const sortedDates = Array.from(uniqueLogsMap.keys()).sort();
    if (sortedDates.length > 0 && sortedDates[sortedDates.length - 1] > anchorDateStr) {
      anchorDateStr = sortedDates[sortedDates.length - 1];
    } else if (sortedDates.length > 0 && timeRange !== "all") {
    }

    let minDateStr = todayStr;
    let maxDateStr = todayStr;

    if (timeRange === "all" && sortedDates.length > 0) {
      minDateStr = sortedDates[0];
      maxDateStr = sortedDates[sortedDates.length - 1] > todayStr ? sortedDates[sortedDates.length - 1] : todayStr;
    } else if (timeRange === "7days") {
      const d7 = new Date();
      d7.setDate(d7.getDate() - 6);
      minDateStr = `${d7.getFullYear()}-${String(d7.getMonth() + 1).padStart(2, '0')}-${String(d7.getDate()).padStart(2, '0')}`;
      if (sortedDates.length > 0 && sortedDates[0] < minDateStr && sortedDates[sortedDates.length - 1] < minDateStr) {
        maxDateStr = sortedDates[sortedDates.length - 1];
        const d7_adj = parseYYYYMMDD(maxDateStr);
        d7_adj.setDate(d7_adj.getDate() - 6);
        minDateStr = `${d7_adj.getFullYear()}-${String(d7_adj.getMonth() + 1).padStart(2, '0')}-${String(d7_adj.getDate()).padStart(2, '0')}`;
      } else {
        maxDateStr = todayStr;
      }
    } else if (timeRange === "30days") {
      const d30 = new Date();
      d30.setDate(d30.getDate() - 29);
      minDateStr = `${d30.getFullYear()}-${String(d30.getMonth() + 1).padStart(2, '0')}-${String(d30.getDate()).padStart(2, '0')}`;
      if (sortedDates.length > 0 && sortedDates[0] < minDateStr && sortedDates[sortedDates.length - 1] < minDateStr) {
        maxDateStr = sortedDates[sortedDates.length - 1];
        const d30_adj = parseYYYYMMDD(maxDateStr);
        d30_adj.setDate(d30_adj.getDate() - 29);
        minDateStr = `${d30_adj.getFullYear()}-${String(d30_adj.getMonth() + 1).padStart(2, '0')}-${String(d30_adj.getDate()).padStart(2, '0')}`;
      } else {
        maxDateStr = todayStr;
      }
    }

    // Generate continuous date sequence to last data point
    const paddedData = [];
    let current = parseYYYYMMDD(minDateStr);
    let end = parseYYYYMMDD(maxDateStr);
    // don't let it exceed today just in case
    const localToday = parseYYYYMMDD(todayStr);
    if (end > localToday) end = localToday;

    while (current <= end) {
      const dStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      const log = uniqueLogsMap.get(dStr);
      paddedData.push({
        date: dStr,
        timestamp: current.getTime(),
        id: log?.id || `empty-${dStr}`,
        stressLevel: log ? log.stressLevel : null,
        sleepQuality: log ? log.sleepQuality : null,
        energyLevel: log ? log.energyLevel : null,
        normalizedSleep: log ? log.sleepQuality * 2 : null,
        normalizedEnergy: log ? log.energyLevel * 2 : null,
        mood: log?.mood || undefined,
        moodEmoji: log?.moodEmoji || undefined,
        isEmpty: !log
      });
      current.setDate(current.getDate() + 1);
    }
    
    return paddedData;
  }, [logs, timeRange, todayStr]);

  const stats = useMemo(() => {
    const validLogs = chartData.filter(d => !d.isEmpty);
    if (validLogs.length === 0) return { avgStress: 0, avgSleep: 0, avgEnergy: 0 };
    const stressSum = validLogs.reduce((acc, log) => acc + (log.stressLevel || 0), 0);
    const sleepSum = validLogs.reduce((acc, log) => acc + (log.sleepQuality || 0), 0);
    const energySum = validLogs.reduce((acc, log) => acc + (log.energyLevel || 0), 0);
    return {
      avgStress: Number((stressSum / validLogs.length).toFixed(1)),
      avgSleep: Number((sleepSum / validLogs.length).toFixed(1)),
      avgEnergy: Number((energySum / validLogs.length).toFixed(1)),
    };
  }, [chartData]);

  // Click handler wrapper for Recharts
  const handleChartClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const point = data.activePayload[0].payload;
      if (point && !point.isEmpty && point.id) onSelectLog(point.id);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-sand-200/80 shadow-[0_4px_20px_-4px_rgba(230,223,211,0.5)] flex flex-col gap-6" id="analytics_container">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg md:text-xl font-semibold text-sand-800" id="analytics_heading">Wellness Horizon</h3>
          <p className="text-sm text-sand-700 font-sans mt-0.5 max-w-md">Interactive trend tracking. Hover for exact metrics and tap markers to jump to original entries.</p>
        </div>

        <div className="flex flex-col gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-sand-100 rounded-xl w-fit self-start md:self-end">
            <button
              onClick={() => setTimeRange("7days")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 ${timeRange === "7days" ? "bg-white text-sand-900 shadow-sm" : "text-sand-600 hover:text-black"}`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange("30days")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 ${timeRange === "30days" ? "bg-white text-sand-900 shadow-sm" : "text-sand-600 hover:text-black"}`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeRange("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 ${timeRange === "all" ? "bg-white text-sand-900 shadow-sm" : "text-sand-600 hover:text-black"}`}
            >
              All Time
            </button>
          </div>

          {/* Metric Selector */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-sand-100/50 rounded-xl max-w-full overflow-x-auto border border-sand-200/50" id="metric_selectors">
            <button
              onClick={() => setMetric("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 ${metric === "all" ? "bg-white text-sand-900 shadow-sm border-b border-sand-300" : "text-sand-600 hover:text-black"}`}
            >
              Overview
            </button>
            <button
              onClick={() => setMetric("stress")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 flex items-center gap-1 ${metric === "stress" ? "bg-red-50 text-red-700 shadow-sm border-b border-red-200" : "text-sand-600 hover:text-red-700"}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
              Stress
            </button>
            <button
              onClick={() => setMetric("sleep")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 flex items-center gap-1 ${metric === "sleep" ? "bg-sage-50 text-sage-700 shadow-sm border-b border-sage-200" : "text-sand-600 hover:text-sage-700"}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sage-400"></span>
              Sleep
            </button>
            <button
              onClick={() => setMetric("energy")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 flex items-center gap-1 ${metric === "energy" ? "bg-amber-50 text-amber-700 shadow-sm border-b border-amber-200" : "text-sand-600 hover:text-amber-700"}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Energy
            </button>
          </div>
        </div>
      </div>

      {chartData.filter(d => !d.isEmpty).length < 2 ? (
        <div className="h-[320px] flex flex-col items-center justify-center border border-dashed border-sand-200 bg-sand-50/50 rounded-2xl p-6 text-center" id="empty_chart_state">
          <Calendar className="w-8 h-8 text-sand-300 stroke-[1.5] mb-3" />
          <p className="text-sand-800 font-medium font-sans text-sm">Awaiting daily entries to establish trends</p>
          <p className="text-xs text-sand-600 mt-1.5 max-w-sm leading-relaxed">Complete your first 2 daily check-ins to unlock interactive trend charts.</p>
        </div>
      ) : (
        <div className="h-[320px] min-h-[320px] min-w-0 w-full mt-4" style={{ WebkitTapHighlightColor: 'transparent' }}>
          <ResponsiveContainer width="100%" height={320} minWidth={1}>
            <ComposedChart
              data={chartData}
              margin={{ top: 15, right: 20, left: -25, bottom: 0 }}
              onClick={handleChartClick}
            >
              <defs>
                <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E0D8" />
              <XAxis 
                dataKey="date" 
                interval="preserveStartEnd"
                tickFormatter={(val) => {
                  if (!val || typeof val !== 'string') return "";
                  const parts = val.split('-');
                  if (parts.length !== 3) return val;
                  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                  return `${monthNames[parseInt(parts[1], 10) - 1]} ${parseInt(parts[2], 10)}`;
                }}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#78716c', fontWeight: 500 }}
                dy={10}
              />
              <YAxis 
                domain={[1, 10]} 
                ticks={[2, 4, 6, 8, 10]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#A8A29E', fontWeight: 600, fontFamily: 'monospace' }}
                dx={-10}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: '#D6D3D1', strokeWidth: 1, strokeDasharray: '4 4' }}
              />

              {(metric === "all" || metric === "sleep") && (
                <Area 
                  type="monotone" 
                  dataKey="normalizedSleep" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorSleep)" 
                  strokeWidth={metric === "sleep" ? 3 : 2}
                  activeDot={{ r: metric === "sleep" ? 6 : 4, strokeWidth: 0, fill: "#10b981" }}
                  dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                  connectNulls={true}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              )}
              
              {(metric === "all" || metric === "energy") && (
                <Area 
                  type="monotone" 
                  dataKey="normalizedEnergy" 
                  stroke="#f59e0b" 
                  fillOpacity={1} 
                  fill="url(#colorEnergy)" 
                  strokeWidth={metric === "energy" ? 3 : 2}
                  activeDot={{ r: metric === "energy" ? 6 : 4, strokeWidth: 0, fill: "#f59e0b" }}
                  dot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }}
                  connectNulls={true}
                  isAnimationActive={true}
                  animationDuration={1100}
                />
              )}

              {(metric === "all" || metric === "stress") && (
                <Area 
                  type="monotone" 
                  dataKey="stressLevel" 
                  stroke="#ef4444" 
                  fillOpacity={1} 
                  fill="url(#colorStress)" 
                  strokeWidth={metric === "stress" ? 3.5 : 2.5}
                  activeDot={{ r: metric === "stress" ? 7 : 5, strokeWidth: 2, stroke: "#fff", fill: "#ef4444" }}
                  dot={{ r: 3.5, fill: "#ef4444", strokeWidth: 0 }}
                  connectNulls={true}
                  isAnimationActive={true}
                  animationDuration={1200}
                />
              )}

            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Mini Legend & Trend Analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-sand-100 pt-5" id="analytics_mini_grid">
        <div className="bg-sand-50/50 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
            <Activity className="w-4.5 h-4.5 text-red-600" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-medium uppercase tracking-wider text-sand-700">Avg Stress</div>
            <div className="text-sm font-semibold text-sand-800">{stats.avgStress} <span className="text-[10px] text-sand-500 font-mono">/ 10</span></div>
          </div>
        </div>

        <div className="bg-sand-50/50 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sage-50 flex items-center justify-center flex-shrink-0">
            <Check className="w-4.5 h-4.5 text-sage-600" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-medium uppercase tracking-wider text-sand-700">Avg Sleep</div>
            <div className="text-sm font-semibold text-sand-800">{stats.avgSleep} <span className="text-[10px] text-sand-500 font-mono">/ 5</span></div>
          </div>
        </div>

        <div className="bg-sand-50/50 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-medium uppercase tracking-wider text-sand-700">Avg Energy</div>
            <div className="text-sm font-semibold text-sand-800">{stats.avgEnergy} <span className="text-[10px] text-sand-500 font-mono">/ 5</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}