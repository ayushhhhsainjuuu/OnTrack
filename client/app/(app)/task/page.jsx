"use client";

import { useState } from "react";
import {
  Plus,
  Tag,
  Calendar,
  Circle,
  CheckCircle2,
  Clock,
  Trash2,
} from "lucide-react";

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
  HIGH: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300",
  MEDIUM: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300",
  LOW: "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-300",
};

const statusStyle = {
  "To Do": "text-gray-500 dark:text-slate-400",
  "In Progress": "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300",
  Done: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
};

const categories = ["All", "Admin", "Operations", "Training", "Compliance"];
const statusFilters = ["All", "To Do", "In Progress", "Done"];

export default function TasksPage() {
  const [tasks, setTasks] = useState(initialTasks);
  const [catFilter, setCatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const toggleDone = (id) =>
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id
          ? {
              ...task,
              status: task.status === "Done" ? "To Do" : "Done",
            }
          : task
      )
    );

  const removeTask = (id) =>
    setTasks((previous) => previous.filter((task) => task.id !== id));

  const filtered = tasks.filter(
    (task) =>
      (catFilter === "All" || task.cat === catFilter) &&
      (statusFilter === "All" || task.status === statusFilter)
  );

  const doneCount = tasks.filter((task) => task.status === "Done").length;
  const todo = tasks.filter((task) => task.status === "To Do").length;
  const inProgress = tasks.filter((task) => task.status === "In Progress").length;
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  const counts = {
    All: tasks.length,
    "To Do": todo,
    "In Progress": inProgress,
    Done: doneCount,
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
          Tasks
        </p>
        <h1 className="mt-0.5 text-2xl font-bold text-gray-900 dark:text-white">
          Tasks
        </h1>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            My Tasks
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {doneCount} of {tasks.length} completed
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
        >
          <Plus size={16} />
          New Task
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-700 dark:bg-[#111c2d]">
        <div className="mb-2 flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
            Overall progress
          </span>

          <div className="flex items-center gap-6">
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {pct}%
            </span>

            <div className="hidden gap-5 text-center sm:flex">
              {[
                ["To Do", todo],
                ["In Progress", inProgress],
                ["Done", doneCount],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {value}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                statusFilter === filter
                  ? "bg-gray-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:bg-[#111c2d] dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {filter}
              {filter !== "All" ? ` (${counts[filter]})` : ""}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setCatFilter(category)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                catFilter === category
                  ? "bg-[#2563eb] text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:bg-[#111c2d] dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((task) => {
          const done = task.status === "Done";

          return (
            <div
              key={task.id}
              className={`group flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition-colors dark:border-slate-700 dark:bg-[#111c2d] ${
                done ? "opacity-65" : ""
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleDone(task.id)}
                  className="shrink-0"
                  aria-label={done ? "Mark task incomplete" : "Mark task complete"}
                >
                  {done ? (
                    <CheckCircle2 size={20} className="text-emerald-500" />
                  ) : (
                    <Circle
                      size={20}
                      className="text-gray-300 transition hover:text-blue-500 dark:text-slate-600 dark:hover:text-blue-400"
                    />
                  )}
                </button>

                <div className="min-w-0">
                  <p
                    className={`text-sm font-semibold ${
                      done
                        ? "text-gray-400 line-through dark:text-slate-500"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {task.title}
                  </p>

                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-400 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <Tag size={11} />
                      {task.cat}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      Due {task.due}
                    </span>
                    <span>·</span>
                    <span>by {task.by}</span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-semibold ${priorityStyle[task.priority]}`}
                >
                  ● {task.priority}
                </span>

                <span
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle[task.status]}`}
                >
                  {task.status === "In Progress" && <Clock size={11} />}
                  {task.status === "Done" && <CheckCircle2 size={11} />}
                  {task.status === "To Do" && <Circle size={11} />}
                  {task.status}
                </span>

                <button
                  type="button"
                  onClick={() => removeTask(task.id)}
                  className="text-gray-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100 dark:text-slate-600 dark:hover:text-red-400"
                  aria-label={`Delete ${task.title}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-slate-500">
            No tasks match this filter.
          </p>
        )}
      </div>
    </div>
  );
}
