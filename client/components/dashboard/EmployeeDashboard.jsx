"use client";

import { useState, useEffect, useCallback } from "react";

const OFFICE_LAT = 0;
const OFFICE_LNG = 0;
const GEOFENCE_RADIUS_METERS = 0;

const mockAttendance = [
  { date: "Mon Jun 9", clockIn: "9:02 AM", clockOut: "5:03 PM", hours: "8.0", status: "On Time" },
  { date: "Sun Jun 8", clockIn: "10:00 AM", clockOut: "6:00 PM", hours: "8.0", status: "On Time" },
  { date: "Sat Jun 7", clockIn: "9:35 AM", clockOut: "5:30 PM", hours: "7.9", status: "Late" },
  { date: "Fri Jun 6", clockIn: "9:00 AM", clockOut: "5:01 PM", hours: "8.0", status: "On Time" },
  { date: "Thu Jun 5", clockIn: "-", clockOut: "-", hours: "0", status: "Day Off" },
];

const mockSchedule = [
  { date: "Tue Jun 10", label: "Today", shift: "10:00 AM - 6:00 PM", role: "Cleaner" },
  { date: "Wed Jun 11", label: "Tomorrow", shift: "9:00 AM - 5:00 PM", role: "Cleaner" },
  { date: "Thu Jun 12", label: "In 2 days", shift: "Day Off", role: "-" },
  { date: "Fri Jun 13", label: "In 3 days", shift: "10:00 AM - 6:00 PM", role: "Cleaner" },
];

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

function statusClass(status) {
  if (status === "On Time") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
  }

  if (status === "Late") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300";
  }

  return "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300";
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-700 dark:bg-[#111c2d]">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
        {label}
      </p>
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
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>

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

function GpsStatus({ gpsState, distanceMeters }) {
  if (gpsState === "loading") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-gray-300 dark:bg-slate-600" />
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

  const evaluateGeofence = useCallback((lat, lng) => {
    const distance = haversineDistance(lat, lng, OFFICE_LAT, OFFICE_LNG);
    setDistanceMeters(distance);
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

  const isInsideGeofence = gpsState === "inside";

  function handleClock() {
    if (!isInsideGeofence) return;

    if (!clockedIn) {
      setClockInTime(new Date());
      setClockedIn(true);
      setOnMealBreak(false);
      setMealStartTime(null);
      return;
    }

    if (onMealBreak) {
      const end = new Date();
      setMealLog((previous) => [
        ...previous,
        { start: mealStartTime, end },
      ]);
      setOnMealBreak(false);
      setMealStartTime(null);
    }

    setClockedIn(false);
    setClockInTime(null);
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

    const elapsedMs = Date.now() - clockInTime.getTime();
    const totalMealMs =
      mealLog.reduce((total, meal) => total + (meal.end - meal.start), 0) +
      (onMealBreak && mealStartTime
        ? Date.now() - mealStartTime.getTime()
        : 0);

    const worked = Math.max(0, elapsedMs - totalMealMs);
    const minutes = Math.floor(worked / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours}h ${remainingMinutes.toString().padStart(2, "0")}m worked`;
  }

  const clockIcon = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-10 w-10 ${
        clockedIn
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-gray-400 dark:text-slate-500"
      }`}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );

  const mealIcon = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  );

  return (
    <div className="space-y-6">
      {gpsState === "outside" && (
        <GeofenceBanner distanceMeters={distanceMeters} />
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Status"
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
              ? "text-amber-500 dark:text-amber-400"
              : clockedIn
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-gray-900 dark:text-white"
          }
        />

        <StatCard label="Hours This Week" value="32.5h" sub="Target: 40h" />
        <StatCard label="Leave Balance" value="12 days" sub="remaining" accent="text-blue-600 dark:text-blue-400" />
        <StatCard label="Next Shift" value="Tomorrow" sub="10:00 AM - 6:00 PM" accent="text-purple-600 dark:text-purple-400" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-700 dark:bg-[#111c2d]">
          <div
            className={`flex h-24 w-24 items-center justify-center rounded-full border-4 shadow-lg transition-all ${
              onMealBreak
                ? "border-amber-400 bg-amber-50 shadow-amber-100 dark:bg-amber-950/35 dark:shadow-amber-950/30"
                : clockedIn
                  ? "border-emerald-500 bg-emerald-50 shadow-emerald-200 dark:bg-emerald-950/35 dark:shadow-emerald-950/30"
                  : "border-gray-300 bg-gray-100 shadow-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:shadow-none"
            }`}
          >
            {clockIcon}
          </div>

          <div className="text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {onMealBreak
                ? "On meal break"
                : clockedIn
                  ? "You're clocked in"
                  : "You're clocked out"}
            </p>

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
            className={`w-full max-w-xs rounded-2xl px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all ${
              !isInsideGeofence
                ? "cursor-not-allowed bg-gray-300 shadow-none dark:bg-slate-700 dark:text-slate-400"
                : clockedIn
                  ? "bg-rose-600 hover:-translate-y-0.5 hover:bg-rose-500"
                  : "bg-blue-700 hover:-translate-y-0.5 hover:bg-blue-600"
            }`}
          >
            {clockedIn ? "Clock Out" : "Clock In"}
          </button>

          {clockedIn && (
            <button
              type="button"
              onClick={handleMealBreak}
              disabled={!isInsideGeofence}
              className={`flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl border px-6 py-3 text-sm font-semibold transition-all ${
                !isInsideGeofence
                  ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                  : onMealBreak
                    ? "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/35 dark:text-amber-300"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {mealIcon}
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
                    className="flex justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
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

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-700 dark:bg-[#111c2d]">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
            Upcoming Schedule
          </h3>

          <div className="space-y-3">
            {mockSchedule.map((schedule, index) => (
              <div
                key={`${schedule.date}-${schedule.shift}`}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                  index === 0
                    ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/35"
                    : "border-gray-100 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/60"
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {schedule.date}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {schedule.label}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {schedule.shift}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {schedule.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-700 dark:bg-[#111c2d]">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
          Recent Attendance
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700">
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

            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {mockAttendance.map((row) => (
                <tr
                  key={row.date}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60"
                >
                  <td className="py-3 text-gray-900 dark:text-white">{row.date}</td>
                  <td className="py-3 text-gray-600 dark:text-slate-300">{row.clockIn}</td>
                  <td className="py-3 text-gray-600 dark:text-slate-300">{row.clockOut}</td>
                  <td className="py-3 text-gray-600 dark:text-slate-300">{row.hours}h</td>
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
      </div>
    </div>
  );
}
