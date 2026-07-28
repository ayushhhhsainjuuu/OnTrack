"use client";
import { useEffect, useRef } from "react";

/**
 * Registers global sequential keyboard shortcuts, e.g. "g d" (press g, then d).
 *
 * shortcuts: { "g d": () => void, "g s": () => void, "ctrl+k": () => void }
 * - Space-separated keys are treated as a sequence (must be pressed within `timeout` ms).
 * - "+" separated keys are treated as a simultaneous combo (ctrl/cmd/shift + key).
 *
 * Ignores keystrokes while focus is inside an input/textarea/select/contentEditable
 * element, so it never interferes with typing.
 */
export function useSequentialShortcut(shortcuts, { timeout = 800 } = {}) {
  const bufferRef = useRef([]);
  const timerRef = useRef(null);
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    function isTypingContext(el) {
      if (!el) return false;
      const tag = el.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el.isContentEditable
      );
    }

    function matchCombo(comboStr, e) {
      const parts = comboStr.toLowerCase().split("+");
      const mainKey = parts[parts.length - 1];
      const wantsCtrl = parts.includes("ctrl") || parts.includes("cmd");
      const wantsShift = parts.includes("shift");
      const wantsAlt = parts.includes("alt");

      const ctrlPressed = e.ctrlKey || e.metaKey;
      if (wantsCtrl !== ctrlPressed) return false;
      if (wantsShift !== e.shiftKey) return false;
      if (wantsAlt !== e.altKey) return false;
      return e.key.toLowerCase() === mainKey;
    }

    function resetBuffer() {
      bufferRef.current = [];
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    function handleKeyDown(e) {
      if (isTypingContext(document.activeElement)) return;
      if (e.key === "Escape") {
        resetBuffer();
        return;
      }

      const entries = Object.entries(shortcutsRef.current);

      // First, check simultaneous combos (contain "+") — fire immediately.
      for (const [combo, handler] of entries) {
        if (combo.includes("+") && matchCombo(combo, e)) {
          e.preventDefault();
          resetBuffer();
          handler(e);
          return;
        }
      }

      // Ignore modifier-only presses and modified keys for sequence matching.
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length > 1 && e.key !== "Escape") return; // ignore Shift, Tab, etc.

      bufferRef.current.push(e.key.toLowerCase());
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(resetBuffer, timeout);

      const bufferStr = bufferRef.current.join(" ");

      for (const [combo, handler] of entries) {
        if (combo.includes("+")) continue;
        if (combo === bufferStr) {
          e.preventDefault();
          resetBuffer();
          handler(e);
          return;
        }
      }

      // Trim buffer if it can no longer match any sequence prefix.
      const stillPossible = entries.some(
        ([combo]) => !combo.includes("+") && combo.startsWith(bufferStr),
      );
      if (!stillPossible) resetBuffer();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      resetBuffer();
    };
  }, [timeout]);
}
