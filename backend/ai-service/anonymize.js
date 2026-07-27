// Replaces real employee names/IDs with stable pseudonyms and strips
// free-text notes before context data is sent to the Claude API. The
// same person gets the same pseudonym everywhere in the returned
// context, so the summary can still compare "Employee A" against
// "Employee B" without ever seeing a real name.

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function makePseudonym(index) {
  if (index < LETTERS.length) {
    return `Employee ${LETTERS[index]}`;
  }
  // Falls back to AA, AB, AC... if there are more than 26 people.
  const first = Math.floor(index / LETTERS.length) - 1;
  const second = index % LETTERS.length;
  return `Employee ${LETTERS[first]}${LETTERS[second]}`;
}

export function anonymizeContext(context) {
  const pseudonymByUserId = new Map();

  (context.users || []).forEach((user, index) => {
    pseudonymByUserId.set(user.id, makePseudonym(index));
  });

  function pseudonymFor(userId) {
    if (!userId) return null;
    if (!pseudonymByUserId.has(userId)) {
      pseudonymByUserId.set(userId, makePseudonym(pseudonymByUserId.size));
    }
    return pseudonymByUserId.get(userId);
  }

  const schedules = (context.schedules || []).map((s) => ({
    employee: pseudonymFor(s.user_id),
    start_time: s.start_time,
    end_time: s.end_time,
    status: s.status,
    // notes intentionally dropped - free text may contain PII
  }));

  const clockRecords = (context.clockRecords || []).map((c) => ({
    employee: pseudonymFor(c.user_id),
    clock_in: c.clock_in,
    clock_out: c.clock_out,
  }));

  const leaveRequests = (context.leaveRequests || []).map((l) => ({
    employee: pseudonymFor(l.user_id),
    start_date: l.start_date,
    end_date: l.end_date,
    type: l.type,
    status: l.status,
  }));

  const employees = (context.users || []).map((u) => ({
    employee: pseudonymFor(u.id),
    role: u.system_role,
  }));

  return {
    range: context.range,
    schedules,
    clockRecords,
    leaveRequests,
    employees,
  };
}
