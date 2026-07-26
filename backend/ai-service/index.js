import express from "express";
import cors from "cors";
import { requireAuth, requireManagerRole } from "./auth.js";
import { generateSummary } from "./claudeClient.js";
import { fetchSummaryContext } from "./dataFetch.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4005;

app.get("/health", (req, res) => res.json({ status: "ok", service: "ai" }));

app.use("/ai", requireAuth, requireManagerRole);

// Returns the raw, unanonymized, unformatted context for a given date
// range, scoped to what the requesting manager can see. Intended for
// OC-106 (PII anonymization) and OC-107 (JSON formatting) to consume,
// and useful on its own for verifying scope/date filtering while those
// land.
app.get("/ai/context", async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ error: "startDate and endDate query params are required." });
  }

  try {
    const context = await fetchSummaryContext({
      user: req.user,
      startDate,
      endDate,
    });
    res.json(context);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accepts context data that has already been fetched from Supabase and
// anonymized/formatted upstream (see the data-fetch, PII anonymization,
// and JSON formatting tickets). This endpoint's only job is turning that
// context into a natural-language summary via Claude.
app.post("/ai/summary", async (req, res) => {
  const { reportType, context } = req.body;

  if (!context) {
    return res
      .status(400)
      .json({ error: "Missing 'context' in request body." });
  }

  const systemPrompt =
    "You are an assistant that writes concise, factual workforce management " +
    "summaries for a cleaning company's managers. Only use the data provided " +
    "in the context. Do not invent numbers, names, or events that are not " +
    "present in the context.";

  const userPrompt =
    `Report type: ${reportType || "general"}\n\n` +
    `Context data:\n${JSON.stringify(context, null, 2)}\n\n` +
    "Write a short summary of key patterns, notable changes, and anything " +
    "that needs attention.";

  try {
    const summary = await generateSummary({ systemPrompt, userPrompt });
    res.json({ summary });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`ai-service running on ${PORT}`));
