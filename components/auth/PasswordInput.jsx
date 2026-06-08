"use client";

import { useState } from "react";

export default function PasswordInput({ label, name, placeholder, ...props }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={name}
          name={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#0A3C86] focus:bg-white focus:ring-4 focus:ring-blue-100"
          {...props}
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}