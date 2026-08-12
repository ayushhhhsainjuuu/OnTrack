"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Clock,
  Timer,
  Umbrella,
  CalendarClock,
  AlertTriangle,
  UtensilsCrossed,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import ClockPhotoCapture from "./ClockPhotoCapture";
import { literalDateFromIso } from "@/utils/scheduleTime";

const OFFICE_LAT = 51.06474583312273;
const OFFICE_LNG = -114.08930946420794;
const GEOFENCE_RADIUS_METERS = 1000;

// Standard full-time weekly hours, shown as the "Hours This Week" target.
// Not derived from data - every dashboard in the industry shows this as a
// fixed policy figure rather than a per-employee contracted value, and this
// codebase has no contracted-hours column to source it from.
const WEEKLY_HOURS_TARGET = 40;

function haversineDistance(lat1, lng1, lat2, lng2) {
  const radius = 6371000;
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmt(date) {
  return date.toLocaleTimeString("en-CA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function startOfWeek(date) {
  const start = new Date(date);
  const day = start.getDay();
  const diffFromMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffFromMonday);
  start.setHours(0, 0, 0, 0);
  return start;
}

// "Today" / "Tomorrow" / "In N days" for the next few days, then a plain
// date once it's far enough out that a relative label stops being useful.
function relativeDayLabel(date) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTarget = new Date(date);
  startOfTarget.setHours(0, 0, 0, 0);

  const dayDiff = Math.round((startOfTarget - startOfToday) / 86400000);

  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Tomorrow";
  if (dayDiff > 1 && dayDiff <= 6) return `In ${dayDiff} days`;
  return formatDate(date);
}

function statusClass(status) {
  if (status === "Completed") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
  }

  if (status === "In Progress") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300";
  }

  if (status === "Outside Geofence") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300";
  }

  return "bg-gray-100 text-gray-600 dark:bg-[#1a1a1a] dark:text-slate-300";
}

function StatCard({ label, value, sub, accent, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-[#262626] dark:bg-[#121212]">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
          {label}
        </p>
        {Icon && <Icon size={18} className="text-gray-400 dark:text-slate-500" />}
      </div>

      <p className={`mt-2 text-3xl font-bold ${accent || "text-gray-900 dark:text-white"}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{sub}</p>}
    </div>
  );
}

function GeofenceBanner({ distanceMeters }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />

      <div>
        <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
          You're outside the work area
        </p>
        <p className="mt-0.5 text-xs text-rose-600 dark:text-rose-400">
          You're approximately {Math.round(distanceMeters)} m from the designated
          location. Please return to the building to clock in or out.
        </p>
      </div>
    </div>
  );
}

function SiteAssignmentBanner({ message }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />

      <div>
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
          Site assignment needed
        </p>
        <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">{message}</p>
      </div>
    </div>
  );
}

function GpsStatus({ gpsState, distanceMeters }) {
  if (gpsState === "loading") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-gray-300 dark:bg-[#262626]" />
        Detecting location…
      </p>
    );
  }

  if (gpsState === "denied") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400">
        <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
        Location access denied — enable GPS to use this feature
      </p>
    );
  }

  if (gpsState === "outside") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400">
        <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
        GPS: Outside geofence ({Math.round(distanceMeters)} m away)
      </p>
    );
  }

  return (
    <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
      GPS: Verified · Within geofence
    </p>
  );
}

export default function EmployeeDashboard() {
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState(null);
  const [onMealBreak, setOnMealBreak] = useState(false);
  const [mealStartTime, setMealStartTime] = useState(null);
  const [mealLog, setMealLog] = useState([]);
  const [gpsState, setGpsState] = useState("loading");
  const [distanceMeters, setDistanceMeters] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  // Backed by the clock_records table via backend/clock-services (port 4002),
  // proxied through /api/clock. clockRecordId is the open row's id.
  const [clockRecordId, setClockRecordId] = useState(null);
  const [clockBusy, setClockBusy] = useState(false);
  const [clockError, setClockError] = useState("");
  const [lastCoords, setLastCoords] = useState({ lat: null, lng: null });

  // The signed-in user's id, needed to namespace uploads in the
  // "clock-photos" storage bucket (clock-photos/{user_id}/...).
  const [userId, setUserId] = useState(null);

  // Shows the webcam capture modal before a clock-in is submitted. Clock-in
  // proof of presence is required, so the request to /api/clock only fires
  // once a photo has been captured and uploaded.
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);

  // The site (account) this employee clocks into. clock_records has a
  // "clock_records_site_required" check constraint - a clock-in with no
  // account_id and no project_id is rejected by the database. Resolved from
  // account_members (open read policy, same as CreateScheduleForm's
  // accounts fetch) rather than asking the employee to pick one each time.
  const [accountId, setAccountId] = useState(null);
  const [siteName, setSiteName] = useState("");
  const [siteError, setSiteError] = useState("");

  // Clock history backs both the "Hours This Week" stat and the Recent
  // Attendance table - both are derived client-side from the same fetch.
  const [clockHistory, setClockHistory] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  // The caller's own upcoming shifts. The scheduling service returns every
  // schedule in the system (no server-side filtering), so this is filtered
  // down to the signed-in user client-side - same pattern the schedule page
  // already uses.
  const [schedules, setSchedules] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  // The caller's own leave requests, same "filter client-side" situation.
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;

      if (!cancelled) setUserId(uid);

      const { data, error } = await supabase
        .from("account_members")
        .select("account_id")
        .eq("user_id", uid)
        .is("end_date", null)
        .limit(1);

      if (cancelled) return;

      if (error || !data?.length) {
        setSiteError(
          "You are not currently assigned to a site - contact your manager."
        );
        return;
      }

      setAccountId(data[0].account_id);
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!accountId) return;

    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("accounts")
        .select("name")
        .eq("id", accountId)
        .single();

      if (!cancelled && data?.name) setSiteName(data.name);
    })();

    return () => { cancelled = true; };
  }, [accountId]);

  async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };
  }

  // On mount, restore clock state from the database so a page refresh
  // doesn't reset an in-progress shift back to "Clocked Out".
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const headers = await getAuthHeaders();
        if (!headers) return;

        const res = await fetch("/api/clock?open=true", { headers });
        if (!res.ok) return;

        const payload = await res.json();
        if (cancelled || !payload?.record) return;

        setClockRecordId(payload.record.id);
        const start = new Date(payload.record.clock_in_at);
        setClockInTime(start);
        setNow(Date.now());
        setClockedIn(true);
      } catch {
        // service unreachable - leave the UI in its clocked-out default
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const loadClockHistory = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;

      const res = await fetch("/api/clock", { headers });
      if (!res.ok) return;

      const payload = await res.json();
      setClockHistory(payload?.records || []);
    } catch {
      // service unreachable - keep whatever history is already loaded
    } finally {
      setAttendanceLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    loadClockHistory();
  }, [userId, loadClockHistory]);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    (async () => {
      try {
        const headers = await getAuthHeaders();
        if (!headers) return;

        const res = await fetch("/api/schedule", { headers });
        if (!res.ok) return;

        const payload = await res.json();
        const rows = Array.isArray(payload) ? payload : [];
        if (!cancelled) setSchedules(rows.filter((row) => row.user_id === userId));
      } catch {
        // service unreachable - schedule panel stays empty
      } finally {
        if (!cancelled) setScheduleLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    (async () => {
      try {
        const headers = await getAuthHeaders();
        if (!headers) return;

        const res = await fetch("/api/leave", { headers });
        if (!res.ok) return;

        const payload = await res.json();
        const rows = Array.isArray(payload) ? payload : [];
        if (!cancelled) setLeaveRequests(rows.filter((row) => row.user_id === userId));
      } catch {
        // service unreachable - leave stat stays empty
      } finally {
        if (!cancelled) setLeaveLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  const evaluateGeofence = useCallback((lat, lng) => {
    const distance = haversineDistance(lat, lng, OFFICE_LAT, OFFICE_LNG);
    setDistanceMeters(distance);
    setLastCoords({ lat, lng });
    setGpsState(distance <= GEOFENCE_RADIUS_METERS ? "inside" : "outside");
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsState("denied");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        evaluateGeofence(
          position.coords.latitude,
          position.coords.longitude
        );
      },
      () => setGpsState("denied"),
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [evaluateGeofence]);

  // Tick every second while a shift is active so the worked-time counter
  // actually updates instead of freezing at the value from the moment
  // of clocking in (Date.now() alone doesn't trigger re-renders).
  useEffect(() => {
    if (!clockedIn) return;

    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [clockedIn]);

  const isInsideGeofence = gpsState === "inside";

  // Entry point for the Clock In / Clock Out button. Clocking in requires
  // proof-of-presence, so this only opens the photo capture modal; the
  // actual POST happens in submitClockIn once a photo is uploaded.
  // Clocking out has no photo requirement and proceeds immediately.
  async function handleClock() {
    if (!isInsideGeofence || clockBusy) return;

    if (!clockedIn) {
      if (!accountId) {
        setClockError(siteError || "No site assigned yet.");
        return;
      }
      if (!userId) {
        setClockError("You are not signed in.");
        return;
      }
      setClockError("");
      setShowPhotoCapture(true);
      return;
    }

    await submitClockOut();
  }

  // Writes to the clock_records table through backend/clock-services.
  // The service takes user_id from the verified auth token, so the client
  // never sends it - a user can only ever clock themselves in or out.
  async function submitClockIn(photoPath) {
    setClockBusy(true);
    setClockError("");

    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        setClockError("You are not signed in.");
        return;
      }

      const res = await fetch("/api/clock", {
        method: "POST",
        headers,
        body: JSON.stringify({
          account_id: accountId,
          lat: lastCoords.lat,
          lng: lastCoords.lng,
          outside_geofence: !isInsideGeofence,
          photo_url: photoPath,
        }),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setClockError(payload?.error || "Could not clock in.");
        return;
      }

      const start = new Date(payload.record.clock_in_at);
      setClockRecordId(payload.record.id);
      setClockInTime(start);
      setNow(Date.now());
      setClockedIn(true);
      setOnMealBreak(false);
      setMealStartTime(null);
    } catch {
      setClockError("Could not reach the clock service.");
    } finally {
      setClockBusy(false);
    }
  }

  async function submitClockOut() {
    setClockBusy(true);
    setClockError("");

    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        setClockError("You are not signed in.");
        return;
      }

      // Clocking out - close any open meal break first (local only; meal
      // breaks aren't persisted since clock_records has no break columns).
      if (onMealBreak) {
        const end = new Date();
        setMealLog((previous) => [...previous, { start: mealStartTime, end }]);
        setOnMealBreak(false);
        setMealStartTime(null);
      }

      const res = await fetch("/api/clock", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          lat: lastCoords.lat,
          lng: lastCoords.lng,
        }),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setClockError(payload?.error || "Could not clock out.");
        return;
      }

      setClockedIn(false);
      setClockInTime(null);
      setClockRecordId(null);
      loadClockHistory();
    } catch {
      setClockError("Could not reach the clock service.");
    } finally {
      setClockBusy(false);
    }
  }

  function handlePhotoCaptured(photoPath) {
    setShowPhotoCapture(false);
    submitClockIn(photoPath);
  }

  function handlePhotoCancel() {
    setShowPhotoCapture(false);
  }

  function handleMealBreak() {
    if (!isInsideGeofence || !clockedIn) return;

    if (!onMealBreak) {
      setMealStartTime(new Date());
      setOnMealBreak(true);
      return;
    }

    const end = new Date();
    setMealLog((previous) => [
      ...previous,
      { start: mealStartTime, end },
    ]);
    setOnMealBreak(false);
    setMealStartTime(null);
  }

  function getShiftLabel() {
    if (!clockInTime) return null;

    const elapsedMs = now - clockInTime.getTime();
    const totalMealMs =
      mealLog.reduce((total, meal) => total + (meal.end - meal.start), 0) +
      (onMealBreak && mealStartTime
        ? now - mealStartTime.getTime()
        : 0);

    const worked = Math.max(0, elapsedMs - totalMealMs);
    const minutes = Math.floor(worked / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours}h ${remainingMinutes.toString().padStart(2, "0")}m worked`;
  }

  // Sum of completed shifts this week from real clock history, plus the
  // live elapsed time of the current shift (if it started this week).
  const weeklyHours = useMemo(() => {
    const weekStart = startOfWeek(new Date()).getTime();

    let totalMs = clockHistory
      .filter(
        (record) =>
          record.clock_out_at &&
          new Date(record.clock_in_at).getTime() >= weekStart
      )
      .reduce(
        (sum, record) =>
          sum + (new Date(record.clock_out_at) - new Date(record.clock_in_at)),
        0
      );

    if (clockedIn && clockInTime && clockInTime.getTime() >= weekStart) {
      const mealMs =
        mealLog.reduce((total, meal) => total + (meal.end - meal.start), 0) +
        (onMealBreak && mealStartTime ? now - mealStartTime.getTime() : 0);

      totalMs += Math.max(0, now - clockInTime.getTime() - mealMs);
    }

    return totalMs / 3600000;
  }, [clockHistory, clockedIn, clockInTime, now, mealLog, onMealBreak, mealStartTime]);

  const attendanceRows = useMemo(() => {
    return clockHistory.slice(0, 6).map((record) => {
      const start = new Date(record.clock_in_at);
      const end = record.clock_out_at ? new Date(record.clock_out_at) : null;

      let status = "In Progress";
      if (end) status = record.outside_geofence ? "Outside Geofence" : "Completed";

      return {
        id: record.id,
        date: formatDate(start),
        clockIn: fmt(start),
        clockOut: end ? fmt(end) : "—",
        hours: end ? ((end - start) / 3600000).toFixed(1) : "—",
        status,
      };
    });
  }, [clockHistory]);

  const upcomingShifts = useMemo(() => {
    const nowMs = Date.now();

    return schedules
      .filter(
        (schedule) =>
          schedule.status !== "cancelled" &&
          literalDateFromIso(schedule.end_time).getTime() > nowMs
      )
      .sort((a, b) => literalDateFromIso(a.start_time) - literalDateFromIso(b.start_time))
      .slice(0, 4)
      .map((schedule) => {
        const start = literalDateFromIso(schedule.start_time);
        const end = literalDateFromIso(schedule.end_time);

        return {
          id: schedule.id,
          date: formatDate(start),
          relative: relativeDayLabel(start),
          shift: `${fmt(start)} - ${fmt(end)}`,
          detail: schedule.notes || siteName || "Scheduled shift",
        };
      });
  }, [schedules, siteName]);

  const nextShift = upcomingShifts[0] || null;

  const pendingLeaveCount = useMemo(
    () => leaveRequests.filter((request) => request.status === "pending").length,
    [leaveRequests]
  );

  const nextApprovedLeave = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);

    return (
      leaveRequests
        .filter(
          (request) => request.status === "approved" && request.end_date >= todayIso
        )
        .sort((a, b) => a.start_date.localeCompare(b.start_date))[0] || null
    );
  }, [leaveRequests]);

  const leaveValue = nextApprovedLeave
    ? relativeDayLabel(new Date(`${nextApprovedLeave.start_date}T00:00:00`))
    : pendingLeaveCount > 0
      ? `${pendingLeaveCount} Pending`
      : "None";

  const leaveSub = nextApprovedLeave
    ? "Upcoming approved leave"
    : pendingLeaveCount > 0
      ? "Awaiting approval"
      : "No leave requests";

  const dialColor = onMealBreak
    ? "text-amber-600 dark:text-amber-400"
    : clockedIn
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-gray-400 dark:text-slate-500";

  const DialIcon = onMealBreak ? UtensilsCrossed : clockedIn ? CheckCircle2 : Clock;

  return (
    <div className="space-y-6">
      {showPhotoCapture && userId && (
        <ClockPhotoCapture
          userId={userId}
          onCaptured={handlePhotoCaptured}
          onCancel={handlePhotoCancel}
        />
      )}

      {gpsState === "outside" && (
        <GeofenceBanner distanceMeters={distanceMeters} />
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Status"
          icon={onMealBreak ? UtensilsCrossed : clockedIn ? CheckCircle2 : Clock}
          value={
            onMealBreak
              ? "On Break"
              : clockedIn
                ? "Clocked In"
                : "Clocked Out"
          }
          sub={
            onMealBreak
              ? `Break since ${fmt(mealStartTime)}`
              : clockedIn
                ? `Since ${fmt(clockInTime)}`
                : "Not started"
          }
          accent={
            onMealBreak
              ? "text-amber-600 dark:text-amber-400"
              : clockedIn
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-gray-900 dark:text-white"
          }
        />

        <StatCard
          label="Hours This Week"
          icon={Timer}
          value={`${weeklyHours.toFixed(1)}h`}
          sub={`Target: ${WEEKLY_HOURS_TARGET}h`}
        />

        <StatCard
          label="Upcoming Leave"
          icon={Umbrella}
          value={leaveLoading ? "…" : leaveValue}
          sub={leaveLoading ? "Loading…" : leaveSub}
          accent="text-amber-600 dark:text-amber-400"
        />

        <StatCard
          label="Next Shift"
          icon={CalendarClock}
          value={scheduleLoading ? "…" : nextShift ? nextShift.relative : "None scheduled"}
          sub={scheduleLoading ? "Loading…" : nextShift ? nextShift.shift : "No shifts scheduled"}
          accent="text-blue-600 dark:text-blue-400"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-[#262626] dark:bg-[#121212]">
          <div
            className={`flex h-24 w-24 items-center justify-center rounded-full border-4 shadow-lg transition-all ${
              onMealBreak
                ? "border-amber-400 bg-amber-50 shadow-amber-100 dark:bg-amber-950/35 dark:shadow-amber-950/30"
                : clockedIn
                  ? "border-emerald-500 bg-emerald-50 shadow-emerald-200 dark:bg-emerald-950/35 dark:shadow-emerald-950/30"
                  : "border-gray-300 bg-gray-100 shadow-gray-200 dark:border-[#262626] dark:bg-[#1a1a1a] dark:shadow-none"
            }`}
          >
            <DialIcon className={`h-10 w-10 ${dialColor}`} strokeWidth={2} />
          </div>

          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {onMealBreak
                ? "On meal break"
                : clockedIn
                  ? "You're clocked in"
                  : "You're clocked out"}
            </p>

            {clockedIn && (
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Clocked in at {fmt(clockInTime)}
              </p>
            )}

            <p className="text-sm text-gray-500 dark:text-slate-400">
              {onMealBreak
                ? `Break started at ${fmt(mealStartTime)}`
                : clockedIn
                  ? getShiftLabel()
                  : gpsState === "inside"
                    ? "GPS verified · tap to start shift"
                    : gpsState === "loading"
                      ? "Detecting your location…"
                      : gpsState === "denied"
                        ? "Enable location to clock in"
                        : "Move to the work site to clock in"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClock}
            disabled={!isInsideGeofence}
            className={`w-full max-w-xs rounded-2xl px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all ${
              !isInsideGeofence
                ? "cursor-not-allowed bg-gray-300 shadow-none dark:bg-[#1a1a1a] dark:text-slate-400"
                : clockedIn
                  ? "bg-rose-600 hover:-translate-y-0.5 hover:bg-rose-500"
                  : "bg-blue-700 hover:-translate-y-0.5 hover:bg-blue-600"
            }`}
          >
            {clockBusy
              ? "Working..."
              : clockedIn
                ? "Clock Out"
                : "Clock In"}
          </button>

          {clockError && (
            <p className="max-w-xs text-center text-sm font-medium text-rose-600 dark:text-rose-400">
              {clockError}
            </p>
          )}

          {clockedIn && (
            <button
              type="button"
              onClick={handleMealBreak}
              disabled={!isInsideGeofence}
              className={`flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl border px-6 py-3 text-sm font-semibold transition-all ${
                !isInsideGeofence
                  ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 dark:border-[#262626] dark:bg-[#1a1a1a] dark:text-slate-500"
                  : onMealBreak
                    ? "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/35 dark:text-amber-300"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-[#262626] dark:bg-[#1a1a1a] dark:text-slate-200 dark:hover:bg-[#232323]"
              }`}
            >
              <UtensilsCrossed className="h-4 w-4" />
              {onMealBreak ? "End Meal Break" : "Start Meal Break"}
            </button>
          )}

          {clockedIn && mealLog.length > 0 && (
            <div className="w-full max-w-xs space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
                Meal breaks
              </p>

              {mealLog.map((meal, index) => {
                const durationMin = Math.round((meal.end - meal.start) / 60000);

                return (
                  <div
                    key={index}
                    className="flex justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:border-[#262626] dark:bg-[#1a1a1a] dark:text-slate-300"
                  >
                    <span>
                      {fmt(meal.start)} - {fmt(meal.end)}
                    </span>
                    <span className="text-gray-400 dark:text-slate-500">
                      {durationMin} min
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <GpsStatus
            gpsState={gpsState}
            distanceMeters={distanceMeters}
          />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-[#262626] dark:bg-[#121212]">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
            Upcoming Schedule
          </h3>

          {scheduleLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((key) => (
                <div
                  key={key}
                  className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-[#1a1a1a]"
                />
              ))}
            </div>
          ) : upcomingShifts.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-slate-400">
              No upcoming shifts scheduled.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingShifts.map((shift, index) => (
                <div
                  key={shift.id}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                    index === 0
                      ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/35"
                      : "border-gray-100 bg-gray-50 dark:border-[#262626] dark:bg-[#1a1a1a]/60"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {shift.date}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {shift.relative}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {shift.shift}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {shift.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-[#262626] dark:bg-[#121212]">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
          Recent Attendance
        </h3>

        {attendanceLoading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((key) => (
              <div
                key={key}
                className="h-9 animate-pulse rounded-lg bg-gray-100 dark:bg-[#1a1a1a]"
              />
            ))}
          </div>
        ) : attendanceRows.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-slate-400">
            No clock records yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#262626]">
                  {["Date", "Clock In", "Clock Out", "Hours", "Status"].map((heading) => (
                    <th
                      key={heading}
                      className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-[#262626]">
                {attendanceRows.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]/60"
                  >
                    <td className="py-3 text-gray-900 dark:text-white">{row.date}</td>
                    <td className="py-3 text-gray-600 dark:text-slate-300">{row.clockIn}</td>
                    <td className="py-3 text-gray-600 dark:text-slate-300">{row.clockOut}</td>
                    <td className="py-3 text-gray-600 dark:text-slate-300">
                      {row.hours === "—" ? row.hours : `${row.hours}h`}
                    </td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
