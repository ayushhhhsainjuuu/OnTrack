"use client";

import { useState, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// GEOFENCE CONFIG
// Swap these coords and radius for the real office location before production.
// ---------------------------------------------------------------------------
const OFFICE_LAT = 0;   // Calgary City Centre placeholder
const OFFICE_LNG = 0;
const GEOFENCE_RADIUS_METERS = 0;

// ---------------------------------------------------------------------------
// MOCK DATA
// ---------------------------------------------------------------------------
const mockAttendance = [
  { date: "Mon Jun 9",  clockIn: "9:02 AM",  clockOut: "5:03 PM", hours: "8.0", status: "On Time" },
  { date: "Sun Jun 8",  clockIn: "10:00 AM", clockOut: "6:00 PM", hours: "8.0", status: "On Time" },
  { date: "Sat Jun 7",  clockIn: "9:35 AM",  clockOut: "5:30 PM", hours: "7.9", status: "Late"    },
  { date: "Fri Jun 6",  clockIn: "9:00 AM",  clockOut: "5:01 PM", hours: "8.0", status: "On Time" },
  { date: "Thu Jun 5",  clockIn: "-",         clockOut: "-",        hours: "0",   status: "Day Off" },
];

const mockSchedule = [
  { date: "Tue Jun 10", label: "Today",    shift: "10:00 AM - 6:00 PM", role: "Cleaner" },
  { date: "Wed Jun 11", label: "Tomorrow", shift: "9:00 AM - 5:00 PM",  role: "Cleaner" },
  { date: "Thu Jun 12", label: "In 2 days",shift: "Day Off",             role: "-"       },
  { date: "Fri Jun 13", label: "In 3 days",shift: "10:00 AM - 6:00 PM", role: "Cleaner" },
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

// Haversine distance in metres between two lat/lng pairs
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmt(date) {
  return date.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" });
}

function statusClass(status) {
  if (status === "On Time") return "bg-emerald-100 text-emerald-700";
  if (status === "Late")    return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-600";
}

// ---------------------------------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------------------------------

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent || "text-gray-900"}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

// Geofence status banner shown when outside the perimeter
function GeofenceBanner({ distanceMeters }) {
  return (
    <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 flex items-start gap-3">
      <div className="mt-0.5 flex-shrink-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-rose-600">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-rose-700">You're outside the work area</p>
        <p className="text-xs text-rose-600 mt-0.5">
          You're approximately {Math.round(distanceMeters)} m from the designated location.
          Please return to the building to clock in or out.
        </p>
      </div>
    </div>
  );
}

// GPS status pill
function GpsStatus({ gpsState, distanceMeters }) {
  if (gpsState === "loading") {
    return (
      <p className="text-xs text-gray-400 flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
        Detecting location…
      </p>
    );
  }
  if (gpsState === "denied") {
    return (
      <p className="text-xs text-rose-500 flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
        Location access denied — enable GPS to use this feature
      </p>
    );
  }
  if (gpsState === "outside") {
    return (
      <p className="text-xs text-rose-500 flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
        GPS: Outside geofence ({Math.round(distanceMeters)} m away)
      </p>
    );
  }
  return (
    <p className="text-xs text-gray-500 flex items-center gap-1.5">
      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
      GPS: Verified · Within geofence
    </p>
  );
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

export default function EmployeeDashboard({ user }) {
  // --- Clock state ---
  const [clockedIn, setClockedIn]     = useState(false);
  const [clockInTime, setClockInTime] = useState(null);

  // --- Meal break state ---
  const [onMealBreak, setOnMealBreak]       = useState(false);
  const [mealStartTime, setMealStartTime]   = useState(null);
  const [mealLog, setMealLog]               = useState([]); // [{start, end}]

  // --- GPS / geofence state ---
  // gpsState: "loading" | "inside" | "outside" | "denied"
  const [gpsState, setGpsState]             = useState("loading");
  const [coords, setCoords]                 = useState(null);      // { lat, lng }
  const [distanceMeters, setDistanceMeters] = useState(null);

  // Check geofence whenever coords update
  const evaluateGeofence = useCallback((lat, lng) => {
    const dist = haversineDistance(lat, lng, OFFICE_LAT, OFFICE_LNG);
    setDistanceMeters(dist);
    setGpsState(dist <= GEOFENCE_RADIUS_METERS ? "inside" : "outside");
  }, []);

  // Start watching position on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsState("denied");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        evaluateGeofence(lat, lng);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setGpsState("denied");
        else setGpsState("denied");
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [evaluateGeofence]);

  const isInsideGeofence = gpsState === "inside";

  // --- Clock In / Out handler ---
  function handleClock() {
    if (!isInsideGeofence) return;

    if (!clockedIn) {
      setClockInTime(new Date());
      setClockedIn(true);
      setOnMealBreak(false);
      setMealStartTime(null);
      // Real implementation: insert into time_entries with method="clock_in", lat/lng from coords
    } else {
      // If still on a meal break, end it first
      if (onMealBreak) {
        const end = new Date();
        setMealLog((prev) => [...prev, { start: mealStartTime, end }]);
        setOnMealBreak(false);
        setMealStartTime(null);
      }
      setClockedIn(false);
      setClockInTime(null);
      // Real implementation: insert into time_entries with method="clock_out", lat/lng from coords
    }
  }

  // --- Meal Start / End handler ---
  function handleMealBreak() {
    if (!isInsideGeofence) return;
    if (!clockedIn) return;

    if (!onMealBreak) {
      setMealStartTime(new Date());
      setOnMealBreak(true);
      // Real implementation: insert into time_entries with method="meal_start", lat/lng from coords
    } else {
      const end = new Date();
      setMealLog((prev) => [...prev, { start: mealStartTime, end }]);
      setOnMealBreak(false);
      setMealStartTime(null);
      // Real implementation: insert into time_entries with method="meal_end", lat/lng from coords
    }
  }

  // Derive elapsed shift duration string (excluding meal breaks)
  function getShiftLabel() {
    if (!clockInTime) return null;
    const elapsedMs = Date.now() - clockInTime.getTime();
    const totalMealMs = mealLog.reduce((acc, m) => acc + (m.end - m.start), 0) +
      (onMealBreak && mealStartTime ? Date.now() - mealStartTime.getTime() : 0);
    const worked = Math.max(0, elapsedMs - totalMealMs);
    const mins = Math.floor(worked / 60000);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m.toString().padStart(2, "0")}m worked`;
  }

  const clockIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      className={`w-10 h-10 ${clockedIn ? "text-emerald-600" : "text-gray-400"}`}>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );

  const mealIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/>
      <line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  );

  return (
    <div className="space-y-6">
      {/* Geofence warning banner — shown when outside */}
      {gpsState === "outside" && (
        <GeofenceBanner distanceMeters={distanceMeters} />
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Status"
          value={
            onMealBreak ? "On Break" :
            clockedIn   ? "Clocked In" :
                          "Clocked Out"
          }
          sub={
            onMealBreak  ? `Break since ${fmt(mealStartTime)}` :
            clockedIn    ? `Since ${fmt(clockInTime)}` :
                           "Not started"
          }
          accent={
            onMealBreak ? "text-amber-500" :
            clockedIn   ? "text-emerald-600" :
                          "text-gray-900"
          }
        />
        <StatCard label="Hours This Week" value="32.5h" sub="Target: 40h" />
        <StatCard label="Leave Balance"   value="12 days" sub="remaining" accent="text-blue-600" />
        <StatCard label="Next Shift"      value="Tomorrow" sub="10:00 AM - 6:00 PM" accent="text-purple-600" />
      </div>

      {/* Clock panel + schedule */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col items-center justify-center gap-4">
          {/* Clock circle */}
          <div className={`h-24 w-24 rounded-full flex items-center justify-center border-4 shadow-lg transition-all ${
            onMealBreak ? "border-amber-400 bg-amber-50 shadow-amber-100" :
            clockedIn   ? "border-emerald-500 bg-emerald-50 shadow-emerald-200" :
                          "border-gray-300 bg-gray-100 shadow-gray-200"
          }`}>
            {clockIcon}
          </div>

          {/* State label */}
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">
              {onMealBreak ? "On meal break" :
               clockedIn   ? "You're clocked in" :
                             "You're clocked out"}
            </p>
            <p className="text-sm text-gray-500">
              {onMealBreak  ? `Break started at ${fmt(mealStartTime)}` :
               clockedIn    ? getShiftLabel() :
               gpsState === "inside" ? "GPS verified · tap to start shift" :
               gpsState === "loading" ? "Detecting your location…" :
               gpsState === "denied"  ? "Enable location to clock in" :
                                        "Move to the work site to clock in"}
            </p>
          </div>

          {/* Primary clock in/out button */}
          <button
            onClick={handleClock}
            disabled={!isInsideGeofence}
            className={`w-full max-w-xs rounded-2xl px-6 py-3.5 text-sm font-bold shadow-md transition-all text-white
              ${!isInsideGeofence
                ? "bg-gray-300 cursor-not-allowed shadow-none"
                : clockedIn
                  ? "bg-rose-600 hover:bg-rose-500 hover:-translate-y-0.5"
                  : "bg-blue-700 hover:bg-blue-600 hover:-translate-y-0.5"
              }`}
          >
            {clockedIn ? "Clock Out" : "Clock In"}
          </button>

          {/* Meal break button — only visible while clocked in */}
          {clockedIn && (
            <button
              onClick={handleMealBreak}
              disabled={!isInsideGeofence}
              className={`w-full max-w-xs rounded-2xl px-6 py-3 text-sm font-semibold border transition-all flex items-center justify-center gap-2
                ${!isInsideGeofence
                  ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
                  : onMealBreak
                    ? "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
            >
              {mealIcon}
              {onMealBreak ? "End Meal Break" : "Start Meal Break"}
            </button>
          )}

          {/* Meal log — shows completed breaks this shift */}
          {clockedIn && mealLog.length > 0 && (
            <div className="w-full max-w-xs space-y-1.5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Meal breaks</p>
              {mealLog.map((m, i) => {
                const durationMin = Math.round((m.end - m.start) / 60000);
                return (
                  <div key={i} className="flex justify-between rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-xs text-gray-600">
                    <span>{fmt(m.start)} - {fmt(m.end)}</span>
                    <span className="text-gray-400">{durationMin} min</span>
                  </div>
                );
              })}
            </div>
          )}

          <GpsStatus gpsState={gpsState} distanceMeters={distanceMeters} />
        </div>

        {/* Upcoming schedule */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Upcoming Schedule</h3>
          <div className="space-y-3">
            {mockSchedule.map((s, i) => (
              <div
                key={i}
                className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                  i === 0
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-gray-50 border border-gray-100"
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.date}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{s.shift}</p>
                  <p className="text-xs text-gray-500">{s.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent attendance */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Attendance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 pb-3">Date</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-3">Clock In</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-3">Clock Out</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-3">Hours</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockAttendance.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 text-gray-900">{row.date}</td>
                  <td className="py-3 text-gray-600">{row.clockIn}</td>
                  <td className="py-3 text-gray-600">{row.clockOut}</td>
                  <td className="py-3 text-gray-600">{row.hours}h</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClass(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}