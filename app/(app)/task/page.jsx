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

  const counts = {
    All: tasks.length,
    "To Do": todo,
    "In Progress": inProgress,
    Done: doneCount,
  };

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
        <button className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white