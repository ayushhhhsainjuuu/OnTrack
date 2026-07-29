import { supabase } from "./db.js";

const TOP_TIER_ROLES = ["Owner", "General Manager (GM)"];

// Determines which accounts/projects a manager is allowed to pull context
// for. Owner and GM see everything. Project Manager is scoped to projects
// where they are account_manager_id. Foreman/Lead are scoped to accounts
// they supervise or are a member of via account_members.
export async function resolveManagerScope(user) {
  if (TOP_TIER_ROLES.includes(user.role)) {
    return { unrestricted: true, accountIds: [], projectIds: [] };
  }

  if (user.role === "Project Manager") {
    const { data, error } = await supabase
      .from("projects")
      .select("id")
      .eq("account_manager_id", user.id);

    if (error) {
      throw new Error(`Failed to resolve project scope: ${error.message}`);
    }

    return {
      unrestricted: false,
      accountIds: [],
      projectIds: (data || []).map((p) => p.id),
    };
  }

  const [supervisedResult, membershipResult] = await Promise.all([
    supabase.from("accounts").select("id").eq("supervisor_id", user.id),
    supabase
      .from("account_members")
      .select("account_id")
      .eq("user_id", user.id),
  ]);

  if (supervisedResult.error) {
    throw new Error(
      `Failed to resolve supervised accounts: ${supervisedResult.error.message}`,
    );
  }

  if (membershipResult.error) {
    throw new Error(
      `Failed to resolve account membership: ${membershipResult.error.message}`,
    );
  }

  const accountIds = Array.from(
    new Set([
      ...(supervisedResult.data || []).map((a) => a.id),
      ...(membershipResult.data || []).map((m) => m.account_id),
    ]),
  );

  return { unrestricted: false, accountIds, projectIds: [] };
}

function applyScope(query, scope) {
  if (scope.unrestricted) {
    return query;
  }

  const filters = [];

  if (scope.accountIds.length) {
    filters.push(`account_id.in.(${scope.accountIds.join(",")})`);
  }

  if (scope.projectIds.length) {
    filters.push(`project_id.in.(${scope.projectIds.join(",")})`);
  }

  if (!filters.length) {
    // No accounts or projects assigned yet - return no rows rather than
    // silently falling through to an unscoped query.
    return query.eq("id", "00000000-0000-0000-0000-000000000000");
  }

  return query.or(filters.join(","));
}

// Fetches raw schedule, clock, and leave data for the given manager's scope
// and date range, plus the names of the users involved. This data is not
// anonymized and not formatted for the model yet - see OC-106 and OC-107.
export async function fetchSummaryContext({ user, startDate, endDate }) {
  if (!startDate || !endDate) {
    throw new Error("startDate and endDate are required.");
  }

  const scope = await resolveManagerScope(user);

  const schedulesQuery = applyScope(
    supabase
      .from("schedules")
      .select(
        "id, user_id, account_id, project_id, start_time, end_time, status, notes",
      )
      .gte("start_time", startDate)
      .lte("start_time", endDate),
    scope,
  );

  const { data: schedules, error: scheduleError } = await schedulesQuery;

  if (scheduleError) {
    throw new Error(`Failed to fetch schedules: ${scheduleError.message}`);
  }

  const userIds = Array.from(
    new Set((schedules || []).map((s) => s.user_id).filter(Boolean)),
  );

  const [clockResult, leaveResult, usersResult] = await Promise.all([
    userIds.length
      ? supabase
          .from("clock_records")
          .select("id, user_id, clock_in_at, clock_out_at")
          .in("user_id", userIds)
          .gte("clock_in_at", startDate)
          .lte("clock_in_at", endDate)
      : Promise.resolve({ data: [], error: null }),
    userIds.length
      ? supabase
          .from("leave_requests")
          .select("id, user_id, start_date, end_date, leave_type, status")
          .in("user_id", userIds)
          .lte("start_date", endDate)
          .gte("end_date", startDate)
      : Promise.resolve({ data: [], error: null }),
    userIds.length
      ? supabase
          .from("users")
          .select("id, full_name, system_role")
          .in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (clockResult.error) {
    throw new Error(
      `Failed to fetch clock records: ${clockResult.error.message}`,
    );
  }

  if (leaveResult.error) {
    throw new Error(
      `Failed to fetch leave requests: ${leaveResult.error.message}`,
    );
  }

  if (usersResult.error) {
    throw new Error(`Failed to fetch users: ${usersResult.error.message}`);
  }

  return {
    range: { startDate, endDate },
    schedules: schedules || [],
    clockRecords: clockResult.data || [],
    leaveRequests: leaveResult.data || [],
    users: usersResult.data || [],
  };
}