import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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

// Admin-only: create a Supabase Auth user AND its matching row in the `users` table.
// Requires the service-role key (already used by `supabase` above) since auth.admin.* calls need it.
const RESTRICTED_ROLES = ["owner", "general manager (gm)"];

// Only lets the request through if the caller's own account is Owner or GM
async function requireOwnerOrGM(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "no token" });

  const { data: authData, error: authError } = await supabase.auth.getUser(
    token
  );
  if (authError || !authData?.user) {
    return res.status(401).json({ error: "invalid token" });
  }

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("system_role")
    .eq("id", authData.user.id)
    .single();

  if (userError || !userRow) {
    return res.status(403).json({ error: "No user record found for this account." });
  }

  if (!RESTRICTED_ROLES.includes(userRow.system_role.trim().toLowerCase())) {
    return res.status(403).json({
      error: "Only Owner or General Manager (GM) can create new users",
    });
  }

  next();
}

app.post("/admin/create-user", requireOwnerOrGM, async (req, res) => {
  const { email, password, full_name, system_role, is_active = true } =
    req.body;

  if (!email || !password || !full_name || !system_role) {
    return res.status(400).json({
      error: "email, password, full_name, and system_role are required",
    });
  }

  if (RESTRICTED_ROLES.includes(system_role.trim().toLowerCase())) {
    return res.status(400).json({
      error: "system_role cannot be Owner or General Manager (GM)",
    });
  }

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: system_role },
    });
  if (authError) return res.status(400).json({ error: authError.message });

  const authUser = authData.user;

  // Also store a bcrypt hash of the password on the users row (never the plaintext).
  const passwordHash = await bcrypt.hash(password, 12);

  // Upsert (not insert): a DB trigger may already auto-create a bare users row
  // for the new auth user, so an insert would fail on the duplicate id and
  // leave password/other fields unset. Upsert fills in the full row either way.
  const { data: userRows, error: userError } = await supabase
    .from("users")
    .upsert(
      {
        id: authUser.id,
        email,
        full_name,
        system_role,
        is_active,
        password: passwordHash,
      },
      { onConflict: "id" }
    )
    .select();

  if (userError) {
    console.error("Failed to upsert users row for new employee:", userError);
    // Roll back the auth user so we don't leave an orphaned Supabase Auth account
    await supabase.auth.admin.deleteUser(authUser.id);
    return res.status(400).json({ error: userError.message });
  }

  // The write itself succeeded even if PostgREST didn't hand back the row
  // (e.g. .single() previously threw on 0/many rows) -- don't treat that as
  // a failure and don't delete the auth user we just created.
  const userRow = userRows?.[0] ?? {
    id: authUser.id,
    email,
    full_name,
    system_role,
    is_active,
  };

  res.status(201).json({ user: userRow });
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