"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({
  label,
  name,
  placeholder,
  value,
  onChange,
  required = false,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-slate-700">
        {label}
      </span>

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete="current-password"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pr-12 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#0A3C86] focus:ring-4 focus:ring-blue-100"
        />

        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          title={showPassword ? "Hide password" : "Show password"}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-[#0A3C86] focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          {showPassword ? (
            <EyeOff size={19} />
          ) : (
            <Eye size={19} />
          )}
        </button>
      </div>
    </label>
  );
}