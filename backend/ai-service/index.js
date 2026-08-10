import express from "express";
import cors from "cors";
import { requireAuth, requireManagerRole } from "./auth.js";
import { generateSummary } from "./claudeClient.js";
import { fetchSummaryContext } from "./dataFetch.js";
import { anonymizeContext } from "./anonymize.js";
import { formatContext } from "./formatContext.js";
import { buildAnalytics } from "./analytics.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4005;

app.get("/health", (req, res) => res.json({ status: "ok", service: "ai" }));

app.use("/ai", requireAuth, requireManagerRole);

// Chart-ready analytics for the dashboard, scoped to what the requesting
// manager can see. Uses the same clock_in_at / clock_out_at columns and the
// same 2-hour shift-matching window as the client-side analytics code.
app.get("/ai/analytics", async (req, res) => {
  const weeks = Number.parseInt(req.query.weeks, 10) || 6;

  try {
    const data = await buildAnalytics({ user: req.user, weeks });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
    const anonymized = anonymizeContext(context);
    const formatted = formatContext(anonymized);
    res.json(formatted);
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
