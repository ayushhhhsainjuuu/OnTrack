import { supabase } from "./db.js";
import { canManage } from "./roleHierarchy.js";

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");

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

  req.user = { id: userRow.id, role: userRow.system_role };

  next();
}

export function requireSchedulePermission(getTargetUserId) {
  return async function (req, res, next) {
    try {
      const targetUserId = await getTargetUserId(req);

      if (!targetUserId) {
        return res.status(400).json({
          error: "Could not determine the target user for this schedule.",
        });
      }

      const { data: targetUser, error } = await supabase
        .from("users")
        .select("id, system_role")
        .eq("id", targetUserId)
        .single();

      if (error || !targetUser) {
        return res.status(404).json({ error: "Target user not found." });
      }

      if (!canManage(req.user.role, targetUser.system_role)) {
        return res.status(403).json({
          error: "You do not have permission to manage this user's schedule.",
        });
      }

      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
}
