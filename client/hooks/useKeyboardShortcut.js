"use client";
import { useEffect } from "react";

export function useKeyboardShortcut(keyCombo, callback, deps = []) {
  useEffect(() => {
    function handler(e) {
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(
        document.activeElement?.tagName,
      );
      if (isTyping) return; // don't fire while user is typing in a field

      const keys = keyCombo.toLowerCase().split("+");
      const ctrl = keys.includes("ctrl") || keys.includes("cmd");
      const shift = keys.includes("shift");
      const mainKey = keys[keys.length - 1];

      const ctrlPressed = e.ctrlKey || e.metaKey;
      if (ctrl !== ctrlPressed) return;
      if (shift !== e.shiftKey) return;
      if (e.key.toLowerCase() !== mainKey) return;

      e.preventDefault();
      callback(e);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, deps);
}
