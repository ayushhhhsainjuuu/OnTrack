"use client";

import { useEffect, useState } from "react";
import { FolderPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";

function Field({ label, value, onChange, placeholder, type = "text", required }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  );
}

function UserSelect({ label, value, onChange, users, required }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="" disabled>
          Select a user
        </option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.full_name}{u.system_role ? ` · ${u.system_role}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

const CAN_VIEW_PROJECTS_ROLES = ["owner", "general manager (gm)"];

export default function ProjectsPage() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    account_manager_id: "",
    start_date: "",
    end_date: "",
  });
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });
  const [authorized, setAuthorized] = useState(null); // null = checking, true/false = resolved

  async function loadProjects() {
    try {
      const res = await fetch("/api/projects");
      const json = await res.json();
      if (res.ok) setProjects(json.projects || []);
    } catch {
      // ignore load errors, form still usable
    }
  }

  async function loadUsers() {
    try {
      const res = await fetch("/api/users");
      const json = await res.json();
      if (res.ok) setUsers(json.users || []);
    } catch {
      // ignore load errors, form still usable
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const role = (
        data?.user?.user_metadata?.role ||
        data?.user?.app_metadata?.role ||
        ""
      ).toLowerCase();
      setAuthorized(CAN_VIEW_PROJECTS_ROLES.includes(role));
      if (data?.user) {
        setForm((f) => ({ ...f, account_manager_id: f.account_manager_id || data.user.id }));
      }
    });
    loadProjects();
    loadUsers();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: "", success: "" });

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      account_manager_id: form.account_manager_id.trim(),
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
    };

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        setStatus({ loading: false, error: json.error || "Failed to create project.", success: "" });
        return;
      }

      setStatus({ loading: false, error: "", success: `Project "${json.project.name}" created.` });
      setForm((f) => ({ ...f, name: "", description: "", start_date: "", end_date: "" }));
      loadProjects();
    } catch {
      setStatus({ loading: false, error: "Network error, please try again.", success: "" });
    }
  }

  if (authorized === null) {
    return null;
  }

  if (authorized === false) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Projects</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Projects</h1>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600">
            You don&apos;t have permission to view this page. Projects are only visible to Owner and General Manager (GM) users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Projects</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Projects</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Create Project</h2>

        {status.error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{status.error}</div>
        )}
        {status.success && (
          <div className="rounded-lg bg-emerald-50 text-emerald-700 text-sm px-3 py-2">{status.success}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Project name"
            value={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder="e.g. Downtown Office Deep Clean"
            required
          />
          <UserSelect
            label="Account manager"
            value={form.account_manager_id}
            onChange={(v) => setForm((f) => ({ ...f, account_manager_id: v }))}
            users={users}
            required
          />
          <Field
            label="Start date"
            type="date"
            value={form.start_date}
            onChange={(v) => setForm((f) => ({ ...f, start_date: v }))}
          />
          <Field
            label="End date"
            type="date"
            value={form.end_date}
            onChange={(v) => setForm((f) => ({ ...f, end_date: v }))}
          />
        </div>

        <label className="block">
          <span className="text-xs font-medium text-gray-500">Description (optional)</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <button
          type="submit"
          disabled={status.loading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition disabled:opacity-50"
        >
          <FolderPlus size={16} /> {status.loading ? "Creating..." : "Create Project"}
        </button>
      </form>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">All Projects</h2>
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
          {projects.length === 0 && (
            <p className="px-5 py-4 text-sm text-gray-500">No projects yet.</p>
          )}
          {projects.map((p) => (
            <div key={p.id} className="px-5 py-4 text-sm">
              <p className="font-semibold text-gray-900">
                {p.name}{" "}
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {p.status}
                </span>
              </p>
              {p.description && <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>}
              <p className="text-xs text-gray-400 mt-1">
                Manager: {users.find((u) => u.id === p.account_manager_id)?.full_name || p.account_manager_id}
                {p.start_date ? ` · ${p.start_date}` : ""}
                {p.end_date ? ` → ${p.end_date}` : ""}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
