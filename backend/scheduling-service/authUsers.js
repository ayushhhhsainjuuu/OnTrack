import { supabase } from "./db.js";

function formatRole(role) {
  if (!role) return "";

  return String(role)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getUserRole(user) {
  const metadataRole = user.user_metadata?.role || user.app_metadata?.role;

  return formatRole(metadataRole);
}

// Mirrors client/hooks/useAuth.js's getNameFromUser().
function getUserFullName(user) {
  const metadataName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.display_name;

  if (metadataName) return metadataName;

  const emailPrefix = user.email?.split("@")[0];

  if (!emailPrefix) return "OnTrack User";

  return emailPrefix
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

// Fetches every Supabase Auth user
export async function listAssignableEmployees(roles) {
  const matchedRoles = new Set(
    roles.map((role) => role.trim().toLowerCase()).filter(Boolean)
  );

  if (matchedRoles.size === 0) {
    return [];
  }

  const employees = [];
  const perPage = 200;
  let page = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw error;

    const users = data?.users || [];

    for (const user of users) {
      if (user.banned_until) continue;

      const role = getUserRole(user);

      if (!matchedRoles.has(role.toLowerCase())) continue;

      employees.push({
        id: user.id,
        full_name: getUserFullName(user),
        role,
      });
    }

    if (users.length < perPage) break;
    page += 1;
  }

  return employees;
}
