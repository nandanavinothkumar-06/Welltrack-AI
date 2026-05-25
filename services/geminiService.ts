/// <reference types="vite/client" />
import { GoogleGenerativeAI } from "@google/generative-ai";
import { LogEntry, ChatMessage, DigitalTwinData } from "../types";

// 🌐 Load API key from .env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error("VITE_GEMINI_API_KEY environment variable not set");
}

// 🧠 Initialize Gemini client once
const ai = new GoogleGenerativeAI(API_KEY);

// ✅ Define model constants — Updated to latest stable (2.5)
const GEMINI_MODEL = "gemini-2.5-flash";
const WELLNESS_TIP_MODEL = "gemini-2.5-flash";
const ANALYSIS_MODEL = "gemini-2.5-flash";
const CHAT_MODEL = "gemini-2.5-flash";
const DIGITAL_TWIN_MODEL = "gemini-2.5-flash";

/**
 * 🪴 Digital Twin — AI-generated plant avatar message
 */
export const getDigitalTwinMessage = async (twinData: DigitalTwinData): Promise<string> => {
  const prompt = `
  You are the user's "Digital Twin" — a friendly plant avatar representing their wellness.
  Current state: ${twinData.state}.
  7-day summary:
  - Avg Mood: ${twinData.summary.avgMood.toFixed(1)}
  - Avg Sleep: ${twinData.summary.avgSleep.toFixed(1)}h
  - Habits completed: ${twinData.summary.totalHabits}

  Write a short, kind, first-person message from the plant’s perspective.
  `;

  try {
    const model = ai.getGenerativeModel({ model: DIGITAL_TWIN_MODEL });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating Digital Twin message:", error);
    return "Keep tracking your wellness — I’m growing with you! 🌱";
  }
};

/**
 * 🌟 Personalized Wellness Tip
 */
export const getWellnessTip = async (recentLogs: LogEntry[]): Promise<string> => {
  if (recentLogs.length === 0)
    return "Keep logging your daily wellness to get personalized tips!";

  const latest = recentLogs.at(-1)!;
  const formattedLog = `Date: ${latest.date}, Mood: ${latest.mood}/5, Sleep: ${latest.sleepHours}h, Water: ${latest.waterLiters}L, Habits: [${latest.habits.join(", ") || "None"}], Note: "${latest.note || "N/A"}"`;

  const prompt = `Based on this wellness log, give one short, positive, and actionable tip: ${formattedLog}`;

  try {
    const model = ai.getGenerativeModel({ model: WELLNESS_TIP_MODEL });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating tip:", error);
    return "Could not generate a tip right now — try again soon.";
  }
};

/**
 * 🔍 Correlation Insights (habits ↔ mood ↔ sleep)
 */
export const getCorrelationInsight = async (logs: LogEntry[]): Promise<string> => {
  const formattedLogs = logs
    .map(l => `- ${l.date}: Mood ${l.mood}/5, Sleep ${l.sleepHours}h, Habits [${l.habits.join(", ") || "None"}]`)
    .join("\n");

  const prompt = `Analyze these logs and describe one interesting correlation between sleep, habits, and mood. Keep it under 3 sentences.\n${formattedLogs}`;

  try {
    const model = ai.getGenerativeModel({ model: ANALYSIS_MODEL });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating correlation insight:", error);
    return "Could not analyze the data at this time.";
  }
};
/**
 * 📈 Mood Prediction for the next 7 days (JSON output — with strong parsing fix)
 */
export const getMoodPrediction = async (logs: LogEntry[]) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const startDate = tomorrow.toISOString().split("T")[0];

  const formattedLogs = logs
    .map(
      (l) =>
        `- ${l.date}: Mood ${l.mood}/5, Sleep ${l.sleepHours}h, Habits [${l.habits.join(", ") || "None"}]`
    )
    .join("\n");

  const prompt = `
You are an AI wellness assistant.

Analyze these past mood, sleep, and habit logs:
${formattedLogs}

Now, predict the user's mood (1–5) for **each of the next 7 days starting ${startDate}**.

➡️ Return ONLY valid JSON (no explanations, no markdown).
Format strictly as:

[
  {"date": "YYYY-MM-DD", "predictedMood": 4, "rationale": "Short reason"},
  ...
]
`;

  try {
    const model = ai.getGenerativeModel({ model: ANALYSIS_MODEL });
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    // 🔍 Remove Markdown or code blocks if Gemini returns them
    text = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .replace(/^[^{\[]+/, "") // remove garbage before [
      .replace(/[^}\]]+$/, ""); // remove garbage after ]

    // 🧩 Attempt parsing clean JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.warn("⚠️ AI response not pure JSON, fallback triggered:", text);
      data = null;
    }

    // 🧠 Ensure 7 valid entries
    if (!Array.isArray(data) || data.length < 7) {
      data = Array.from({ length: 7 }).map((_, i) => ({
        date: new Date(tomorrow.getTime() + i * 86400000)
          .toISOString()
          .split("T")[0],
        predictedMood: 3,
        rationale: "Fallback prediction",
      }));
    }

    return data.slice(0, 7);
  } catch (error) {
    console.error("Error generating AI mood prediction:", error);
    return Array.from({ length: 7 }).map((_, i) => ({
      date: new Date(tomorrow.getTime() + i * 86400000)
        .toISOString()
        .split("T")[0],
      predictedMood: 3,
      rationale: "API error fallback",
    }));
  }
};

/**
 * 💬 Chat Assistant (friendly support bot)
 */
export const getMessageFromAssistant = async (
  messages: ChatMessage[],
  logs: LogEntry[]
): Promise<ChatMessage> => {
  const logsText = logs.length
    ? logs.map(l => `- ${l.date}: Mood ${l.mood}/5, Sleep ${l.sleepHours}h, Habits [${l.habits.join(", ") || "None"}]`).join("\n")
    : "No logs available.";

  const lastUserMessage = messages.at(-1)?.parts[0]?.text ?? "Hello!";

  const systemPrompt = `
  You are WellTrack AI — a kind, supportive wellness assistant.
  Use recent logs and chat history to offer brief, empathetic responses.
  Avoid medical or diagnostic advice.
  Logs:\n${logsText}
  `;

  try {
    const model = ai.getGenerativeModel({ model: CHAT_MODEL });
    const chat = model.startChat({ history: messages });
    const response = await chat.sendMessage(lastUserMessage);
    return { role: "model", parts: [{ text: response.response.text() }] };
  } catch (error) {
    console.error("Error in chat:", error);
    return { role: "model", parts: [{ text: "I’m having trouble right now. Please try again later." }] };
  }
};
