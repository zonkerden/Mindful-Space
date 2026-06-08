/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client to prevent crash-on-startup
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.warn("GEMINI_API_KEY is not set or holds placeholder value. Running in offline/fallback mode.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Empathy Fallback Generator
function getMockCopingStrategies(stress: number, thoughts: string) {
  const isHighStress = stress >= 7;
  const lowercaseThoughts = thoughts.toLowerCase();

  let affirmation = "You are doing the best you can in this moment, and that is more than enough.";
  let insight = "It sounds like you're carrying a lot on your shoulders today. Realizing where you are is the first courageous step toward peace.";
  let copingTips = [
    "Box Breathing: Inhale for 4 seconds, hold for 4, exhale for 4, hold for 4. Repeat three times.",
    "The 5-4-3-2-1 Grounding Method: Name 5 things you can see, 4 you can feel, 3 you can hear, 2 you can smell, and 1 you can taste.",
    "Somatic Release: Drop your shoulders away from your ears, unclench your jaw, and let go of any tension in your forehead."
  ];

  if (isHighStress) {
    affirmation = "It is safe to let go of what you cannot control right now. Breathe into this quiet space.";
    insight = "Your system is signalling heavy overwhelm. This is a normal response to challenging times—treat yourself with extreme softness.";
    copingTips = [
      "Physical Sensation Shift: Splash your face with cool water or hold an ice cube to stimulate the vagus nerve and ground your system.",
      "The Physiological Sigh: Take two quick inhales through your nose, then a long, slow sigh out through your mouth.",
      "2-Minute Media Cocoon: Turn off notifications, close your eyes, and place your hands comfortably on your lap to rest."
    ];
  } else if (lowercaseThoughts.includes("tired") || lowercaseThoughts.includes("sleep") || lowercaseThoughts.includes("exhaust")) {
    affirmation = "Rest is not earned; it is a fundamental need. You have permission to pause.";
    insight = "Your exhaustion is calling for genuine restoration. The world can wait while you recover your core energy.";
    copingTips = [
      "Tech-Free Horizon: Place screens in another room 30 minutes before resting to let your mind quiet down.",
      "Gentle Extension: Lie down and raise your legs slightly against a wall to relieve deep circulatory stress.",
      "Soothing Warmth: Sip hot caffeine-free tea, focusing entirely on the sensory warmth in your hands."
    ];
  } else {
    // Joyful or balanced states
    affirmation = "Cherish this moment of presence. Let beauty and momentum flow without pressure.";
    insight = "You are cultivating steady, grounded roots. Acknowledging your balanced moments helps secure emotional resilience.";
    copingTips = [
      "Vaporize worry: Write down one small win or highlight of your day in your journal to bookmark this positive feeling.",
      "A conscious step: Walk slowly outside for 3 minutes, feeling the connection between your feet and the earth.",
      "Mindful posture: Elevate your collarbones, bring a slight half-smile to your lips, and enjoy a deep chest breath."
    ];
  }

  return { affirmation, insight, copingTips };
}

// --- API Routes ---

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Post Daily Entry for AI Coping Strategies & Affirmation Synthesis
app.post("/api/coping", async (req, res) => {
  const { stressLevel, sleepQuality, energyLevel, journalEntry, mood } = req.body;

  if (stressLevel === undefined || !journalEntry) {
    return res.status(400).json({ error: "Missing required check-in parameters." });
  }

  const ai = getGeminiClient();

  if (!ai) {
    // Run offline/fallback if no key is supplied
    const fallback = getMockCopingStrategies(Number(stressLevel), journalEntry);
    return res.json({
      ...fallback,
      _mode: "fallback-storage"
    });
  }

  try {
    const prompt = `
      The user checked in their mental state today details below:
      - Stress Level rating: ${stressLevel}/10 (1 is peaceful/serene, 10 is high panic/distress/overwhelm)
      - Sleep Quality: ${sleepQuality}/5 (1 is restless, 5 is deeply restorative)
      - Energy Level: ${energyLevel}/5 (1 is depleted, 5 is fully vibrant)
      - Manifested Mood descriptor: "${mood}"
      - Written Journal Entry: "${journalEntry}"

      Based on these variables, formulate:
      1. A deeply calming, encouraging, and positive affirmation (1-2 sentences) aimed at counteracting any negative sentiments, stress factors, or anxieties expressed in their journal entry. Speak in a loving, warm, and comforting tone.
      2. A gentle, empathetic insight (2-3 sentences) summarizing what their journal text might mean or reassuring them that their feelings are valid. Be a non-judgmental guide.
      3. Exactly 3 actionable coping tips / breathing / somatic grounding exercises. Make them highly specific, practical, and somatic.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elegant, warm, ultra-calming human mental health coach and mindfulness facilitator. Never speak clinically or algorithmically, and prioritize warm, grounding language.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            affirmation: {
              type: Type.STRING,
              description: "A calming, non-cheesy, empathetic affirmation crafted for their specific level of stress and journal tone."
            },
            insight: {
              type: Type.STRING,
              description: "A compassionate, soothing, human response that validates how they feel without diagnosing them."
            },
            copingTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Three tailored, practical, somatic tasks or breathing patterns they can physically do in under two minutes."
            }
          },
          required: ["affirmation", "insight", "copingTips"]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("No text returned from Gemini models.");
    }

    const result = JSON.parse(textOutput.trim());
    return res.json({
      ...result,
      _mode: "ai-generated"
    });
  } catch (err: any) {
    console.log("Coping API: Peak load condition, serving personalized offline coping strategies.");
    // Graceful fallback to avoid interrupting client experience
    const fallback = getMockCopingStrategies(Number(stressLevel), journalEntry);
    return res.json({
      ...fallback,
      _mode: "interrupted-fallback"
    });
  }
});


// Exquisite collection of beautiful mindfulness reflections to use as fallback/caching pool
const MINDFUL_AFFIRMATIONS = [
  "Your breath is a quiet sanctuary. You have permission to step back from the speed of the world and find your own tempo.",
  "You do not need to figure everything out today. Trust the unfolding of your journey, one soft step at a time.",
  "Let your thoughts settle like silt of a quiet lake. Underneath the motion is a deep, undisturbed stillness.",
  "Every transition holds its own quiet beauty. You are allowed to move at the speed of grace, not urgency.",
  "Your worth is inherent; it does not reside in your productivity, your checklist, or the noise of tomorrow.",
  "Breathe in peace, let go of expectations. You are fully equipped to navigate each wave as it arrives.",
  "You are worthy of space, silence, and soft recovery. Your rest is a sacred part of your growth.",
  "The sky does not struggle to hold its clouds, nor does the earth struggle to support your weight. You are held.",
  "Allow yourself to be exactly who you are in this moment. Every shade of your feeling is valid and true.",
  "Your mind is a grand garden. Give yourself gentle soil, spacious sky, and time to bloom in silence.",
  "Like waters flowing to the sea, let your worries glide past you. You are the riverbank, steady and secure.",
  "Peace is not the absence of storm, but the clarity you carry within. You are your own secure harbor.",
  "With every gentle inhalation, draw in warmth and clarity. With every exhale, release the demand to do it all.",
  "You have survived all your previous challenges with courage and grace. Trust the wisdom you carry within.",
  "Step gently into the morning. The light doesn't rush to fill the valley; let yours rise in its own perfect timing."
];

// Simplified in-memory cache to stay extremely gentle on Gemini API quota/loading states
let dailyAffirmationCache = {
  text: "",
  dateString: ""
};

function getDailyFallbackAffirmation(): string {
  const dayIndex = new Date().getDate() % MINDFUL_AFFIRMATIONS.length;
  return MINDFUL_AFFIRMATIONS[dayIndex];
}

// Fetch General Daily Affirmation
app.get("/api/daily-affirmation", async (req, res) => {
  const todayStr = new Date().toDateString();

  if (dailyAffirmationCache.dateString === todayStr && dailyAffirmationCache.text) {
    return res.json({
      affirmation: dailyAffirmationCache.text,
      _mode: "cached"
    });
  }

  const ai = getGeminiClient();

  // If no AI, or offline
  if (!ai) {
    const fallbackVal = getDailyFallbackAffirmation();
    dailyAffirmationCache.text = fallbackVal;
    dailyAffirmationCache.dateString = todayStr;
    return res.json({
      affirmation: fallbackVal,
      _mode: "fallback-cache"
    });
  }

  try {
    const prompt = `
      Generate one single personalized, encouraging, and uplifting positive affirmation for general well-being.
      It should be beautiful, warm, and not cheesy. Maximum 2 sentences.
      Do not include any formatting or quotes, just the text.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a warm, poetic mindfulness coach. Provide an uplifting daily affirmation.",
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("No text returned from Gemini models.");
    }

    const processedText = textOutput.trim();
    dailyAffirmationCache.text = processedText;
    dailyAffirmationCache.dateString = todayStr;

    return res.json({
      affirmation: processedText,
      _mode: "ai-generated"
    });
  } catch (err: any) {
    const fallbackVal = getDailyFallbackAffirmation();
    dailyAffirmationCache.text = fallbackVal;
    dailyAffirmationCache.dateString = todayStr; // Cache today's fallback to prevent throttling calls completely

    console.log("Daily Affirmation API: Handled offline fallback smoothly to save API quota.");
    return res.json({
      affirmation: fallbackVal,
      _mode: "interrupted-fallback"
    });
  }
});

// Fetch AI TTS audio route
app.post("/api/tts", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Missing text payload" });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({ error: "Gemini client not initialized" });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Zephyr" }
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: "Failed to generate audio" });
    }

    return res.json({ audio: base64Audio });
  } catch (err: any) {
    console.log("TTS API: Could not process speech conversion at this time (handled gracefully).");
    return res.status(500).json({ error: err.message });
  }
});

// Serve static assets in production, hook Vite dev middleware in development
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev server middleware integrated into Express.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production bundle from: " + distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express application container listening at http://0.0.0.0:${PORT}`);
  });
}

setupViteOrStatic().catch((err) => {
  console.error("Vite/Express initialization failed:", err);
});
