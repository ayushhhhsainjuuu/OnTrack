"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "ontrack-theme";

function applyTheme(theme) {
  const root = document.documentElement;

  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
}

export default function useTheme() {
  const [theme, setThemeState] = useState("light");
  const [isThemeLoading, setIsThemeLoading] = useState(true);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_KEY);

    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const startingTheme =
      savedTheme === "dark" || savedTheme === "light"
        ? savedTheme
        : systemPrefersDark
          ? "dark"
          : "light";

    applyTheme(startingTheme);
    setThemeState(startingTheme);
    setIsThemeLoading(false);
  }, []);

  const setTheme = (newTheme) => {
    if (newTheme !== "light" && newTheme !== "dark") {
      return;
    }

    window.localStorage.setItem(THEME_KEY, newTheme);

    applyTheme(newTheme);
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  return {
    theme,
    isDark: theme === "dark",
    isThemeLoading,
    setTheme,
    toggleTheme,
  };
}