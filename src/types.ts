/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CopingStrategyResponse {
  affirmation: string;
  insight: string;
  copingTips: string[];
}

export interface DailyCheckIn {
  id: string;
  date: string; // Format: YYYY-MM-DD
  stressLevel: number; // 1 to 10 (1 = Serene, 10 = High Overwhelm)
  sleepQuality: number; // 1 to 5 (1 = Poor, 5 = Excellent)
  energyLevel: number; // 1 to 5 (1 = Exhausted, 5 = Vibrant)
  mood: string; // E.g. "Serene", "Anxious", "Rooted", "Tired", "Restless", "Joyful"
  moodEmoji?: string; // Selected emoji representing mood (e.g., "😊", "😔")
  journalEntry: string;
  copingInstructions?: CopingStrategyResponse;
}

export interface DashboardStats {
  averageStress: number;
  averageSleep: number;
  averageEnergy: number;
  stressTrend: "improving" | "stable" | "worsening";
  mostFrequentMood: string;
}
