import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const PORT = process.env.PORT || 4004;

app.get("/health", (req, res) =>
  res.json({ status: "ok", service: "auth" })
);

// Login: frontend sends email + password, service authenticates via Supabase
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return res.status(401).json({ error: error.message });
  res.json({ session: data.session, user: data.user });
});

// Signup
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ user: data.user });
});

// Verify a token — other services call this to check a request is authenticated
app.post("/verify", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "no token" });

  const { data, error } = await supabase.auth.getUser(token);
  if (error) return res.status(401).json({ error: "invalid token" });

  res.json({ user: data.user });
});

// Logout
app.post("/logout", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const { error } = await supabase.auth.admin.signOut(token);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`auth-service running on ${PORT}`));