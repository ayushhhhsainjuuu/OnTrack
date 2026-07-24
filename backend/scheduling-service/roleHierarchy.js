export const ROLE_RANK = {
  Owner: 4,
  "General Manager (GM)": 4,
  "Project Manager": 3,
  "Accountant Supervisor": 0,
  Foreman: 2,
  Lead: 2,
  Cleaner: 1,
};

export function canManage(actingRole, targetRole) {
  const actingRank = ROLE_RANK[actingRole] || 0;
  const targetRank = ROLE_RANK[targetRole] || 0;

  return actingRank > targetRank;
}
