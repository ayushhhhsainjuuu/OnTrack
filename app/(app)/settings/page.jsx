"use client";

import React, { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('app-theme');
    if (saved) setTheme(saved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem('app-theme', theme);
  }, [theme, mounted]);

  const toggleTheme = () => setTheme((p) => (p === 'light' ? 'dark' : 'light'));
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Settings</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Settings</h1>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm max-w-lg">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Appearance</h3>
        <p className="text-xs text-gray-500 mb-4">Choose your preferred theme.</p>
        <button onClick={toggleTheme} className="rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition">
          {isDark ? "Switch to Light" : "Switch to Dark"} Mode
        </button>
        <p className="text-xs text-gray-400 mt-3">Current: {theme}</p>
      </div>
    </div>
  );
}