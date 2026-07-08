"use client";

import { useState } from "react";
import { Plus, Tag, Calendar, Circle, CheckCircle2, Clock, Trash2 } from "lucide-react";

const initialTasks = [
  { id: 1, title: "Complete end-of-week sales report", cat: "Admin", due: "Jun 10", by: "Manager", priority: "HIGH", status: "In Progress" },
  { id: 2, title: "Restock condiment station before open", cat: "Operations", due: "Jun 10", by: "Lead", priority: "HIGH", status: "To Do" },
  { id: 3, title: "Review updated allergen menu changes", cat: "Training", due: "Jun 11", by: "Manager", priority: "MEDIUM", status: "To Do" },
  { id: 4, title: "Submit uniform sizing for new team members", cat: "Admin", due: "Jun 12", by: "HR", priority: "LOW", status: "To Do" },
  { id: 5, title: "Complete food safety refresher module", cat: "Training", due: "Jun 13", by: "Manager", priority: "MEDIUM", status: "In Progress" },
  { id: 6, title: "Deep clean coffee machine after close", cat: "Operations", due: "Jun 10", by: "Lead", priority: "MEDIUM", status: "To Do" },
  { id: 7, title: "Log fridge temperature checks for the week", cat: "Compliance", due: "Jun 9", by: "Manager", priority: "HIGH", status: "Done" },
  { id: 8, title: "Attend Friday team briefing at 9:00 AM", cat: "Admin", due: "Jun 7", by: "Manager", priority: "LOW", status: "Done" },
];

const priorityStyle = {
  HIGH: "bg-red-50 text-red-600",
  MEDIUM: "bg-amber-50 text-amber-600",
  LOW: "bg-gray-100 text-gray-500",
};

const statusStyle = {
  "To Do": "text-gray-500",
  "In Progress": "bg-blue-50 text-blue-600",
  "Done": "bg-emerald-50 text-emerald-600",
};

const categories = ["All", "Admin", "Operations", "Training", "Compliance"];
const statusFilters = ["All", "To Do", "In Progress", "Done"];

export default function TasksPage() {
  const [tasks, setTasks] = useState(initialTasks);
  const [catFilter, setCatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const toggleDone = (id) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: t.status === "Done" ? "To Do" : "Done" } : t))
    );

  const removeTask = (id) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const filtered = tasks.filter(
    (t) => (catFilter === "All" || t.cat === catFilter) && (statusFilter === "All" || t.status === statusFilter)
  );

  const doneCount = tasks.filter((t) => t.status === "Done").length;
  const todo = tasks.filter((t) => t.status === "To Do").length;
  const inProgress = tasks.filter((t) => t.status === "In Progress").length;
  const pct = Math.round((doneCount / tasks.length) * 100);

  const counts = { All: tasks.length, "To Do": todo, "In Progress": inProgress, Done: doneCount };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tasks</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Tasks</h1>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">My Tasks</h2>
          <p className="text-xs text-gray-500">{doneCount} of {tasks.length} completed</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition">
          <Plus size={16} /> New Task
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall progress</span>
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold text-blue-600">{pct}%</span>
            <div className="hidden sm:flex gap-5 text-center">
              <div><p className="text-lg font-bold text-gray-900">{todo}</p><p className="text-[10px] text-gray-400">To Do</p></div>
              <div><p className="text-lg font-bold text-gray-900">{inProgress}</p><p className="text-[10px] text-gray-400">In Progress</p></div>
              <div><p className="text-lg font-bold text-gray-900">{doneCount}</p><p className="text-[10px] text-gray-400">Done</p></div>
            </div>
          </div>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition ${
                statusFilter === f ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f}{f !== "All" ? ` (${counts[f]})` : ""}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition ${
                catFilter === c ? "bg-[#2563eb] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((t) => {
          const done = t.status === "Done";
          return (
            <div key={t.id} className={`group rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm flex items-center justify-between ${done ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => toggleDone(t.id)} className="shrink-0">
                  {done ? <CheckCircle2 size={20} className="text-emerald-500" /> : <Circle size={20} className="text-gray-300 hover:text-blue-500" />}
                </button>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold text-gray-900 ${done ? "line-through text-gray-400" : ""}`}>{t.title}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <span className="flex items-center gap-1"><Tag size={11} /> {t.cat}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Calendar size={11} /> Due {t.due}</span>
                    <span>·</span>
                    <span>by {t.by}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${priorityStyle[t.priority]}`}>● {t.priority}</span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${statusStyle[t.status]}`}>
                  {t.status === "In Progress" && <Clock size={11} />}
                  {t.status === "Done" && <CheckCircle2 size={11} />}
                  {t.status === "To Do" && <Circle size={11} />}
                  {t.status}
                </span>
                <button onClick={() => removeTask(t.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-sm text-gray-400 py-8">No tasks match this filter.</p>}
      </div>
    </div>
  );
}