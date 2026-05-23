const axios = require("axios");

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

const aiClient = axios.create({
  baseURL: AI_URL,
  timeout: 30000,
});

const analyzeDescription = async (description) => {
  try {
    const [categorize, urgency, ner] = await Promise.allSettled([
      aiClient.post("/api/categorize", { description }),
      aiClient.post("/api/urgency", { description }),
      aiClient.post("/api/ner", { text: description }),
    ]);

    return {
      crimeType: categorize.status === "fulfilled" ? categorize.value.data.crime_type : "Other",
      confidence: categorize.status === "fulfilled" ? categorize.value.data.confidence : 0,
      urgency: urgency.status === "fulfilled" ? urgency.value.data.urgency : "LOW",
      urgencyScore: urgency.status === "fulfilled" ? urgency.value.data.score : 0,
      entities: ner.status === "fulfilled" ? ner.value.data : null,
    };
  } catch (err) {
    console.error("AI analysis failed:", err.message);
    return { crimeType: "Other", urgency: "LOW", entities: null };
  }
};

const checkDuplicates = async (description, existingFIRs) => {
  try {
    const { data } = await aiClient.post("/api/duplicate", {
      description,
      existing_firs: existingFIRs,
    });
    return data;
  } catch (err) {
    console.error("Duplicate check failed:", err.message);
    return { is_duplicate: false, highest_similarity: 0, matches: [] };
  }
};

const summarizeCase = async (firText, investigationNotes, crimeType, status) => {
  try {
    const { data } = await aiClient.post("/api/summarize", {
      fir_text: firText,
      investigation_notes: investigationNotes,
      crime_type: crimeType,
      status,
    });
    return data;
  } catch (err) {
    console.error("Summarization failed:", err.message);
    return { summary: "Summary unavailable.", key_points: [], method: "error" };
  }
};

const extractEntities = async (text) => {
  try {
    const { data } = await aiClient.post("/api/ner", { text });
    return data;
  } catch (err) {
    console.error("NER failed:", err.message);
    return null;
  }
};

module.exports = { analyzeDescription, checkDuplicates, summarizeCase, extractEntities };
