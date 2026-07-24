const supabase = require("../config/supabaseClient");
const { canManage } = require("./roleHierarchy");

function requireSchedulePermission(getTargetSchedule) {
  return async function (req, res, next) {
    try {
      const target = await getTargetSchedule(req);

      if (!target || !target.user_id) {
        return res.status(400).json({
          error: "Could not determine the target user for this schedule.",
        });
      }

      const { data: targetUser, error } = await supabase
        .from("users")
        .select("id, system_role")
        .eq("id", target.user_id)
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

module.exports = requireSchedulePermission;
