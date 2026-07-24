const supabase = require("../config/supabaseClient");

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing authorization token." });
  }

  const { data: authData, error: authError } =
    await supabase.auth.getUser(token);

  if (authError || !authData?.user) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id, system_role, is_active")
    .eq("id", authData.user.id)
    .single();

  if (userError || !userRow) {
    return res
      .status(403)
      .json({ error: "No user record found for this account." });
  }

  if (!userRow.is_active) {
    return res
      .status(403)
      .json({ error: "This account has been deactivated." });
  }

  req.user = {
    id: userRow.id,
    role: userRow.system_role,
  };

  next();
}

module.exports = requireAuth;
