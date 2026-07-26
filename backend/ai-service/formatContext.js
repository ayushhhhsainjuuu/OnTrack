// Takes the anonymized context (flat arrays keyed by pseudonym) and
// restructures it grouped by employee, so the model can read one
// person's full picture in one place instead of cross-referencing
// three separate lists itself.

export function formatContext(anonymized) {
  const byEmployee = new Map();

  function getEntry(pseudonym) {
    if (!pseudonym) return null;
    if (!byEmployee.has(pseudonym)) {
      byEmployee.set(pseudonym, {
        employee: pseudonym,
        role: null,
        schedules: [],
        clockRecords: [],
        leaveRequests: [],
      });
    }
    return byEmployee.get(pseudonym);
  }

  (anonymized.employees || []).forEach((e) => {
    const entry = getEntry(e.employee);
    if (entry) entry.role = e.role;
  });

  (anonymized.schedules || []).forEach((s) => {
    const entry = getEntry(s.employee);
    if (entry) {
      entry.schedules.push({
        start_time: s.start_time,
        end_time: s.end_time,
        status: s.status,
      });
    }
  });

  (anonymized.clockRecords || []).forEach((c) => {
    const entry = getEntry(c.employee);
    if (entry) {
      entry.clockRecords.push({
        clock_in: c.clock_in,
        clock_out: c.clock_out,
      });
    }
  });

  (anonymized.leaveRequests || []).forEach((l) => {
    const entry = getEntry(l.employee);
    if (entry) {
      entry.leaveRequests.push({
        start_date: l.start_date,
        end_date: l.end_date,
        type: l.type,
        status: l.status,
      });
    }
  });

  const employees = Array.from(byEmployee.values()).map((entry) => ({
    ...entry,
    summary_counts: {
      total_schedules: entry.schedules.length,
      total_clock_records: entry.clockRecords.length,
      total_leave_requests: entry.leaveRequests.length,
    },
  }));

  return {
    range: anonymized.range,
    employee_count: employees.length,
    employees,
  };
}
